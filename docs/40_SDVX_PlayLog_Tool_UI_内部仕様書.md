# SDVX PlayLog Tool UI内部仕様書

## 1. 文書情報

- 文書名：SDVX PlayLog Tool UI内部仕様書
- 対象OS：Windows 11
- 対象アプリ：SDVX PlayLog Tool
- UI実装：React / TypeScript
- UI実行環境：Electron 44.4.1
- UIビルド環境：Vite 8.3.0
- データベース：SQLite
- DBアクセス：better-sqlite3

本仕様書は、SDVX PlayLog Tool UIの内部実装を定義する。

対象は以下とする。

```text
Electron Main Process
preload
Renderer Process
Reactコンポーネント
React Hooks
状態管理
画面遷移
SQLiteアクセス
メディアアクセス
Electron IPC
Electronカスタムプロトコル
UIビルド・パッケージング
```

画面上の表示内容、利用者の操作方法、検索条件、GRADE表示基準等の外部仕様については、UI外部仕様書で定義する。

---

# 2. 内部アーキテクチャ

UIはElectronをホスト環境とし、Main ProcessとRenderer Processを分離する。

```text
Electron
│
├─ Main Process
│   ├─ アプリケーションライフサイクル
│   ├─ BrowserWindow
│   ├─ SQLite
│   ├─ メディアファイル
│   ├─ Electron Protocol
│   └─ IPC
│
├─ Preload
│   └─ Rendererへ公開するAPI
│
└─ Renderer Process
    └─ React / TypeScript
        ├─ App
        ├─ Components
        ├─ Hooks
        ├─ Types
        └─ Utils
```

基本的な責務分担：

| 領域 | 主な責務 |
|---|---|
| Main Process | OS・SQLite・メディア・Electron API |
| Preload | Rendererへ公開するAPI境界 |
| Renderer | UI表示・操作・画面状態 |
| React Components | UI構造・表示 |
| Hooks | 状態・データ取得・画面ロジック |
| Utils | UI共通の純粋な変換処理 |

RendererからNode.js APIやSQLiteへ直接アクセスしない。

---

# 3. プロセス間境界

UI内部では以下のプロセス境界を設ける。

```text
┌─────────────────────────────────────┐
│ Electron Main Process               │
│                                     │
│ SQLite                              │
│ Filesystem                          │
│ Electron API                        │
│ Media Protocol                      │
└───────────────┬─────────────────────┘
                │
                │ preload / IPC
                ↓
┌─────────────────────────────────────┐
│ Renderer Process                    │
│                                     │
│ React                               │
│ UI State                            │
│ Hooks                               │
│ Components                          │
└─────────────────────────────────────┘
```

RendererはMain Processの内部実装を直接参照しない。

Main Processの具体的なファイルパス、SQLite接続、ファイル読み込み等はRendererへ公開しない。

---

# 4. ディレクトリ構成

UIの主要なソース構成は以下とする。

```text
ui/
├─ electron/
│  ├─ main.mjs
│  ├─ preload.mjs
│  ├─ db.mjs
│  └─ paths.mjs
│
├─ src/
│  ├─ components/
│  │  ├─ effects/
│  │  │  └─ FxStyles.tsx
│  │  │
│  │  └─ playlog/
│  │     ├─ ScoreCard.tsx
│  │     ├─ DetailView.tsx
│  │     └─ PlayLogFilters.tsx
│  │
│  ├─ hooks/
│  │  ├─ usePlayLogs.ts
│  │  ├─ usePlayLogNavigation.ts
│  │  ├─ usePlayLogFilters.ts
│  │  ├─ useSystemReady.ts
│  │  └─ usePagination.ts
│  │
│  ├─ types/
│  │  └─ playLog.ts
│  │
│  ├─ utils/
│  │  └─ playLog.ts
│  │
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
│
├─ package.json
├─ vite.config.*
└─ ...
```

`node_modules`、`dist`、`release`等の生成物はソースコードの構成対象としない。

---

# 5. Main Process

## 5.1 main.mjs

`main.mjs`はElectron Main Processのエントリポイントとする。

