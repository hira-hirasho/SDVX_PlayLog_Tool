from enum import Enum


class AppState(Enum):
    """SDVX PlayLog全体の状態。"""

    SLEEP = "SLEEP"
    ACTIVE = "ACTIVE"
