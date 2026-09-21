from __future__ import annotations

import math
import subprocess
from pathlib import Path

from loguru import logger


class VideoProcessor:
    """FFmpegを使用してReplay動画を加工する。"""

    def trim(
        self,
        input_path: Path,
        output_path: Path,
        start_seconds: float,
    ) -> None:
        """
        動画のstart_seconds以前を削除して出力する。

        映像・音声は再エンコードせず、
        元Replayのストリームをそのままコピーする。

        元ファイルは変更しない。
        """

        input_path = Path(input_path)
        output_path = Path(output_path)

        if not input_path.is_file():
            raise FileNotFoundError(
                f"Input video not found: {input_path}"
            )

        if start_seconds < 0:
            raise ValueError(
                f"start_seconds must be >= 0: {start_seconds}"
            )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        command = [
            "ffmpeg",
            "-y",
            "-ss",
            str(start_seconds),
            "-i",
            str(input_path),
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-c",
            "copy",
            "-avoid_negative_ts",
            "make_zero",
            str(output_path),
        ]

        logger.info(
            "VIDEO: stream-copy trimming started: "
            "input={}, output={}, start={}s",
            input_path,
            output_path,
            start_seconds,
        )

        self._run_ffmpeg(
            command,
            operation="stream-copy trim",
            input_path=input_path,
        )

        self._validate_output_file(
            output_path
        )

        logger.info(
            "VIDEO: stream-copy trimming completed: "
            "output={}, size={} bytes",
            output_path,
            output_path.stat().st_size,
        )

    def copy(
        self,
        input_path: Path,
        output_path: Path,
    ) -> None:
        """
        動画全体を再エンコードせず、そのままコピーする。

        曲開始地点が検出できなかった場合に使用する。

        元ファイルは変更しない。
        """

        input_path = Path(input_path)
        output_path = Path(output_path)

        if not input_path.is_file():
            raise FileNotFoundError(
                f"Input video not found: {input_path}"
            )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        command = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-map",
            "0:v:0",
            "-map",
            "0:a?",
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(output_path),
        ]

        logger.info(
            "VIDEO: stream-copy full video started: "
            "input={}, output={}",
            input_path,
            output_path,
        )

        self._run_ffmpeg(
            command,
            operation="stream-copy full video",
            input_path=input_path,
        )

        self._validate_output_file(
            output_path
        )

        logger.info(
            "VIDEO: stream-copy full video completed: "
            "output={}, size={} bytes",
            output_path,
            output_path.stat().st_size,
        )

    @staticmethod
    def get_duration(
        input_path: Path,
    ) -> float:
        """動画ファイルの実時間長を秒単位で取得する。"""

        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(input_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        duration = float(result.stdout.strip())

        if (
            not math.isfinite(duration)
            or duration <= 0
        ):
            raise RuntimeError(
                f"Invalid video duration: {input_path}"
            )

        return duration

    @staticmethod
    def _run_ffmpeg(
        command: list[str],
        *,
        operation: str,
        input_path: Path,
    ) -> None:
        """FFmpegを実行する。"""

        try:
            subprocess.run(
                command,
                check=True,
            )

        except subprocess.CalledProcessError as exc:
            raise RuntimeError(
                f"FFmpeg {operation} failed "
                f"with exit code {exc.returncode}: "
                f"{input_path}"
            ) from exc

    @staticmethod
    def _validate_output_file(
        output_path: Path,
    ) -> None:
        """FFmpeg出力ファイルの存在とサイズを確認する。"""

        if not output_path.is_file():
            raise RuntimeError(
                "FFmpeg completed but output file "
                f"was not created: {output_path}"
            )

        output_size = output_path.stat().st_size

        if output_size <= 0:
            raise RuntimeError(
                "FFmpeg created an empty output file: "
                f"{output_path}"
            )