主な責務：

```text
Electron起動
BrowserWindow生成
単一起動制御
Preload設定
IPC登録
メディアプロトコル登録
アプリケーション終了処理
```

Main ProcessからRendererを起動するが、Pythonバックエンドを起動しない。

---

## 5.2 BrowserWindow

RendererはElectronのBrowserWindow内で実行する。

BrowserWindowにはPreloadスクリプトを設定する。

RendererへNode.jsの完全な実行権限を与えない。

---

# 6. Preload

PreloadはMain ProcessとRenderer ProcessのAPI境界とする。

Rendererから利用可能なAPIを限定して公開する。

概念構造：

```text
Renderer
    │
    │ window.api
    ↓
Preload
    │
    │ ipcRenderer
    ↓
Main Process
```

Rendererから以下を直接実行しない。

```text
fs
path
better-sqlite3
child_process
Electron Main API
```

---

# 7. Rendererアーキテクチャ

RendererはReactで構築する。

```text
main.tsx
   ↓
App.tsx
   ├─ FxStyles
   ├─ PlayLogFilters
   ├─ ScoreCard
   └─ DetailView
```

`App.tsx`はアプリケーション全体の組み立てと画面状態の統合を担当する。

画面単位・責務単位の処理はHooksおよびComponentsへ分離する。

---

# 8. App.tsx

`App.tsx`はRendererのルートコンポーネントとする。

主な責務：

```text
各Hookの組み合わせ
一覧画面と詳細画面の切り替え
一覧画面の構成
詳細画面の構成
共通レイアウト
```

`App.tsx`に個別コンポーネントの詳細な表示ロジックを集中させない。

現在の主要な依存関係：

```text
App
├─ usePlayLogs
├─ usePlayLogNavigation
├─ usePlayLogFilters
├─ useSystemReady
├─ usePagination
│
├─ PlayLogFilters
├─ ScoreCard
├─ DetailView
└─ FxStyles
```

今回のリファクタリングでは、従来`App.tsx`に集中していたUI・状態・取得処理を責務ごとに分離した。

---

# 9. Reactコンポーネント

## 9.1 ScoreCard

ファイル：

```text
src/components/playlog/ScoreCard.tsx
```

責務：

```text
1プレイ分の一覧カード表示
```

入力としてプレイレコードを受け取り、以下を表示する。

```text
GRADE
曲名
アーティスト
難易度
LEVEL
SCORE
SCORE差分
EX SCORE
EX SCORE差分
日時
```

ScoreCard自身はプレイ履歴全体の取得を担当しない。

---

## 9.2 DetailView

ファイル：

```text
src/components/playlog/DetailView.tsx
```

責務：

```text
1プレイの詳細表示
プレイ情報編集
プレイ情報保存
プレイ情報編集キャンセル
パフォーマンス表示
GRADE表示
メディア表示
RESULT IMAGEプレビュー
REPLAY VIDEO表示
```

DetailViewは対象`play_id`に対応するプレイデータを受け取り、その内容を表示する。

編集状態では、表示中のプレイデータとは別に編集用の状態を保持する。

`SAVE`実行時はPreloadで公開された更新APIを介してMain Processへプレイデータの更新を要求する。

`CANCEL`実行時は編集内容を破棄し、保存前のプレイデータを表示する。

保存成功後は一覧データを再取得し、更新後のプレイデータを反映する。

メディア表示では、Main Processから取得したメディアURLを使用する。
---

## 9.3 PlayLogFilters

ファイル：

```text
src/components/playlog/PlayLogFilters.tsx
```

責務：

```text
曲名検索入力
アーティスト検索入力
開始日入力
終了日入力
RESET操作
```

検索状態そのものの管理は`usePlayLogFilters`が担当する。

---

## 9.4 FxStyles

ファイル：

```text
src/components/effects/FxStyles.tsx
```

責務：

```text
UI全体で使用する視覚エフェクト用CSS
```

背景発光、グロー、ページイン等のUI演出を管理する。

データ取得や画面状態管理を担当しない。

---

# 10. Hooks

