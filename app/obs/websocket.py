import base64
import logging
import time

import obsws_python as obs
from obsws_python.error import OBSSDKRequestError

from app.core.config import (
    AppConfig,
    get_obs_websocket_password,
)
from app.core.logger import get_logger


logging.getLogger("obsws_python").setLevel(logging.CRITICAL)

logger = get_logger("OBS_WS")


class OBSWebSocket:
    """OBS WebSocketとの通信を管理する。"""

    def __init__(self, config: AppConfig) -> None:
        self._config = config
        self._client: obs.ReqClient | None = None

    @property
    def client(self) -> obs.ReqClient:
        if self._client is None:
            raise RuntimeError("OBS WebSocket is not connected")
        return self._client

    def connect(self) -> None:
        """OBS WebSocketに接続する。"""
        host = self._config.get(
            "obs",
            "websocket",
            "host",
            default="localhost",
        )
        port = self._config.get(
            "obs",
            "websocket",
            "port",
            default=4455,
        )
        timeout_seconds = self._config.get(
            "obs",
            "websocket",
            "timeout_seconds",
            default=30,
        )

        password = get_obs_websocket_password()

        self._client = obs.ReqClient(
            host=host,
            port=port,
            password=password,
            timeout=timeout_seconds,
        )

        logger.info(
            f"OBS WebSocket connected: "
            f"host={host} port={port}"
        )

    def disconnect(self) -> None:
        """OBS WebSocketを切断する。"""
        if self._client is None:
            return

        try:
            self._client.disconnect()
        finally:
            self._client = None

    def wait_until_ready(
        self,
        timeout_seconds: float = 30.0,
        interval_seconds: float = 1.0,
    ) -> None:
        """
        OBS WebSocketがReplay Buffer状態を取得できるようになるまで待つ。
        """
        deadline = time.monotonic() + timeout_seconds

        while time.monotonic() < deadline:
            try:
                self.get_replay_buffer_status()
                logger.info("OBS WebSocket is ready")
                return
            except OBSSDKRequestError:
                time.sleep(interval_seconds)

        raise TimeoutError(
            f"OBS was not ready within {timeout_seconds} seconds"
        )

    def get_current_scene(self) -> str:
        """現在選択されているOBSシーン名を取得する。"""
        response = self.client.get_current_program_scene()
        return response.current_program_scene_name

    def get_replay_buffer_status(self) -> bool:
        """
        Replay Bufferが現在実行中か取得する。

        Returns:
            True: Replay Buffer実行中
            False: Replay Buffer停止中
        """
        response = self.client.get_replay_buffer_status()
        return bool(response.output_active)

    def start_replay_buffer(
        self,
        timeout_seconds: float = 10.0,
        interval_seconds: float = 0.5,
    ) -> None:
        """
        Replay Bufferを開始し、実際に実行状態になるまで待つ。
        既に実行中なら何もしない。
        """
        if self.get_replay_buffer_status():
            logger.info(
                "OBS Replay Buffer is already running"
            )
            return

        logger.info(
            "Starting OBS Replay Buffer"
        )

        self.client.start_replay_buffer()

        deadline = (
            time.monotonic()
            + timeout_seconds
        )

        while time.monotonic() < deadline:
            try:
                if self.get_replay_buffer_status():
                    logger.info(
                        "OBS Replay Buffer started"
                    )
                    return
            except OBSSDKRequestError:
                pass

            time.sleep(interval_seconds)

        raise TimeoutError(
            "OBS Replay Buffer did not become active "
            f"within {timeout_seconds} seconds"
        )

    def save_replay_buffer(self) -> None:
        """Replay Bufferを保存する。"""
        if not self.get_replay_buffer_status():
            raise RuntimeError(
                "OBS Replay Buffer is not running"
            )

        logger.info(
            "Requesting OBS Replay Buffer save"
        )

        self.client.save_replay_buffer()

        logger.info(
            "OBS Replay Buffer save requested"
        )

    def save_source_screenshot(
        self,
        source_name: str,
        file_path: str,
    ) -> None:
        """OBSソースのスクリーンショットをPNGとして保存する。"""
        width = self._config.get(
            "obs",
            "screenshot",
            "width",
        )
        height = self._config.get(
            "obs",
            "screenshot",
            "height",
        )

        response = self.client.get_source_screenshot(
            source_name,
            "png",
            width,
            height,
            -1,
        )

        image_data = response.image_data

        if image_data.startswith("data:image"):
            image_data = image_data.split(",", 1)[1]

        with open(file_path, "wb") as file:
            file.write(
                base64.b64decode(image_data)
            )

    @property
    def is_connected(self) -> bool:
        """OBS WebSocketに接続済みか取得する。"""
        return self._client is not None
