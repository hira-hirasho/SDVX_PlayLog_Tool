# <img src="asset/tray_icon.png" width="34" align="absmiddle"> SDVX PlayLog Tool

<p align="center">
  <strong>⚡ Setup Guide</strong>
</p>

<p align="center">
  SDVX PlayLog ToolをWindows環境にセットアップするための手順です。
</p>

---

## ✦ Setup Flow

セットアップは以下の流れで行います。

```text
┌─────────────────────┐
│ ① 前提ソフトウェア   │
│ Python / uv / Node  │
│ FFmpeg / OBS        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ② リポジトリ取得     │
│ SDVX_PlayLog        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ③ setup.ps1         │
│ 自動セットアップ     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ④ OBS Studio        │
│ Scene / Replay / WS │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ⑤ .env              │
│ OBS Password        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ⑥ config.yaml       │
│ 環境設定の確認       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ⑦ Backend 動作確認   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ⑧ Windows Startup   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ⑨ UI Installer      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ⑩ UI Install        │
└──────────┬──────────┘
           │
           ▼
       ✓ COMPLETE
```

---

# 01 ── Prerequisites

## ✦ 前提ソフトウェア

以下のソフトウェアを事前にインストールしてください。

| Software         | Required |
| :--------------- | :------: |
| 🐍 Python        |  `3.12`  |
| 📦 uv            |     ✓    |
| 🟢 Node.js / npm |     ✓    |
| ⚙️ FFmpeg        |     ✓    |
| 🎥 OBS Studio    |     ✓    |

`setup.ps1` はこれらがインストール済みであることを確認します。

---

# 02 ── Repository

## ✦ リポジトリの取得

リポジトリを任意の場所に配置してください。

例：

```text
C:\<任意の場所>\SDVX_PlayLog
```

以降の操作は、プロジェクトルートを基準に行います。

---

# 03 ── Automatic Setup

## ✦ セットアップスクリプトの実行

PowerShellでプロジェクトのルートディレクトリに移動します。

```powershell
cd C:\<任意の場所>\SDVX_PlayLog
```

セットアップスクリプトを実行します。

```powershell
.\scripts\setup.ps1
```

### setup.ps1 が自動で行うこと

```text
✓ Python 3.12 の確認
✓ uv の確認
✓ Python依存パッケージのセットアップ
✓ Node.js / npm の確認
✓ UI依存パッケージのセットアップ
✓ config.yaml の作成
✓ .env の作成
✓ アプリケーションデータディレクトリの作成
✓ 必要なテンプレート・アセットの確認
✓ OBS Studio の確認
✓ FFmpeg / FFprobe の確認
```

`config.yaml`や`.env`が既に存在する場合、既存のファイルは上書きされません。

セットアップ完了後、以下の設定を行います。

---

# 04 ── OBS Studio

## ✦ OBS Studioの設定

OBS Studioを起動し、以下を設定してください。

### 4.1 Scene

以下の名前のシーンを作成してください。

```text
SDVX PlayLog Tool
```

### 4.2 Replay Buffer

Replay Bufferを有効にしてください。

保存先は以下を指定します。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\temp
```

### 4.3 WebSocket

OBS StudioのWebSocket設定を開き、WebSocketサーバーを有効にしてください。

以下を設定します。

| Setting  | Value    |
| :------- | :------- |
| Port     | `4455`   |
| Password | 任意のパスワード |

設定したパスワードは、次の手順で`.env`に設定します。

---

# 05 ── Environment

## ✦ `.env`の設定

プロジェクトルートの`.env`を開き、OBS WebSocketで設定したパスワードを指定してください。

```text
OBS_WEBSOCKET_PASSWORD=設定したWebSocketパスワード
```

`setup.ps1`によって`.env`が作成されている場合は、そのファイルを編集してください。

### Configuration Flow

```text
┌──────────────────────┐
│     OBS Studio       │
│                      │
│ WebSocket Password   │
└──────────┬───────────┘
           │
           │ same password
           ▼
┌──────────────────────┐
│        .env          │
│                      │
│ OBS_WEBSOCKET_       │
│ PASSWORD=...         │
└──────────────────────┘
```

---

# 06 ── Configuration

## ✦ `config.yaml`の確認

通常は`setup.ps1`によって自動作成された`config.yaml`をそのまま使用できます。

OBS Studioを標準の場所とは異なる場所にインストールしている場合は、`obs.executable_path`を実際のOBS実行ファイルのパスに変更してください。

```yaml
obs:
  executable_path: "C:/Program Files/obs-studio/bin/64bit/obs64.exe"
```

標準のインストール先を使用している場合は変更不要です。

---

# 07 ── Backend Check

## ✦ Pythonバックエンドの動作確認

プロジェクトルートで以下を実行します。

```powershell
uv run python main.py
```

以下を確認してください。

```text
✓ SDVX PlayLog Toolが起動する
✓ システムトレイに常駐する
✓ OBSとの接続が正常に行われる
```

動作確認後、アプリを終了してください。

---

# 08 ── Windows Startup

## ✦ PythonバックエンドをWindowsスタートアップに登録

PythonバックエンドをWindowsへのログイン時に自動起動させる場合は、プロジェクトに含まれている以下のファイルを使用します。

```text
startup/start_backend.vbs
```

### Startup Folderを開く

`Win + R`を押し、以下を入力してください。

```text
shell:startup
```

Enterキーを押します。

開いたスタートアップフォルダーに、`startup/start_backend.vbs`へのショートカットを配置してください。

これにより、Windowsへのログイン時にPythonバックエンドが自動起動し、システムトレイに常駐します。

---

# 09 ── UI Build

## ✦ UIインストーラーの作成

UIをインストールするためのインストーラーを作成する場合は、`ui`ディレクトリで以下を実行します。

```powershell
npm run dist
```

ビルドが完了すると、以下の場所にインストーラーが生成されます。

```text
ui/release/SDVX PlayLog Tool Setup <バージョン>.exe
```

---

# 10 ── UI Installation

## ✦ UIのインストール

生成されたインストーラーを実行してください。

```text
ui/release/SDVX PlayLog Tool Setup <バージョン>.exe
```

画面の指示に従ってインストールします。

インストール後、Windowsのスタートメニューから`SDVX PlayLog Tool`を起動できます。

必要に応じてタスクバーにピン留めしてください。

### タスクバーへの登録

1. Windowsのスタートメニューを開く
2. `SDVX PlayLog Tool`を検索する
3. アプリを右クリックする
4. 「タスクバーにピン留めする」を選択する

---

# 11 ── Final Check

## ✦ 最終確認

Windowsへのログイン後、以下を確認してください。

```text
☐ Pythonバックエンドが自動起動する
☐ SDVX PlayLog Toolがシステムトレイに常駐する
☐ OBSとの接続が正常に行われる
☐ UIを起動できる
☐ SDVXをプレイする
☐ リザルトが自動的に記録される
☐ UIからプレイ履歴を確認できる
```

---

<div align="center">

### ✓ Setup Complete

**SDVX PlayLog Tool のセットアップは完了です。**

`PLAY → RECORD → MANAGE → REPLAY`

</div>
