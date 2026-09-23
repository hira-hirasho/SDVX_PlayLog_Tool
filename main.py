from __future__ import annotations

import io
import math
import time
import wave
import winsound

from pathlib import Path
from threading import Lock, Thread

import pystray
from PIL import Image

from loguru import logger

from app.capture.result_detection_capture import ResultDetectionCapture
from app.capture.screen_capture import ScreenCapture
from app.core.config import (
    load_config,
    load_environment,
)
from app.core.data_paths import resolve_data_path
from app.core.f12_detector import F12Detector
from app.core.logger import setup_logger
from app.core.single_instance import (
    acquire_single_instance,
    release_single_instance,
)
from app.core.state import AppState
from app.core.state_manager import StateManager
from app.database.play_log import PlayLogDatabase
from app.database.play_record import PlayRecordService
from app.media.job import MediaJob
from app.media.job_runner import MediaJobRunner
from app.media.processor import MediaProcessor
from app.media.replay_video_saver import ReplayVideoSaver
from app.obs.launcher import OBSLauncher
from app.obs.websocket import OBSWebSocket
from app.ocr.processor import OCRProcessor
from app.replay.processor import ReplayProcessor
from app.replay.replay_file import ReplayFileDetector
from app.replay.song_start_detector import SongStartDetector
from app.replay.song_start_monitor import SongStartMonitor
from app.replay.video_processor import VideoProcessor
from app.result_detection.f12_handler import ResultF12Handler
from app.result_detection.monitor import ResultMonitor
from app.result_detection.record_handler import ResultRecordHandler
from app.result_detection.result_screen_detector import ResultScreenDetector
from app.sdvx.process_detector import is_sdvx_running


