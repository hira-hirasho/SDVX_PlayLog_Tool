# SDVX PlayLog Tool 内部仕様書

## 1. 文書情報

* 文書名：SDVX PlayLog Tool 内部仕様書
* 対象OS：Windows 11
* 対象ゲーム：SOUND VOLTEX（コナステ版）
* 対象ゲームプロセス：`sv6c.exe`
* Python：3.12（`>=3.12,<3.13`）
* パッケージ管理：uv
* バックエンド起動方法：

```text
uv run python main.py
```

本仕様書は、SDVX PlayLog ToolのPython Backendにおける内部構造、責務分担、データ処理、コンポーネント間の連携方式を定義する。

Electron UIの画面構成、表示、検索、操作、UI内部実装は本仕様書の対象外とし、別文書「SDVX PlayLog Tool UI仕様書」および「30_SDVX_PlayLog_Tool_UI_内部仕様書.md」で定義する。

---

## 2. 内部アーキテクチャ

Python Backendは、SDVX、OBS、入力監視、リザルト処理、記録処理、メディア処理を責務単位で分離する。

主要な処理系は以下とする。

```text
Python Backend
│
├─ Core
│   ├─ Config
│   ├─ State
│   ├─ Process / Instance管理
│   └─ ID / Path管理
│
├─ SDVX
│   └─ ProcessDetector
│
├─ OBS
│   ├─ Launcher
│   ├─ ProcessDetector
│   └─ WebSocket
│
├─ Capture
│   ├─ ScreenCapture
│   └─ ResultDetectionCapture
│
├─ Result Detection
│   ├─ ResultScreenDetector
│   ├─ ResultMonitor
│   ├─ ResultState
│   ├─ RecordHandler
│   └─ F12Handler
│
├─ OCR
│   ├─ RegionCropper
│   ├─ Processor
│   └─ Result
│
├─ Play Record
│   ├─ PlayRecord
│   ├─ SQLite
│   └─ Excel
│
└─ Media
    ├─ MediaJob
    ├─ MediaJobRunner
    ├─ MediaProcessor
    ├─ ReplayVideoSaver
    ├─ ReplayProcessor
    ├─ SongStartDetector
    └─ VideoProcessor
```

各コンポーネントは原則として担当責務のみを持ち、他の責務を直接管理しない。

アプリケーション全体を単一の`Job`抽象へ集約する設計は採用しない。

---

## 3. プロジェクト構成

Python Backendの主要構成は以下とする。

```text
SDVX PlayLog Tool/
├─ main.py
├─ pyproject.toml
├─ uv.lock
├─ config.yaml
├─ config.example.yaml
├─ .env
│
├─ SDVX_PlayLog.xlsx
│
├─ app/
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ state.py
│  │  ├─ state_manager.py
│  │  ├─ f12_detector.py
│  │  ├─ logger.py
│  │  ├─ ids.py
│  │  ├─ data_paths.py
│  │  └─ single_instance.py
│  │
│  ├─ sdvx/
│  │  ├─ process_detector.py
│  │  └─ window_focus.py
│  │
│  ├─ obs/
│  │  ├─ launcher.py
│  │  ├─ process_detector.py
│  │  └─ websocket.py
│  │
│  ├─ capture/
│  │  ├─ screen_capture.py
│  │  └─ result_detection_capture.py
│  │
│  ├─ result_detection/
│  │  ├─ result_screen_detector.py
│  │  ├─ result_state.py
│  │  ├─ monitor.py
│  │  ├─ record_handler.py
│  │  └─ f12_handler.py
│  │
│  ├─ ocr/
│  │  ├─ region_cropper.py
│  │  ├─ processor.py
│  │  └─ result.py
│  │
│  ├─ replay/
│  │  ├─ replay_file.py
│  │  ├─ song_start_detector.py
│  │  ├─ song_start_monitor.py
│  │  ├─ video_processor.py
│  │  └─ processor.py
│  │
│  ├─ media/
│  │  ├─ job.py
│  │  ├─ processor.py
│  │  └─ replay_video_saver.py
│  │
│  ├─ database/
│  │  └─ play_log.py
│  │
│  ├─ excel/
│  │  ├─ play_log.py
│  │  └─ play_record.py
│  │
│  └─ play_record.py
│
├─ templates/
│  ├─ result_screen.png
│  └─ song_start.png
│
├─ startup/
│  ├─ start_backend.vbs
│  └─ start_backend.bat
│
└─ ui/
```

モジュール構成は責務分離を表すためのものであり、単なる内部変数名や一時的な実装詳細を仕様として固定するものではない。

---

## 4. 設定管理

通常設定は`config.yaml`から読み込む。

サンプル設定は`config.example.yaml`として管理する。

秘密情報は`.env`から取得する。

