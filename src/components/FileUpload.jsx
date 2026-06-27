import React from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function FileUpload({ file, error, loading, disabled, onFileChange, onExtract }) {
  return (
    <div className="mb-8">
      <label className="block mb-4">
        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 cursor-pointer hover:bg-indigo-50 transition">
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-indigo-600 mb-2" />
            <p className="font-semibold text-gray-800">職務経歴書をアップロード</p>
            <p className="text-sm text-gray-600">PDFファイルを選択してください</p>
          </div>
          <input type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
        </div>
      </label>

      {file && (
        <p className="text-sm text-green-600 flex items-center gap-2 mb-4">
          <CheckCircle className="w-4 h-4" />
          {file.name}が選択されました
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      <button
        onClick={onExtract}
        disabled={disabled}
        className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader className="w-5 h-5 animate-spin" />個人情報をマスク中...</>
        ) : (
          'STEP 1: 個人情報をマスクして内容を確認'
        )}
      </button>
    </div>
  );
}
