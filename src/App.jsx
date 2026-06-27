import React, { useState } from 'react';
import { useResumeAnalysis } from './useResumeAnalysis';
import CompanyInfoSection from './components/CompanyInfoSection';
import FileUpload from './components/FileUpload';
import MaskedTextPreview from './components/MaskedTextPreview';
import ScoreResult from './components/ScoreResult';

export default function HRMatchingTool() {
  const [companyInfo, setCompanyInfo] = useState({
    industry: '半導体製造装置の設計から組み立てを行う製造業',
    position: '設計業務を支援するツールを開発・運用する社内SE',
    otherDuties: '社内のIT化・DX化も推進'
  });
  const [file, setFile] = useState(null);

  const { loading, loadingStep, maskedText, result, error, extractMaskedText, scoreResume, resetState } = useResumeAnalysis();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      resetState();
    } else {
      setFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">職務経歴書マッチング診断</h1>
            <p className="text-gray-600">貴社の要件に基づいて候補者をマッチング診断します</p>
          </div>

          <CompanyInfoSection
            companyInfo={companyInfo}
            onSave={setCompanyInfo}
          />

          <FileUpload
            file={file}
            error={error}
            loading={loading && loadingStep === '個人情報をマスク中...'}
            disabled={!file || loading}
            onFileChange={handleFileChange}
            onExtract={() => extractMaskedText(file)}
          />

          <MaskedTextPreview
            maskedText={maskedText}
            loading={loading && loadingStep === '採点中...'}
            disabled={loading}
            onScore={() => scoreResume(maskedText, companyInfo)}
          />

          <ScoreResult result={result} />
        </div>
      </div>
    </div>
  );
}