```text
config.yaml
└─ 通常設定

config.example.yaml
└─ 設定例

.env
└─ 秘密情報
```

プロジェクトルートは以下で解決する。

```python
PROJECT_ROOT = Path(__file__).resolve().parents[2]
```

ランタイムデータはプロジェクトルートではなく、共通のデータルート解決処理を使用する。

論理パス：

```text
data/...
```

実際の保存先：

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\...
```

Excel保存先は`excel.workbook_path`で管理する。

空文字列の場合、Excel処理のみ無効とする。

---

## 5. AppStateと状態管理

Backendの状態は以下の2状態のみとする。

```text
SLEEP
ACTIVE
```

`StateManager`が現在状態を保持する。

状態変更はSDVXプロセスの存在状態が変化した場合のみ行う。

```text
SLEEP
  │
  │ sv6c.exe 起動
  ▼
ACTIVE
  │
  │ sv6c.exe 終了
  ▼
SLEEP
```

プロセスが存在し続けている間、ACTIVEへの再設定を繰り返さない。

---

## 6. SDVXプロセス監視

対象プロセスは`sv6c.exe`とする。

監視間隔は1秒とする。

`ProcessDetector`はプロセスの存在状態のみを提供し、ACTIVE時に実行する処理そのものを管理しない。

```text
ProcessDetector
      │
      ▼
存在 / 不存在
      │
      ▼
StateManager
```

---

## 7. ACTIVEライフサイクル

SLEEPからACTIVEへ遷移した場合、Backendはプレイ監視に必要な処理を有効化する。

基本順序は以下とする。

```text
sv6c.exe検出
↓
OBS準備
↓
Replay Buffer準備
↓
ACTIVE設定
↓
SongStartMonitor開始
↓
F12監視開始
```

ResultMonitorは常時開始せず、SongStart検出を起点として開始する。

---

## 8. SLEEPライフサイクル

ACTIVEからSLEEPへ遷移した場合、新規のプレイ処理を開始しない。

停止対象：

```text
SongStartMonitor
ResultMonitor
F12監視
```

すでに開始済みのメディア処理は、SDVX終了のみを理由として中断しない。

メディア処理に必要なOBSも、処理完了まで必要な範囲で維持する。

---

## 9. OBS管理

OBSはReplay BufferおよびReplay動画取得に使用する。

OBSがすでに起動している場合は既存プロセスを再利用する。

Toolが起動したOBSと、外部から起動済みのOBSを所有権によって区別する。

Tool自身が起動したOBSのみ終了対象とする。

OBS準備時は以下を確認する。

```text
OBSプロセス
↓
WebSocket接続
↓
OBS Ready
↓
現在シーン
↓
Replay Buffer状態
```

Replay Bufferが停止している場合は開始要求を行う。

OBS WebSocketとの通信は`app/obs/websocket.py`に集約する。

---

## 10. OBS終了処理

Tool所有OBSを終了する場合は以下の順序とする。

```text
WebSocket切断
↓
WM_CLOSE
↓
最大10秒待機
↓
終了確認
├─ 終了済み
└─ 未終了 → プロセス終了
```

外部起動のOBSには終了処理を行わない。

進行中のReplay処理がある場合、必要なOBSを処理完了まで維持する。

---

## 11. 画面キャプチャ

通常のリザルト検出およびSongStart検出には、Windows画面キャプチャを使用する。

OBSの映像をリザルト検出用入力として使用しない。

画面キャプチャの取得責務は`ScreenCapture`へ分離する。

```text
ScreenCapture
├─ 全画面取得
└─ ROI切り出し
```

通常のゲーム画面はWindows上で1920×1080として取得する。

---

## 12. リザルト画面検出

リザルト画面検出は以下の責務に分離する。

```text
ResultMonitor
    │
    ├─ キャプチャ周期管理
    │
    ▼
ResultScreenDetector
    │
    └─ テンプレート照合
