import time
from collections.abc import Callable

from loguru import logger

from pynput import keyboard


class F12Detector:
    """グローバルなトリガーキー入力を検知する。"""

    def __init__(
        self,
        callback: Callable[[float], None],
        trigger_key: str = "F12",
        debounce_seconds: float = 0.1,
    ) -> None:
        self._callback = callback
        self._trigger_key = trigger_key.upper()
        self._debounce_seconds = debounce_seconds
        self._last_triggered_at = 0.0
        self._listener: keyboard.Listener | None = None

    def start(self) -> None:
        """トリガーキー監視を開始する。"""
        if self._listener is not None:
            return

        self._listener = keyboard.Listener(
            on_press=self._on_press,
        )
        self._listener.start()

        logger.info(
            "F12 DEBUG: keyboard listener started "
            f"(trigger_key={self._trigger_key!r})"
        )

    def stop(self) -> None:
        """トリガーキー監視を停止する。"""
        if self._listener is None:
            return

        self._listener.stop()
        self._listener = None

    def _on_press(self, key: keyboard.Key | keyboard.KeyCode) -> None:
        if not self._is_trigger_key(key):
            return

        logger.info(
            "F12 DEBUG: trigger key detected "
            f"(key={key!r})"
        )

        now = time.monotonic()

        if now - self._last_triggered_at < self._debounce_seconds:
            return

        self._last_triggered_at = now
        self._callback(now)

    def _is_trigger_key(
        self,
        key: keyboard.Key | keyboard.KeyCode,
    ) -> bool:
        """押されたキーが設定されたトリガーキーか判定する。"""
        try:
            configured_key = getattr(
                keyboard.Key,
                self._trigger_key.lower(),
            )
        except AttributeError:
            configured_key = None

        if configured_key is not None:
            return key == configured_key

        if isinstance(key, keyboard.KeyCode):
            return key.char == self._trigger_key.lower()

        return False
