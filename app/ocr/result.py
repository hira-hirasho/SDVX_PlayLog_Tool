from dataclasses import dataclass
from difflib import SequenceMatcher


@dataclass
class OCRResult:
    """1回の結果画面から取得したOCR結果。"""

    song_name: str | None = None
    artist: str | None = None
    difficulty: str | None = None
    level: float | None = None
    clear_type: str | None = None
    rate_type: str | None = None
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
    minimum: float,
    maximum: float,
) -> float | None:
    """OCRで取得したLEVELを整数または小数へ正規化する。"""
    if value is None:
        return None

    text = (
        value
        .strip()
        .replace(" ", "")
        .replace(",", "")
    )

    if not text:
        return None

    try:
        level = float(text)
    except ValueError:
        return None

    if not minimum <= level <= maximum:
        return None

    return level


def parse_difficulty_level(
    value: str | None,
    candidates: list[str],
    minimum: float,
    maximum: float,
) -> tuple[str | None, float | None]:
    """
    OCRで取得した難易度+LEVELを解析する。

    以下のようなOCR結果を許容する。

    EXH 16
    EXH16
    MXM 18
    MXM18.6
    MXM 18.6
    """
    if value is None:
        return None, None

    text = (
        value
        .strip()
        .upper()
        .replace(" ", "")
    )

    if not text:
        return None, None

    # OCR候補の中から難易度を先頭部分として探す。
    difficulty = None

    for candidate in sorted(
        candidates,
        key=len,
        reverse=True,
    ):
        normalized_candidate = candidate.upper()

        if text.startswith(normalized_candidate):
            difficulty = candidate
            text = text[len(normalized_candidate):]
            break

    if difficulty is None:
        return None, None

    # 残りをLEVELとして解析する。
    level = normalize_level(
        text,
        minimum,
        maximum,
    )

    if level is None:
        return difficulty, None

    return difficulty, level


def _normalize_ocr_candidate(value: str) -> str:
    """OCR文字列を候補比較用に正規化する。"""
    return (
        value
        .strip()
        .upper()
        .replace(" ", "")
        .replace("_", "")
        .replace("-", "")
    )


def _find_closest_candidate(
    value: str | None,
    candidates: tuple[str, ...],
    threshold: float,
) -> str | None:
    """OCR文字列から最も類似する候補を取得する。"""
    if value is None:
        return None

    text = _normalize_ocr_candidate(value)

    if not text:
        return None

    best_candidate: str | None = None
    best_similarity = 0.0

    for candidate in candidates:
        normalized_candidate = _normalize_ocr_candidate(candidate)

        similarity = SequenceMatcher(
            None,
            text,
            normalized_candidate,
        ).ratio()

        if similarity > best_similarity:
            best_similarity = similarity
            best_candidate = candidate

    if best_similarity < threshold:
        return None

    return best_candidate


def normalize_clear_type(
    value: str | None,
) -> str | None:
    """OCRで取得したクリアタイプを類似度ベースで正規化する。"""
    return _find_closest_candidate(
        value,
        (
            "COMPLETE",
            "ULTIMATECHAIN",
            "PERFECT",
            "CRASH",
        ),
        threshold=0.75,
    )


def normalize_rate_type(
    value: str | None,
) -> str:
    """OCRで取得したRATE種別を類似度ベースで正規化する。"""
    return (
        _find_closest_candidate(
            value,
            (
                "EFFECTIVE RATE",
                "EXCESSIVE RATE",
                "MAXXIVE RATE",
            ),
            threshold=0.75,
        )
        or "OTHER"
    )
