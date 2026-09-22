from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np


from app.core.config import AppConfig


class ResultScreenDetector:
    """キャプチャ済み画像をテンプレートマッチングして結果画面を判定する。"""

    def __init__(self, config: AppConfig) -> None:
        self._config = config

        template_path = self._config.get(
            "result_detection",
            "template_path",
        )

        if not template_path:
            raise ValueError(
                "result_detection.template_path is not configured"
            )

        self._template_path = Path(template_path)

        self._threshold = float(
            self._config.get(
                "result_detection",
                "threshold",
                default=0.85,
            )
        )

        self._scale = float(
            self._config.get(
                "result_detection",
                "scale",
                default=1.0,
            )
        )
        if self._scale <= 0:
            raise ValueError(
                "Result detection scale must be > 0"
            )

        template = cv2.imread(
            str(self._template_path),
            cv2.IMREAD_GRAYSCALE,
        )

        if template is None:
            raise FileNotFoundError(
                "Template could not be loaded: "
                f"{self._template_path}"
            )

        # テンプレートと検出対象ROIの向きを一致させるため、90度回転する。
        # Windows画面から取得したROIは横向きのため、反時計回りに回転する。
        template = cv2.rotate(
            template,
            cv2.ROTATE_90_COUNTERCLOCKWISE,
        )

        self._template = self._resize(
            template
        )

    def is_result_screen(
        self,
        image: np.ndarray,
    ) -> bool:
        """Windows画面から取得したROIが結果画面か判定する。"""

        if image is None:
            raise ValueError(
                "Result detection image must not be None"
            )

        if image.ndim == 2:
            image_gray = image
        else:
            image_gray = cv2.cvtColor(
                image,
                cv2.COLOR_RGB2GRAY,
            )

        image_gray = self._resize(
            image_gray
        )

        template_height, template_width = (
            self._template.shape[:2]
        )

        image_height, image_width = image_gray.shape[:2]

        if (
            image_width != template_width
            or image_height != template_height
        ):
            raise ValueError(
                "Result detection image size does not match "
                "template size. "
                f"image={image_width}x{image_height}, "
                f"template={template_width}x{template_height}"
            )

        result = cv2.matchTemplate(
            image_gray,
            self._template,
            cv2.TM_CCOEFF_NORMED,
        )

        _, max_value, _, _ = cv2.minMaxLoc(result)

        return max_value >= self._threshold

    def _resize(
        self,
        image: np.ndarray,
    ) -> np.ndarray:
        """設定された縮小率で画像を縮小する。"""
        if self._scale == 1.0:
            return image
        width = max(
            1,
            int(image.shape[1] * self._scale),
        )
        height = max(
            1,
            int(image.shape[0] * self._scale),
        )
        return cv2.resize(
            image,
            (width, height),
            interpolation=cv2.INTER_AREA,
        )
