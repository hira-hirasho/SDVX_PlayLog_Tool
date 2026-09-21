from __future__ import annotations

from pathlib import Path
from threading import Lock, Thread
from typing import Callable

from loguru import logger

from app.media.job import MediaJob
from app.media.processor import MediaProcessResult, MediaProcessor


class MediaJobRunner:
    """MediaJobの非同期実行ライフサイクルを管理する。"""

    def __init__(
        self,
        *,
        processor: MediaProcessor,
        on_completed: Callable[[], None] | None = None,
    ) -> None:
        self._processor = processor
        self._on_completed = on_completed

        self._lock = Lock()
        self._thread: Thread | None = None
        self._current_job: MediaJob | None = None
        self._reserved_image_path: Path | None = None

    def submit(
        self,
        job: MediaJob,
    ) -> bool:
        """MediaJobを開始できればTrue。実行中ならFalse。"""

        with self._lock:
            if (
                self._thread is not None
                and self._thread.is_alive()
            ):
                return False

            if (
                self._reserved_image_path is not None
                and (
                    not job.save_image
                    or self._reserved_image_path
                    != job.result_screenshot_path
                )
            ):
                return False

            self._current_job = job
            self._reserved_image_path = None

            thread = Thread(
                target=self._run,
                args=(job,),
                name="MediaProcessor",
                daemon=False,
            )

            self._thread = thread

            thread.start()

        return True

    def is_running(self) -> bool:
        """MediaJobが実行中か確認する。"""

        with self._lock:
            return (
                self._thread is not None
                and self._thread.is_alive()
            )

    def reserve_image(
        self,
        image_path: Path,
    ) -> bool:
        """指定した一時画像をMediaJob開始前の処理待ちとして予約する。"""

        with self._lock:
            if self._reserved_image_path is not None:
                return False

            if self._current_job is not None:
                return False

            self._reserved_image_path = image_path

            return True

    def release_image(
        self,
        image_path: Path,
    ) -> None:
        """MediaJob開始前に行った一時画像の予約を解除する。"""

        with self._lock:
            if self._reserved_image_path == image_path:
                self._reserved_image_path = None

    def is_image_pending(
        self,
        image_path: Path,
    ) -> bool:
        """指定した一時画像がMediaJob処理待ちか確認する。"""

        with self._lock:
            if self._reserved_image_path == image_path:
                return True

            job = self._current_job

            return (
                job is not None
                and job.save_image
                and job.result_screenshot_path == image_path
            )

    def cleanup_image(
        self,
        image_path: Path,
    ) -> None:
        """MediaJobで処理中でない一時画像を削除する。"""

        if self.is_image_pending(image_path):
            return

        self._delete_result_image(
            image_path
        )

    def wait_for_completion(self) -> None:
        """実行中のMediaJob完了を待つ。"""

        with self._lock:
            thread = self._thread

        if thread is None:
            return

        thread.join()

    def _run(
        self,
        job: MediaJob,
    ) -> None:
        """MediaJobを実行する。"""

        image_saved = False

        try:
            result = self._processor.process(
                job
            )

            image_saved = result.image_saved

            self._log_result(
                job,
                result,
            )

        except Exception:
            logger.exception(
                "MEDIA: unexpected media job failure "
                "play_id={}",
                job.play_id,
            )

        finally:
            self._finish_job(
                job,
                image_saved,
            )

    @staticmethod
    def _log_result(
        job: MediaJob,
        result: MediaProcessResult,
    ) -> None:
        """MediaJobの処理結果をログへ出力する。"""

        if result.all_saved:
            logger.info(
                "MEDIA: media job completed "
                "play_id={} path={}",
                job.play_id,
                job.media_directory,
            )

        elif result.any_saved:
            logger.warning(
                "MEDIA: media job partially completed "
                "play_id={} image={} video={} path={}",
                job.play_id,
                result.image_saved,
                result.video_saved,
                job.media_directory,
            )

        else:
            logger.error(
                "MEDIA: media job failed "
                "play_id={}",
                job.play_id,
            )

    def _finish_job(
        self,
        job: MediaJob,
        image_saved: bool,
    ) -> None:
        """MediaJob完了時の後処理を行う。"""

        if job.save_image:
            if image_saved:
                self._delete_result_image(
                    job.result_screenshot_path
                )

            else:
                logger.warning(
                    "RESULT: temporary image retained because "
                    "formal result.png was not saved: "
                    "play_id={} image={}",
                    job.play_id,
                    job.result_screenshot_path,
                )

        with self._lock:
            self._current_job = None
            self._thread = None

        if self._on_completed is not None:
            try:
                self._on_completed()
            except Exception:
                logger.exception(
                    "MEDIA: completion callback failed "
                    "play_id={}",
                    job.play_id,
                )

    @staticmethod
    def _delete_result_image(
        image_path: Path,
    ) -> None:
        """結果画面の一時画像を削除する。"""

        try:
            image_path.unlink(
                missing_ok=True
            )

            logger.debug(
                "RESULT: temporary image deleted "
                "image={}",
                image_path,
            )

        except Exception:
            logger.exception(
                "RESULT: failed to delete temporary image "
                "image={}",
                image_path,
            )
