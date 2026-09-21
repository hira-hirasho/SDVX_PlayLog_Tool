# SDVX PlayLog Tool 外部仕様書

## 1. 文書情報

* 文書名：SDVX PlayLog Tool 外部仕様書
* バージョン：1.1
* 最終更新：2026-09-21
* 対象OS：Windows 11
* 対象ゲーム：SOUND VOLTEX（コナステ版）
* 対象プロセス：`sv6c.exe`

---

## 2. 目的

SDVX PlayLog Toolは、コナステ版SOUND VOLTEXのプレイ結果を検出し、プレイ履歴として保存するとともに、結果画像およびReplay動画を管理するWindowsアプリケーションである。

アプリケーションは以下の2つの独立した機能で構成する。

* プレイ結果を取得・保存するPython Backend
* 保存されたプレイ履歴を閲覧・操作するElectron UI

主な機能は以下のとおり。

* SDVXの起動状態監視
* 曲開始およびリザルト画面の検出
* リザルト画像の取得
* OCRによるプレイ結果取得
* SQLiteへのプレイ履歴保存
* Excelへのプレイ履歴保存
* F12による手動記録
* OBS Replay BufferによるReplay動画保存
* Replay動画の曲開始位置トリミング
* プレイ結果とメディアの`play_id`による紐付け
* プレイ履歴の閲覧・検索
* 結果画像・Replay動画の表示・削除
* X公式Intentを利用した共有支援

Xへの自動投稿は行わない。投稿内容の確定はユーザー自身が行う。

---

## 3. アプリケーション構成

SDVX PlayLog Toolは、Python BackendとElectron UIを独立したプロセスとして動作させる。

```text
Windows
│
├─ Python Backend
│    └─ プレイ結果の検出・保存
│
└─ Electron UI
     └─ プレイ履歴の閲覧・操作
```

### 3.1 Python Backend

Python Backendは、SDVXのプレイ中にプレイ結果を検出し、必要なデータやメディアを保存する。

主な機能：

* SDVX起動状態監視
* OBS連携
* 曲開始監視
* F12監視
* リザルト画面監視
* リザルト画像取得
* OCR
* SQLite記録
* Excel記録
* Replay Buffer連携
* Replay動画処理
* メディア保存
* システムトレイからの有効・無効切り替え

Python BackendはWindowsログオン時に自動起動し、常駐する。

### 3.2 Electron UI

Electron UIは保存済みのプレイ履歴を閲覧・操作する。

主な機能：

* プレイ履歴一覧表示
* プレイ履歴検索
* プレイ履歴詳細表示
* 結果画像表示
* Replay動画再生
* メディア削除
* X公式Intentによる共有支援

Electron UIはPython Backendを起動・終了・管理しない。

---

## 4. BackendとUIの独立性

Python BackendとElectron UIは独立して動作する。

以下を保証する。

* Electron UIの起動はBackendの起動状態に依存しない。
* Electron UIを終了してもBackendは継続する。
* Backendが停止してもElectron UIは保存済みデータを利用できる。
* BackendからElectron UIを起動・終了しない。
* Electron UIからBackendを起動・終了しない。

Backend停止中は新規のプレイ結果取得・保存を行わない。

---

## 5. Backendの常駐と有効・無効

Python BackendはWindowsログオン時に自動起動し、システムトレイに常駐する。

システムトレイからBackendの処理を有効・無効に切り替えられる。

### 5.1 有効

通常のプレイ結果取得および保存を行う。

### 5.2 無効

Backendプロセスは終了せず、新規のSDVX処理を開始しない。

無効中は以下を新規に開始しない。

* 曲開始監視
* リザルト監視
* F12処理
* OCR
* プレイ記録
* メディア処理

すでに開始されているメディア処理は可能な限り継続する。

### 5.3 再有効化

無効状態から有効に戻した場合、SDVXの状態に応じて通常動作へ復帰する。

---

## 6. Backendの単一起動

Python Backendは多重起動しない。

