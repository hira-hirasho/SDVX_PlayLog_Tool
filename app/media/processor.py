from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path

from loguru import logger

from app.media.job import MediaJob
from app.media.replay_video_saver import ReplayVideoSaver


@dataclass(frozen=True)
class MediaProcessResult:
    """1つのMediaJobにおける各メディア処理結果。"""

    image_saved: bool
    video_saved: bool

    @property
    def any_saved(self) -> bool:
        """画像または動画のいずれかが正式保存されたか。"""
        return (
            self.image_saved
            or self.video_saved
        )

    @property
    def all_saved(self) -> bool:
        """画像・動画の両方が正式保存されたか。"""
        return (
            self.image_saved
            and self.video_saved
        )


class MediaProcessor:
    """1プレイ分のメディア処理を実行する。"""

    EXPECTED_IMAGE_WIDTH = 1080
    EXPECTED_IMAGE_HEIGHT = 1920


    def __init__(
        self,
        replay_video_saver: ReplayVideoSaver,
        media_root: Path,
    ) -> None:
        self._replay_video_saver = replay_video_saver
        self._media_root = Path(media_root)

    def process(
        self,
        job: MediaJob,
    ) -> MediaProcessResult:
        """
        1回分のメディア保存処理を実行する。

        画像・動画は独立して処理する。

        Returns:
            MediaProcessResult:
                result.png / replay.mp4 の正式保存結果。

        メディア処理のみを担当し、プレイ記録の保存には関与しない。
        """

        media_dir = self._create_media_directory(
            job
        )

        image_saved = False
        video_saved = False

        if job.save_image:
            image_saved = self._save_result_image(
                job,
                media_dir,
            )

        if job.save_video:
            video_saved = self._replay_video_saver.save(
                job,
                media_dir,
            )

        result = MediaProcessResult(
            image_saved=image_saved,
            video_saved=video_saved,
        )

        logger.info(
            "MEDIA: job completed: "
            "play_id={} image={} video={} "
            "all_saved={} any_saved={}",
            job.play_id,
            result.image_saved,
            result.video_saved,
            result.all_saved,
            result.any_saved,
        )

        return result

    def _create_media_directory(
        self,
        job: MediaJob,
    ) -> Path:
        """プレイID単位の正式メディアディレクトリを作成する。"""

        media_dir = job.create_media_directory(
            self._media_root
        )

        logger.info(
            "MEDIA: media directory ready: "
            "play_id={} path={}",
            job.play_id,
            media_dir,
        )

        return media_dir

    def _save_result_image(
        self,
        job: MediaJob,
        media_dir: Path,
    ) -> bool:
        """ResultStateの一時画像を正式保存先へコピーする。"""

        source_path = Path(
            job.result_screenshot_path
        )

        destination_path = (
            media_dir / "result.png"
        )

        try:
            if not source_path.is_file():
                raise FileNotFoundError(
                    "Result screenshot not found: "
                    f"{source_path}"
                )

            if not self._validate_result_image(
                source_path
            ):
                raise RuntimeError(
                    "Result screenshot is invalid: "
                    f"{source_path}"
                )

            shutil.copy2(
                source_path,
                destination_path,
            )

            if not self._validate_result_image(
                destination_path
            ):
                raise RuntimeError(
                    "Saved result image is invalid: "
                    f"{destination_path}"
                )

            logger.info(
                "MEDIA: result image saved: "
                "play_id={} path={}",
                job.play_id,
                destination_path,
            )

            return True

        except Exception:
            logger.exception(
                "MEDIA: result image save failed: "
                "play_id={}",
                job.play_id,
            )

            return False

    def _validate_result_image(
        cls,
        path: Path,
    ) -> bool:
        """リザルト画像が1080×1920の有効な画像か検証する。"""

        try:
            if not path.is_file():
                return False

            if path.stat().st_size <= 0:
                return False

            from PIL import Image

            with Image.open(path) as image:
                if image.size != (
                    cls.EXPECTED_IMAGE_WIDTH,
                    cls.EXPECTED_IMAGE_HEIGHT,
                ):
                    logger.warning(
                        "MEDIA: invalid result image size: "
                        "path={} size={} expected={}x{}",
                        path,
                        image.size,
                        cls.EXPECTED_IMAGE_WIDTH,
                        cls.EXPECTED_IMAGE_HEIGHT,
                    )
                    return False

                image.verify()

            return True

        except Exception:
            logger.exception(
                "MEDIA: result image validation failed: "
                "path={}",
                path,
            )
            return False
