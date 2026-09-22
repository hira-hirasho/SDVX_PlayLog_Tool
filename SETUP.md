# SDVX PlayLog Tool セットアップ手順

## 1. 前提ソフトウェア

以下のソフトウェアを事前にインストールしてください。

* Python 3.12
* uv
* Node.js / npm
* FFmpeg
* OBS Studio

`setup.ps1` はこれらがインストール済みであることを確認します。

---

## 2. リポジトリの取得

リポジトリを任意の場所に配置してください。

例：

```text
C:\<任意の場所>\SDVX_PlayLog
```

以降の操作は、プロジェクトルートを基準に行います。

---

## 3. セットアップスクリプトの実行

PowerShellでプロジェクトのルートディレクトリに移動します。

```powershell
cd C:\<任意の場所>\SDVX_PlayLog
```

セットアップスクリプトを実行します。

```powershell
.\setup.ps1
```

スクリプトによって以下が自動的に実行されます。

* Python 3.12の確認
* uvの確認
* Python依存パッケージのセットアップ
* Node.js / npmの確認
* UI依存パッケージのセットアップ
* `config.yaml`の作成
* `.env`の作成
* アプリケーションデータディレクトリの作成
* 必要なテンプレート・アセットの確認
* OBS Studioの確認
* FFmpeg / FFprobeの確認

`config.yaml`や`.env`が既に存在する場合、既存のファイルは上書きされません。

セットアップ完了後、以下の設定を行います。

---

## 4. OBS Studioの設定

OBS Studioを起動し、以下を設定してください。

### 4.1 シーン

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

* ポート：`4455`
* パスワード：任意のパスワード

設定したパスワードは、次の手順で`.env`に設定します。

---

## 5. `.env`の設定

プロジェクトルートの`.env`を開き、OBS WebSocketで設定したパスワードを指定してください。

```text
OBS_WEBSOCKET_PASSWORD=設定したWebSocketパスワード
```

`setup.ps1`によって`.env`が作成されている場合は、そのファイルを編集してください。

---

## 6. `config.yaml`の確認

通常は`setup.ps1`によって自動作成された`config.yaml`をそのまま使用できます。

OBS Studioを標準の場所とは異なる場所にインストールしている場合は、`obs.executable_path`を実際のOBS実行ファイルのパスに変更してください。

```yaml
obs:
  executable_path: "C:/Program Files/obs-studio/bin/64bit/obs64.exe"
```

標準のインストール先を使用している場合は変更不要です。

---

## 7. Pythonバックエンドの動作確認

プロジェクトルートで以下を実行します。

```powershell
uv run python main.py
```

以下を確認してください。

* SDVX PlayLog Toolが起動する
* システムトレイに常駐する
* OBSとの接続が正常に行われる

動作確認後、アプリを終了してください。

---

## 8. PythonバックエンドをWindowsスタートアップに登録

PythonバックエンドをWindowsへのログイン時に自動起動させる場合は、プロジェクトに含まれている以下のファイルを使用します。

```text
startup/start_backend.vbs
```

Windowsのスタートアップフォルダーを開きます。

`Win + R`を押し、以下を入力してください。

```text
shell:startup
```

Enterキーを押します。

開いたスタートアップフォルダーに、`startup/start_backend.vbs`へのショートカットを配置してください。

これにより、Windowsへのログイン時にPythonバックエンドが自動起動し、システムトレイに常駐します。

---

## 9. UIインストーラーの作成

UIをインストールするためのインストーラーを作成する場合は、`ui`ディレクトリで以下を実行します。

```powershell
npm run dist
```

ビルドが完了すると、以下の場所にインストーラーが生成されます。

```text
ui/release/SDVX PlayLog Tool Setup <バージョン>.exe
```

---

## 10. UIのインストール

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

## 11. 最終確認

Windowsへのログイン後、以下を確認してください。

1. Pythonバックエンドが自動起動する
2. SDVX PlayLog Toolがシステムトレイに常駐する
3. OBSとの接続が正常に行われる
4. UIを起動できる
5. SDVXをプレイする
6. リザルトが自動的に記録される
7. UIからプレイ履歴を確認できる

以上でセットアップは完了です。
