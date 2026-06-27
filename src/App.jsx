import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader, Settings } from 'lucide-react';

export default function HRMatchingTool() {
  // 当社情報の状態
  const [companyInfo, setCompanyInfo] = useState({
    industry: '半導体製造装置の設計から組み立てを行う製造業',
    position: '設計業務を支援するツールを開発・運用する社内SE',
    otherDuties: '社内のIT化・DX化も推進'
  });

  const [editMode, setEditMode] = useState(false);
  const [tempCompanyInfo, setTempCompanyInfo] = useState(companyInfo);

  // ファイルと結果の状態
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [maskedText, setMaskedText] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const apiHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMaskedText(null);
      setResult(null);
      setError(null);
    } else {
      setError('PDFファイルを選択してください');
      setFile(null);
    }
  };

  const saveCompanyInfo = () => {
    setCompanyInfo(tempCompanyInfo);
    setEditMode(false);
  };

  const cancelEdit = () => {
    setTempCompanyInfo(companyInfo);
    setEditMode(false);
  };

  // Step1: PDFから個人情報をマスクしたテキストを抽出
  const extractMaskedText = async () => {
    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    setLoading(true);
    setLoadingStep('個人情報をマスク中...');
    setError(null);
    setMaskedText(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1];

        try {
          const maskResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
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

          if (!maskResponse.ok) {
            throw new Error('API呼び出しに失敗しました');
          }

          const maskData = await maskResponse.json();
          const text = maskData.content.find(c => c.type === 'text')?.text || '';
          setMaskedText(text);
        } catch (err) {
          setError('マスク処理中にエラーが発生しました: ' + err.message);
        }

        setLoading(false);
        setLoadingStep('');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('ファイル処理中にエラーが発生しました');
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Step2: マスク済みテキストをスコアリング
  const scoreResume = async () => {
    setLoading(true);
    setLoadingStep('採点中...');
    setError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
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

      if (!response.ok) {
        throw new Error('API呼び出しに失敗しました');
      }

      const data = await response.json();
      const textContent = data.content.find(c => c.type === 'text')?.text || '';

      try {
        let jsonStr = textContent.trim();
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');

        if (start === -1 || end === -1) {
          throw new Error('JSON形式が見つかりません');
        }

        jsonStr = jsonStr.substring(start, end + 1);
        const analysisResult = JSON.parse(jsonStr);

        if (!analysisResult.総合スコア || !analysisResult.総合判定) {
          throw new Error('必須フィールドが不足しています');
        }

        setResult(analysisResult);
      } catch (err) {
        setError('申し訳ありません。別のPDFファイルでお試しください。');
      }
    } catch (err) {
      setError('採点中にエラーが発生しました: ' + err.message);
    }

    setLoading(false);
    setLoadingStep('');
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getJudgmentColor = (judgement) => {
    if (judgement === '採用推奨') return 'bg-green-100 text-green-800';
    if (judgement === '要検討') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">職務経歴書マッチング診断</h1>
            <p className="text-gray-600">貴社の要件に基づいて候補者をマッチング診断します</p>
          </div>

          {/* 当社情報セクション */}
          <div className="bg-indigo-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5" /> 当社情報
              </h2>
              <button
                onClick={() => {
                  if (editMode) {
                    cancelEdit();
                  } else {
                    setEditMode(true);
                  }
                }}
                className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                {editMode ? 'キャンセル' : '編集'}
              </button>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">業種・企業情報</label>
                  <textarea
                    value={tempCompanyInfo.industry}
                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, industry: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">採用職種・役割</label>
                  <textarea
                    value={tempCompanyInfo.position}
                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, position: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">その他の業務・要件</label>
                  <textarea
                    value={tempCompanyInfo.otherDuties}
                    onChange={(e) => setTempCompanyInfo({ ...tempCompanyInfo, otherDuties: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                  />
                </div>

                <button
                  onClick={saveCompanyInfo}
                  className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  保存
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-800">業種・企業情報</p>
                  <p>{companyInfo.industry}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">採用職種・役割</p>
                  <p>{companyInfo.position}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">その他の業務・要件</p>
                  <p>{companyInfo.otherDuties}</p>
                </div>
              </div>
            )}
          </div>

          {/* ファイルアップロード */}
          <div className="mb-8">
            <label className="block mb-4">
              <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 cursor-pointer hover:bg-indigo-50 transition">
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-indigo-600 mb-2" />
                  <p className="font-semibold text-gray-800">職務経歴書をアップロード</p>
                  <p className="text-sm text-gray-600">PDFファイルを選択してください</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </label>

            {file && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {file.name}が選択されました
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* Step1: マスク処理ボタン */}
          <button
            onClick={extractMaskedText}
            disabled={!file || loading || editMode}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2 mb-6"
          >
            {loading && loadingStep === '個人情報をマスク中...' ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                個人情報をマスク中...
              </>
            ) : (
              'STEP 1: 個人情報をマスクして内容を確認'
            )}
          </button>

          {/* マスク済みテキストの表示 */}
          {maskedText && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-gray-800">送信内容の確認（マスク済み）</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">個人情報は [MASKED] に置換済み</span>
              </div>
              <textarea
                readOnly
                value={maskedText}
                className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 font-mono resize-none focus:outline-none"
                rows="12"
              />

              {/* Step2: 採点ボタン */}
              <button
                onClick={scoreResume}
                disabled={loading || editMode}
                className="w-full mt-4 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading && loadingStep === '採点中...' ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    採点中...
                  </>
                ) : (
                  'STEP 2: この内容で採点する'
                )}
              </button>
            </div>
          )}

          {/* 結果表示 */}
          {result && (
            <div className="mt-8 border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">診断結果</h2>

              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg p-6 text-white mb-8">
                <p className="text-sm font-semibold opacity-90 mb-2">総合マッチ度</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{result.総合スコア}</span>
                  <span className="text-lg">/100点</span>
                </div>
              </div>

              <div className={`rounded-lg p-4 mb-8 font-semibold text-center ${getJudgmentColor(result.総合判定)}`}>
                {result.総合判定}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { key: 'ソフトウェア開発', label: 'ソフトウェア開発', max: 30 },
                  { key: '業界経験', label: '業界・製造業経験', max: 20 },
                  { key: 'IT_DX推進スキル', label: 'IT/DX推進スキル', max: 25 },
                  { key: 'ビジネススキル', label: 'ビジネススキル', max: 25 },
                ].map(item => (
                  <div key={item.key} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-800 mb-2">{item.label}</p>
                    <p className={`text-3xl font-bold mb-2 ${getScoreColor(result[item.key].スコア)}`}>
                      {result[item.key].スコア}/{item.max}点
                    </p>
                    <p className="text-sm text-gray-600">{result[item.key].評価}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="font-semibold text-gray-800 mb-2">💡 推奨ポイント</p>
                <p className="text-gray-700">{result.推奨ポイント}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
