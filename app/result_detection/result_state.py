from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from app.core.ids import generate_uuid7
from app.ocr.result import OCRResult


@dataclass
class ResultState:
    """現在表示中の1リザルトを管理する状態。"""

    detected_at: datetime
    screenshot_path: Path

    play_id: str = field(
        default_factory=lambda: str(generate_uuid7())
    )

    ocr_result: OCRResult | None = None
    ocr_completed: bool = False
    play_recorded: bool = False
    f12_triggered: bool = False

    def has_play_record(self) -> bool:
        """プレイ記録が既に作成済みか。"""
        return self.play_recorded

    def can_trigger_f12(self) -> bool:
        """F12記録を実行可能か。"""
        return not self.f12_triggered

    def mark_f12_triggered(self) -> None:
        """F12が受理されたことを記録する。"""
        self.f12_triggered = True

    def set_ocr_result(self, result: OCRResult) -> None:
        """OCR結果を設定する。"""
        self.ocr_result = result
        self.ocr_completed = True

    def mark_play_recorded(self) -> None:
        """プレイ記録が作成済みであることを記録する。"""
        self.play_recorded = True
