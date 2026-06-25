# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # 依存パッケージのインストール
npm run dev        # 開発サーバー起動 → http://localhost:5173
npm run build      # プロダクションビルド（dist/）
npm run preview    # ビルド成果物のプレビューサーバー起動
```

テスト・リントのスクリプトは未設定。

## 環境変数

`.env.example` をコピーして `.env` を作成し、`VITE_ANTHROPIC_API_KEY` に Anthropic API キーをセット。

## アーキテクチャ

シングルページの React アプリ（`src/App.jsx` に全ロジック集約）。バックエンドなし。

**データフロー:**
1. ユーザーが PDF をアップロード → `FileReader` で base64 変換
2. `fetch` でブラウザから直接 Anthropic API（`/v1/messages`）を呼び出す
   - `anthropic-dangerous-direct-browser-access: true` ヘッダーが必須
   - モデル: `claude-sonnet-4-6`
   - コンテンツタイプ `document`（base64 PDF）でファイルを送信
3. レスポンスの JSON を parse して結果を表示

**状態管理（useState のみ）:**
- `companyInfo` — 当社情報（業種・採用職・その他）。UI から編集可能。
- `file` — アップロードされた PDF File オブジェクト
- `result` — API レスポンスを parse した診断結果オブジェクト
- `editMode` / `tempCompanyInfo` — 当社情報の編集フォーム用一時状態

**スコアリング仕様（プロンプト定義）:**

| 評価軸 | 配点 |
|---|---|
| ソフトウェア開発・ツール開発 | 0–30点 |
| 業界・製造業経験 | 0–20点 |
| IT/DX推進スキル | 0–25点 |
| ビジネススキル | 0–25点 |

総合判定: `採用推奨` / `要検討` / `不適合`

**スタイリング:** Tailwind CSS のユーティリティクラス直書き。コンポーネント分割なし。
