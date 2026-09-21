from __future__ import annotations

import time
from datetime import datetime
from pathlib import Path
from threading import Event, Lock, Thread, current_thread
from typing import Callable

import numpy as np
from loguru import logger

from app.capture.result_detection_capture import ResultDetectionCapture
from app.result_detection.result_state import ResultState
from app.result_detection.result_screen_detector import ResultScreenDetector


ResultEnterCallback = Callable[[ResultState], None]
ResultExitCallback = Callable[[ResultState], None]


class ResultMonitor:
    """SDVX結果画面を定期監視する。"""

    # リザルト画面終了判定に必要な連続未検知回数。
    RESULT_EXIT_MISSED_CHECKS = 3

    def __init__(
        self,
        detection_capture: ResultDetectionCapture,
        detector: ResultScreenDetector,
        *,
        temp_directory: Path,
        interval_seconds: float = 1.0,
        on_enter: ResultEnterCallback | None = None,
        on_exit: ResultExitCallback | None = None,
    ) -> None:
        self._detection_capture = detection_capture
        self._detector = detector

        self._temp_directory = Path(temp_directory)
        self._interval_seconds = interval_seconds

        self._on_enter = on_enter
        self._on_exit = on_exit

        self._stop_event = Event()
        self._thread: Thread | None = None

        self._state_lock = Lock()
        self._current_state: ResultState | None = None

        # 現在のResultStateに対する連続未検知回数。
        self._consecutive_missed_checks = 0

        if self._interval_seconds <= 0:
            raise ValueError(
                "Result monitor interval must be > 0"
            )

    @property
    def current_state(self) -> ResultState | None:
        """現在表示中の結果画面状態を取得する。"""
        with self._state_lock:
            return self._current_state

    def start(self) -> None:
        """監視を開始する。"""

        if (
            self._thread is not None
            and self._thread.is_alive()
        ):
            return

        self._stop_event.clear()

        with self._state_lock:
            self._consecutive_missed_checks = 0

        self._thread = Thread(
            target=self._run,
            name="ResultMonitor",
            daemon=True,
        )

        self._thread.start()

        logger.info(
            "RESULT: result monitor started "
            f"(interval={self._interval_seconds}s)"
        )

    def stop(self) -> None:
        """監視を停止し、表示中の結果画面を終了扱いにする。"""

        self._stop_event.set()

        thread = self._thread

        if (
            thread is not None
            and thread.is_alive()
            and thread is not current_thread()
        ):
            thread.join()

        self._thread = None

        self._exit_result()

        logger.info(
            "RESULT: result monitor stopped"
        )

    def _run(self) -> None:
        while not self._stop_event.is_set():
            started_at = time.monotonic()

            try:
                self._check_once()

            except Exception:
                logger.exception(
                    "RESULT: result monitor check failed"
                )

            elapsed = (
                time.monotonic()
                - started_at
            )

            wait_seconds = max(
                0.0,
                self._interval_seconds
                - elapsed,
            )

            self._stop_event.wait(
                wait_seconds
            )

    def _check_once(self) -> None:
        """
        1回の監視処理を実行する。

        重要:
            リザルト判定とResultState保存用画像には
            必ず同一のフルスクリーンキャプチャを使用する。
        """

        capture_started_at = time.monotonic()

        # ------------------------------------------------------------
        # 1. フルスクリーンを1回だけキャプチャ
        # ------------------------------------------------------------

        full_screen_image = (
            self._detection_capture.capture_full_screen()
        )

        capture_elapsed = (
            time.monotonic()
            - capture_started_at
        )

        logger.debug(
            "RESULT: full-screen capture completed "
            f"(elapsed={capture_elapsed:.4f}s)"
        )

        # ------------------------------------------------------------
        # 2. 同じキャプチャからROIを切り出して判定
        # ------------------------------------------------------------

        detection_image = (
            self._detection_capture.extract_detection_region(
                full_screen_image
            )
        )

        detected = self._detector.is_result_screen(
            detection_image
        )

        current_state = self.current_state

        # ------------------------------------------------------------
        # ResultStateが存在しない場合
        # ------------------------------------------------------------

        if current_state is None:
            if not detected:
                return

            logger.info(
                "RESULT: result screen detected"
            )

            self._enter_result(
                full_screen_image
            )

            return

        # ------------------------------------------------------------
        # ResultStateが存在する場合
        # ------------------------------------------------------------

        if detected:
            # リザルト画面が継続して表示されている。
            # 一時的な未検知があった場合もここでカウンタをリセットする。
            if self._consecutive_missed_checks > 0:
                logger.debug(
                    "RESULT: result screen detected again; "
                    "resetting exit miss counter "
                    f"(previous="
                    f"{self._consecutive_missed_checks})"
                )

            self._consecutive_missed_checks = 0

            return

        # ------------------------------------------------------------
        # リザルト画面が検知されなかった
        # ------------------------------------------------------------

        self._consecutive_missed_checks += 1

        logger.debug(
            "RESULT: result screen not detected "
            f"(consecutive_misses="
            f"{self._consecutive_missed_checks}/"
            f"{self.RESULT_EXIT_MISSED_CHECKS})"
        )

        # 3回連続で未検知した場合のみ、
        # リザルト画面を完全に抜けたものと判定する。
        if (
            self._consecutive_missed_checks
            < self.RESULT_EXIT_MISSED_CHECKS
        ):
            return

        logger.info(
            "RESULT: result screen exit detected "
            f"after "
            f"{self.RESULT_EXIT_MISSED_CHECKS} "
            "consecutive missed checks"
        )

        self._exit_result()
        self._stop_event.set()

    def _enter_result(
        self,
        full_screen_image: np.ndarray,
    ) -> None:
        """
        リザルト画面への進入処理。

        引数のfull_screen_imageは、リザルト検知に使用した
        同一キャプチャである。
        """

        detected_at = datetime.now()

        try:
            result_image = (
                self._detection_capture.create_result_image(
                    full_screen_image
                )
            )

        except Exception:
            logger.exception(
                "RESULT: result image creation failed"
            )
            return

        result_path = (
            self._create_result_screenshot_path(
                detected_at
            )
        )

        result_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            result_image.save(
                result_path,
                format="PNG",
            )

        except Exception:
            logger.exception(
                "RESULT: result image save failed"
            )
            return

        state = ResultState(
            detected_at=detected_at,
            screenshot_path=result_path,
        )

        with self._state_lock:
            self._current_state = state
            self._consecutive_missed_checks = 0

        logger.info(
            "RESULT: result screen entered "
            f"detected_at={detected_at.isoformat()} "
            f"play_id={state.play_id} "
            f"image={result_path}"
        )

        if self._on_enter is not None:
            try:
                self._on_enter(
                    state
                )

            except Exception:
                logger.exception(
                    "RESULT: on_enter callback failed"
                )

    def _exit_result(self) -> None:
        with self._state_lock:
            state = self._current_state
            self._current_state = None
            self._consecutive_missed_checks = 0

        if state is None:
            return

        logger.info(
            "RESULT: result screen exited "
            f"detected_at={state.detected_at.isoformat()} "
            f"play_id={state.play_id}"
        )

        if self._on_exit is not None:
            try:
                self._on_exit(
                    state
                )

            except Exception:
                logger.exception(
                    "RESULT: on_exit callback failed"
                )

    def _create_result_screenshot_path(
        self,
        detected_at: datetime,
    ) -> Path:
        filename = (
            f"{detected_at:%Y%m%d_%H%M%S_%f}.png"
        )

        return (
            self._temp_directory
            / filename
        )
