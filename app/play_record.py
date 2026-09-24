from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.core.ids import generate_uuid7
from app.ocr.result import OCRResult


@dataclass(frozen=True)
class PlayRecord:
    """1プレイ分の正規プレイ記録。"""

    play_id: str
    played_at: datetime
    song_name: str | None
    artist: str | None
    difficulty: str | None
    level: float | None
    clear_type: str | None
    rate_type: str | None
    score: int | None
    score_delta: int | None
    ex_score: int | None
    ex_score_delta: int | None

    @classmethod
    def from_ocr(
        cls,
        *,
        played_at: datetime,
        ocr_result: OCRResult,
        play_id: str | None = None,
    ) -> PlayRecord:
        return cls(
            play_id=play_id or str(generate_uuid7()),
            played_at=played_at,
            song_name=ocr_result.song_name,
            artist=ocr_result.artist,
            difficulty=ocr_result.difficulty,
            level=ocr_result.level,
            clear_type=ocr_result.clear_type,
            rate_type=ocr_result.rate_type,
            score=ocr_result.score,
            score_delta=ocr_result.score_delta,
            ex_score=ocr_result.ex_score,
            ex_score_delta=ocr_result.ex_score_delta,
        )