UIの状態管理・データ取得・画面ロジックはHooksへ分離する。

---

## 10.1 usePlayLogs

ファイル：

```text
src/hooks/usePlayLogs.ts
```

責務：

```text
プレイ履歴取得
取得結果保持
一覧データ更新
検索条件・ページ条件を反映したデータ取得
```

Main Processへ公開されたAPIを介してSQLiteデータを取得する。

Renderer自身はSQLiteへ直接アクセスしない。

---

## 10.2 usePlayLogNavigation

ファイル：

```text
src/hooks/usePlayLogNavigation.ts
```

責務：

```text
一覧 / 詳細の画面状態
play_idによる詳細遷移
Browser History
popstate
```

詳細画面ではQuery Parameterを使用する。

```text
?play=<play_id>
```

一覧から詳細へ移動する場合はHistoryへ状態を追加する。

ブラウザの戻る操作では`popstate`を利用して画面状態を更新する。

---

## 10.3 usePlayLogFilters

ファイル：

```text
src/hooks/usePlayLogFilters.ts
```

責務：

```text
検索条件の状態管理
検索条件変更
RESET
検索条件変更時のページリセット
```

管理対象：

```text
track
artist
from
to
```

検索条件変更時はページを先頭へ戻す。

---

## 10.4 useSystemReady

ファイル：

```text
src/hooks/useSystemReady.ts
```

責務：

```text
UI起動時のシステム表示状態
初期表示状態
ONLINE / CONNECTED等の表示状態
```

このHookはPythonバックエンドの`ACTIVE` / `SLEEP`を直接管理するものではない。

---

## 10.5 usePagination

ファイル：

```text
src/hooks/usePagination.ts
```

責務：

```text
現在ページ
総ページ数
次ページ
前ページ
ページ変更
```

1ページあたりの表示件数は50件とする。

ページ変更時は`usePlayLogs`による再取得につなげる。

---

# 11. 型定義

ファイル：

```text
src/types/playLog.ts
```

プレイ履歴に関するTypeScript型を定義する。

代表的なデータ：

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

OCRで取得する項目はNULLになり得る。

TypeScriptでは以下の項目をnullableとして扱う。

```text
song_name: string | null
artist: string | null
difficulty: string | null
level: number | null
score: number | null
score_delta: number | null
ex_score: number | null
ex_score_delta: number | null
```

`play_id`および`played_at`はnullableとしない。

Renderer内部ではこれらの型を基準としてプレイデータを扱う。

---

# 12. UIユーティリティ

ファイル：

```text
src/utils/playLog.ts
```

UI表示に必要な純粋な変換処理を配置する。

対象例：

```text
GRADE算出
数値フォーマット
日時フォーマット
表示用値変換
```

バックエンドの保存処理やSQLite更新処理をここへ配置しない。

---

# 13. SQLiteアクセス

SQLiteはUIにおけるプレイ履歴の読み取り元とする。

UIではプレイレコードの生成・削除は行わない。

プレイ詳細画面から既存のプレイレコードを更新できる。

更新対象は既存の`play_id`に対応するプレイレコードとし、`play_id`自体および`played_at`は変更しない。

更新処理はRendererからPreloadで公開されたAPIを介してMain Processへ要求し、Main Processの`better-sqlite3`によってSQLiteへ反映する。

```text
Renderer
↓
window.api
↓
IPC
↓
Main Process
↓
better-sqlite3
↓
playlog.db
```

SQLiteはUIにおけるプレイ履歴の読み取り元とする。

UIはプレイレコードの生成・更新・削除を行わない。

---

# 14. SQLiteデータベースパス

データルートは以下を使用する。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data
```

SQLite：

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\database\playlog.db
```

Electron側ではデータルートを共通のパス解決処理から取得する。

---

# 15. SQLite取得処理

UIから必要なデータのみ取得する。

一覧取得ではページングおよび検索条件をSQLiteクエリへ反映する。

概念：

```text
検索条件
+
ページ番号
↓
SQLite Query
↓
プレイ履歴
↓
Renderer
```

基本的な並び順：

