from __future__ import annotations

import json
import subprocess
import time
from datetime import datetime
from pathlib import Path

from loguru import logger

from app.media.job import MediaJob
from app.obs.websocket import OBSWebSocket
from app.replay.processor import ReplayProcessor
from app.replay.replay_file import ReplayFileDetector


class ReplayVideoSaver:
    """OBS Replay BufferからReplay動画を保存・処理する。"""

    EXPECTED_VIDEO_WIDTH = 1080
    EXPECTED_VIDEO_HEIGHT = 1920
    EXPECTED_VIDEO_FPS = 60.0

    def __init__(
        self,
        obs_websocket: OBSWebSocket,
        replay_file_detector: ReplayFileDetector,
        replay_processor: ReplayProcessor,
        replay_detection_timeout_seconds: float = 30.0,
        replay_detection_interval_seconds: float = 1.0,
    ) -> None:
        self._obs_websocket = obs_websocket
        self._replay_file_detector = replay_file_detector
        self._replay_processor = replay_processor
        self._replay_detection_timeout_seconds = (
            replay_detection_timeout_seconds
        )
        self._replay_detection_interval_seconds = (
            replay_detection_interval_seconds
        )

    def save(
        self,
        job: MediaJob,
        media_dir: Path,
    ) -> bool:
        """Replay Bufferを保存し、加工済み動画を正式保存する。"""

        replay_path: Path | None = None

        try:
            # --------------------------------------------------------
            # Replay Buffer状態確認
            # --------------------------------------------------------

            if not self._obs_websocket.get_replay_buffer_status():
                logger.warning(
                    "MEDIA: replay buffer is not running; "
                    "starting it: play_id={}",
                    job.play_id,
                )

                self._obs_websocket.start_replay_buffer()

            if not self._obs_websocket.get_replay_buffer_status():
                raise RuntimeError(
                    "OBS Replay Buffer is not running"
                )

            # --------------------------------------------------------
            # Replay保存要求
            # --------------------------------------------------------

            requested_at = (
                datetime.now().timestamp()
            )

            self._obs_websocket.save_replay_buffer()

            logger.info(
                "MEDIA: replay buffer save requested: "
                "play_id={} requested_at={}",
                job.play_id,
                requested_at,
            )

            # --------------------------------------------------------
            # 新規Replay検出
            # --------------------------------------------------------

            replay_path = self._wait_for_new_replay(
                requested_at
            )

            if replay_path is None:
                raise RuntimeError(
                    "New OBS Replay Buffer file "
                    "was not detected"
                )

            logger.info(
                "MEDIA: new replay detected: "
                "play_id={} path={}",
                job.play_id,
                replay_path,
            )

            # --------------------------------------------------------
            # Replayファイル安定確認
            # --------------------------------------------------------

            if not self._replay_file_detector.wait_until_stable(
                replay_path
            ):
                raise RuntimeError(
                    "Replay file did not become stable: "
                    f"{replay_path}"
                )

            # --------------------------------------------------------
            # Replay加工
            # --------------------------------------------------------

            final_path = (
                media_dir / "replay.mp4"
            )

            # ReplayProcessorは動画加工のみを担当する。
            # raw Replayの削除はここでは行わない。
            self._replay_processor.process(
                replay_path,
                final_path,
                elapsed_seconds=job.replay_elapsed_seconds,
            )

            # --------------------------------------------------------
            # 正式保存動画の検証
            # --------------------------------------------------------

            if not self._validate_video(
                final_path
            ):
                raise RuntimeError(
                    "Processed replay video is invalid: "
                    f"{final_path}"
                )

            # --------------------------------------------------------
            # 正式保存完了後にraw Replayを削除
            # --------------------------------------------------------

            try:
                replay_path.unlink()

            except OSError as exc:
                # 正式なreplay.mp4は既に検証済みなので、
                # raw Replay削除失敗によって
                # 正式動画まで失敗扱いにはしない。
                logger.warning(
                    "MEDIA: failed to delete raw replay "
                    "after formal save: "
                    "play_id={} path={} error={}",
                    job.play_id,
                    replay_path,
                    exc,
                )

            else:
                logger.info(
                    "MEDIA: raw replay deleted after "
                    "formal save: play_id={} path={}",
                    job.play_id,
                    replay_path,
                )

            logger.info(
                "MEDIA: replay video saved: "
                "play_id={} path={}",
                job.play_id,
                final_path,
            )

            return True

        except Exception:
            logger.exception(
                "MEDIA: video save failed: "
                "play_id={}",
                job.play_id,
            )

            # 正式保存が完了していない場合は
            # raw Replayを残す。
            if replay_path is not None:
                logger.warning(
                    "MEDIA: raw replay retained because "
                    "formal media save did not complete: "
                    "play_id={} path={}",
                    job.play_id,
                    replay_path,
                )

            return False

    def _wait_for_new_replay(
        self,
        requested_at: float,
    ) -> Path | None:
        """SaveReplayBuffer後の新規Replayファイルを待つ。"""

        deadline = (
            time.monotonic()
            + self._replay_detection_timeout_seconds
        )

        while time.monotonic() < deadline:
            replay_path = (
                self._replay_file_detector.find_new_replay(
                    requested_at
                )
            )

            if replay_path is not None:
                return replay_path

            time.sleep(
                self._replay_detection_interval_seconds
            )

        return None

    @classmethod
    def _validate_video(
        cls,
        path: Path,
    ) -> bool:
        """
        正式保存するReplay動画を検証する。

        必須条件:
        - 1080×1920
        - 60fps
        - H.264
        - AAC
        - ファイルが存在し、空でない
        """

        try:
            if not path.is_file():
                return False

            if path.stat().st_size <= 0:
                return False

            result = subprocess.run(
                [
                    "ffprobe",
                    "-v",
                    "error",
                    "-show_streams",
                    "-show_format",
                    "-of",
                    "json",
                    str(path),
                ],
                check=True,
                capture_output=True,
                text=True,
            )

            metadata = json.loads(
                result.stdout
            )

            streams = metadata.get(
                "streams",
                [],
            )

            video_streams = [
                stream
                for stream in streams
                if stream.get("codec_type") == "video"
            ]

            audio_streams = [
                stream
                for stream in streams
                if stream.get("codec_type") == "audio"
            ]

            if not video_streams:
                logger.warning(
                    "MEDIA: video validation failed: "
                    "no video stream: path={}",
                    path,
                )
                return False

            video = video_streams[0]

            width = video.get("width")
            height = video.get("height")

            if width != cls.EXPECTED_VIDEO_WIDTH:
                logger.warning(
                    "MEDIA: invalid video width: "
                    "path={} width={} expected={}",
                    path,
                    width,
                    cls.EXPECTED_VIDEO_WIDTH,
                )
                return False

            if height != cls.EXPECTED_VIDEO_HEIGHT:
                logger.warning(
                    "MEDIA: invalid video height: "
                    "path={} height={} expected={}",
                    path,
                    height,
                    cls.EXPECTED_VIDEO_HEIGHT,
                )
                return False

            if video.get("codec_name") != "h264":
                logger.warning(
                    "MEDIA: invalid video codec: "
                    "path={} codec={} expected=h264",
                    path,
                    video.get("codec_name"),
                )
                return False

            fps = cls._parse_frame_rate(
                video.get("r_frame_rate")
            )

            if fps is None:
                fps = cls._parse_frame_rate(
                    video.get("avg_frame_rate")
                )

            if fps is None:
                logger.warning(
                    "MEDIA: video FPS could not be determined: "
                    "path={}",
                    path,
                )
                return False

            if abs(
                fps - cls.EXPECTED_VIDEO_FPS
            ) > 0.01:
                logger.warning(
                    "MEDIA: invalid video FPS: "
                    "path={} fps={} expected={}",
                    path,
                    fps,
                    cls.EXPECTED_VIDEO_FPS,
                )
                return False

            if not audio_streams:
                logger.warning(
                    "MEDIA: video validation failed: "
                    "no audio stream: path={}",
                    path,
                )
                return False

            audio = audio_streams[0]

            if audio.get("codec_name") != "aac":
                logger.warning(
                    "MEDIA: invalid audio codec: "
                    "path={} codec={} expected=aac",
                    path,
                    audio.get("codec_name"),
                )
                return False

            logger.info(
                "MEDIA: video validation succeeded: "
                "path={} resolution={}x{} fps={} "
                "video_codec={} audio_codec={}",
                path,
                width,
                height,
                fps,
                video.get("codec_name"),
                audio.get("codec_name"),
            )

            return True

        except FileNotFoundError:
            logger.exception(
                "MEDIA: ffprobe was not found while "
                "validating video: path={}",
                path,
            )
            return False

        except (
            subprocess.CalledProcessError,
            json.JSONDecodeError,
            OSError,
        ):
            logger.exception(
                "MEDIA: video validation failed: "
                "path={}",
                path,
            )
            return False

    @staticmethod
    def _parse_frame_rate(
        value: str | None,
    ) -> float | None:
        """ffprobeのフレームレート表記をfloatへ変換する。"""

        if not value or value == "0/0":
            return None

        try:
            if "/" in value:
                numerator, denominator = value.split(
                    "/",
                    1,
                )

                numerator_value = float(
                    numerator
                )
                denominator_value = float(
                    denominator
                )

                if denominator_value == 0:
                    return None

                return (
                    numerator_value
                    / denominator_value
                )

            return float(value)

        except (
            TypeError,
            ValueError,
        ):
            return None
