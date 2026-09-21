import psutil


OBS_PROCESS_NAME = "obs64.exe"


def is_obs_running() -> bool:
    """OBS Studioが起動しているか確認する。"""
    for process in psutil.process_iter(["name"]):
        try:
            if process.info["name"] == OBS_PROCESS_NAME:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return False