```text
played_at DESC
```

一覧のページサイズ：

```text
50
```

---

# 16. IPC

UI内部では、RendererからMain Processの処理を呼び出すためにElectron IPCを使用する。

IPCはUI内部のElectron Main / Renderer間通信であり、Pythonバックエンドとの通信ではない。

代表的な処理：

```text
プレイ履歴取得
プレイレコード更新
メディア情報取得
```

IPCチャンネルは用途ごとに分離する。

---

## 16.1 play-log:get-list

プレイ履歴一覧を取得するためのIPCとする。

概念：

```text
Renderer
↓
play-log:get-list
↓
Main Process
↓
SQLite
↓
結果
↓
Renderer
```

検索条件およびページ情報をMain Processへ渡す。

---

## 16.2 play-log:get-media

指定された`play_id`のメディア情報を取得するためのIPCとする。

概念：

```text
Renderer
↓
play-log:get-media
↓
Main Process
↓
media/<play_id>/
↓
メディアURL
↓
Renderer
```

メディアファイルそのものをBase64文字列としてIPCで転送しない。

---

## 16.3 play-log:update

指定された`play_id`の既存プレイレコードを更新するためのIPCとする。

概念：

```text
Renderer
↓
play-log:update
↓
Main Process
↓
SQLite UPDATE
↓
結果
↓
Renderer
```

更新対象：

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

`play_id`を更新対象の識別子として使用する。

`played_at`および`play_id`は更新しない。

更新対象の値にはNULLを指定できる。

更新結果として、対象レコードが存在して更新されたかをRendererへ返す。

---

# 17. メディアアクセス

メディアは以下に保存される。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\media\<play_id>\
```

対象：

```text
result.png
replay.mp4
```

SQLiteにはメディアパスを保存しない。

Main Processが`play_id`を基準にメディアパスを導出する。

```text
play_id
↓
data/media/<play_id>/
├─ result.png
└─ replay.mp4
```

---

# 18. Electronカスタムプロトコル

大容量メディアをRendererへBase64文字列として渡さないため、専用Electronプロトコルを使用する。

プロトコル：

```text
sdvx-media://
```

例：

```text
sdvx-media://<play_id>/result.png
sdvx-media://<play_id>/replay.mp4
```

Main Processでプロトコルを登録する。

プロトコルはアプリケーション起動時、ElectronのRenderer利用開始前に登録する。

---

# 19. メディアURL生成

`play-log:get-media`では、ファイルの存在を確認したうえでメディアURLを返す。

概念：

```text
result.png exists
↓
sdvx-media://<play_id>/result.png

replay.mp4 exists
↓
sdvx-media://<play_id>/replay.mp4
```

存在しないメディアは`null`として扱う。

概念：

```text
{
  resultImage: string | null,
  replayVideo: string | null
}
```

---

# 20. メディアストリーミング

`sdvx-media://`へのアクセスはMain Processでファイルストリームへ変換する。

概念：

```text
HTML img / video
        │
        ↓
sdvx-media://
        │
        ↓
Electron Main
        │
        ↓
fs.createReadStream()
        │
        ↓
Renderer
```

動画についてはHTTP Range相当の範囲読み込みに対応する。

これにより、動画全体を一度にメモリへ読み込まず、動画要素からシーク操作を行える。

---

# 21. 大容量動画への対応

Replay動画は数百MBになる場合があるため、以下の方式を禁止する。

```text
MP4全体読み込み
↓
Base64変換
↓
IPCで巨大文字列として送信
```

代わりに以下を使用する。

```text
MP4
↓
sdvx-media://
↓
ストリーム読み込み
```

これによりElectron IPCの文字列サイズ制限を回避する。

---

# 22. DetailViewのメディア処理

DetailViewでは`play-log:get-media`によってメディアURLを取得する。

```text
DetailView
↓
play-log:get-media(play_id)
↓
resultImage
replayVideo
```

結果：

```text
resultImageあり
→ <img>

replayVideoあり
→ <video>
```

それぞれ独立して表示する。

---

# 23. Replay Video