すでにBackendが起動している状態で別のBackendを起動した場合、後から起動したBackendは処理を開始せず終了する。

---

## 7. Electron UIの単一起動

Electron UIも多重起動しない。

すでにUIが起動している状態で再度起動した場合、新しいUIを起動せず既存UIを使用する。

既存UIが最小化されている場合は復元して前面に表示する。

---

## 8. Backendの状態

Backendには以下の2状態を使用する。

```text
SLEEP
ACTIVE
```

### 8.1 SLEEP

SDVXが起動していない、またはBackendが無効になっている状態。

新規のプレイ結果取得・保存処理を行わない。

### 8.2 ACTIVE

SDVXが起動しており、Backendが有効な状態。

以下の処理を有効にする。

* 曲開始監視
* リザルト画面監視
* F12監視
* OCR
* プレイ記録
* メディア処理
* Replay Buffer連携

進行中のメディア処理はACTIVEからSLEEPへ移行した場合でも可能な限り継続する。

---

## 9. SDVXの起動監視

対象プロセスは以下とする。

```text
sv6c.exe
```

BackendはSDVXの起動・終了状態を監視する。

```text
SLEEP
  │
  │ SDVX起動
  ▼
ACTIVE
  │
  │ SDVX終了
  ▼
SLEEP
```

SDVXが起動している間、プレイ結果取得機能を有効にする。

---

## 10. OBS連携

ACTIVE中はOBSを利用してプレイ映像を取得する。

OBSが起動していない場合はBackendが起動する。

OBSがすでに起動している場合は、そのOBSを利用する。

Backend自身が起動したOBSのみ、Backend終了時に終了対象とする。

Backend起動前から存在していたOBSは終了しない。

OBSとの通信にはOBS WebSocketを使用する。

---

## 11. プレイ検出

ACTIVE中は、Windows画面キャプチャを使用して曲開始およびリザルト画面を監視する。

通常のSDVX映像取得にはOBSを使用するが、曲開始およびリザルト画面の検出にはOBS映像を使用しない。

### 11.1 曲開始検出

曲開始を検出した時刻を、そのプレイの曲開始時刻として保持する。

曲開始検出後、リザルト画面の監視を開始する。

曲開始を検出できなかった場合でも、F12による手動記録は可能とする。

### 11.2 リザルト画面検出

リザルト画面を検出すると、その時点の画面からリザルト画像を取得して保持する。

この保持画像を、そのプレイの結果画像として使用する。

F12実行時にリザルト画像を再取得しない。

リザルト画面の終了を検出した場合、そのプレイに対するリザルト監視を終了し、次の曲開始を待機する。

---

## 12. プレイの識別

1回のリザルトにつき1つの`play_id`を生成する。

`play_id`にはUUIDv7を使用する。

生成タイミングはリザルト画面の初回検出時とする。

同じ`play_id`を以下の識別に使用する。

* SQLite
* Excel
* 結果画像
* Replay動画
* Electron UI

Excelの行番号やメディアファイルの日時をプレイ識別に使用しない。

---

## 13. F12による手動記録

ACTIVE中にF12を押すことで、現在のリザルトを手動記録できる。

F12を受け付けるには、対象となるリザルトが検出されている必要がある。

曲開始が検出されていることは、F12受付の必須条件としない。

同一リザルトに対するF12の重複実行は行わない。

F12では通常の自動記録条件を適用しない。

したがって、SCOREが`play_log.min_score`未満であっても記録対象とする。

F12では以下を保存対象とする。

```text
プレイ記録
result.png
replay.mp4
```

---

## 14. 自動プレイ記録

F12を使用しなかったリザルトについては、リザルト終了後に自動記録条件を判定する。

自動記録条件は以下とする。

```text
SCORE >= `play_log.min_score`
```

条件を満たした場合、プレイ記録および結果画像を保存する。

条件を満たさない場合、プレイ記録およびメディアを保存しない。