class SDVXPlayLogApp:
    """SDVX PlayLog本体。"""

    def __init__(self) -> None:
        load_environment()

        self._config = load_config()
        self._state_manager = StateManager()

        # ------------------------------------------------------------
        # OBS
        # ------------------------------------------------------------

        self._obs_launcher = OBSLauncher(
            self._config
        )

        self._obs_websocket = OBSWebSocket(
            self._config
        )

        self._obs_owned = False

        self._obs_scene_name = self._config.get(
            "obs",
            "scene_name",
        )

        # ------------------------------------------------------------
        # Capture / result detection / OCR
        # ------------------------------------------------------------

        # Windows画面からリザルト判定用ROIを取得する。
        #
        # リザルト画面全体の保存用画像もResultDetectionCaptureが
        # Windowsから直接取得するため、OBS ImageCaptureは使用しない。
        result_region = self._config.get(
            "result_detection",
            "region",
            default={},
        )

        self._result_detection_capture = ResultDetectionCapture(
            x=int(result_region.get("x", 0)),
            y=int(result_region.get("y", 0)),
            width=int(result_region.get("width", 0)),
            height=int(result_region.get("height", 0)),
        )

        self._result_detector = ResultScreenDetector(
            self._config
        )

        self._ocr_processor = OCRProcessor(
            self._config
        )

        # SongStart判定はResultDetectionCaptureとは独立して、
        # Windows画面から指定ROIを直接取得する。
        song_start_region = self._config.get(
            "song_start_detection",
            "region",
            default={},
        )
        self._song_start_capture = ScreenCapture()
        self._song_start_detector = SongStartDetector(
            self._config
        )
        self._song_start_monitor = SongStartMonitor(
            capture=self._song_start_capture,
            detector=self._song_start_detector,
            region_x=int(song_start_region.get("x", 0)),
            region_y=int(song_start_region.get("y", 0)),
            region_width=int(song_start_region.get("width", 0)),
            region_height=int(song_start_region.get("height", 0)),
            interval_seconds=float(
                self._config.get(
                    "song_start_detection",
                    "interval_seconds",
                    default=1.0,
                )
            ),
            on_detected=self._on_song_start_detected,
        )

        # 一時ファイルはアプリ管理領域で管理する。
        temp_directory = resolve_data_path("temp")

        self._result_record_handler: ResultRecordHandler | None = None
        self._result_f12_handler: ResultF12Handler | None = None

        self._result_monitor = ResultMonitor(
            detection_capture=self._result_detection_capture,
            detector=self._result_detector,
            temp_directory=temp_directory,
            interval_seconds=float(
                self._config.get(
                    "result_detection",
                    "interval_seconds",
                    default=1.0,
                )
            ),
            on_enter=self._on_result_enter,
            on_exit=self._on_result_exit,
        )

        # ------------------------------------------------------------
        # Play record
        # ------------------------------------------------------------

        min_score = self._config.get(
            "play_log",
            "min_score",
            default=9_000_000,
        )

        database_path = resolve_data_path(
            "database/playlog.db"
        )

        self._play_log_database = PlayLogDatabase(
            database_path
        )

        self._play_record_service = PlayRecordService(
            database=self._play_log_database,
            min_score=min_score,
        )

        self._result_record_handler = ResultRecordHandler(
            ocr_processor=self._ocr_processor,
            play_record_service=self._play_record_service,
        )

        self._result_f12_handler = ResultF12Handler(
            ocr_processor=self._ocr_processor,
            play_record_service=self._play_record_service,
        )

        # ------------------------------------------------------------
        # Replay / Media
        # ------------------------------------------------------------

        # OBS Replay Bufferのrawファイルはdata/temp直下で管理する。
        replay_directory = temp_directory

        self._replay_file_detector = ReplayFileDetector(
            directory=replay_directory,
        )

        self._video_processor = VideoProcessor()

        self._replay_processor = ReplayProcessor(
            self._video_processor,
        )

        # 正式保存メディアはアプリ管理領域で管理する。
        media_root = resolve_data_path("media")

        self._replay_video_saver = ReplayVideoSaver(
            obs_websocket=self._obs_websocket,
            replay_file_detector=self._replay_file_detector,
            replay_processor=self._replay_processor,
            replay_detection_interval_seconds=1.0,
        )

        self._media_processor = MediaProcessor(
            replay_video_saver=self._replay_video_saver,
            media_root=media_root,
        )


        self._media_job_runner = MediaJobRunner(
            processor=self._media_processor,
            on_completed=self._on_media_job_completed,
        )

        # ------------------------------------------------------------
        # F12
        # ------------------------------------------------------------

        self._f12_detector = F12Detector(
            trigger_key=self._config.get(
                "input",
                "trigger_key",
                default="F12",
            ),
            callback=self._on_f12,
        )

        # ------------------------------------------------------------
        # Lifecycle
        # ------------------------------------------------------------
        self._running = True
        self._accepting_work = False

        # SongStart検出時刻。
        # F12受信時刻との差分からReplayのトリミング位置を算出する。
        self._song_start_detected_at: float | None = None

        # ------------------------------------------------------------
        # System Tray
        # ------------------------------------------------------------
        project_root = Path(__file__).resolve().parent
        self._tray_icon_path = project_root / "asset" / "tray_icon.png"
        self._tray_enabled = True
        self._tray_lock = Lock()
        self._tray_icon: pystray.Icon | None = None
        self._tray_thread: Thread | None = None

    # ================================================================
    # Lifecycle
    # ================================================================

    def run(self) -> None:
        """アプリケーションを常駐実行する。"""
        logger.info(
            "APP: SDVX PlayLog starting"
        )

        self._start_tray()

        try:
            while self._running:
                sdvx_active = is_sdvx_running()

                state = self._state_manager.state

                if self._is_tray_enabled():
                    if (
                        sdvx_active
                        and state == AppState.SLEEP
                    ):
                        self._activate()
                    elif (
                        not sdvx_active
                        and state == AppState.ACTIVE
                    ):
                        self._deactivate()

                time.sleep(1.0)

        except KeyboardInterrupt:
            logger.info(
                "APP: keyboard interrupt received"
            )
        finally:
            self._shutdown()

    def _activate(self) -> None:
        """SDVX起動時のACTIVE化処理。"""

        logger.info(
            "STATE: SLEEP -> ACTIVE"
        )

        try:
            self._ensure_obs_ready()
            self._start_replay_buffer()

            self._song_start_detected_at = None
            self._accepting_work = True

            # ACTIVEを先に確定してから監視を開始する。
            self._state_manager.set_state(
                AppState.ACTIVE
            )

            # プレイ開始を検出してからResultMonitorを開始する。
            self._song_start_monitor.start()
            self._f12_detector.start()

            logger.info(
                "STATE: application is ACTIVE"
            )

        except Exception:
            logger.exception(
                "APP: activation failed"
            )

            self._accepting_work = False

            self._stop_input_and_result_monitor()
            self._shutdown_obs_if_owned()

            self._state_manager.set_state(
                AppState.SLEEP
            )

    def _deactivate(self) -> None:
        """ACTIVE状態からSLEEP状態へ移行する。"""
        logger.info(
            "STATE: ACTIVE -> SLEEP; stopping new work"
        )

        # まず新規F12・SongStart・Result処理を止める。
        self._accepting_work = False
        self._f12_detector.stop()
        self._song_start_monitor.stop()
        self._result_monitor.stop()

        # 実行中のMediaJobは継続させる必要がある。
        if self._media_job_runner.is_running():
            logger.info(
                "MEDIA: active media job exists; "
                "keeping OBS alive until completion"
            )
            self._state_manager.set_state(
                AppState.SLEEP
            )
            return

        self._shutdown_obs_if_owned()

        self._state_manager.set_state(
            AppState.SLEEP
        )

        logger.info(
            "APP: application is SLEEP"
        )


    # ================================================================
    # System Tray
    # ================================================================

    def _start_tray(self) -> None:
        """システムトレイアイコンを開始する。"""
        if not self._tray_icon_path.exists():
            logger.error(
                "TRAY: icon file not found: {}",
                self._tray_icon_path,
            )
            return

        try:
            image = Image.open(self._tray_icon_path)

            menu = pystray.Menu(
                pystray.MenuItem(
                    "有効",
                    self._on_tray_enable,
                    checked=lambda item: self._is_tray_enabled(),
                    radio=True,
                ),
                pystray.MenuItem(
                    "無効",
                    self._on_tray_disable,
                    checked=lambda item: not self._is_tray_enabled(),
                    radio=True,
                ),
            )

            self._tray_icon = pystray.Icon(
                "SDVX PlayLog Tool",
                image,
                "SDVX PlayLog Tool",
                menu,
            )

            self._tray_thread = Thread(
                target=self._tray_icon.run,
                name="SystemTray",
                daemon=True,
            )
            self._tray_thread.start()

            logger.info(
                "TRAY: system tray started"
            )

        except Exception:
            logger.exception(
                "TRAY: failed to start system tray"
            )

    def _is_tray_enabled(self) -> bool:
        """トレイ上の有効状態を取得する。"""
        with self._tray_lock:
            return self._tray_enabled

    def _on_tray_enable(
        self,
        _icon,
        _item,
    ) -> None:
        """トレイからバックエンドを有効化する。"""
        with self._tray_lock:
            if self._tray_enabled:
                return

            self._tray_enabled = True

        logger.info(
            "TRAY: application enabled"
        )

    def _on_tray_disable(
        self,
        _icon,
        _item,
    ) -> None:
        """トレイからバックエンドを無効化する。"""
        with self._tray_lock:
            if not self._tray_enabled:
                return

            self._tray_enabled = False

        logger.info(
            "TRAY: application disabled"
        )

        if self._state_manager.state == AppState.ACTIVE:
            self._deactivate()

    def _shutdown(self) -> None:
        """アプリケーション終了処理。"""

        logger.info(
            "APP: shutting down"
        )

        self._running = False
        self._accepting_work = False

        try:
            self._f12_detector.stop()

        except Exception:
            logger.exception(
                "APP: failed to stop F12 detector"
            )

        try:
            self._song_start_monitor.stop()
        except Exception:
            logger.exception(
                "APP: failed to stop song start monitor"
            )

        try:
            self._result_monitor.stop()

        except Exception:
            logger.exception(
                "APP: failed to stop result monitor"
            )

        # 実行中のメディア処理は可能な限り完了させる。
        if self._media_job_runner.is_running():
            logger.info(
                "MEDIA: waiting for active media job to finish"
            )

            self._media_job_runner.wait_for_completion()

        self._shutdown_obs_if_owned()

        self._state_manager.set_state(
            AppState.SLEEP
        )

        if self._tray_icon is not None:
            try:
                self._tray_icon.stop()
            except Exception:
                logger.exception(
                    "TRAY: failed to stop system tray"
                )
            self._tray_icon = None

        logger.info(
            "APP: shutdown complete"
        )

    # ================================================================
    # OBS
    # ================================================================

    @staticmethod
    def _is_obs_running() -> bool:
        """OBS Studioが起動中か確認する。"""

        import subprocess

        result = subprocess.run(
            [
                "tasklist",
                "/FI",
                "IMAGENAME eq obs64.exe",
                "/NH",
            ],
            capture_output=True,
            text=True,
            encoding="cp932",
            errors="replace",
            check=False,
        )

        return (
            "obs64.exe"
            in result.stdout.lower()
        )

    def _ensure_obs_ready(self) -> None:
        """OBSを起動または再利用し、WebSocket Readyまで待つ。"""

        if self._is_obs_running():
            logger.info(
                "OBS: existing OBS instance detected; reusing it"
            )

            self._obs_owned = False

        else:
            logger.info(
                "OBS: OBS is not running; launching"
            )

            self._obs_launcher.launch()
            self._obs_owned = True

        self._obs_websocket.connect()

        self._obs_websocket.wait_until_ready()

        current_scene = (
            self._obs_websocket.get_current_scene()
        )

        if current_scene != self._obs_scene_name:
            raise RuntimeError(
                "OBS current scene mismatch: "
                f"expected={self._obs_scene_name!r}, "
                f"actual={current_scene!r}"
            )

        logger.info(
            "OBS: ready "
            f"scene={current_scene!r}"
        )

    def _start_replay_buffer(self) -> None:
        """Replay Bufferが停止中なら開始し、実行状態を確認する。"""

        status = (
            self._obs_websocket.get_replay_buffer_status()
        )

        if status:
            logger.info(
                "OBS: replay buffer is already running"
            )

            return

        logger.info(
            "OBS: replay buffer is stopped; starting"
        )

        self._obs_websocket.start_replay_buffer()

        if not self._obs_websocket.get_replay_buffer_status():
            raise RuntimeError(
                "OBS Replay Buffer failed to start"
            )

        logger.info(
            "OBS: replay buffer is running"
        )


    def _shutdown_obs_if_owned(self) -> None:
        """PlayLog Toolが起動したOBSだけを終了する。"""
        if not self._obs_owned:
            try:
                self._obs_websocket.disconnect()
            except Exception:
                logger.exception(
                    "OBS_WS: failed to disconnect"
                )
            return

        try:
            logger.info(
                "OBS: shutting down owned OBS instance"
            )

            try:
                self._obs_websocket.disconnect()
            except Exception:
                logger.exception(
                    "OBS_WS: failed to disconnect"
                )

            if self._obs_launcher.close_window():
                logger.info(
                    "OBS: WM_CLOSE sent"
                )
            else:
                logger.warning(
                    "OBS: failed to find OBS window for WM_CLOSE"
                )

            if self._obs_launcher.wait_for_exit(
                timeout_seconds=10.0
            ):
                logger.info(
                    "OBS: owned OBS exited after WM_CLOSE"
                )
                return

            logger.warning(
                "OBS: WM_CLOSE timed out; "
                "forcing process termination"
            )

            self._obs_launcher.terminate()

            logger.info(
                "OBS: owned OBS process terminated"
            )

        except Exception:
            logger.exception(
                "OBS: failed to shut down owned OBS"
            )

        finally:
            try:
                self._obs_websocket.disconnect()
            except Exception:
                logger.exception(
                    "OBS_WS: failed to disconnect"
                )

            self._obs_owned = False

    # ================================================================
    # SongStart / Result
    # ================================================================

    def _on_song_start_detected(
        self,
        detected_at: float,
    ) -> None:
        """SongStartを検出したときの通知。"""
        if not self._accepting_work:
            return

        if self._state_manager.state != AppState.ACTIVE:
            return

        self._song_start_detected_at = detected_at

        logger.info(
            "SONG_START: detected at {}",
            detected_at,
        )

        # SongStart検出後にResultMonitorを開始する。
        self._result_monitor.start()

    def _on_result_enter(
        self,
        state,
    ) -> None:
        """結果画面に入ったときの通知。"""
        # リザルト画面に入ったらSongStart監視は不要。
        if (
            self._accepting_work
            and self._state_manager.state == AppState.ACTIVE
        ):
            self._song_start_monitor.stop()

        logger.info(
            "RESULT: new result detected "
            f"play_id={state.play_id} "
            f"detected_at={state.detected_at.isoformat()}"
        )

    def _on_result_exit(
        self,
        state,
    ) -> None:
        """結果画面を抜けたときの自動プレイ記録と一時画像処理。"""

        try:
            if self._result_record_handler is None:
                return

            recorded = (
                self._result_record_handler.on_result_exited(
                    state
                )
            )

            # F12が押されていない通常リザルトで、
            # 設定したスコア下限以上の自動記録が成功した場合だけ
            # リザルト画像を正式保存する。
            #
            # F12の場合は_on_f12()側ですでに
            # MediaJobが開始されるため、ここでは開始しない。
            if (
                recorded
                and not state.f12_triggered
            ):
                job = MediaJob(
                    play_id=state.play_id,
                    detected_at=state.detected_at,
                    result_screenshot_path=state.screenshot_path,
                    save_image=True,
                    save_video=False,
                )

                if self._media_job_runner.submit(job):
                    logger.info(
                        "RESULT: automatic image media job accepted: "
                        "play_id={} detected_at={}",
                        state.play_id,
                        state.detected_at.isoformat(),
                    )
                    return

                logger.warning(
                    "MEDIA: automatic result image save "
                    "was skipped because another media job "
                    "is running: play_id={}",
                    state.play_id,
                )

        except Exception:
            logger.exception(
                "PLAY_RECORD: automatic result record failed"
            )

        finally:
            # MediaJobRunnerが処理中の画像は削除せず、
            # それ以外の一時画像を後処理する。
            self._media_job_runner.cleanup_image(
                state.screenshot_path
            )

            # リザルト終了後、まだACTIVEなら次プレイの
            # SongStart監視を再開する。
            if (
                self._accepting_work
                and self._state_manager.state == AppState.ACTIVE
            ):
                self._song_start_monitor.start()

    # ================================================================
    # F12
    # ================================================================

    def _on_f12(
        self,
        f12_pressed_at: float,
    ) -> None:
        """F12入力を処理する。"""
        if not self._accepting_work:
            logger.debug(
                "F12: ignored because application is not accepting work"
            )
            return

        if self._state_manager.state != AppState.ACTIVE:
            logger.debug(
                "F12: ignored because application is not ACTIVE"
            )
            return

        if not is_sdvx_running():
            logger.debug(
                "F12: ignored because SDVX is not running"
            )
            return

        state = self._result_monitor.current_state

        if state is None:
            logger.debug(
                "F12: ignored because result screen is not active"
            )
            return

        if self._result_f12_handler is None:
            logger.error(
                "F12: ignored because ResultF12Handler is not available"
            )
            return

        result_image_path = state.screenshot_path

        if not self._media_job_runner.reserve_image(
            result_image_path
        ):
            logger.info(
                "F12: ignored because another media job is running"
            )
            return

        try:
            handled = self._result_f12_handler.handle(
                state
            )

            if not handled:
                logger.info(
                    "F12: forced record was not accepted: play_id={}",
                    state.play_id,
                )
                self._media_job_runner.release_image(
                    result_image_path
                )
                return

            # SongStart検出時刻が取得できていれば、
            # F12受信時刻との差分をReplay処理へ渡す。
            #
            # SongStartが未検出でもF12自体は拒否せず、
            # elapsed_seconds=NoneとしてReplay全体を保存する。
            replay_elapsed_seconds: float | None = None

            if self._song_start_detected_at is not None:
                elapsed = (
                    f12_pressed_at
                    - self._song_start_detected_at
                )

                if elapsed >= 0:
                    replay_elapsed_seconds = elapsed
                else:
                    logger.warning(
                        "F12: invalid song start elapsed time; "
                        "using full replay: "
                        "song_start={} f12={}",
                        self._song_start_detected_at,
                        f12_pressed_at,
                    )

            logger.info(
                "F12: replay elapsed time={}s",
                replay_elapsed_seconds,
            )

            job = MediaJob(
                play_id=state.play_id,
                detected_at=state.detected_at,
                result_screenshot_path=result_image_path,
                replay_elapsed_seconds=replay_elapsed_seconds,
            )

            if not self._media_job_runner.submit(job):
                logger.warning(
                    "F12: media job was not accepted: play_id={}",
                    state.play_id,
                )
                self._media_job_runner.release_image(
                    result_image_path
                )
                return

            logger.info(
                "F12: media job accepted: "
                "play_id={} detected_at={} elapsed={}s",
                state.play_id,
                state.detected_at.isoformat(),
                replay_elapsed_seconds,
            )

            self._play_f12_sound()

        except Exception:
            logger.exception(
                "F12: failed to create media job: play_id={}",
                state.play_id,
            )

            self._media_job_runner.release_image(
                result_image_path
            )

    # ================================================================
    # Helpers
    # ================================================================

    def _play_f12_sound(self) -> None:
        """F12による保存受付完了時のサウンドを非同期再生する。"""
        Thread(
            target=self._generate_and_play_f12_sound,
            name="F12Sound",
            daemon=True,
        ).start()

    @staticmethod
    def _generate_and_play_f12_sound() -> None:
        """F12サウンドを生成して再生する。"""
        rate = 44100
        volume = 0.022

        chords = [
            ([261.63, 392.00, 523.25], 70, 0.9, 0.10),
            ([392.00, 493.88, 587.33, 783.99], 185, 0.95, 0.12),
        ]

        data = bytearray()

        for freqs, duration_ms, chord_volume, harmonic in chords:
            sample_count = int(rate * duration_ms / 1000)

            for i in range(sample_count):
                t = i / rate

                value = sum(
                    math.sin(2 * math.pi * freq * t)
                    for freq in freqs
                ) / len(freqs)

                value += harmonic * math.sin(
                    2 * math.pi * max(freqs) * 2 * t
                )

                attack = min(
                    1.0,
                    i / (rate * 0.004),
                )

                release = min(
                    1.0,
                    (sample_count - i) / (rate * 0.050),
                )

                value *= (
                    volume
                    * chord_volume
                    * attack
                    * release
                )

                sample = max(
                    -1.0,
                    min(1.0, value),
                )

                data += int(
                    sample * 32767
                ).to_bytes(
                    2,
                    "little",
                    signed=True,
                )

            data += b"\x00\x00" * int(
                rate * 0.035
            )

        buffer = io.BytesIO()

        with wave.open(buffer, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(rate)
            wav.writeframes(data)

        winsound.PlaySound(
            buffer.getvalue(),
            winsound.SND_MEMORY,
        )

    def _on_media_job_completed(self) -> None:
        """MediaJob完了後に必要なアプリケーション処理を行う。"""
        if (
            not self._accepting_work
            and self._state_manager.state == AppState.SLEEP
        ):
            self._shutdown_obs_if_owned()

    def _stop_input_and_result_monitor(self) -> None:
        try:
            self._f12_detector.stop()

        except Exception:
            logger.exception(
                "APP: failed to stop F12 detector"
            )

        try:
            self._song_start_monitor.stop()
        except Exception:
            logger.exception(
                "APP: failed to stop song start monitor"
            )

        try:
            self._result_monitor.stop()

        except Exception:
            logger.exception(
                "APP: failed to stop result monitor"
            )


def main() -> None:
    setup_logger()

    if not acquire_single_instance():
        return

    try:
        app = SDVXPlayLogApp()
        app.run()
    finally:
        release_single_instance()


if __name__ == "__main__":
    main()
