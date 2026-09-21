from __future__ import annotations

from loguru import logger

from app.excel.play_record import PlayRecordService
from app.ocr.processor import OCRProcessor
from app.result_detection.result_state import ResultState


class ResultF12Handler:
    """F12によるプレイ記録を処理する。"""

    def __init__(
        self,
        *,
        ocr_processor: OCRProcessor,
        play_record_service: PlayRecordService,
    ) -> None:
        self._ocr_processor = ocr_processor
        self._play_record_service = play_record_service

    def handle(
        self,
        state: ResultState,
    ) -> bool:
        """
        現在のResultStateをF12で強制記録する。

        Returns:
            プレイ記録を作成できた場合True。
        """

        if not state.can_trigger_f12():
            logger.debug(
                "F12: already triggered: play_id={}",
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

        state.mark_f12_triggered()

        record = self._play_record_service.create_record(
            play_id=state.play_id,
            played_at=state.detected_at,
            ocr_result=ocr_result,
        )

        self._play_record_service.save(record)
        state.mark_play_recorded()

        logger.info(
            "F12: play record created: play_id={}",
            state.play_id,
        )

        return True
