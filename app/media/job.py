from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass
class MediaJob:
    """1プレイ分のメディア処理単位。"""

    play_id: str
    detected_at: datetime
    result_screenshot_path: Path

    save_image: bool = True
    save_video: bool = True

    # SongStart検出時点からF12受信時点までの経過時間。
    # Noneの場合はReplay全体を保存する。
    replay_elapsed_seconds: float | None = None

    media_directory: Path | None = None

    @property
    def result_image_path(self) -> Path:
        """正式保存先のリザルト画像パスを返す。"""
        return self._require_media_directory() / "result.png"

    @property
    def replay_video_path(self) -> Path:
        """正式保存先のReplay動画パスを返す。"""
        return self._require_media_directory() / "replay.mp4"

    def create_media_directory(
        self,
        media_root: Path,
    ) -> Path:
        """
        プレイID単位の正式メディアディレクトリを作成する。

        保存先:
            data/media/<play_id>/
        """

        media_root = Path(media_root)
        media_directory = media_root / self.play_id

        media_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.media_directory = media_directory

        return media_directory

    def _require_media_directory(self) -> Path:
        if self.media_directory is None:
            raise RuntimeError(
                "Media directory has not been created."
            )

        return self.media_directory
