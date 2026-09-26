from __future__ import annotations

from dataclasses import dataclass


VERTICAL_WIDTH = 1080
VERTICAL_HEIGHT = 1920


@dataclass(frozen=True)
class ROI:
    """ROIの矩形座標。"""

    x: int
    y: int
    width: int
    height: int


def rotate_left_90_roi(roi: ROI) -> ROI:
    """
    1080x1920基準のROIを、
    左90度回転後の1920x1080基準へ変換する。
    """

    return ROI(
        x=roi.y,
        y=VERTICAL_WIDTH - (roi.x + roi.width),
        width=roi.height,
        height=roi.width,
    )