通常の自動記録ではReplay動画を保存しない。

過去の記録よりSCOREが高いかどうかは保存条件としない。

同じSCOREであっても、記録条件を満たしていれば保存対象とする。

---

## 15. OCR

リザルト画像から以下のプレイ情報を取得する。

* 曲名
* アーティスト名
* 難易度
* LEVEL
* SCORE
* SCORE差分
* EX SCORE
* EX SCORE差分

OCRにはPaddleOCRを使用する。

### 15.1 数値項目

以下の項目は数字を主体とする値として認識する。

* LEVEL
* SCORE
* EX SCORE

SCOREは画面上の4桁単位の表示を個別に認識し、連結して8桁のSCOREとして扱う。

数値項目では、数字として認識できない文字を別の数字へ自動的に置換する補正は行わない。

### 15.2 符号付き数値項目

以下の項目は符号を含む数値として扱う。

* SCORE差分
* EX SCORE差分

`+` または `-` の符号を認識した場合は、符号を保持して数値として扱う。

### 15.3 難易度

難易度は以下のいずれかとして扱う。

```text
NOV
ADV
EXH
INF
GRV
HVN
VVD
XCD
MXM
ULT
NBL
```

### 15.4 OCR失敗

OCRで一部の項目を取得できなかった場合、その項目は欠損値として扱う。

OCR結果の欠損によってBackend全体を停止させない。

F12による手動記録では、OCRで取得できた項目を使用してプレイ記録を作成する。

通常の自動記録では、SCOREを取得できない場合、自動記録条件を満たさないものとして扱う。

---

## 16. プレイ履歴

プレイ履歴はSQLiteを正規のデータソースとして保存する。

SQLiteとExcelは独立して保存する。

Excel保存は設定によって有効・無効を切り替えられる。

一方の保存に失敗しても、もう一方の保存結果を取り消さない。

### 16.1 SQLite保存先

論理パス：

```text
data/database/playlog.db
```

Windows上では以下へ保存する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\database\playlog.db
```

テーブル名：

```text
play_log
```

### 16.2 保存項目

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

`play_id`を一意な識別子として使用する。

### 16.3 プレイ日時

プレイ日時にはリザルト初回検出時刻を使用する。

タイムゾーン情報を保持した日時として保存する。

### 16.4 保存条件

通常リザルト：

```text
SCORE >= `play_log.min_score`
```

F12：

```text
SCOREに関係なく保存
```

プレイ履歴は永久保存し、自動削除しない。

---

## 17. Excel保存

Excel保存は任意機能とする。

Excel保存先は設定ファイルの`excel.workbook_path`で指定する。

### 17.1 Excel保存の有効・無効

`excel.workbook_path`が空の場合、Excelへの保存を行わない。

```yaml
excel:
  workbook_path: ""
```

パスが設定されている場合、Excelへの保存を行う。

```yaml
excel:
  workbook_path: "C:/path/to/SDVX_PlayLog.xlsx"
```

### 17.2 Excelファイル

シート：

```text
プレイ履歴
```

テーブル：

```text
sdvx_play_log_table
```

プレイ履歴はExcelテーブルへ追加・更新する。

通常のセルへの単純な追記は行わない。

### 17.3 保存項目

```text
プレイID
プレイ日時
曲名
アーティスト名
難易度
LEVEL
SCORE
Δ SCORE
EX SCORE
Δ EX SCORE
```

メディアパスは保存しない。

### 17.4 SQLiteとの対応

```text
SQLite            Excel
--------------------------------
play_id        →  プレイID
played_at      →  プレイ日時
song_name      →  曲名
artist         →  アーティスト名
difficulty     →  難易度
level          →  LEVEL
score          →  SCORE
score_delta    →  Δ SCORE
ex_score       →  EX SCORE
ex_score_delta →  Δ EX SCORE
```

### 17.5 重複防止

「プレイID」を一意識別子として使用し、同じプレイを二重追加しない。

Excelの行番号をプレイの識別やメディアとの紐付けに使用しない。

### 17.6 Excel保存条件

Excel保存が有効な場合、SQLiteと同じプレイ記録条件に従って保存する。

通常リザルト：

```text
SCORE >= `play_log.min_score`
```

F12：

```text
SCOREに関係なく保存
```

---

## 18. メディア保存

メディアはプレイごとに`play_id`を使用して保存する。

論理パス：

```text
data/media/<play_id>/
```

Windows上では以下へ保存する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\media\<play_id>\
```

