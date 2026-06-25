# 職務経歴書マッチング診断ツール

PDFの職務経歴書をアップロードするだけで、貴社の要件に対する候補者のマッチ度をAIが自動診断するWebアプリです。

## 機能

- PDFの職務経歴書をアップロードしてワンクリック分析
- ソフトウェア開発・業界経験・IT/DX推進・ビジネススキルの4軸で採点（合計100点）
- 「採用推奨 / 要検討 / 不適合」の総合判定
- 診断対象の業種・職種をUIから自由に編集可能

## セットアップ

### 必要なもの

- Node.js 18 以上
- Anthropic API キー（[console.anthropic.com](https://console.anthropic.com) で取得）

### 手順

```bash
# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env
# .env を開き、VITE_ANTHROPIC_API_KEY に取得したAPIキーを設定

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 技術スタック

- React 18
- Vite
- Tailwind CSS
- Anthropic Claude API（claude-sonnet-4-6）