Replay動画はHTMLの`video`要素を使用する。

主な設定：

```text
controls
playsInline
preload="metadata"
object-fit: contain
```

動画全体をRendererのJavaScriptメモリへ読み込まず、ブラウザのメディア要素からカスタムプロトコルへアクセスする。

---

# 24. Result Image Preview

RESULT IMAGEはDetailView内でプレビュー表示を管理する。

管理対象：

```text
プレビュー表示状態
ズーム倍率
パン位置
```

ズーム範囲：

```text
50% ～ 400%
```

操作：

```text
マウスホイール
+
-
RESET
ドラッグ
ESC
背景クリック
```

プレビュー表示中は背景ページのスクロールを抑制する。

---

# 25. GRADE処理

GRADEの算出はRenderer側のUI表示処理として行う。

SCOREを入力としてGRADEを算出する。

```text
SCORE
↓
playLog utility
↓
GRADE
↓
ScoreCard / DetailView
```

GRADE算出結果をSQLiteへ保存しない。

GRADEはプレイレコードの保存条件とは独立する。

---

# 26. 検索状態

検索状態は`usePlayLogFilters`で管理する。

```text
track
artist
from
to
```

検索条件変更時：

```text
Filter変更
↓
page = 0
↓
PlayLog再取得
↓
一覧更新
```

RESET時：

```text
Filter初期化
↓
page = 0
↓
PlayLog再取得
```

---

# 27. ページング状態

ページ状態は`usePagination`で管理する。

基本値：

```text
pageSize = 50
```

ページ変更：

```text
NEXT
↓
page + 1

PREV
↓
page - 1
```

ページ変更後、対象ページのデータを再取得する。

---

# 28. 画面遷移状態

画面遷移は`usePlayLogNavigation`で管理する。

詳細画面：

```text
?play=<play_id>
```

概念：

```text
URL
↓
play_id取得
↓
詳細画面
```

一覧へ戻る場合はHistory APIを利用する。

ブラウザ履歴変更時は`popstate`を監視して画面状態を更新する。

---

# 29. 一覧状態と詳細状態

Rendererでは以下を論理的に区別する。

```text
一覧状態
詳細状態
```

一覧状態：

```text
検索条件
ページ
プレイ一覧
```

詳細状態：

```text
play_id
プレイ詳細
メディア
画像プレビュー状態
```

詳細表示から一覧へ戻る際には、可能な限り一覧状態を復元する。

---

# 30. UI起動状態

UI起動時は以下の順序で初期化する。

```text
Electron起動
↓
Main Process初期化
↓
BrowserWindow生成
↓
Preload読み込み
↓
Renderer起動
↓
React初期化
↓
UI初期状態
↓
SQLiteデータ取得
↓
一覧表示
```

起動時にPythonバックエンドを起動しない。

---

# 31. Electron単一起動

UIはElectronの単一起動機構を使用する。

```text
1個目
↓
通常起動

2個目
↓
新規ウィンドウを生成しない
↓
既存インスタンスを前面へ
```

既存ウィンドウが最小化されている場合は復元する。

具体的なElectron APIによる実装はMain Processに置く。

---

# 32. Pythonバックエンドとの分離

UIとPythonバックエンドは以下の通信を行わない。

```text
HTTP
WebSocket
Python API
Electron IPC
```

Electron IPCはMain ProcessとRenderer Processの内部通信にのみ使用する。

```text
Python Backend
      │
      │
      X 直接通信なし
      │
Electron Main
      │
      ↓
Renderer
```

両者が共有するもの：

```text
SQLite
Media
```

---

# 33. Backend状態との分離

Pythonバックエンドには独自の状態として以下が存在する。

```text
ACTIVE
SLEEP
```

これはElectron UIの状態とは共有しない。

UI側でPythonバックエンドの状態を直接管理しない。

---

# 34. UIデータ更新

BackendからUIへのPush通知は実装しない。

UI側から必要なタイミングでデータを取得する。

```text
UI起動
↓
取得

ページ変更
↓
取得

検索条件変更
↓
取得

RESET
↓
取得

画面再表示
↓
必要に応じて取得
```