```

テンプレート：

```text
templates/result_screen.png
```

照合方式：

```text
cv2.TM_CCOEFF_NORMED
```

テンプレートおよび検出ROIは内部仕様として管理する。

---

## 13. ResultScreenDetectorの画像処理

リザルト検出では、元画面から対象ROIを切り出して処理する。

現在のROI：

```text
x = 1666
y = 584
width = 116
height = 462
```

テンプレートは90度反時計回りに回転した後、検出用スケールへ縮小する。

検出時のROIも同一スケールへ縮小する。

現在の検出スケール：

```text
0.25
```

テンプレートと処理対象ROIは、縮小後のサイズが一致した状態でテンプレート照合を行う。

---

## 14. ResultMonitor

`ResultMonitor`はリザルト画面の状態監視を担当する。

検出間隔：

```text
1秒
```

初回検出時にResultStateを生成する。

検出継続中は同じResultStateを保持する。

連続3回の未検出でリザルト終了と判定する。

```text
検出
↓
ResultState保持
↓
未検出
↓
未検出
↓
未検出
↓
ResultState終了
```

自然終了時に監視スレッド自身が自分自身を`join`しない。

---

## 15. ResultState

ResultStateは、現在処理対象となっている1リザルト分の内部状態を保持する。

主な情報：

```text
play_id
detected_at
screenshot_path
OCR結果
OCR完了状態
記録状態
F12処理状態
```

`play_id`はResultState生成時にUUIDv7で発行する。

同一ResultStateから生成されるすべての記録・メディア処理で同じ`play_id`を使用する。

---

## 16. リザルト画像の取得と保持

リザルト初回検出時のキャプチャをResultStateの基準画像とする。

処理：

```text
リザルト検出
↓
同一キャプチャ取得
↓
必要ROI抽出
↓
90度時計回り回転
↓
1080 × 1920
↓
一時PNG保存
↓
ResultStateが参照
```

検出後に別の画面を再キャプチャしてResultState画像を置き換えない。

F12処理時も再キャプチャしない。

---

## 17. ResultStateのライフサイクル

ResultStateはリザルト画面の初回検出から終了まで保持する。

```text
初回検出
↓
ResultState生成
↓
検出継続
↓
OCR / 記録 / F12
↓
3回連続未検出
↓
ResultState終了
```

1つのResultStateに対して複数のプレイ記録を生成しない。

F12処理済み状態を保持し、同一ResultStateへのF12再処理を防止する。

---

## 18. SongStartMonitor

SongStartMonitorは、プレイ中のWindows画面から曲開始位置を検出する。

ResultMonitorとは独立した監視処理として実装する。

基本フロー：

```text
画面キャプチャ
↓
SongStart用ROI切り出し
↓
SongStartDetector
↓
検出
↓
検出時刻通知
↓
監視停止
```

検出時刻は`time.monotonic()`を使用して取得する。

検出成功後は自身の監視を停止する。

SongStartMonitorはResultMonitorを直接操作せず、検出コールバックによってMain側へ通知する。

---

## 19. SongStartDetector

SongStartDetectorは、入力画像から曲開始状態を判定する純粋な検出処理を担当する。

テンプレート：

```text
templates/song_start.png
```

ROI：

```text
x = 572
y = 155
width = 150
height = 765
```

検出スケール：

```text
0.25
```

検出方式：

```text
cv2.TM_CCOEFF_NORMED
```

閾値：

```text
0.85
```

テンプレートは90度反時計回りに回転した後、検出スケールへ縮小する。

入力ROIも同一スケールへ縮小して比較する。

SongStartDetector自身は時刻管理や監視ループを担当しない。

---

## 20. SongStart時刻の扱い

SongStart検出時刻は、Replay動画のトリミング基準として使用する。

保持する情報は以下の経過時間とする。

```text
F12受信時刻
-
SongStart検出時刻
=
replay_elapsed_seconds
```

時刻そのものをMediaJobへ渡さず、経過時間を`float | None`として渡す。

`None`の場合はSongStart時刻が取得できなかったことを表し、Replay全体を保存する。

---

## 21. F12入力

F12監視は`F12Detector`が担当する。

F12検出時には、受信時刻を`time.monotonic()`で取得する。

Main側では以下を確認してからF12処理を開始する。

```text
ACTIVE
AND
sv6c.exe存在
AND
ResultState存在
AND
F12未処理
```

F12DetectorはResultStateやメディア処理を直接管理しない。

---

## 22. OCR

OCR実行は`app/ocr/processor.py`に集約する。

OCR対象はResultStateが保持する1080×1920画像とする。

PaddleOCR 3.7.0を使用する。

OCR処理では、項目ごとに認識方式を分ける。

通常の文字列項目はPaddleOCRの標準認識結果を使用する。

数値項目では、OCR推論時の候補クラスを数字に限定する。

これにより、数字として認識すべき文字について、OCR後の文字置換だけに依存せず、推論時点で`0`～`9`を優先的に選択できるようにする。

```text
Processor
│
├─ 通常文字列OCR
│   ├─ song_name
│   └─ artist
│
├─ difficulty OCR
│   └─ difficulty
│
├─ 数値限定OCR
│   ├─ level
│   ├─ score.first
│   ├─ score.second
│   └─ ex_score
│
└─ 通常OCR
    ├─ score_delta
    └─ ex_score_delta
