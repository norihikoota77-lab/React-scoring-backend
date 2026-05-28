# 🐎 競馬演出スコアラー

## 🎯 このプロジェクトについて

このアプリは、**React + Django + SQLite** のフルスタック構成を学習するために作成したポートフォリオです。

| 目的           | 内容                                            |
| -------------- | ----------------------------------------------- |
| フロントエンド | React / Vite / Tailwind CSS によるSPA構成の理解 |
| バックエンド   | Django による REST API 設計・実装の理解         |
| DB             | SQLite / Django ORM によるデータ永続化の理解    |
| 連携           | フロントエンドとバックエンドの API 通信の理解   |

今後は本プロジェクトで得た知識を活かし、**CSV を使った業務の日次・月次処理ツール**や**集計レポートの自動化**など、実務で活用できるアプリケーション開発に発展させていく予定です。

---

## 🌐 デプロイ先

| 役割           | サービス | URL                                        |
| -------------- | -------- | ------------------------------------------ |
| フロントエンド | Vercel   | https://react-scoring-frontend.vercel.app  |
| バックエンド   | Render   | https://react-scoring-backend.onrender.com |

> Renderの無料プランはスリープがあるため、初回アクセス時に1〜2分かかる場合があります。

---

## 📋 機能概要

Excel 解答ファイルをアップロードするだけで自動採点する Web アプリです。
採点結果をランク・正答率・動画演出で表示し、履歴管理・CSV エクスポートにも対応しています。

---

## 🖥️ 技術スタック

| レイヤー         | 技術                               |
| ---------------- | ---------------------------------- |
| フロントエンド   | React 19 / Vite 8 / Tailwind CSS 4 |
| アニメーション   | Framer Motion 12                   |
| グラフ           | Recharts 3                         |
| バックエンド     | Django 6                           |
| DB               | SQLite3                            |
| Excel 処理       | pandas 3 / openpyxl 3              |
| 静的ファイル配信 | WhiteNoise 6                       |
| フロントデプロイ | Vercel                             |
| バックデプロイ   | Render                             |

---

## 📁 リポジトリ構成

フロントエンドとバックエンドはリポジトリを分けて管理しています。

| リポジトリ     | URL                                                         |
| -------------- | ----------------------------------------------------------- |
| フロントエンド | https://github.com/norihikoota77-lab/React-scoring-frontend |
| バックエンド   | https://github.com/norihikoota77-lab/React-scoring-backend  |

### バックエンド構成

```
React-scoring-backend/
├── manage.py
├── requirements.txt
├── db.sqlite3
├── data/                   # サンプルファイル
│   ├── answer_key.xlsx     # 正解マスタサンプル
│   └── sample.xlsx         # ユーザー解答サンプル
├── keiba_app/              # Django アプリ
│   ├── models.py
│   ├── views.py
│   ├── scoring_engine.py
│   ├── urls.py
│   ├── admin.py
│   └── static/
│       └── videos/         # 演出動画（excellent / good / try_again）
└── staticfiles/            # collectstatic 出力先
```

### フロントエンド構成

```
React-scoring-frontend/
├── src/
│   ├── App.jsx
│   └── components/
├── package.json
└── vite.config.js
```

---

## ⚙️ ローカル環境構築

### 必要環境

- Python 3.14.5
- Node.js v24.15.0
- npm 11.12.1

### バックエンド

```bash
# 仮想環境の作成・有効化
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

# パッケージインストール
pip install -r requirements.txt

# DB マイグレーション
python manage.py migrate

# スーパーユーザー作成
python manage.py createsuperuser

# 開発サーバー起動
python manage.py runserver
```

### フロントエンド

```bash
# パッケージインストール
npm install

# 開発サーバー起動
npm run dev
```

---

## 🚀 使い方

### Excel ファイルの準備

採点には以下の2つの Excel ファイルが必要です。
サンプルファイルは `data/` フォルダに入っています。

| ファイル          | 説明                                 |
| ----------------- | ------------------------------------ |
| `answer_key.xlsx` | 正解マスタ（試験名・正解を記入）     |
| `sample.xlsx`     | ユーザー解答（受験者名・解答を記入） |

#### Excel ファイルの仕様

| セル   | 内容                                      |
| ------ | ----------------------------------------- |
| A13    | 試験名（正解マスタ・ユーザー解答共通）    |
| A14    | 受験者名（ユーザー解答ファイルのみ）      |
| 解答欄 | 問題番号・解答を4列ペアで記入（最大40問） |

> 正解マスタとユーザー解答の試験名（A13）が異なる場合はエラーになります。

### 採点手順

1. ブラウザで `https://react-scoring-frontend.vercel.app` を開く
2. **正解マスタ**（`answer_key.xlsx`）をアップロード
3. **ユーザー解答**（`sample.xlsx`）をアップロード
4. **採点ボタン**を押す
5. 採点結果・動画演出・正答率推移が表示される

### 履歴管理

- **ユーザーフィルター** — 受験者名で絞り込み
- **試験名フィルター** — 試験名で絞り込み
- **CSVダウンロード** — 採点履歴を CSV でエクスポート
- **削除ボタン** — 不要な履歴を削除

---

## 📊 主な機能

- **自動採点** — Excel ファイルを比較して正誤判定
- **試験整合性チェック** — 異なる試験の組み合わせをアラートで検出
- **ランク判定** — S / A / B / C の4段階
- **動画演出** — スコアに応じた動画をランダム再生
- **採点詳細** — 問題ごとの〇✖を2列レイアウトで表示
- **正答率推移グラフ** — 受験者ごとの推移を折れ線グラフで表示
- **履歴管理** — ユーザー・試験名でフィルタリング可能
- **CSV エクスポート** — 採点履歴を CSV でダウンロード

---

## 🔌 API エンドポイント

| メソッド | URL                          | 説明             |
| -------- | ---------------------------- | ---------------- |
| POST     | `/api/score/`                | Excel採点実行    |
| GET      | `/api/history/`              | 履歴一覧取得     |
| DELETE   | `/api/history/delete/<id>/`  | 履歴削除         |
| GET      | `/api/history/export/`       | CSV エクスポート |
| GET      | `/api/exams/`                | 試験一覧取得     |
| GET      | `/api/exams/<id>/questions/` | 問題一覧取得     |
| POST     | `/api/exams/<id>/submit/`    | Web採点実行      |

---

## 🐎 ランク基準

| ランク | 正答率   |
| ------ | -------- |
| S      | 100%     |
| A      | 70% 以上 |
| B      | 50% 以上 |
| C      | 50% 未満 |

---

## 🗺️ 今後の開発予定

- [ ] Web入力による自己採点機能（Excel廃止）
- [ ] CSV日次・月次処理ツールの追加
- [ ] 集計レポートの自動生成
- [ ] ユーザー認証・権限管理
