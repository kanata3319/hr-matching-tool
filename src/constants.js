export const API_URL = 'https://api.anthropic.com/v1/messages';
export const MODEL = 'claude-sonnet-4-6';

export const SCORE_AXES = [
  { key: 'ソフトウェア開発', label: 'ソフトウェア開発', max: 30 },
  { key: '業界経験', label: '業界・製造業経験', max: 20 },
  { key: 'IT_DX推進スキル', label: 'IT/DX推進スキル', max: 25 },
  { key: 'ビジネススキル', label: 'ビジネススキル', max: 25 },
];

export const JUDGMENT_COLORS = {
  '採用推奨': 'bg-green-100 text-green-800',
  '要検討': 'bg-yellow-100 text-yellow-800',
  '不適合': 'bg-red-100 text-red-800',
};

export function getScoreColor(score) {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export const MASK_PROMPT = `職務経歴書のテキストを抽出してください。その際、以下の個人情報を「[MASKED]」に置き換えてください。
- 氏名
- 住所
- 電話番号
- メールアドレス
- 生年月日

マスク済みのテキストのみを返してください。`;

export function buildScoringPrompt(maskedText, companyInfo) {
  return `以下の職務経歴書テキストを分析し、下記のJSON形式のみで返してください。プリアンブルやマークダウンなしで、JSONのみです。

職務経歴書テキスト:
${maskedText}

当社の情報:
- 業種: ${companyInfo.industry}
- 採用職: ${companyInfo.position}
- その他の業務: ${companyInfo.otherDuties}

評価項目（各項目の配点）:
1. ソフトウェア開発・ツール開発（0-30点）: ソフトウェア開発経験、アプリケーション設計・実装、ツール開発経験
2. 当社業界・製造業経験（0-20点）: 関連業界での経験、製造の理解
3. IT/DX推進スキル（0-25点）: システム導入、業務プロセス改善、DX推進経験
4. ビジネススキル（0-25点）: コミュニケーション、要件ヒアリング、プロジェクト推進

返却形式（これ以外は返さないでください）:
{
  "総合スコア": 0-100の数値,
  "ソフトウェア開発": {"スコア": 0-30の数値, "評価": "日本語のコメント"},
  "業界経験": {"スコア": 0-20の数値, "評価": "日本語のコメント"},
  "IT_DX推進スキル": {"スコア": 0-25の数値, "評価": "日本語のコメント"},
  "ビジネススキル": {"スコア": 0-25の数値, "評価": "日本語のコメント"},
  "総合判定": "採用推奨か要検討か不適合",
  "推奨ポイント": "日本語のコメント"
}`;
}
