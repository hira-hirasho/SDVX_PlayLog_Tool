import psutil


SDVX_PROCESS_NAME = "sv6c.exe"


def is_sdvx_running() -> bool:
    """SDVXプロセスが起動しているか確認する。"""
    for process in psutil.process_iter(["name"]):
        try:
            if process.info["name"] == SDVX_PROCESS_NAME:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return False