保存可能なファイルは以下とする。

```text
result.png
replay.mp4
```

メディアパス自体はSQLiteおよびExcelへ保存しない。

メディアの保存場所は`play_id`から一意に決定する。

### 18.1 保存条件

| 条件 | SQLite | Excel※ | result.png | replay.mp4 |
|---|---:|---:|---:|---:|
| 通常・SCORE < `play_log.min_score` | × | × | × | × |
| 通常・SCORE >= `play_log.min_score` | ○ | ○ | ○ | × |
| F12・SCOREに関係なく | ○ | ○ | ○ | ○ |

※ `excel.workbook_path`が設定されている場合のみ保存する。

結果画像とReplay動画は独立して保存する。

一方のメディア保存に失敗しても、もう一方の保存に成功していれば成功したメディアは保持する。

---

## 19. Replay動画

Replay動画はF12による手動記録時のみ保存する。

保存先：

```text
data/media/<play_id>/replay.mp4
```

F12受付時にOBS Replay Bufferへ保存要求を行う。

取得したReplay動画の実際の長さを基準として、曲開始からF12までの経過時間に相当する冒頭部分をトリミングする。

曲開始を検出できていない場合は、冒頭トリミングを行わずReplay動画全体を保存する。

Replay動画の処理では再エンコードを行わず、ストリームコピーを使用する。

Replay動画の正式保存には以下をすべて満たすことを必要とする。

* Replay動画の取得に成功している
* 動画処理に成功している
* 正式な出力ファイルが生成されている
* 出力動画の検証に成功している

正式な保存および検証が完了するまで、取得元のReplay動画を削除しない。

---

## 20. 結果画像

結果画像にはリザルト画面の初回検出時に取得した画像を使用する。

F12実行時に再キャプチャしない。

保存先：

```text
data/media/<play_id>/result.png
```

プレイ記録と結果画像の保存は独立して扱う。

---

## 21. 画面キャプチャ

通常のSDVX映像取得にはOBSを使用する。

曲開始およびリザルト画面の検出と結果画像取得にはWindows画面キャプチャを使用する。

通常のキャプチャに対して自動的な回転・反転・リサイズは行わない。

結果画像生成時に必要な向きへの回転のみ行う。

カーソルは結果画像に含めない。

---

## 22. メディア表示

プレイ詳細画面では、対象`play_id`のメディアフォルダを確認して表示する。

```text
data/media/<play_id>/
```

以下のファイルが存在する場合、それぞれを表示・再生できる。

```text
result.png
replay.mp4
```

片方だけ存在する場合は、存在するメディアのみ表示する。

メディアフォルダやファイルが存在しない場合は、そのメディアを表示しない。

詳細画面を表示した後にメディアが生成されても、自動的には画面を更新しない。

画面を再読み込みした場合は、その時点のファイル状態を反映する。

---

## 23. メディア削除

結果画像とReplay動画は個別に削除できる。

```text
画像削除
↓
result.png削除
```

```text
動画削除
↓
replay.mp4削除
```

両方のファイルが存在しなくなった場合は、プレイ用メディアフォルダも削除する。

メディア削除によってSQLiteやExcelのプレイ履歴は削除しない。

メディアの経過期間による自動削除は行わない。

---

## 24. プレイ履歴UI

### 24.1 データソース

プレイ履歴一覧・詳細はSQLiteの`play_log`を使用する。

プレイの識別には`play_id`を使用する。

### 24.2 一覧表示

