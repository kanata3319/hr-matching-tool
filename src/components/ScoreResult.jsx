import React from 'react';

const SCORE_AXES = [
  { key: 'ソフトウェア開発', label: 'ソフトウェア開発', max: 30 },
  { key: '業界経験', label: '業界・製造業経験', max: 20 },
  { key: 'IT_DX推進スキル', label: 'IT/DX推進スキル', max: 25 },
  { key: 'ビジネススキル', label: 'ビジネススキル', max: 25 },
];

function getScoreColor(score) {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getJudgmentColor(judgement) {
  if (judgement === '採用推奨') return 'bg-green-100 text-green-800';
  if (judgement === '要検討') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export default function ScoreResult({ result }) {
  if (!result) return null;

  return (
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
        {SCORE_AXES.map(({ key, label, max }) => (
          <div key={key} className="bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-800 mb-2">{label}</p>
            <p className={`text-3xl font-bold mb-2 ${getScoreColor(result[key].スコア)}`}>
              {result[key].スコア}/{max}点
            </p>
            <p className="text-sm text-gray-600">{result[key].評価}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
        <p className="font-semibold text-gray-800 mb-2">💡 推奨ポイント</p>
        <p className="text-gray-700">{result.推奨ポイント}</p>
      </div>
    </div>
  );
}
