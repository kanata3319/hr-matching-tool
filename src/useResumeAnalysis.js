import { useState } from 'react';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function buildApiHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

function parseJsonResult(text) {
  let jsonStr = text.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('JSON形式が見つかりません');
  jsonStr = jsonStr.substring(start, end + 1);
  const result = JSON.parse(jsonStr);
  if (!result.総合スコア || !result.総合判定) throw new Error('必須フィールドが不足しています');
  return result;
}

export function useResumeAnalysis() {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [maskedText, setMaskedText] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const resetState = () => {
    setMaskedText(null);
    setResult(null);
    setError(null);
  };

  // Step1: PDFから個人情報をマスクしたテキストを抽出
  const extractMaskedText = async (file) => {
    setLoading(true);
    setLoadingStep('個人情報をマスク中...');
    setError(null);
    setMaskedText(null);
    setResult(null);

    try {
      const base64Data = await readFileAsBase64(file);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: buildApiHeaders(),
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
              },
              {
                type: 'text',
                text: `職務経歴書のテキストを抽出してください。その際、以下の個人情報を「[MASKED]」に置き換えてください。
- 氏名
- 住所
- 電話番号
- メールアドレス
- 生年月日

マスク済みのテキストのみを返してください。`,
              },
            ],
          }],
        }),
      });

      if (!response.ok) throw new Error('API呼び出しに失敗しました');

      const data = await response.json();
      const text = data.content.find(c => c.type === 'text')?.text || '';
      setMaskedText(text);
    } catch (err) {
      setError('マスク処理中にエラーが発生しました: ' + err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Step2: マスク済みテキストをスコアリング
  const scoreResume = async (maskedText, companyInfo) => {
    setLoading(true);
    setLoadingStep('採点中...');
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: buildApiHeaders(),
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [{
              type: 'text',
              text: `以下の職務経歴書テキストを分析し、下記のJSON形式のみで返してください。プリアンブルやマークダウンなしで、JSONのみです。

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
}`,
            }],
          }],
        }),
      });

      if (!response.ok) throw new Error('API呼び出しに失敗しました');

      const data = await response.json();
      const textContent = data.content.find(c => c.type === 'text')?.text || '';

      try {
        setResult(parseJsonResult(textContent));
      } catch {
        setError('申し訳ありません。別のPDFファイルでお試しください。');
      }
    } catch (err) {
      setError('採点中にエラーが発生しました: ' + err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return { loading, loadingStep, maskedText, result, error, extractMaskedText, scoreResume, resetState };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = () => reject(new Error('ファイル読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}