一覧には以下を表示する。

```text
日時
曲名
アーティスト名
難易度
LEVEL
SCORE
SCORE差分
```

新しいプレイを上に表示する。

1ページあたり50件を表示する。

### 24.3 検索

以下の条件で検索できる。

* 開始日
* 終了日
* 曲名
* アーティスト名

日付は日本時間を基準とする。

曲名・アーティスト名は部分一致とする。

検索では大文字・小文字および半角・全角を区別しない。

複数条件を指定した場合はAND条件で検索する。

### 24.4 数値・譜面情報

以下は検索・フィルタ条件として提供しない。

* 難易度
* LEVEL
* SCORE
* SCORE差分
* EX SCORE
* EX SCORE差分

### 24.5 検索結果0件

該当するプレイがない場合は、以下を表示する。

```text
該当するプレイ履歴がありません
```

該当件数が0件の場合、ページネーションは表示しない。

### 24.6 詳細表示

詳細画面では以下を表示する。

```text
日時
曲名
アーティスト名
難易度
LEVEL
SCORE
SCORE差分
EX SCORE
EX SCORE差分
```

詳細画面では`play_id`によって対象プレイを特定する。

### 24.7 一覧への復帰

詳細画面から一覧へ戻った場合、直前の検索条件やページ番号などの表示状態を維持する。

---

## 25. X共有

PlayLog ToolからXへの自動投稿は行わない。

プレイ詳細画面から「共有」を実行すると、X公式Intentを利用して投稿画面を開く。

投稿の最終確定はユーザー自身が行う。

### 25.1 投稿本文

共有時のプレイ情報から、以下の形式を基本として投稿本文を生成する。

```text
【[曲名] / [アーティスト名]】
Level: [難易度] [LEVEL]
Score: [SCORE]([SCORE更新幅]) / [EX SCORE]([EX SCORE更新幅])
Comment:
```

投稿本文はプレイ履歴データとして保存しない。

Xへの投稿済み状態、投稿日時、投稿URLなどもプレイ履歴には保存しない。

### 25.2 コメント

PlayLog Tool内にX用コメント入力欄は設けない。

ユーザーはXの投稿画面で必要なコメントを入力する。

---

## 26. データ保存領域

実行時データはユーザーのローカルデータ領域へ保存する。

共有データルート：

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\
```

主なデータ：

```text
data/
├─ database/
│  └─ playlog.db
├─ logs/
├─ media/
│  └─ <play_id>/
│     ├─ result.png
│     └─ replay.mp4
└─ temp/
```

実行時データをElectronアプリケーションのインストール先やプロジェクトディレクトリへ保存しない。

Electron UIのインストール場所が変更されても、SQLiteおよびメディアの保存場所は変更しない。

---

## 27. ログ

Backendは主要な状態変化、処理結果、エラーなどをログへ記録する。

ログ保存先：

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\logs\
```

ログファイルは日付単位で管理する。

```text
YYYYMMDD.log
```

ログの具体的な出力内容やレベルは内部仕様で定める。

---

## 28. エラー時の基本動作

個別の処理が失敗した場合でも、可能な限り他の処理を継続する。

### 28.1 OCR失敗

OCRで取得できなかった項目は欠損値として扱う。

F12では欠損値を含むプレイ記録の保存を継続する。

通常リザルトではSCOREを取得できない場合、自動記録条件を満たさないものとして扱う。

### 28.2 SQLite保存失敗

SQLite保存に失敗しても、Excel保存が有効な場合はExcel保存を独立して試行する。

### 28.3 Excel保存失敗

Excel保存に失敗してもSQLiteの保存結果を変更しない。

### 28.4 Replay処理失敗

Replay動画の処理に失敗しても、プレイ記録や結果画像など他の処理を可能な限り継続する。

処理に失敗した元Replayは削除しない。

### 28.5 メディア保存失敗

結果画像とReplay動画は独立して扱う。

一方の保存に失敗しても、成功したメディアは保持する。

