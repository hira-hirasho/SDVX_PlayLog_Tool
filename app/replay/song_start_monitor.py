from __future__ import annotations

import time
from threading import Event, Thread, current_thread
from collections.abc import Callable

from loguru import logger

from app.capture.screen_capture import ScreenCapture
from app.replay.song_start_detector import SongStartDetector


class SongStartMonitor:
    def __init__(
        self,
        capture: ScreenCapture,
        detector: SongStartDetector,
        region_x: int,
        region_y: int,
        region_width: int,
        region_height: int,
        interval_seconds: float = 1.0,
        on_detected: Callable[[float], None] | None = None,
    ) -> None:
        self._capture = capture
        self._detector = detector

        self._region_x = region_x
        self._region_y = region_y
        self._region_width = region_width
        self._region_height = region_height

        self._interval_seconds = interval_seconds
        self._on_detected = on_detected

        self._stop_event = Event()
        self._thread: Thread | None = None

    def start(self) -> None:
        if (
            self._thread is not None
            and self._thread.is_alive()
        ):
            return

        self._stop_event.clear()

        self._thread = Thread(
            target=self._run,
            name="SongStartMonitor",
            daemon=True,
        )
        self._thread.start()

        logger.info(
            "SONG_START: monitor started"
        )

    def stop(self) -> None:
        thread = self._thread

        if thread is None:
            return

        self._stop_event.set()

        if (
            thread.is_alive()
            and thread is not current_thread()
        ):
            thread.join()

        self._thread = None

        logger.info(
            "SONG_START: monitor stopped"
        )

    def is_running(self) -> bool:
        return (
            self._thread is not None
            and self._thread.is_alive()
        )

    def _run(self) -> None:
        while not self._stop_event.is_set():
            started_at = time.monotonic()

            try:
                self._check_once()

            except Exception:
                logger.exception(
                    "SONG_START: monitor check failed"
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
        full_screen = self._capture.capture()

        region = self._capture.crop(
            full_screen,
            self._region_x,
            self._region_y,
            self._region_width,
            self._region_height,
        )

        if not self._detector.is_song_start(
            region
        ):
            return

        detected_at = time.monotonic()

        self._stop_event.set()

        if self._on_detected is not None:
            self._on_detected(
                detected_at
            )
