import os
from pathlib import Path


def get_app_data_root() -> Path:
    """SDVX PlayLog Toolの共有ユーザーデータルートを取得する。"""
    local_app_data = os.environ.get("LOCALAPPDATA")

    if not local_app_data:
        raise RuntimeError("LOCALAPPDATA is not defined")

    return Path(local_app_data) / "SDVX PlayLog Tool"


def get_config_path() -> Path:
    """ユーザー設定ファイルのパスを取得する。"""
    return get_app_data_root() / "config.yaml"


def get_data_root() -> Path:
    """SDVX PlayLog Toolの共有ユーザーデータルートを取得する。"""
    return get_app_data_root() / "data"


def resolve_data_path(path_value: str | Path) -> Path:
    """データルート基準のパスを絶対パスへ解決する。"""
    path = Path(path_value)

    if path.is_absolute():
        return path

    return get_data_root() / path
