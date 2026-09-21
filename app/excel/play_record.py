from __future__ import annotations

from datetime import datetime

from loguru import logger

from app.database.play_log import PlayLogDatabase
from app.excel.play_log import PlayLogExcel
from app.play_record import PlayRecord
from app.ocr.result import OCRResult


class PlayRecordService:
    """OCR結果からプレイ記録を生成し、SQLiteとExcelへ保存する。"""

    def __init__(
        self,
        *,
        database: PlayLogDatabase,
        excel: PlayLogExcel | None,
        min_score: int,
    ) -> None:
        self._database = database
        self._excel = excel
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
        """
        プレイ記録をSQLiteとExcelへ独立して保存する。

        SQLiteとExcelはそれぞれplay_idをキーとして
        冪等に保存される。

        一方の保存失敗によって、
        もう一方の成功を取り消さない。
        """

        # ------------------------------------------------------------
        # SQLite
        # ------------------------------------------------------------

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

        except Exception as exc:
            logger.exception(
                "PLAY_RECORD: SQLite save failed: play_id={}",
                record.play_id,
            )

        # ------------------------------------------------------------
        # Excel
        # ------------------------------------------------------------

        if self._excel is not None:
            try:
                inserted = self._excel.save_record(
                    record
                )

                if inserted:
                    logger.info(
                        "PLAY_RECORD: Excel saved: play_id={}",
                        record.play_id,
                    )

                else:
                    logger.info(
                        "PLAY_RECORD: Excel record already exists; "
                        "skipped duplicate: play_id={}",
                        record.play_id,
                    )

            except Exception as exc:
                logger.exception(
                    "PLAY_RECORD: Excel save failed: play_id={}",
                    record.play_id,
                )
