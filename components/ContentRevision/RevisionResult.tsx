'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/lib/analyzer';
import { useToast } from '@/components/Toast';

interface RevisionResultProps {
  isOpen: boolean;
  onClose: () => void;
  originalAnalysis: AnalysisResult;
  revisedContent: string;
  revisedMarkdown: string;
  predictedScores?: {
    seo: number;
    aeo: number;
    geo: number;
    overall: number;
  };
  improvements: string[];
}

export default function RevisionResult({
  isOpen,
  onClose,
  originalAnalysis,
  revisedContent,
  revisedMarkdown,
  predictedScores,
  improvements,
}: RevisionResultProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(revisedMarkdown);
      setCopied(true);
      showToast('마크다운 형식으로 복사되었습니다.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      showToast('복사에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  if (!isOpen) return null;

  const scoreDiff = {
    seo: predictedScores ? predictedScores.seo - originalAnalysis.seoScore : 0,
    aeo: predictedScores ? predictedScores.aeo - originalAnalysis.aeoScore : 0,
    geo: predictedScores ? predictedScores.geo - originalAnalysis.geoScore : 0,
    overall: predictedScores ? predictedScores.overall - originalAnalysis.overallScore : 0,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[95vh] rounded-lg border border-gray-300 bg-white shadow-xl overflow-hidden flex flex-col my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">콘텐츠 수정 완료</h2>
              <p className="mt-1 text-sm text-gray-600">수정된 콘텐츠와 점수 변화를 확인하세요</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="닫기"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 점수 변화 */}
          {predictedScores && (
            <div className="mb-6 rounded-lg border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 p-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">점수 변화</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">SEO</div>
                  <div className="mb-2 text-3xl font-bold text-sky-600">
                    {predictedScores.seo}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">이전: </span>
                    <span className="font-medium">{originalAnalysis.seoScore}</span>
                    <span className={`ml-2 font-semibold ${scoreDiff.seo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scoreDiff.seo >= 0 ? '+' : ''}{scoreDiff.seo}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">AEO</div>
                  <div className="mb-2 text-3xl font-bold text-sky-600">
                    {predictedScores.aeo}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">이전: </span>
                    <span className="font-medium">{originalAnalysis.aeoScore}</span>
                    <span className={`ml-2 font-semibold ${scoreDiff.aeo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scoreDiff.aeo >= 0 ? '+' : ''}{scoreDiff.aeo}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">GEO</div>
                  <div className="mb-2 text-3xl font-bold text-sky-600">
                    {predictedScores.geo}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">이전: </span>
                    <span className="font-medium">{originalAnalysis.geoScore}</span>
                    <span className={`ml-2 font-semibold ${scoreDiff.geo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scoreDiff.geo >= 0 ? '+' : ''}{scoreDiff.geo}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-600 mb-1">종합</div>
                  <div className="mb-2 text-3xl font-bold text-sky-600">
                    {predictedScores.overall}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">이전: </span>
                    <span className="font-medium">{originalAnalysis.overallScore}</span>
                    <span className={`ml-2 font-semibold ${scoreDiff.overall >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scoreDiff.overall >= 0 ? '+' : ''}{scoreDiff.overall}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 개선 사항 */}
          {improvements && improvements.length > 0 && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">주요 개선 사항</h3>
              <ul className="space-y-2">
                {improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 수정된 콘텐츠 */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="font-semibold text-gray-900">수정된 콘텐츠 (마크다운)</h3>
              <button
                onClick={handleCopy}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                }`}
              >
                {copied ? '✓ 복사됨' : '📋 복사'}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                {revisedMarkdown}
              </pre>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