PythonバックエンドがSQLiteへ新しいレコードを追加しても、UIへ自動Pushしない。

---

# 35. エラー処理

Rendererでデータ取得エラーを検知した場合は、UI上でエラー状態を表示する。

対象例：

```text
SQLite取得失敗
IPC失敗
メディア取得失敗
対象プレイ不存在
```

取得できなかったデータを推測して補完しない。

---

# 36. 対象プレイ不存在時

`?play=<play_id>`から取得した`play_id`に対応するSQLiteレコードが存在しない場合：

```text
play_id
↓
SQLite検索
↓
該当なし
↓
通常のDetailViewを表示しない
```

メディアファイルだけが存在していても、プレイレコードを復元しない。

---

# 37. セキュリティ境界

RendererへNode.jsの完全な権限を与えない。

Rendererから以下を直接利用しない。

```text
Node.js filesystem
Node.js child_process
SQLite connection
Electron Main API
```

必要な処理のみPreloadを介して公開する。

---

# 38. CSS・視覚エフェクト

UIの共通視覚表現は以下の責務に分ける。

```text
index.css
↓
グローバルCSS
テーマ
基本レイアウト基盤

FxStyles
↓
React UI内の視覚エフェクト
```

背景、発光、グロー、ページイン等の装飾はUIコンポーネントのデータ処理から分離する。

---

# 39. Reduced Motion

OSの`prefers-reduced-motion`を検出し、アニメーションを抑制または停止する。

Reduced Motion適用時も以下を維持する。

```text
情報表示
画面遷移
検索
ページング
詳細表示
メディア操作
```

アニメーション停止によって機能を使用できなくしてはならない。

---

# 40. ビルド構成

開発時：

```text
React / TypeScript
↓
Vite development server
↓
Electron
```

本番ビルド：

```text
TypeScript
↓
Vite build
↓
ui/dist
↓
Electron
↓
electron-builder
↓
Windows application
```

生成物：

```text
ui/dist
ui/release
```

はソースコードとは分離して扱う。

---

# 41. npmスクリプト

UIの開発・ビルド・パッケージングは`package.json`に定義されたnpm scriptを使用する。

代表的な処理：

```text
dev
build
dist
lint
```

具体的なコマンド名は`package.json`を正とし、本仕様書ではUI内部処理と混同しない範囲で扱う。

---

# 42. リファクタリング後の責務分離

今回のUIリファクタリングでは、従来`App.tsx`へ集中していた処理を以下のように分離した。

```text
旧構成

App.tsx
├─ UI
├─ 状態
├─ データ取得
├─ 検索
├─ ページング
├─ 画面遷移
├─ ScoreCard
├─ DetailView
├─ Media
└─ Visual Effects
```

↓

```text
現在

App.tsx
├─ 画面構成
└─ 各責務の統合

components/
├─ effects/
│  └─ FxStyles
│
└─ playlog/
   ├─ ScoreCard
   ├─ DetailView
   └─ PlayLogFilters

hooks/
├─ usePlayLogs
├─ usePlayLogNavigation
├─ usePlayLogFilters
├─ useSystemReady
└─ usePagination

types/
└─ playLog

utils/
└─ playLog
```

リファクタリングによって外部仕様上の画面・操作・表示内容は変更しない。

---

# 43. コンポーネント責務の原則

各コンポーネントは、可能な限り以下の原則に従う。

```text
表示
↓
Component

状態・副作用
↓
Hook

データ型
↓
types

純粋な変換処理
↓
utils

OS / SQLite / FileSystem
↓
Main Process
```

UIコンポーネントからMain Processの内部実装へ直接依存しない。

---

# 44. データフロー

プレイ履歴一覧：

```text
SQLite
↓
Main Process
↓
IPC
↓
Preload
↓
window.api
↓
usePlayLogs
↓
App
↓
ScoreCard
```

検索：

```text
PlayLogFilters
↓
usePlayLogFilters
↓
検索条件
↓
usePlayLogs
↓
IPC
↓
SQLite
↓
結果
↓
ScoreCard
```

