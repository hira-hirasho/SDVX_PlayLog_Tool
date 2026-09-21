import psutil

from app.core.config import AppConfig


def is_sdvx_running(config: AppConfig) -> bool:
    """設定されたSDVXプロセスが起動しているか確認する。"""
    process_name = config.get(
        "sdvx",
        "process_name",
    )

    for process in psutil.process_iter(["name"]):
        try:
            if process.info["name"] == process_name:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return False
