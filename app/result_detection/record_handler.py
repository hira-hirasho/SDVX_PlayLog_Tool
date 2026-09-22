from __future__ import annotations

from loguru import logger

from app.database.play_record import PlayRecordService
from app.ocr.processor import OCRProcessor
from app.result_detection.result_state import ResultState


class ResultRecordHandler:
    """リザルト終了時の自動プレイ記録を処理する。"""

    def __init__(
        self,
        *,
        ocr_processor: OCRProcessor,
        play_record_service: PlayRecordService,
    ) -> None:
        self._ocr_processor = ocr_processor
        self._play_record_service = play_record_service

    def on_result_exited(
        self,
        state: ResultState,
    ) -> bool:
        """
        リザルト画面終了時に自動記録を行う。

        F12で既に記録済みの場合は何もしない。
        """

        if state.has_play_record():
            logger.debug(
                "RECORD: already recorded: play_id={}",
                state.play_id,
            )
            return False

        if state.f12_triggered:
            logger.debug(
                "RECORD: F12 was triggered: play_id={}",
                state.play_id,
            )
            return False

        if state.ocr_completed and state.ocr_result is not None:
            ocr_result = state.ocr_result
        else:
            ocr_result = self._ocr_processor.process(
                state.screenshot_path
            )
            state.set_ocr_result(ocr_result)

        if not self._play_record_service.qualifies_for_automatic_record(
            ocr_result
        ):
            logger.debug(
                "RECORD: automatic record condition not met: play_id={}",
                state.play_id,
            )
            return False

        record = self._play_record_service.create_record(
            play_id=state.play_id,
            played_at=state.detected_at,
            ocr_result=ocr_result,
        )

        self._play_record_service.save(record)
        state.mark_play_recorded()

        logger.info(
            "RECORD: automatic play record created: play_id={}",
            state.play_id,
        )

        return True