```

数値限定OCRでは、PaddleOCR内部の文字認識モデルが出力するクラス候補について、空白（blank）および0～9のみを許可する。

アルファベット等の非数字クラスはOCR結果取得後にNoneへ変換するのではなく、OCRの候補から除外する。

PaddleOCRの内部認識モデルへのアクセスはOCRProcessorに閉じ込め、他のコンポーネントから直接利用しない。

---

## 23. OCR結果モデルと正規化

OCR結果はプレイ記録で利用可能な内部モデルへ正規化する。

正規化処理は`app/ocr/result.py`へ集約する。

主な処理：

```text
normalize_numeric_text
normalize_fixed_digits
normalize_difficulty
normalize_level
```

数値項目については、可能な範囲でOCR推論時に候補クラスを数字へ限定する。

ただし、score_deltaおよびex_score_deltaは+ / -を含むため、通常のOCR認識結果を使用する。

OCR後の正規化では、OCR結果に含まれる空白、符号、既知の数値誤認識等を必要に応じて処理する。

数値限定OCRであっても、認識結果が取得できない場合や形式が期待値を満たさない場合はNoneを許容する。

曲名・アーティスト名には数値項目用の正規化処理を適用しない。

SCOREは以下の2領域から構成する。

```text
score.first
↓
4桁

score.second
↓
4桁
```

両方の領域から4桁の数値を取得できた場合、それらを連結して8桁のSCOREとしてOCRResult.scoreへ格納する。

いずれか一方が取得できない場合、SCOREはNoneとする。

OCRResultの公開フィールドは以下を維持する。

```text
song_name
artist
difficulty
level
score
score_delta
ex_score
ex_score_delta
```

score.firstおよびscore.secondはOCR処理上の中間値であり、OCRResultの公開フィールドとして保持しない。

記録条件判定側ではNoneを数値と比較して例外を発生させない。

---

## 24. PlayRecord

PlayRecordはResultStateとOCR結果からプレイ記録データを生成する。

責務：

```text
ResultState
+
OCR結果
↓
PlayRecord
```

PlayRecordはSQLite、Excel、メディア処理の内部実装を直接管理しない。

記録先ごとの保存処理はそれぞれの責務へ分離する。

---

## 25. 記録処理の分離

通常記録とF12記録では、共通のPlayRecord生成処理を利用する。

差分は主に記録条件とメディア保存対象に限定する。

```text
通常
ResultState
↓
OCR
↓
記録条件判定
↓
PlayRecord
```

```text
F12
ResultState
↓
OCR
↓
強制記録
↓
PlayRecord
```

記録処理はメディア処理の完了を待たない。

---

## 26. play_id

`play_id`は1プレイを識別する共通IDとして使用する。

形式：

```text
UUIDv7
```

同一プレイでは以下で共通する。

```text
ResultState
SQLite
Excel
MediaJob
data/media/<play_id>/
UIからの参照
```

日時、Excel行番号、曲名等を識別子として使用しない。

---

## 27. SQLite

SQLiteをプレイ履歴の正規データソースとする。

保存先：

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\database\playlog.db
```

プレイレコードにはプレイ情報のみを保存し、メディアパスは保存しない。

主な項目：

```text
play_id
played_at
song_name
artist
difficulty
level
score
score_delta
ex_score
ex_score_delta
```

`played_at`にはResultStateの`detected_at`を使用する。

OCRで取得する項目（`song_name`、`artist`、`difficulty`、`level`、`score`、`score_delta`、`ex_score`、`ex_score_delta`）はNULLを許容する。

OCR結果が取得できなかった項目はNULLとして保存する。

---

## 28. Excel

Excel保存処理はSQLiteとは独立した保存処理として実装する。

設定：

```yaml
excel:
  workbook_path: ""
```

空文字列の場合、Excel処理を実行しない。

Excel保存対象ブックには以下を使用する。

```text
シート：プレイ履歴
テーブル：sdvx_play_log_table
```

保存は通常セルへの単純追記ではなく、既存Excelテーブルを対象とする。

既存行の検索・更新には`play_id`を使用する。

Excelにはメディアパスを保存しない。

---

## 29. SQLiteとExcelの独立性

SQLiteとExcelの保存処理は独立して実行する。

```text
SQLite
  │
  └─ 成功 / 失敗

Excel
  │
  └─ 成功 / 失敗 / 無効
```

一方の保存結果を理由として、もう一方の保存結果を取り消さない。

現時点ではSQLiteとExcel間の自動同期・競合解決は実装しない。

---

## 30. MediaJob

MediaJobは1プレイ分のメディア処理要求を表すデータ構造とする。

主な情報：

```text
play_id
detected_at
ResultState画像
save_image
save_video
replay_elapsed_seconds
```

`replay_elapsed_seconds`は以下を表す。

```text
F12受信時点
-
SongStart検出時点
```

値が`None`の場合、Replay全体を保存する。

MediaJobはアプリケーション全体を統括するJob抽象ではない。

