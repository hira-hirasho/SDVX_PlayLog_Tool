from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from paddleocr import PaddleOCR

from app.core.config import AppConfig
from app.core.logger import get_logger
from app.ocr.region_cropper import OCRRegionCropper
from app.ocr.result import (
    OCRResult,
    normalize_difficulty,
    normalize_fixed_digits,
    normalize_level,
    normalize_numeric_text,
)


logger = get_logger("OCR")


class OCRProcessor:
    """結果画面からSDVXの各項目をOCRする。"""

    OCR_FIELDS = (
        "song_name",
        "artist",
        "difficulty",
        "level",
        "score",
        "score_delta",
        "ex_score",
        "ex_score_delta",
    )

    DIFFICULTY_CANDIDATES = (
        "NOV",
        "ADV",
        "EXH",
        "INF",
        "GRV",
        "HVN",
        "VVD",
        "XCD",
        "MXM",
        "ULT",
        "NBL",
    )

    LEVEL_MIN = 1
    LEVEL_MAX = 20

    def __init__(self, config: AppConfig) -> None:
        self._config = config
        self._cropper = OCRRegionCropper(config)

        self._max_attempts = int(
            config.get(
                "ocr",
                "max_attempts",
                default=2,
            )
        )

        self._difficulty_candidates = self.DIFFICULTY_CANDIDATES

        self._level_min = self.LEVEL_MIN
        self._level_max = self.LEVEL_MAX

        if self._max_attempts <= 0:
            raise ValueError(
                "ocr.max_attempts must be > 0"
            )

        logger.info(
            "Initializing PaddleOCR "
            f"(max_attempts={self._max_attempts})"
        )

        self._ocr = PaddleOCR(
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False,
            engine="paddle",
        )

        logger.info("PaddleOCR initialized")

    def process(
        self,
        image_path: Path,
    ) -> OCRResult:
        """
        結果画像をOCRして結果を返す。

        各フィールドは独立して処理する。
        一部フィールドのOCRが失敗しても、他フィールドの処理は継続する。
        """
        logger.info(
            f"OCR started: {image_path}"
        )

        crops = self._cropper.extract(image_path)
        raw_texts: dict[str, str | None] = {}

        for name, crop in crops.items():
            try:
                logger.info(
                    f"OCR field started: {name}"
                )

                try:
                    raw_texts[name] = self._recognize_crop(
                        crop,
                        name,
                    )
                except Exception:
                    logger.exception(
                        f"OCR field failed: {name}"
                    )
                    raw_texts[name] = None

                logger.info(
                    f"OCR field raw result: "
                    f"{name}={raw_texts[name]!r}"
                )

            finally:
                crop.close()

        result = OCRResult(
            song_name=self._normalize_text(
                raw_texts.get("song_name"),
            ),
            artist=self._normalize_text(
                raw_texts.get("artist"),
            ),
            difficulty=normalize_difficulty(
                raw_texts.get("difficulty"),
                self._difficulty_candidates,
            ),
            level=normalize_level(
                raw_texts.get("level"),
                self._level_min,
                self._level_max,
            ),
            score=normalize_fixed_digits(
                raw_texts.get("score"),
                expected_length=8,
            ),
            score_delta=normalize_numeric_text(
                raw_texts.get("score_delta"),
            ),
            ex_score=normalize_fixed_digits(
                raw_texts.get("ex_score"),
            ),
            ex_score_delta=normalize_numeric_text(
                raw_texts.get("ex_score_delta"),
            ),
        )

        logger.info(
            "OCR normalized result: "
            f"song_name={result.song_name!r}, "
            f"artist={result.artist!r}, "
            f"difficulty={result.difficulty!r}, "
            f"level={result.level!r}, "
            f"score={result.score!r}, "
            f"score_delta={result.score_delta!r}, "
            f"ex_score={result.ex_score!r}, "
            f"ex_score_delta={result.ex_score_delta!r}"
        )

        missing_fields = [
            field
            for field in self.OCR_FIELDS
            if getattr(result, field) is None
        ]

        if missing_fields:
            logger.warning(
                "OCR completed with missing fields: "
                f"{missing_fields}"
            )
        else:
            logger.info("OCR completed successfully")

        return result

    def _recognize_crop(
        self,
        image: Image.Image,
        field_name: str,
    ) -> str | None:
        """1つのOCR領域を最大指定回数まで認識する。"""
        image_array = np.asarray(image)

        last_text: str | None = None

        for attempt in range(1, self._max_attempts + 1):
            logger.debug(
                f"OCR attempt: "
                f"field={field_name}, "
                f"attempt={attempt}/{self._max_attempts}"
            )

            result = self._ocr.predict(image_array)
            text = self._extract_text(result)

            last_text = text

            if text:
                logger.debug(
                    f"OCR attempt succeeded: "
                    f"field={field_name}, "
                    f"attempt={attempt}"
                )
                return text

            logger.warning(
                f"OCR attempt returned no text: "
                f"field={field_name}, "
                f"attempt={attempt}"
            )

        return last_text

    @staticmethod
    def _extract_text(result) -> str | None:
        """PaddleOCRの結果から認識文字列を取得する。"""
        for page in result:
            data = page.json

            if isinstance(data, dict):
                data = data.get("res", data)

            if not isinstance(data, dict):
                continue

            texts = data.get("rec_texts")

            if not isinstance(texts, list):
                continue

            normalized = [
                str(text)
                for text in texts
                if str(text).strip()
            ]

            if normalized:
                return "".join(normalized)

        return None

    @staticmethod
    def _normalize_text(
        value: str | None,
    ) -> str | None:
        """曲名・アーティスト名を正規化する。"""
        if value is None:
            return None

        text = value.strip()

        if not text:
            return None

        return text
