from __future__ import annotations

import math
from pathlib import Path

from loguru import logger

from app.replay.song_start_detector import SongStartDetector
from app.replay.video_processor import VideoProcessor


class ReplayProcessor:
    """Replay動画の曲開始検出・トリミング・加工を担当する。"""

    def __init__(
        self,
        video_processor: VideoProcessor,
    ) -> None:
        self.video_processor = video_processor

    def process(
        self,
        replay_path: Path,
        output_path: Path,
        elapsed_seconds: float | None,
    ) -> Path:
        """
        Replay動画を加工し、指定された出力先へ保存する。

        曲開始地点を検出できた場合:
            検出地点より前をトリミングする。

        曲開始地点を検出できなかった場合:
            元動画を再エンコードせずコピーする。

        このメソッドは元Replayファイルを削除しない。
        元Replayの削除は、正式メディア保存と検証が完了した後に
        ReplayVideoSaverが担当する。
        """

        replay_path = Path(replay_path)
        output_path = Path(output_path)

        if not replay_path.is_file():
            raise FileNotFoundError(
                f"Replay video not found: {replay_path}"
            )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        if output_path.exists():
            raise FileExistsError(
                f"Output video already exists: {output_path}"
            )

        logger.info(
            "REPLAY: processing started: source={}, output={}",
            replay_path,
            output_path,
        )

        intermediate_path = output_path.with_name(
            f".{output_path.stem}_processing{output_path.suffix}"
        )

        try:
            if elapsed_seconds is None:
                logger.info(
                    "REPLAY: song start timestamp unavailable, "
                    "using full video"
                )

                self.video_processor.copy(
                    input_path=replay_path,
                    output_path=intermediate_path,
                )

            else:
                if (
                    not math.isfinite(elapsed_seconds)
                    or elapsed_seconds < 0
                ):
                    raise ValueError(
                        "Invalid replay elapsed time: "
                        f"{elapsed_seconds}"
                    )

                actual_duration = (
                    self.video_processor.get_duration(
                        replay_path
                    )
                )

                trim_start = (
                    actual_duration - elapsed_seconds
                )

                logger.info(
                    "REPLAY: trim calculation: "
                    "duration={:.3f}s elapsed={:.3f}s "
                    "trim_start={:.3f}s",
                    actual_duration,
                    elapsed_seconds,
                    trim_start,
                )

                if trim_start <= 0:
                    logger.warning(
                        "REPLAY: calculated trim start is <= 0; "
                        "using full video"
                    )

                    self.video_processor.copy(
                        input_path=replay_path,
                        output_path=intermediate_path,
                    )

                else:
                    self.video_processor.trim(
                        input_path=replay_path,
                        output_path=intermediate_path,
                        start_seconds=trim_start,
                    )

            self._validate_output(
                intermediate_path
            )

            intermediate_path.replace(
                output_path
            )

            self._validate_output(
                output_path
            )

            logger.info(
                "REPLAY: processing completed: {}",
                output_path,
            )

            return output_path

        except Exception:
            logger.exception(
                "REPLAY: processing failed: {}",
                replay_path,
            )

            if intermediate_path.exists():
                try:
                    intermediate_path.unlink()
                except OSError:
                    logger.exception(
                        "REPLAY: failed to delete intermediate file: {}",
                        intermediate_path,
                    )

            if output_path.exists():
                try:
                    output_path.unlink()
                except OSError:
                    logger.exception(
                        "REPLAY: failed to delete output file: {}",
                        output_path,
                    )

            raise

    @staticmethod
    def _validate_output(
        path: Path,
    ) -> None:
        """加工結果が存在し、空でないことを確認する。"""

        if not path.is_file():
            raise RuntimeError(
                f"Video file was not created: {path}"
            )

        size = path.stat().st_size

        if size <= 0:
            raise RuntimeError(
                f"Video file is empty: {path}"
            )

        logger.debug(
            "REPLAY: output validated: {} ({} bytes)",
            path,
            size,
        )