---

## 31. MediaJobRunner

MediaJobRunnerはメディア処理の実行制御を担当する。

責務：

```text
MediaJob受付
↓
同時実行制御
↓
MediaProcessor実行
↓
完了通知
```

メディア処理は同時に複数実行しない。

MainやResultHandlerが個別にメディアスレッドやメディアロックを管理してはならない。

通常のResultMonitor、OCR、記録処理をMediaJobRunnerの都合で停止させない。

---

## 32. MediaProcessor

MediaProcessorは1つのMediaJobに対するメディア処理を統括する。

責務：

```text
出力フォルダ準備
result.png保存
ReplayVideoSaver呼び出し
保存結果管理
```

Replay Bufferの通信やReplayファイル探索、動画加工の詳細は担当しない。

画像と動画の保存結果は独立して扱う。

---

## 33. メディア保存先

正式メディアはプレイ単位で保存する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\media\<play_id>\
├─ result.png
└─ replay.mp4
```

SQLiteおよびExcelにはメディアパスを保存しない。

メディアとプレイ記録の関連付けは`play_id`によって行う。

---

## 34. result.png保存

`result.png`はResultStateが保持するリザルト画像から生成する。

再キャプチャは行わない。

保存成功後、ファイル存在および画像として利用可能であることを確認する。

正式保存に失敗した場合、一時画像を削除しない。

画像保存とReplay保存は独立した処理として扱う。

---

## 35. ReplayVideoSaver

ReplayVideoSaverはOBS Replay Bufferから正式なReplay動画を生成するまでの処理を担当する。

責務：

```text
OBS Replay Buffer保存要求
↓
Replay要求時刻記録
↓
新規MP4検出
↓
ファイル安定確認
↓
ReplayProcessor
↓
出力検証
↓
正式保存
↓
元Replay削除
```

MediaProcessorはReplay内部処理を直接実装しない。

---

## 36. Replayファイル検出

Replay保存要求時に`replay_requested_at`を記録する。

一時Replayは以下を監視する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\temp\
```

候補条件：

```text
拡張子が.mp4
AND
mtime >= replay_requested_at
```

複数候補がある場合、条件を満たす中で最も新しいファイルを使用する。

検出タイムアウト：

```text
30秒
```

---

## 37. Replayファイル安定確認

新規MP4を検出しても、書き込み完了前には処理を開始しない。

ファイルサイズを一定間隔で確認する。

```text
stability_checks = 3
stability_interval = 1秒
```

3回連続してサイズが変化しない場合、処理可能と判定する。

---

## 38. ReplayProcessor

ReplayProcessorはReplay動画の処理フローを担当する。

入力：

```text
replay_path
output_path
elapsed_seconds
```

SongStartDetectorをReplayProcessor内部から呼び出す設計は採用しない。

ReplayProcessorは、F12時点までの経過時間と実際のReplay動画長からトリミング位置を算出する。

処理：

```text
Replay実動画長取得
↓
trim_start = duration - elapsed_seconds
↓
trim_start > 0
    ├─ Yes → 冒頭トリミング
    └─ No  → Replay全体
```

`elapsed_seconds`が`None`の場合はReplay全体を保存する。

---

## 39. Replayトリミング計算

トリミング開始位置は以下で求める。

```text
elapsed_seconds
    =
F12受信時刻
-
SongStart検出時刻
```

```text
trim_start
    =
実際のReplay動画長
-
elapsed_seconds
```

例えば、

```text
Replay実動画長 = 136秒
経過時間       = 102秒
```

の場合、

```text
trim_start = 136 - 102
           = 34秒
```

となる。

実際のReplay動画長を基準とし、OBS Replay Bufferの設定時間を動画長として扱わない。

`elapsed_seconds`は有限かつ0以上であることを確認する。

実動画長が正の有限値でない場合は処理失敗とする。

`trim_start <= 0`の場合はReplay全体を保存する。

---

## 40. VideoProcessor

VideoProcessorはFFmpegによる動画加工を担当する。

主な責務：

```text
動画長取得
動画ストリームコピー
出力検証に必要なメタデータ取得
```

通常のトリミングでは再エンコードを行わず、ストリームコピーを使用する。

```text
-c:v copy
-c:a copy
```

トリミング時には以下を使用する。

```text
-avoid_negative_ts make_zero
```

通常処理では以下を行わない。

```text
映像再エンコード
音声再エンコード
解像度変換
フレームレート変換
```

---

## 41. Replay出力検証

正式保存前に生成動画を検証する。

検証対象：

```text
ファイル存在
動画として読み込み可能
解像度
フレームレート
映像コーデック
音声コーデック
```

現在の期待形式：

```text
1080 × 1920
60fps
H.264
AAC
MP4
```

