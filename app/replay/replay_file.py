import time
from pathlib import Path


class ReplayFileDetector:
    """OBSが保存したReplayファイルを検出する。"""

    def __init__(
        self,
        directory: Path,
        stability_checks: int = 3,
        stability_interval_seconds: float = 1.0,
    ) -> None:
        self._directory = directory
        self._stability_checks = stability_checks
        self._stability_interval_seconds = (
            stability_interval_seconds
        )

    def find_new_replay(
        self,
        requested_at: float,
    ) -> Path | None:
        """保存要求時刻以降に作成されたMP4を取得する。"""
        if not self._directory.exists():
            return None

        candidates = [
            path
            for path in self._directory.glob("*.mp4")
            if path.stat().st_mtime >= requested_at
        ]

        if not candidates:
            return None

        return max(
            candidates,
            key=lambda path: path.stat().st_mtime,
        )

    def wait_until_stable(
        self,
        file_path: Path,
    ) -> bool:
        """ファイルサイズが安定するまで待つ。"""
        previous_size: int | None = None
        stable_count = 0

        while stable_count < self._stability_checks:
            if not file_path.exists():
                return False

            current_size = file_path.stat().st_size

            if (
                previous_size is not None
                and current_size == previous_size
            ):
                stable_count += 1
            else:
                stable_count = 0

            previous_size = current_size

            if stable_count >= self._stability_checks:
                return True

            time.sleep(self._stability_interval_seconds)

        return True
