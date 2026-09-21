from __future__ import annotations

import secrets
import time
import uuid


def generate_uuid7() -> uuid.UUID:
    """RFC 9562準拠のUUIDv7を生成する。"""

    timestamp_ms = int(time.time() * 1000)

    if timestamp_ms >= (1 << 48):
        raise OverflowError("UUIDv7 timestamp exceeds 48-bit range")

    rand_a = secrets.randbits(12)
    rand_b = secrets.randbits(62)

    value = (
        (timestamp_ms << 80)
        | (0x7 << 76)
        | (rand_a << 64)
        | (0b10 << 62)
        | rand_b
    )

    return uuid.UUID(int=value)
