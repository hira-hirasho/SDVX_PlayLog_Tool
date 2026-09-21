# SDVX PlayLog Tool セットアップ手順

## 1. 前提ソフトウェアのインストール

以下をインストールしてください。

- Python 3.12
- uv
- Node.js
- FFmpeg
- OBS Studio

---

## 2. リポジトリの取得

リポジトリを任意の場所に配置してください。

例：

```text
C:\<任意の場所>\SDVX_PlayLog
```

---

## 3. Python環境のセットアップ

PowerShellでプロジェクトのルートディレクトリに移動します。

```powershell
cd C:\<任意の場所>\SDVX_PlayLog
```

依存パッケージをインストールします。

```powershell
uv sync
```

---

## 4. 設定ファイルの作成

`config.example.yaml`をコピーして、`config.yaml`を作成してください。

```powershell
Copy-Item config.example.yaml config.yaml
```

`config.yaml`を開き、必要な設定を変更してください。

### OBSの実行ファイル

OBS Studioを標準の場所にインストールしていない場合は、`obs.executable_path`を実際のOBS実行ファイルのパスに変更してください。

```yaml
obs:
  executable_path: "C:/Program Files/obs-studio/bin/64bit/obs64.exe"
```

### Excel保存

Excelへの保存を使用する場合は、`templates/SDVX_PlayLog.xlsx`を任意の場所へコピーし、そのパスを設定してください。

```yaml
excel:
  workbook_path: "Excelファイルのパス"
```

Excel保存を使用しない場合は空欄にしてください。

```yaml
excel:
  workbook_path: ""
```

---

## 5. OBS Studioの設定

OBS Studioを起動し、以下を設定してください。

### シーン

以下の名前のシーンを作成してください。

```text
SDVX PlayLog Tool
```

### Replay Buffer

Replay Bufferを有効にしてください。

保存先は以下を指定してください。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\temp
```

### WebSocket

OBS StudioのWebSocket設定を開き、WebSocketサーバーを有効にしてください。

以下を設定します。

- ポート：`4455`
- パスワード：任意のパスワード

設定したパスワードは、後述の`.env`に設定します。

---

## 6. `.env`の作成

プロジェクトルートに`.env`を作成してください。

```text
OBS_WEBSOCKET_PASSWORD=設定したWebSocketパスワード
```

---

## 7. FFmpegの設定

FFmpegをインストールし、PowerShellから以下のコマンドを実行できる状態にしてください。

```powershell
ffmpeg -version
ffprobe -version
```

---

## 8. Pythonバックエンドの動作確認

以下を実行してバックエンドを起動してください。

```powershell
uv run python main.py
```

SDVX PlayLog Toolが起動し、システムトレイに常駐することを確認してください。

動作確認後、アプリを終了してください。

---

## 9. PythonバックエンドをWindowsスタートアップに登録

SDVX PlayLog ToolのPythonバックエンドをWindows起動時に自動起動させます。

プロジェクトに含まれている以下のファイルを使用します。

```text
startup/start_backend.vbs
```

Windowsのスタートアップフォルダーを開きます。

`Win + R`を押して、以下を入力してください。

```text
shell:startup
```

Enterキーを押します。

開いたスタートアップフォルダーに、以下のショートカットを作成してください。

```text
startup/start_backend.vbs
```

スタートアップフォルダーにショートカットを配置すると、Windowsへのログイン時にPythonバックエンドが自動起動し、システムトレイに常駐します。

---

## 10. UIのセットアップ

UIの依存パッケージをインストールします。

PowerShellでプロジェクトの`ui`ディレクトリへ移動してください。

```powershell
cd ui
```

以下を実行します。

```powershell
npm ci
```

---

## 11. UIの動作確認

開発環境でUIを起動する場合は、以下を実行します。

```powershell
npm run dev
```

Electronアプリが起動することを確認してください。

---

## 12. インストーラーの作成

UIのインストーラーを作成します。

`ui`ディレクトリで以下を実行してください。

```powershell
npm run dist
```

ビルドが完了すると、以下のインストーラーが生成されます。

```text
ui/release/SDVX PlayLog Tool Setup <バージョン>.exe
```

---

## 13. UIのインストール

以下のインストーラーを実行してください。

```text
ui/release/SDVX PlayLog Tool Setup <バージョン>.exe
```

画面の指示に従ってインストールしてください。

インストールが完了すると、WindowsのスタートメニューからSDVX PlayLog Toolを起動できるようになります。

必要に応じてアプリをタスクバーにピン留めしてください。

### タスクバーへの登録

1. Windowsのスタートメニューを開く
2. `SDVX PlayLog Tool`を検索する
3. アプリを右クリックする
4. 「タスクバーにピン留めする」を選択する

以降はタスクバーのアイコンからUIを起動できます。

---

## 14. 起動確認

Windowsへのログイン後、Pythonバックエンドが自動起動してシステムトレイに常駐していることを確認してください。

SDVXをプレイし、リザルトが自動で記録されることを確認してください。

プレイ履歴を確認する場合は、タスクバーに登録したSDVX PlayLog Toolを起動してください。
