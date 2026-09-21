from app.core.state import AppState


class StateManager:
    def __init__(self) -> None:
        self._state = AppState.SLEEP

    @property
    def state(self) -> AppState:
        """現在の状態を取得する。"""
        return self._state

    def set_state(self, state: AppState) -> None:
        """状態を変更する。"""
        self._state = state
