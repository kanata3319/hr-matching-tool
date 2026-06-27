import React, { useState } from 'react';
import { Settings } from 'lucide-react';

export default function CompanyInfoSection({ companyInfo, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [temp, setTemp] = useState(companyInfo);

  const handleSave = () => {
    onSave(temp);
    setEditMode(false);
  };

  const handleCancel = () => {
    setTemp(companyInfo);
    setEditMode(false);
  };

  return (
    <div className="bg-indigo-50 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5" /> 当社情報
        </h2>
        <button
          onClick={() => editMode ? handleCancel() : setEditMode(true)}
          className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          {editMode ? 'キャンセル' : '編集'}
        </button>
      </div>

      {editMode ? (
        <div className="space-y-4">
          {[
            { key: 'industry', label: '業種・企業情報' },
            { key: 'position', label: '採用職種・役割' },
            { key: 'otherDuties', label: 'その他の業務・要件' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
              <textarea
                value={temp[key]}
                onChange={(e) => setTemp({ ...temp, [key]: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
              />
            </div>
          ))}
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            保存
          </button>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-gray-700">
          {[
            { key: 'industry', label: '業種・企業情報' },
            { key: 'position', label: '採用職種・役割' },
            { key: 'otherDuties', label: 'その他の業務・要件' },
          ].map(({ key, label }) => (
            <div key={key}>
              <p className="font-semibold text-gray-800">{label}</p>
              <p>{companyInfo[key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