検証失敗時は元Replayを削除しない。

---

## 42. Replay元ファイルの削除

元Replayは、以下をすべて満たした場合のみ削除する。

```text
処理済み出力生成成功
AND
出力ファイル存在
AND
出力検証成功
AND
正式replay.mp4保存完了
```

削除失敗は正式動画保存失敗とは区別する。

正式動画が正常保存されている場合、元Replay削除失敗によって正式動画を削除してはならない。

---

## 43. 一時データ管理

一時データは以下へ保存する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\temp\
```

主な対象：

```text
ResultState用一時PNG
Replay元MP4
動画処理中間ファイル
```

正式保存完了前に処理対象の一時ファイルを無条件で削除しない。

---

## 44. 一時リザルト画像のライフサイクル

一時リザルト画像はResultState生成時に作成する。

```text
Result検出
↓
一時PNG
↓
ResultState
↓
OCR
↓
記録 / メディア処理
```

画像を正式保存する場合：

```text
一時PNG
↓
result.png
↓
保存確認
↓
一時PNG削除
```

正式保存に失敗した場合は一時PNGを保持する。

正式画像保存を行わない場合は、必要な処理完了後に一時PNGを削除する。

---

## 45. プレイ記録とメディア処理の分離

プレイ記録とメディア処理は独立した処理系とする。

```text
PlayRecord
├─ SQLite
└─ Excel

MediaJob
├─ result.png
└─ replay.mp4
```

メディア処理失敗を理由として、保存済みプレイ記録を取り消さない。

プレイ記録保存はメディア処理完了を待たない。

---

## 46. 通常記録の内部フロー

通常記録では、ResultState終了後にOCRと記録条件判定を行う。

```text
ResultState終了
↓
OCR
↓
記録条件判定
├─ 条件不成立
│   └─ 記録・正式メディア保存なし
│
└─ 条件成立
    ├─ PlayRecord
    ├─ SQLite
    ├─ Excel（有効時）
    └─ MediaJob
         └─ result.png
```

通常記録のMediaJobではReplay保存を要求しない。

---

## 47. F12記録の内部フロー

F12では現在のResultStateを入力として強制記録を行う。

```text
F12
↓
ResultState確認
↓
OCR
↓
PlayRecord
├─ SQLite
└─ Excel（有効時）
↓
MediaJob
├─ result.png
└─ replay.mp4
```

F12時の画像はResultState保持画像を使用する。

Replay処理にはMediaJobへ渡された`replay_elapsed_seconds`を使用する。

---

## 48. メディア処理の同時実行

MediaJobRunnerはメディア処理を単一実行とする。

```text
MediaJob
↓
MediaJobRunner
↓
MediaProcessor
```

同時に複数のReplay処理を開始しない。

一方、以下の通常処理はメディア処理と独立して動作可能とする。

```text
ResultMonitor
OCR
PlayRecord
SQLite
Excel
```

---

## 49. SDVX終了時のコールバック制御

SLEEP遷移後に非同期処理から遅れてコールバックが到着する可能性を考慮する。

SongStartMonitor、ResultMonitor、F12等のコールバックは、処理開始時点でBackendが有効かつACTIVEであることを確認する。

SLEEP遷移後のコールバックによって、新しいResultMonitorやSongStartMonitorを再起動してはならない。

---

## 50. Backend終了処理

Backend終了時は、新規処理の受付を停止する。

停止対象：

```text
F12Detector
SongStartMonitor
ResultMonitor
```

進行中のメディア処理については、可能な範囲で中間データを破壊しない。

Replay元ファイルや処理中間ファイルを、終了処理だけを理由として無条件に削除しない。

---

## 51. エラー分離

サブシステム間のエラーは可能な限り局所化する。

基本原則：

```text
OCR失敗
→ 他処理へ不要な影響を与えない

SQLite失敗
→ Excel処理を独立して扱う

Excel失敗
→ SQLite結果を保持

Replay失敗
→ プレイ記録を保持

result.png失敗
→ Replay処理結果を破棄しない

Replay失敗
→ result.pngを削除しない
```

---

## 52. ログ

ログは以下へ保存する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\logs\
```

形式：

```text
YYYYMMDD.log
```

主要イベントとして以下を記録する。

```text
Backend起動 / 終了
SLEEP / ACTIVE
OBS起動 / 再利用 / 接続 / 切断
Replay Buffer開始
SongStart検出
Result検出 / 終了
OCR結果
記録条件判定
SQLite結果
Excel結果
F12結果
MediaJob開始 / 終了
Replay検出
Replay安定確認
Replay処理
動画検証
正式保存
元Replay削除
エラー
```

ログ保持期間は30日とする。

---

## 53. デバッグデータ

