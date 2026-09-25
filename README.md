# <img src="asset/tray_icon.png" width="36" align="absmiddle"> SDVX PlayLog Tool

<p align="center">
  <strong>🎧 SOUND VOLTEX のプレイ結果を、自動で記録・管理。</strong>
</p>

<p align="center">
  コナステ版SOUND VOLTEXのプレイ結果を自動で記録・管理するWindows向けアプリです。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows%2011-0078D4?style=for-the-badge&logo=windows&logoColor=white">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img src="https://img.shields.io/badge/uv-DE5FE9?style=for-the-badge&logo=uv&logoColor=white">
  <img src="https://img.shields.io/badge/Electron-44.4.1-47848F?style=for-the-badge&logo=electron&logoColor=white">
</p>

---

## ✦ Overview

ゲームのリザルト画面を自動検出して、**曲名・難易度・スコアなどのプレイ情報を取得**します。

取得したプレイ結果はデータベースに保存され、専用UIからプレイ履歴を確認できます。

さらに、**OBS Replay Bufferを利用したリプレイ動画の保存**にも対応しています。

<br>

```text
┌──────────────────────┐
│   SOUND VOLTEX       │
│      PLAY            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Result Detection    │
│  リザルト画面を検出   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       OCR            │
│ 曲名 / 難易度 / SCORE │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Database        │
│    プレイ履歴を保存   │
└──────────┬───────────┘
           │
           ├──────────────────┐
           ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│       UI         │  │  Replay Buffer   │
│  プレイ履歴を確認 │  │  リプレイを保存   │
└──────────────────┘  └──────────────────┘
```

---

# ✦ Screenshots

## 📊 Play History

実際のプレイ履歴を専用UIから確認できます。

<p align="center">
  <img src="asset/screenshots/play_history.png" width="900">
</p>

## 🎵 Play Detail

プレイ履歴から各プレイの詳細を確認できます。

<p align="center">
  <img src="asset/screenshots/play_detail.png" width="900">
</p>

---

# ✦ Features

## 🎯 プレイ結果の自動記録

リザルト画面を検出すると、プレイ結果を自動的に取得・保存します。

* 🔍 リザルト画面を自動検出し保存
* 📝 曲名・アーティスト・難易度・レベル・スコアなどをOCRで取得
* 💾 取得したプレイ結果を自動でデータベースに保存
* 🖥️ 保存したプレイ履歴を専用UIから閲覧

---

## 🎬 リプレイ動画の保存

OBS Replay Bufferを利用して、プレイした楽曲のリプレイ動画も保存できます。

* 📹 OBS Replay Bufferを利用してリプレイ動画を自動保存
* ✂️ プレイ開始前の不要な部分を自動でトリミング
* ⌨️ リザルト画面でキー押下でリプレイ動画を保存（初期キー: `F12`）

---

## 📣 SNSへの投稿

プレイ結果や当日のプレイサマリーを、Xの投稿画面から簡単に共有できます。

* 📤 個別のプレイ結果をXの投稿画面へ共有
* 📊 当日のプレイ数・スコア更新数をまとめたTODAY'S SUMMARYを投稿
* 🎵 曲名・アーティスト・難易度・レベル・スコアなどを自動で投稿文に反映
* 📈 同一楽曲の当日中のスコア更新を集計してサマリーに反映

---

# ✦ Requirements

| Requirement      | Version |
| :--------------- | :-----: |
| 🪟 Windows       |    11   |
| 🐍 Python        |   3.12  |
| 📦 uv            |    —    |
| 🟢 Node.js / npm |    —    |
| 🎥 OBS Studio    |    —    |
| ⚙️ FFmpeg        |    —    |

---

# ✦ Setup

リポジトリを取得後、PowerShellから以下を実行します。

```powershell
.\scripts\setup.ps1
```

セットアップ後の詳細な設定は以下を参照してください。

👉 [セットアップ手順（SETUP.md）](SETUP.md)

---

# ✦ Configuration

アプリの設定は、**専用の設定画面から変更できます。**

設定ファイルを直接編集する必要はありません。

<p align="center">
  <img src="asset/screenshots/settings.png" width="900">
</p>

設定画面では、以下の項目を変更できます。

* ⌨️ プレイ結果保存に使用するキー
* 🎥 OBS Studioの実行ファイル・WebSocket・シーン設定
* 🔍 リザルト画面・楽曲開始画面の検出設定
* 📝 OCRの各種設定
* 🎯 スコア保存の最低値
* ⚙️ その他のアプリケーション設定

設定内容は `%LOCALAPPDATA%\SDVX PlayLog Tool\config.yaml` に保存されます。

> `config.yaml` はアプリが管理する設定ファイルです。通常の利用では直接編集する必要はありません。

OBS WebSocketのパスワードのみ、`.env` の `OBS_WEBSOCKET_PASSWORD` に設定します。

---

# ✦ Development

## 🐍 Backend

```powershell
uv run python main.py
```

## ⚛️ UI

```powershell
cd ui
npm run dev
```

## 📦 UI Build

```powershell
cd ui
npm run build
```

## 🪟 Windows Package

```powershell
cd ui
npm run dist
```

---

# ✦ Runtime Data

アプリの実行データは以下に保存されます。

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\
```

### Data Structure

```text
%LOCALAPPDATA%\SDVX PlayLog Tool\data\
│
├── database/    ← プレイ履歴
├── debug/       ← デバッグデータ
├── logs/        ← ログ
├── media/       ← 保存メディア
└── temp/        ← 一時ファイル
```

---

# ✦ License

Copyright © 2026 Sho Hirai.

SDVX PlayLog Tool is available for personal, non-commercial use.
You may download, install, use, and modify the software for your own
personal use.

Redistribution, sublicensing, selling, or otherwise distributing the
software or any modified version of it requires prior written permission
from the copyright holder.

Third-party software and dependencies are subject to their respective
licenses.

👉 [View License](LICENSE)

---

<p align="center">
  <sub>SDVX PlayLog Tool</sub><br>
  <sub>Automatically record. Easily manage. Keep your play history.</sub>
</p>

<div align="center">

© 2026 Sho Hirai · All Rights Reserved

</div>
