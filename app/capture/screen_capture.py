from __future__ import annotations

import numpy as np
from PIL import ImageGrab


class ScreenCapture:
    SCREEN_WIDTH = 1920
    SCREEN_HEIGHT = 1080

    def capture(self) -> np.ndarray:
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

    @staticmethod
    def crop(
        image: np.ndarray,
        x: int,
        y: int,
        width: int,
        height: int,
    ) -> np.ndarray:
        return image[
            y:y + height,
            x:x + width,
        ]
