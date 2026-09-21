import ctypes
from ctypes import wintypes

import psutil


SDVX_PROCESS_NAME = "sv6c.exe"

user32 = ctypes.windll.user32


def find_sdvx_windows() -> list[int]:
    """SDVXプロセスに属するウィンドウを取得する。"""
    sdvx_pids = {
        process.pid
        for process in psutil.process_iter(["name"])
        if process.info["name"] == SDVX_PROCESS_NAME
    }

    windows: list[int] = []

    @ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    def callback(hwnd: int, _lparam: int) -> bool:
        process_id = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(process_id))

        if process_id.value in sdvx_pids:
            if user32.IsWindowVisible(hwnd):
                windows.append(hwnd)

        return True

    user32.EnumWindows(callback, 0)

    return windows


def activate_sdvx() -> bool:
    """SDVXのウィンドウを前面にする。"""
    windows = find_sdvx_windows()

    if not windows:
        return False

    hwnd = windows[0]

    user32.ShowWindow(hwnd, 9)  # SW_RESTORE
    user32.SetForegroundWindow(hwnd)

    return True
