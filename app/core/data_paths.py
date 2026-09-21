import os
from pathlib import Path


def get_data_root() -> Path:
    """SDVX PlayLog Toolの共有ユーザーデータルートを取得する。"""
    local_app_data = os.environ.get("LOCALAPPDATA")

    if not local_app_data:
        raise RuntimeError("LOCALAPPDATA is not defined")

    return (
        Path(local_app_data)
        / "SDVX PlayLog Tool"
        / "data"
    )


def resolve_data_path(path_value: str | Path) -> Path:
    """データルート基準のパスを絶対パスへ解決する。"""
    path = Path(path_value)

    if path.is_absolute():
        return path

    # config.yamlには従来から
    # "data/temp", "data/media" などのパスが設定されている。
    #
    # Data Root自体が既に ".../data" なので、
    # 先頭の "data" は取り除いて解決する。
    parts = path.parts

    if parts and parts[0].lower() == "data":
        path = Path(*parts[1:])

    return get_data_root() / path
