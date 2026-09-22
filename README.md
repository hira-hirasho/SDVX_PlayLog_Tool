# SDVX PlayLog Tool

コナステ版SOUND VOLTEXのプレイ結果を自動で記録・管理するWindows向けアプリです。

ゲームのリザルト画面を自動検出して、曲名・難易度・スコアなどのプレイ情報を取得します。
取得したプレイ結果はデータベースに保存され、専用UIからプレイ履歴を確認できます。
リプレイ動画の保存にも対応しています。

## Features

### プレイ結果の自動記録

- リザルト画面を自動検出し保存
- 曲名・アーティスト・難易度・レベル・スコアなどをOCRで取得
- 取得したプレイ結果を自動でデータベースに保存
- 保存したプレイ履歴を専用UIから閲覧

### リプレイ動画の保存

- OBS Replay Bufferを利用してリプレイ動画を自動保存
- プレイ開始前の不要な部分を自動でトリミング
- リザルト画面でキー押下でリプレイ動画を保存（初期キー: F12）

## Requirements

- Windows 11
- Python 3.12
- uv
- Node.js / npm
- OBS Studio
- FFmpeg

## Setup

リポジトリを取得後、PowerShellから以下を実行します。

```powershell
.\scripts\setup.ps1
```

セットアップ後の詳細な設定は以下を参照してください。

`SETUP.md`

## Development

### Backend

```powershell
uv run python main.py
```

### UI

```powershell
cd ui
npm run dev
```

### UI Build

```powershell
cd ui
npm run build
```

### Windows Package

```powershell
cd ui
npm run dist
```

## Configuration

個人環境の設定は `config.yaml` で行います。

サンプル設定は `config.example.yaml` を使用します。

OBS WebSocketのパスワードは `.env` の `OBS_WEBSOCKET_PASSWORD` に設定します。

## Runtime Data

アプリの実行データは以下に保存されます。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\
```

主な保存先：

```text
data/
├── database/
├── debug/
├── logs/
├── media/
└── temp/
```
