import ctypes
import subprocess
from ctypes import wintypes
from pathlib import Path

from app.core.config import AppConfig


class OBSLauncher:
    """OBS Studioを起動・終了する。"""

    def __init__(self, config: AppConfig) -> None:
        self._config = config
        self._process: subprocess.Popen | None = None

    def launch(self) -> subprocess.Popen:
        """OBS Studioを起動する。"""
        obs_executable_path = Path(
            self._config.get("obs", "executable_path")
        )

        if not obs_executable_path.exists():
            raise FileNotFoundError(
                f"OBS executable not found: {obs_executable_path}"
            )

        if self._process is not None and self._process.poll() is None:
            return self._process

        self._process = subprocess.Popen(
            [
                str(obs_executable_path),
                "--minimize-to-tray",
            ],
            cwd=str(obs_executable_path.parent),
        )

        return self._process

    @property
    def process(self) -> subprocess.Popen | None:
        """PlayLog Toolが起動したOBSプロセスを取得する。"""
        return self._process


    def wait_for_exit(
        self,
        timeout_seconds: float = 10.0,
    ) -> bool:
        """Wait for the OBS process to exit."""
        if self._process is None:
            return True

        if self._process.poll() is not None:
            self._process = None
            return True

        try:
            self._process.wait(
                timeout=timeout_seconds
            )
        except subprocess.TimeoutExpired:
            return False

        self._process = None
        return True

    def close_window(self) -> bool:
        """Send WM_CLOSE to the OBS window."""
        if self._process is None:
            return False

        if self._process.poll() is not None:
            self._process = None
            return False

        hwnd = self._find_window(self._process.pid)

        if hwnd is None:
            return False

        ctypes.windll.user32.PostMessageW(
            hwnd,
            0x0010,
            0,
            0,
        )

        return True

    def terminate(self) -> None:
        """Forcefully terminate the OBS process."""
        if self._process is None:
            return

        if self._process.poll() is not None:
            self._process = None
            return

        self._process.terminate()
        self._process.wait()
        self._process = None

    @staticmethod
    def _find_window(pid: int) -> int | None:
        """指定プロセスのトップレベルウィンドウを取得する。"""
        user32 = ctypes.windll.user32
        windows: list[int] = []

        enum_windows_proc = ctypes.WINFUNCTYPE(
            wintypes.BOOL,
            wintypes.HWND,
            wintypes.LPARAM,
        )

        def callback(
            hwnd: int,
            _lparam: int,
        ) -> bool:
            process_id = wintypes.DWORD()

            user32.GetWindowThreadProcessId(
                hwnd,
                ctypes.byref(process_id),
            )

            if process_id.value == pid:
                windows.append(hwnd)
                return False

            return True

        user32.EnumWindows(
            enum_windows_proc(callback),
            0,
        )

        if not windows:
            return None

        return windows[0]