デバッグデータは以下へ保存する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\debug\
```

正式データとデバッグデータを混在させない。

---

## 54. Backend常駐と単一インスタンス

BackendはWindowsログオン時にStartupから起動する。

起動時にNamed Mutexを取得し、すでにBackendが起動している場合は新規プロセスを終了する。

Mutex名：

```text
Local\SDVX_PlayLog_Tool_Backend
```

基本フロー：

```text
Backend起動
↓
Named Mutex取得
├─ 成功 → 起動継続
└─ 失敗 → 終了
```

Backendプロセス自体はSDVX終了によって終了しない。

---

## 55. Windows Startup

Backend自動起動にはWindows Startupフォルダを使用する。

```text
Windows Startup
↓
start_backend.vbs
↓
start_backend.bat
↓
Python Backend
```

`start_backend.bat`はプロジェクトルートを基準としてBackendを起動する。

`start_backend.vbs`はBATを非表示で起動する。

---

## 56. ランタイムデータ

ランタイムデータは以下をルートとする。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\
```

主要構成：

```text
data/
├─ database/
│  └─ playlog.db
├─ debug/
├─ logs/
│  └─ YYYYMMDD.log
├─ media/
│  └─ <play_id>/
│     ├─ result.png
│     └─ replay.mp4
└─ temp/
   ├─ *.png
   ├─ *.mp4
   └─ その他中間ファイル
```

ソースプロジェクトディレクトリやElectronの`dist`をランタイムデータ保存先として使用しない。

---

## 57. Electron UIとのデータ境界

Python BackendとElectron UIは独立したOSプロセスとする。

両者の直接通信は設けない。

使用しない通信方式：

```text
HTTP API
WebSocket
Python ↔ Electron IPC
標準入出力によるプロセス間通信
```

共有データは以下とする。

```text
SQLite
└─ プレイ履歴

File System
└─ data/media/<play_id>/
```

BackendはUIを起動・終了しない。

UIもBackendを起動・終了しない。

UI内部実装は別のUI内部仕様書で定義する。

---

## 58. メディア参照のデータ境界

メディアパスはSQLiteに保存しない。

UI等からメディアを参照する場合は`play_id`から固定パスを解決する。

```text
play_id
↓
data/media/<play_id>/
├─ result.png
└─ replay.mp4
```

メディアファイルの存在状態はファイルシステムから判定する。

SQLiteレコードが存在していてメディアが存在しない状態を許容する。

メディアだけが存在しても、SQLiteレコードを自動生成しない。

---

## 59. データ整合性

1つのResultStateから生成されるプレイ記録は最大1件とする。

```text
1 ResultState
=
1 play_id
=
1 PlayRecord
```

SQLiteおよびExcelの保存処理では`play_id`を基準として冪等性を確保する。

メディア保存結果はプレイ記録の成否とは独立する。

許容される状態：

```text
SQLiteあり / メディアなし
SQLiteあり / result.pngのみ
SQLiteあり / replay.mp4のみ
SQLiteあり / 両方あり
```

メディア削除によってプレイ記録を削除・変更しない。

---

## 60. メディア削除

Backendは自動的な期間経過メディア削除を行わない。

メディア削除はユーザー操作を起点とする。

削除対象はファイル単位で扱う。

```text
result.png
replay.mp4
```

両方のファイルが存在しなくなった場合にのみ、プレイ単位のメディアフォルダを削除対象とする。

UI側の削除操作はUI内部仕様書で定義する。

---

## 61. 実装対象外

現時点でBackendの実装対象外とするもの：

```text
X API自動投稿
SQLite / Excel自動同期
ExcelからSQLiteへの自動移行
自動メディア削除
SQLiteへのメディアパス保存
Excelへのメディアパス保存
x_posted管理
X投稿本文のDB保存
```

これらを追加する場合は、既存責務へ直接混在させず、別途要件定義を行う。

---

## 62. 内部責務一覧

主要コンポーネントの責務は以下とする。

