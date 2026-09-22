from __future__ import annotations

from datetime import datetime

from loguru import logger

from app.database.play_log import PlayLogDatabase
from app.ocr.result import OCRResult
from app.play_record import PlayRecord


class PlayRecordService:
    """OCR結果からプレイ記録を生成し、SQLiteへ保存する。"""

    def __init__(
        self,
        *,
        database: PlayLogDatabase,
        min_score: int,
    ) -> None:
        self._database = database
        self._min_score = min_score

    def qualifies_for_automatic_record(
        self,
        ocr_result: OCRResult,
    ) -> bool:
        """自動記録条件を満たすか判定する。"""
        return (
            ocr_result.score is None
            or ocr_result.score >= self._min_score
        )

    def create_record(
        self,
        *,
        play_id: str,
        played_at: datetime,
        ocr_result: OCRResult,
    ) -> PlayRecord:
        """ResultStateのplay_idを使用してPlayRecordを生成する。"""

        return PlayRecord.from_ocr(
            played_at=played_at,
            ocr_result=ocr_result,
            play_id=play_id,
        )

    def save(
        self,
        record: PlayRecord,
    ) -> None:
        """プレイ記録をSQLiteへ保存する。"""

        try:
            inserted = self._database.insert(
                record
            )

            if inserted:
                logger.info(
                    "PLAY_RECORD: SQLite saved: play_id={}",
                    record.play_id,
                )
            else:
                logger.info(
                    "PLAY_RECORD: SQLite record already exists; "
                    "skipped duplicate: play_id={}",
                    record.play_id,
                )

        except Exception:
            logger.exception(
                "PLAY_RECORD: SQLite save failed: play_id={}",
                record.play_id,
            )
            raise