詳細：

```text
URL
↓
usePlayLogNavigation
↓
play_id
↓
SQLite
↓
DetailView
```

メディア：

```text
play_id
↓
play-log:get-media
↓
Main Process
↓
ファイル存在確認
↓
sdvx-media:// URL
↓
DetailView
↓
img / video
```

---

# 45. 外部仕様との対応

UI内部仕様は、UI外部仕様で定義された機能を実現するための内部構造を定義する。

対応関係：

| 外部仕様 | 主な内部実装 |
|---|---|
| プレイ履歴一覧 | `usePlayLogs` / `ScoreCard` |
| 検索 | `usePlayLogFilters` / `PlayLogFilters` |
| ページング | `usePagination` |
| 詳細画面 | `usePlayLogNavigation` / `DetailView` |
| プレイ詳細編集・保存 | `DetailView` / `window.api` / `play-log:update` / `db.mjs` |
| GRADE | `utils/playLog.ts` |
| RESULT IMAGE | `DetailView` / `sdvx-media://` |
| REPLAY VIDEO | `DetailView` / `sdvx-media://` |
| 画像プレビュー | `DetailView` |
| Browser History | `usePlayLogNavigation` |
| UI初期状態 | `useSystemReady` |
| SQLite | Main Process / `db.mjs` |
| メディアファイル | Main Process / `main.mjs` |
| Renderer API | Preload |

外部仕様の表示・操作要件を満たす限り、内部実装はリファクタリングによって変更できる。

---

# 46. 内部仕様変更時の原則

内部実装を変更する場合でも、外部仕様に定義された利用者向け動作を変更しない場合は、原則として外部仕様書のバージョンを変更しない。

例えば以下は内部仕様の変更として扱う。

```text
Reactコンポーネント分割
Hooks分割
ファイル移動
SQLiteクエリの内部改善
IPC実装変更
メディアストリーミング方式変更
CSS実装変更
Electron内部実装変更
```

一方、以下を変更する場合は外部仕様書も更新対象とする。

```text
画面構成変更
表示項目変更
検索条件変更
ユーザー操作変更
GRADE判定変更
ページサイズ変更
メディア表示仕様変更
新機能追加
既存機能削除
```

---

# 47. 現行内部構成の基準

現時点のUI内部構成は以下を基準とする。

```text
Electron Main
├─ main.mjs
├─ preload.mjs
├─ db.mjs
└─ paths.mjs

Renderer
├─ App.tsx
│
├─ components/
│  ├─ effects/
│  │  └─ FxStyles.tsx
│  │
│  └─ playlog/
│     ├─ ScoreCard.tsx
│     ├─ DetailView.tsx
│     └─ PlayLogFilters.tsx
│
├─ hooks/
│  ├─ usePlayLogs.ts
│  ├─ usePlayLogNavigation.ts
│  ├─ usePlayLogFilters.ts
│  ├─ useSystemReady.ts
│  └─ usePagination.ts
│
├─ types/
│  └─ playLog.ts
│
└─ utils/
   └─ playLog.ts
```

データアクセス：

```text
SQLite
↓
Main Process
↓
IPC / Preload
↓
Renderer
```

メディア：

```text
play_id
↓
Main Process
↓
sdvx-media://
↓
img / video
```

---

# 48. 内部仕様の基準

UI内部では以下の責務境界を基準とする。

```text
Electron Main
    ↓
OS / SQLite / Media

Preload
    ↓
安全なAPI境界

Renderer
    ↓
React UI

Hooks
    ↓
状態 / データ取得 / UIロジック

Components
    ↓
表示

Types
    ↓
型

Utils
    ↓
純粋な変換処理
```

UIはPythonバックエンドと直接通信しない。

プレイ履歴はSQLiteから取得する。

既存のプレイレコードは、Preloadで公開された更新APIを介してMain ProcessからSQLiteへ更新できる。

メディアは`play_id`を基準として取得する。

大容量メディアはIPCの巨大文字列転送を行わず、`sdvx-media://`によるストリーミングを使用する。
