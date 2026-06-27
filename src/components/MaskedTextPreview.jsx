import React from 'react';
import { Loader } from 'lucide-react';

export default function MaskedTextPreview({ maskedText, loading, disabled, onScore }) {
  if (!maskedText) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-gray-800">送信内容の確認（マスク済み）</h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          個人情報は [MASKED] に置換済み
        </span>
      </div>
      <textarea
        readOnly
        value={maskedText}
        className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-700 font-mono resize-none focus:outline-none"
        rows="12"
      />
      <button
        onClick={onScore}
        disabled={disabled}
        className="w-full mt-4 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader className="w-5 h-5 animate-spin" />採点中...</>
        ) : (
          'STEP 2: この内容で採点する'
        )}
      </button>
    </div>
  );
}
