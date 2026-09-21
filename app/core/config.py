import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_ROOT / ".env"
CONFIG_FILE = PROJECT_ROOT / "config.yaml"


@dataclass(frozen=True)
class AppConfig:
    """PlayLog Toolの通常設定。"""

    data: dict[str, Any]

    def get(
        self,
        *keys: str,
        default: Any = None,
    ) -> Any:
        """階層化された設定値を取得する。"""
        value: Any = self.data

        for key in keys:
            if not isinstance(value, dict) or key not in value:
                return default

            value = value[key]

        return value


def load_environment() -> None:
    """.envを読み込む。"""
    load_dotenv(ENV_FILE)


def load_config() -> AppConfig:
    """config.yamlを読み込む。"""
    if not CONFIG_FILE.exists():
        raise FileNotFoundError(
            f"Config file not found: {CONFIG_FILE}"
        )

    with CONFIG_FILE.open("r", encoding="utf-8-sig") as file:
        data = yaml.safe_load(file) or {}

    if not isinstance(data, dict):
        raise ValueError(
            "config.yaml must contain a YAML mapping"
        )

    return AppConfig(data=data)


def get_obs_websocket_password() -> str:
    """OBS WebSocketのパスワードを.envから取得する。"""
    return os.getenv("OBS_WEBSOCKET_PASSWORD", "")
