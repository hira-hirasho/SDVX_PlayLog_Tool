from __future__ import annotations

import cv2
import numpy as np
from loguru import logger

from app.core.config import AppConfig, PROJECT_ROOT


SONG_START_TEMPLATE_PATH = (
    PROJECT_ROOT / "templates" / "song_start.png"
)


class SongStartDetector:
    """リアルタイム画面キャプチャから曲開始画面を検出する。"""

    def __init__(
        self,
        config: AppConfig,
    ) -> None:
        detection_config = config.get(
            "song_start_detection",
            default={},
        )

        self.template_path = SONG_START_TEMPLATE_PATH

        if not self.template_path.is_file():
            raise FileNotFoundError(
                "Song start template not found: "
                f"{self.template_path}"
            )

        self._threshold = float(
            detection_config.get(
                "threshold",
                0.85,
            )
        )

        self._scale = float(
            detection_config.get(
                "scale",
                1.0,
            )
        )

        if self._scale <= 0:
            raise ValueError(
                "Song start detection scale must be > 0"
            )

        region = detection_config.get(
            "region",
            {},
        )

        self._region_width = int(
            region.get("width", 0)
        )
        self._region_height = int(
            region.get("height", 0)
        )

        if (
            self._region_width <= 0
            or self._region_height <= 0
        ):
            raise ValueError(
                "Song start detection region size "
                "must be > 0"
            )

        template = cv2.imread(
            str(self.template_path),
            cv2.IMREAD_GRAYSCALE,
        )

        if template is None:
            raise FileNotFoundError(
                f"Song start template not found: {self.template_path}"
            )

        template = cv2.rotate(
            template,
            cv2.ROTATE_90_COUNTERCLOCKWISE,
        )

        template = self._resize(template)

        template_height, template_width = (
            template.shape[:2]
        )

        expected_width = int(
            self._region_width * self._scale
        )
        expected_height = int(
            self._region_height * self._scale
        )

        if (
            template_width != expected_width
            or template_height != expected_height
        ):
            raise ValueError(
                "Invalid song start template size: "
                f"expected="
                f"{expected_width}x"
                f"{expected_height}, "
                f"actual="
                f"{template_width}x"
                f"{template_height}"
            )

        self._template = template

    def is_song_start(
        self,
        image: np.ndarray,
    ) -> bool:
        """指定された画面ROIが曲開始画面か判定する。"""

        if image.size == 0:
            return False

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_RGB2GRAY,
        )

        gray = self._resize(
            gray
        )

        template_height, template_width = (
            self._template.shape[:2]
        )

        image_height, image_width = (
            gray.shape[:2]
        )

        if (
            image_width < template_width
            or image_height < template_height
        ):
            return False

        result = cv2.matchTemplate(
            gray,
            self._template,
            cv2.TM_CCOEFF_NORMED,
        )

        _, max_value, _, _ = cv2.minMaxLoc(
            result
        )

        logger.debug(
            "SONG_START: score={:.6f}",
            max_value,
        )

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
