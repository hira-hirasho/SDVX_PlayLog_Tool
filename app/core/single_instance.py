import ctypes
from ctypes import wintypes

from loguru import logger


MUTEX_NAME = "Local\\SDVX_PlayLog_Tool_Backend"

_kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

_kernel32.CreateMutexW.argtypes = [
    wintypes.LPVOID,
    wintypes.BOOL,
    wintypes.LPCWSTR,
]
_kernel32.CreateMutexW.restype = wintypes.HANDLE

_kernel32.CloseHandle.argtypes = [
    wintypes.HANDLE,
]
_kernel32.CloseHandle.restype = wintypes.BOOL


_mutex_handle: wintypes.HANDLE | None = None


def acquire_single_instance() -> bool:
    """Backendの単一起動Mutexを取得する。"""
    global _mutex_handle

    handle = _kernel32.CreateMutexW(
        None,
        True,
        MUTEX_NAME,
    )

    if not handle:
        error_code = ctypes.get_last_error()
        raise OSError(
            error_code,
            f"CreateMutexW failed: {error_code}",
        )

    _mutex_handle = handle

    error_code = ctypes.get_last_error()

    if error_code == 183:
        logger.warning(
            "APP: another backend instance is already running"
        )
        return False

    logger.info(
        "APP: backend single-instance lock acquired"
    )
    return True


def release_single_instance() -> None:
    """Backendの単一起動Mutexを解放する。"""
    global _mutex_handle

    if _mutex_handle is None:
        return

    _kernel32.CloseHandle(_mutex_handle)
    _mutex_handle = None

    logger.info(
        "APP: backend single-instance lock released"
    )