---

## 29. SDVX終了時の動作

SDVXの終了を検出した場合、新しいSDVXプレイ処理を開始しない。

現在処理中のリザルトについて必要な後処理を行う。

すでに開始されているメディア処理は可能な限り継続する。

その後BackendはSLEEP状態へ移行する。

---

## 30. Backend終了時の動作

Backend終了時は新規処理を停止する。

すでに開始されている処理については、可能な限り完了させた後に終了する。

Backend自身が起動したOBSが存在する場合は、終了対象とする。

Backend起動前から存在していたOBSは終了しない。

---

## 31. UI終了時の動作

Electron UIを終了してもPython Backendには影響しない。

```text
Electron UI → 終了
Python Backend → 継続
```

---

## 32. 全体フロー

### 32.1 Backend起動

```text
Windowsログオン
↓
Python Backend自動起動
↓
Backend常駐
↓
SDVX監視
```

### 32.2 SDVX起動

```text
sv6c.exe検出
↓
ACTIVE
↓
OBS確認・準備
↓
曲開始監視
↓
曲開始検出
↓
リザルト監視
```

F12監視はACTIVE中に常時有効とする。

### 32.3 通常リザルト

```text
曲開始検出
↓
リザルト検出
↓
結果画像取得
↓
play_id生成
↓
リザルト終了
↓
OCR
↓
SCORE判定
```

SCOREが`play_log.min_score`以上の場合：

```text
SQLite保存
↓
Excel保存（有効な場合）
↓
result.png保存
```

SCOREが`play_log.min_score`未満の場合、記録およびメディア保存を行わない。

### 32.4 F12

```text
リザルト検出
↓
結果画像保持
↓
play_id生成
↓
F12
↓
OCR
↓
SQLite保存
↓
Excel保存（有効な場合）
↓
result.png保存
↓
Replay Buffer保存
↓
Replay動画取得
↓
曲開始からF12までの経過時間を基準に冒頭トリミング
↓
replay.mp4保存
```

曲開始を検出できていない場合は、Replay動画全体を保存する。

F12ではSCOREによる保存制限を行わない。

---

## 33. 保存条件一覧

| 条件 | SQLite | Excel※ | result.png | replay.mp4 |
|---|---:|---:|---:|---:|
| 通常・SCORE < `play_log.min_score` | × | × | × | × |
| 通常・SCORE >= `play_log.min_score` | ○ | ○ | ○ | × |
| F12・SCOREに関係なく | ○ | ○ | ○ | ○ |

※ `excel.workbook_path`が設定されている場合のみExcelへ保存する。

`excel.workbook_path`が空の場合、Excelへの保存は行わない。

SCOREが過去最高値かどうかは保存条件に含めない。

---

## 34. 外部仕様上のデータ関係

1プレイについて、以下の関係を維持する。

```text
play_id
   │
   ├─ SQLite play_log
   │
   ├─ Excel プレイID（Excel保存が有効な場合）
   │
   └─ data/media/<play_id>/
          ├─ result.png
          └─ replay.mp4
```

SQLite・Excel・メディアはそれぞれ独立して保存する。

Excel保存が無効であっても、SQLiteおよびメディアの保存・管理には影響しない。

メディアの存在・削除によってプレイ履歴を削除しない。

プレイ履歴の保存失敗によって、すでに保存されたメディアを自動削除しない。

---

## 35. 将来拡張

以下は現時点では必須機能とせず、将来の拡張対象とする。

* プレイ履歴UIの機能拡張
* 検索・フィルタ機能の拡張
* 曲グループ表示
* X共有機能の拡張
* X API連携
* SQLiteバックアップ
* SQLiteとExcelの同期・修復
* OBSキャプチャ失敗時の代替方式
* ウィンドウフォーカス制御
* Python Backendの単体実行ファイル化
* その他のプレイログ連携

将来拡張によって本仕様の既存動作を変更する場合は、仕様を更新したうえで実装する。