| コンポーネント | 責務 |
|---|---|
| ProcessDetector | SDVXプロセス存在状態の検出 |
| StateManager | Backend状態の保持 |
| OBS Launcher | OBS起動 |
| OBS ProcessDetector | OBSプロセス状態確認 |
| OBS WebSocket | OBS API通信 |
| ScreenCapture | Windows画面取得・ROI切り出し |
| ResultScreenDetector | リザルトテンプレート照合 |
| ResultMonitor | リザルト状態監視 |
| ResultState | 1リザルト分の処理状態保持 |
| SongStartDetector | 曲開始状態の画像判定 |
| SongStartMonitor | プレイ中の曲開始監視 |
| F12Detector | F12入力検出 |
| RecordHandler | 通常記録処理の制御 |
| F12Handler | F12記録処理の制御 |
| OCR Processor | OCR実行、項目別OCR方式の選択、数値限定OCRの実行、OCR結果の組み立て |
| OCR Result | OCR結果モデル、OCR結果の正規化 |
| PlayRecord | プレイ記録モデル生成 |
| SQLite | SQLiteへの保存 |
| Excel | Excelテーブルへの保存 |
| MediaJob | 1プレイ分のメディア要求 |
| MediaJobRunner | メディア処理の単一実行制御 |
| MediaProcessor | メディア処理全体の調整 |
| ReplayVideoSaver | Replay取得から正式保存までの制御 |
| ReplayProcessor | Replay動画処理フロー |
| VideoProcessor | FFmpegによる動画処理 |
| Logger | ログ出力 |
| SingleInstance | Backend多重起動防止 |
| DataPaths | ランタイムデータパス解決 |
| IDs | play_id等のID生成 |

---

## 63. Backend主要フロー

Backend全体の内部処理関係は以下とする。

```text
Windows Startup
      │
      ▼
Backend
      │
      ▼
Single Instance
      │
      ▼
SDVX ProcessDetector
      │
      ▼
SLEEP / ACTIVE
      │
      ├──────────────────────────┐
      │                          │
      ▼                          ▼
SongStartMonitor             F12Detector
      │                          │
      │ SongStart時刻             │ F12時刻
      ▼                          │
ResultMonitor                    │
      │                          │
      ▼                          │
ResultState ◀───────────────────┘
      │
      ▼
OCR
      │
      ├───────────────┐
      │               │
      ▼               ▼
通常記録             F12
      │               │
      └───────┬───────┘
              ▼
         PlayRecord
          │       │
          ▼       ▼
       SQLite    Excel
          │       │
          └───┬───┘
              │
              ▼
          MediaJob
              │
              ▼
       MediaJobRunner
              │
              ▼
        MediaProcessor
          │         │
          │         └─────────────┐
          ▼                       ▼
      result.png          ReplayVideoSaver
                                  │
                                  ▼
                         Replay Buffer保存
                                  │
                                  ▼
                           Replay検出
                                  │
                                  ▼
                           安定確認
                                  │
                                  ▼
                         ReplayProcessor
                                  │
                         ┌────────┴────────┐
                         │                 │
                         ▼                 ▼
                  elapsed=None       elapsedあり
                         │                 │
                         │          実動画長取得
                         │                 │
                         │          trim_start算出
                         │                 │
                         └────────┬────────┘
                                  ▼
                           VideoProcessor
                                  │
                                  ▼
                             出力検証
                                  │
                                  ▼
                            replay.mp4
                                  │
                                  ▼
                           元Replay削除
```

---

## 64. 設計上の基本原則

内部設計では以下を原則とする。

1. **責務を分離する。**
   各コンポーネントは担当処理を越えて他の処理を管理しない。

2. **プレイ記録とメディア処理を分離する。**
   メディア処理の成否をプレイ記録の成否に直接結び付けない。

3. **ResultStateを1プレイの処理単位とする。**
   同一プレイに属するデータには共通の`play_id`を使用する。

4. **一時データと正式データを分離する。**
   正式保存と検証が完了する前に処理対象データを破棄しない。

5. **非同期処理のコールバックを状態確認付きで扱う。**
   SLEEP遷移後の遅延コールバックによって新規処理を開始しない。

6. **失敗を局所化する。**
   独立した処理の失敗によって、すでに成功した処理結果を取り消さない。

7. **内部固定値と外部設定値を分離する。**
   ユーザーが変更する必要のない値を不要に設定化しない。

8. **UIとBackendを疎結合にする。**
   両者は共有データを介して連携し、直接通信に依存しない。

9. **実装詳細を必要以上に仕様化しない。**
   リファクタリング可能な変数名や一時的な内部構造は、外部動作を拘束しない。

10. **将来機能を現在の責務へ混在させない。**
    未実装機能は必要になった段階で独立して設計する。

---

## 65. 本仕様書の位置付け

本仕様書は、2026-09-21時点におけるPython Backendの内部設計基準とする。

外部から見える機能、ユーザー操作、保存対象、利用条件等は「SDVX PlayLog Tool 外部仕様書」で定義する。

Electron UIの画面構成、UI動作およびUI内部実装は、以下の別文書で定義する。

```text
SDVX PlayLog Tool UI仕様書
30_SDVX_PlayLog_Tool_UI_内部仕様書.md
```

本仕様書では、Backend内部の責務分離、データフロー、コンポーネント間の契約、内部固定値および処理ライフサイクルを定義する。

今後リファクタリングを行う場合は、外部仕様として維持すべき動作と内部実装上の変更可能な詳細を分離し、外部動作を維持する範囲では内部構造を変更できるものとする。
