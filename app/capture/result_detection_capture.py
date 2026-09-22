from __future__ import annotations

import numpy as np
from PIL import Image, ImageGrab


class ResultDetectionCapture:
    """Windows画面からリザルト検知・保存用画像をキャプチャする。"""

    SCREEN_WIDTH = 1920
    SCREEN_HEIGHT = 1080

    def __init__(
        self,
        *,
        x: int,
        y: int,
        width: int,
        height: int,
    ) -> None:
        if width <= 0:
            raise ValueError(
                "Result detection capture width must be > 0"
            )

        if height <= 0:
            raise ValueError(
                "Result detection capture height must be > 0"
            )

        self._x = x
        self._y = y
        self._width = width
        self._height = height

    def capture_detection_region(self) -> np.ndarray:
        """
        Windows画面からリザルト判定用ROIだけをキャプチャする。
        """
        image = ImageGrab.grab(
            bbox=(
                self._x,
                self._y,
                self._x + self._width,
                self._y + self._height,
            ),
            all_screens=True,
        )
        return np.asarray(image)

    def capture_full_screen(self) -> np.ndarray:
        """
        Windows画面全体を1回キャプチャする。

        戻り値:
            1920×1080のRGB画像を表すnumpy配列。
        """

        image = ImageGrab.grab(
            bbox=(
                0,
                0,
                self.SCREEN_WIDTH,
                self.SCREEN_HEIGHT,
            ),
            all_screens=True,
        )

        return np.asarray(image)

    def create_result_image(
        self,
        image: np.ndarray,
    ) -> Image.Image:
        """
        フルスクリーンキャプチャを右90度回転し、
        1080×1920のリザルト画像を生成する。

        ResultMonitorが検知に使用した同一キャプチャを
        そのまま引数として受け取る。
        """

        if image.ndim < 2:
            raise ValueError(
                "Captured image must have at least 2 dimensions"
            )

        image_height, image_width = image.shape[:2]

        if (
            image_width != self.SCREEN_WIDTH
            or image_height != self.SCREEN_HEIGHT
        ):
            raise ValueError(
                "Unexpected captured image size: "
                f"{image_width}x{image_height}, "
                f"expected="
                f"{self.SCREEN_WIDTH}x{self.SCREEN_HEIGHT}"
            )

        pil_image = Image.fromarray(
            image
        )

        return pil_image.rotate(
            -90,
            expand=True,
        )
