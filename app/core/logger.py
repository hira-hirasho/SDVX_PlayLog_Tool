import sys

from loguru import logger

from app.core.data_paths import get_data_root


LOG_DIRECTORY = get_data_root() / "logs"


def setup_logger(log_level: str = "INFO") -> None:
    """PlayLog Toolのログ出力を初期化する。"""
    LOG_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    logger.remove()

    log_format = (
        "{time:YYYY-MM-DD HH:mm:ss.SSS} | "
        "{level:<8} | "
        "{extra[category]:<9} | "
        "{message}"
    )

    logger.configure(
        extra={"category": "APP"},
    )

    logger.add(
        sys.stdout,
        format=log_format,
        level=log_level,
        enqueue=True,
        backtrace=True,
        diagnose=False,
    )

    logger.add(
        LOG_DIRECTORY / "{time:YYYYMMDD}.log",
        format=log_format,
        level=log_level,
        rotation="00:00",
        retention="30 days",
        encoding="utf-8",
        enqueue=True,
        backtrace=True,
        diagnose=False,
    )


def get_logger(category: str):
    """カテゴリ付きLoggerを取得する。"""
    return logger.bind(category=category)
