import { useState } from 'react';
import { API_URL, MODEL, MASK_PROMPT, buildScoringPrompt } from './constants';

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
              { type: 'text', text: MASK_PROMPT },
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
            content: [{ type: 'text', text: buildScoringPrompt(maskedText, companyInfo) }],
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
