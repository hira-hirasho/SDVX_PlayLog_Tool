from dataclasses import dataclass
from pathlib import Path

from PIL import Image

from app.core.config import AppConfig


@dataclass(frozen=True)
class OCRRegion:
    """OCR対象領域の座標を表す。"""

    name: str
    x: int
    y: int
    width: int
    height: int

    @property
    def box(self) -> tuple[int, int, int, int]:
        """Pillowのcrop()で使用する座標を返す。"""
        return (
            self.x,
            self.y,
            self.x + self.width,
            self.y + self.height,
        )


class OCRRegionCropper:
    """結果画像からOCR対象領域を切り出す。"""

    RESULT_IMAGE_WIDTH = 1080
    RESULT_IMAGE_HEIGHT = 1920

    REQUIRED_REGIONS = (
        "song_name",
        "artist",
        "difficulty",
        "level",
        "score",
        "score_delta",
        "ex_score",
        "ex_score_delta",
    )

    def __init__(self, config: AppConfig) -> None:
        self._config = config
        self._regions = self._load_regions()

    def _load_regions(self) -> dict[str, OCRRegion]:
        """config.yamlからOCR領域を読み込む。"""
        regions = self._config.get(
            "ocr",
            "regions",
            default={},
        )

        if not isinstance(regions, dict):
            raise ValueError("ocr.regions must be a mapping")

        loaded_regions: dict[str, OCRRegion] = {}

        for name in self.REQUIRED_REGIONS:
            data = regions.get(name)

            if not isinstance(data, dict):
                raise ValueError(
                    f"OCR region is not configured: ocr.regions.{name}"
                )

            try:
                x = int(data["x"])
                y = int(data["y"])
                width = int(data["width"])
                height = int(data["height"])
            except (KeyError, TypeError, ValueError) as error:
                raise ValueError(
                    f"Invalid OCR region: ocr.regions.{name}"
                ) from error

            if x < 0 or y < 0:
                raise ValueError(
                    f"OCR region coordinates must be >= 0: {name}"
                )

            if width <= 0 or height <= 0:
                raise ValueError(
                    f"OCR region size must be > 0: {name}"
                )

            loaded_regions[name] = OCRRegion(
                name=name,
                x=x,
                y=y,
                width=width,
                height=height,
            )

        return loaded_regions

    def _get_expected_image_size(self) -> tuple[int, int]:
        """OCR処理対象となるリザルト画像サイズを返す。"""
        return (
            self.RESULT_IMAGE_WIDTH,
            self.RESULT_IMAGE_HEIGHT,
        )

    @property
    def regions(self) -> dict[str, OCRRegion]:
        """読み込んだOCR領域を返す。"""
        return self._regions.copy()

    def extract(
        self,
        image_path: Path,
    ) -> dict[str, Image.Image]:
        """結果画像から8つのOCR対象画像を切り出す。"""
        expected_size = self._get_expected_image_size()

        with Image.open(image_path) as image:
            if image.size != expected_size:
                raise ValueError(
                    "OCR source image has an unexpected size: "
                    f"expected={expected_size[0]}x{expected_size[1]}, "
                    f"actual={image.size[0]}x{image.size[1]}, "
                    f"path={image_path}"
                )

            image = image.convert("RGB")

            result: dict[str, Image.Image] = {}

            for name, region in self._regions.items():
                self._validate_region_bounds(
                    region,
                    image.size,
                )
                result[name] = image.crop(region.box)

            return result

    @staticmethod
    def _validate_region_bounds(
        region: OCRRegion,
        image_size: tuple[int, int],
    ) -> None:
        """OCR領域が画像の範囲内か確認する。"""
        image_width, image_height = image_size

        if region.x + region.width > image_width:
            raise ValueError(
                f"OCR region exceeds image width: {region.name}"
            )

        if region.y + region.height > image_height:
            raise ValueError(
                f"OCR region exceeds image height: {region.name}"
            )

    def save_debug_crops(
        self,
        image_path: Path,
        output_directory: Path,
    ) -> dict[str, Path]:
        """OCR切り出し画像をデバッグ用に保存する。"""
        crops = self.extract(image_path)

        output_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        paths: dict[str, Path] = {}

        for name, crop in crops.items():
            output_path = output_directory / f"{name}.png"
            crop.save(
                output_path,
                format="PNG",
            )
            crop.close()
            paths[name] = output_path

        return paths
