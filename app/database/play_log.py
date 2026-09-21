from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

from app.play_record import PlayRecord


class PlayLogDatabase:
    """SDVXプレイ履歴をSQLiteへ保存する。"""

    TABLE_NAME = "play_log"

    COLUMNS = (
        "play_id",
        "played_at",
        "song_name",
        "artist",
        "difficulty",
        "level",
        "score",
        "score_delta",
        "ex_score",
        "ex_score_delta",
    )

    def __init__(
        self,
        database_path: Path,
    ) -> None:
        self._database_path = Path(
            database_path
        )

        self._database_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(
            self._database_path,
            timeout=30,
        )

        connection.row_factory = sqlite3.Row

        return connection

    def _initialize(self) -> None:
        """プレイ履歴テーブルを初期化する。"""

        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS play_log (
                    play_id TEXT PRIMARY KEY,
                    played_at TEXT NOT NULL,
                    song_name TEXT,
                    artist TEXT,
                    difficulty TEXT,
                    level INTEGER,
                    score INTEGER,
                    score_delta INTEGER,
                    ex_score INTEGER,
                    ex_score_delta INTEGER
                )
                """
            )

            connection.commit()

    def insert(
        self,
        record: PlayRecord,
    ) -> bool:
        """
        プレイ記録を1件保存する。

        Returns:
            True:
                今回の呼び出しで新規保存した。

            False:
                同じplay_idが既に存在しており、
                既存レコードをそのまま維持した。

        同じplay_idを再度保存しても、
        既存レコードを上書きしたり二重登録したりしない。
        """

        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT OR IGNORE INTO play_log (
                    play_id,
                    played_at,
                    song_name,
                    artist,
                    difficulty,
                    level,
                    score,
                    score_delta,
                    ex_score,
                    ex_score_delta
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.play_id,
                    self._format_datetime(
                        record.played_at
                    ),
                    record.song_name,
                    record.artist,
                    record.difficulty,
                    record.level,
                    record.score,
                    record.score_delta,
                    record.ex_score,
                    record.ex_score_delta,
                ),
            )

            connection.commit()

            inserted = cursor.rowcount == 1

            return inserted

    def exists(
        self,
        play_id: str,
    ) -> bool:
        """指定したplay_idのプレイ記録が存在するか確認する。"""

        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT 1
                FROM play_log
                WHERE play_id = ?
                LIMIT 1
                """,
                (play_id,),
            ).fetchone()

            return row is not None

    @staticmethod
    def _format_datetime(
        value: datetime,
    ) -> str:
        return value.isoformat()
