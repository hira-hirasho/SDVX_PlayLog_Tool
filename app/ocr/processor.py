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

    NUMERIC_FIELDS = (
        "level",
        "score_first",
        "score_second",
        "ex_score",
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
        
        self._text_rec_model = (
            self._ocr
            .paddlex_pipeline
            ._pipeline
            .text_rec_model
        )

        self._numeric_allowed_indices = (
            self._build_numeric_allowed_indices()
        )

        logger.info(
            "Numeric OCR enabled: "
            f"allowed_indices={self._numeric_allowed_indices}"
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
                    if name in self.NUMERIC_FIELDS:
                        raw_texts[name] = (
                            self._recognize_numeric_crop(
                                crop,
                                name,
                            )
                        )
                    else:
                        raw_texts[name] = (
                            self._recognize_crop(
                                crop,
                                name,
                            )
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

        score_text = self._combine_score(
            raw_texts.get("score_first"),
            raw_texts.get("score_second"),
        )

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
                score_text,
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

    def _recognize_numeric_crop(
        self,
        image: Image.Image,
        field_name: str,
    ) -> str | None:
        """数字候補だけを許可してOCRする。"""
        image_array = np.asarray(image)

        last_text: str | None = None

        for attempt in range(1, self._max_attempts + 1):
            logger.debug(
                "Numeric OCR attempt: "
                f"field={field_name}, "
                f"attempt={attempt}/{self._max_attempts}"
            )

            text = self._recognize_numeric_once(
                image_array,
            )

            last_text = text

            if text:
                logger.debug(
                    "Numeric OCR attempt succeeded: "
                    f"field={field_name}, "
                    f"attempt={attempt}"
                )
                return text

            logger.warning(
                "Numeric OCR attempt returned no text: "
                f"field={field_name}, "
                f"attempt={attempt}"
            )

        return last_text

    def _recognize_numeric_once(
        self,
        image_array: np.ndarray,
    ) -> str | None:
        """モデル出力を数字＋blankに制限してCTCデコードする。"""
        batch_data = next(
            iter(
                self._text_rec_model.batch_sampler(
                    [image_array],
                )
            )
        )

        raw_images = self._text_rec_model.pre_tfs["Read"](
            imgs=batch_data.instances,
        )

        width_list = [
            image.shape[1] / float(image.shape[0])
            for image in raw_images
        ]

        resized_images = self._text_rec_model.pre_tfs[
            "ReisizeNorm"
        ](
            imgs=raw_images,
        )

        batch_images = self._text_rec_model.pre_tfs[
            "ToBatch"
        ](
            imgs=resized_images,
        )

        predictions = self._text_rec_model.runner(
            x=batch_images,
        )

        if not predictions:
            return None

        logits = predictions[0]

        if not isinstance(logits, np.ndarray):
            logits = np.asarray(logits)

        masked_logits = self._mask_numeric_logits(
            logits,
        )

        decoded = self._text_rec_model.post_op(
            [masked_logits],
            return_word_box=False,
            wh_ratio_list=width_list,
            max_wh_ratio=max(width_list),
        )

        if not decoded:
            return None

        text = decoded[0][0]

        if not isinstance(text, str):
            return None

        text = text.strip()

        return text or None

    def _mask_numeric_logits(
        self,
        logits: np.ndarray,
    ) -> np.ndarray:
        """数字とCTC blank以外のクラスを選択不能にする。"""
        masked = np.full_like(
            logits,
            -np.inf,
        )

        allowed_indices = tuple(
            self._numeric_allowed_indices
        )

        masked[
            ...,
            allowed_indices,
        ] = logits[
            ...,
            allowed_indices,
        ]

        return masked

    def _build_numeric_allowed_indices(self) -> tuple[int, ...]:
        """モデルの文字辞書から数字＋blankのindexを取得する。"""
        character = self._text_rec_model.post_op.character

        if not isinstance(character, list):
            raise ValueError(
                "Unexpected OCR character dictionary type"
            )

        try:
            blank_index = character.index("blank")
        except ValueError as error:
            raise ValueError(
                "OCR character dictionary does not contain "
                "the CTC blank token"
            ) from error

        digit_indices: set[int] = set()

        for digit in "0123456789":
            try:
                digit_indices.add(
                    character.index(digit)
                )
            except ValueError as error:
                raise ValueError(
                    "OCR character dictionary does not contain "
                    f"digit: {digit}"
                ) from error

        return tuple(
            sorted({blank_index, *digit_indices})
        )

    @staticmethod
    def _combine_score(
        first: str | None,
        second: str | None,
    ) -> str | None:
        if not first or not second:
            return None

        return f"{first}{second}"

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
