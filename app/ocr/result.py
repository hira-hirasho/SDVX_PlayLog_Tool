from dataclasses import dataclass


@dataclass
class OCRResult:
    """1回の結果画面から取得したOCR結果。"""

    song_name: str | None = None
    artist: str | None = None
    difficulty: str | None = None
    level: int | None = None
    score: int | None = None
    score_delta: int | None = None
    ex_score: int | None = None
    ex_score_delta: int | None = None


def _normalize_numeric_parts(
    value: str | None,
) -> tuple[str, str] | None:
    """OCR数値文字列を符号と数字文字列へ正規化する。"""
    if value is None:
        return None

    text = value.strip()

    if not text or text == "-":
        return None

    text = text.replace(" ", "").replace(",", "")

    sign = ""

    if text.startswith("+"):
        sign = "+"
        text = text[1:]
    elif text.startswith("-"):
        sign = "-"
        text = text[1:]

    digits = "".join(
        character
        for character in text
        if character.isdigit()
    )

    if not digits:
        return None

    return sign, digits


def normalize_numeric_text(value: str | None) -> int | None:
    """OCRで取得した数値文字列を整数へ正規化する。"""
    parts = _normalize_numeric_parts(value)

    if parts is None:
        return None

    sign, digits = parts

    try:
        return int(f"{sign}{digits}")
    except ValueError:
        return None


def normalize_fixed_digits(
    value: str | None,
    expected_length: int | None = None,
) -> int | None:
    """数字項目を正規化し、必要に応じて桁数を検証する。"""
    parts = _normalize_numeric_parts(value)

    if parts is None:
        return None

    sign, digits = parts

    if (
        expected_length is not None
        and len(digits) != expected_length
    ):
        return None

    try:
        return int(f"{sign}{digits}")
    except ValueError:
        return None


def normalize_difficulty(
    value: str | None,
    candidates: list[str],
) -> str | None:
    """OCRで取得した難易度を候補値へ正規化する。"""
    if value is None:
        return None

    text = value.strip().upper()

    if not text:
        return None

    for candidate in candidates:
        if text == candidate.upper():
            return candidate

    return None


def normalize_level(
    value: str | None,
    minimum: int,
    maximum: int,
) -> int | None:
    """OCRで取得したLEVELを整数へ正規化する。"""
    level = normalize_numeric_text(value)

    if level is None:
        return None

    if not minimum <= level <= maximum:
        return None

    return level
