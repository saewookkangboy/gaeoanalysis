'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/lib/analyzer';

interface RevisionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analysisData: AnalysisResult | null;
  url: string;
}

export default function RevisionPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  analysisData,
  url,
}: RevisionPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<{
    revisedMarkdown: string;
    predictedScores?: {
      seo: number;
      aeo: number;
      geo: number;
      overall: number;
    };
    improvements: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    if (!analysisData || !url) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          analysisResult: analysisData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '미리보기 생성 실패');
      }

      const data = await response.json();
      setPreview(data.preview);
    } catch (err: any) {
      console.error('미리보기 생성 오류:', err);
      setError(err.message || '미리보기를 생성할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-lg border border-gray-300 bg-white shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">콘텐츠 수정안 미리 보기</h2>
              <p className="mt-1 text-sm text-gray-600">개선된 콘텐츠를 미리 확인하세요</p>
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
          {!preview && !isLoading && !error && (
            <div className="text-center py-8">
              <div className="mb-4 text-4xl">👀</div>
              <p className="text-gray-600 mb-6">
                미리보기를 생성하면 개선된 콘텐츠와 예상 점수를 확인할 수 있습니다.
              </p>
              <button
                onClick={handleGeneratePreview}
                className="rounded-lg bg-sky-600 px-6 py-3 text-white font-semibold hover:bg-sky-700 transition-colors"
              >
                미리보기 생성
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-sky-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">미리보기를 생성하는 중...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-800">{error}</p>
              <button
                onClick={handleGeneratePreview}
                className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {preview && (
            <div className="space-y-6">
              {/* 예상 점수 */}
              {preview.predictedScores && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold text-gray-900">예상 점수 변화</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <div className="text-xs text-gray-600">SEO</div>
                      <div className="text-2xl font-bold text-sky-600">
                        {preview.predictedScores.seo}
                        {analysisData && (
                          <span className="ml-1 text-sm text-gray-500">
                            ({preview.predictedScores.seo > analysisData.seoScore ? '+' : ''}
                            {preview.predictedScores.seo - analysisData.seoScore})
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">AEO</div>
                      <div className="text-2xl font-bold text-sky-600">
                        {preview.predictedScores.aeo}
                        {analysisData && (
                          <span className="ml-1 text-sm text-gray-500">
                            ({preview.predictedScores.aeo > analysisData.aeoScore ? '+' : ''}
                            {preview.predictedScores.aeo - analysisData.aeoScore})
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">GEO</div>
                      <div className="text-2xl font-bold text-sky-600">
                        {preview.predictedScores.geo}
                        {analysisData && (
                          <span className="ml-1 text-sm text-gray-500">
                            ({preview.predictedScores.geo > analysisData.geoScore ? '+' : ''}
                            {preview.predictedScores.geo - analysisData.geoScore})
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">종합</div>
                      <div className="text-2xl font-bold text-sky-600">
                        {preview.predictedScores.overall}
                        {analysisData && (
                          <span className="ml-1 text-sm text-gray-500">
                            ({preview.predictedScores.overall > analysisData.overallScore ? '+' : ''}
                            {preview.predictedScores.overall - analysisData.overallScore})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 개선 사항 */}
              {preview.improvements && preview.improvements.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">주요 개선 사항</h3>
                  <ul className="space-y-1">
                    {preview.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 미리보기 콘텐츠 */}
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">수정된 콘텐츠 미리보기</h3>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {preview.revisedMarkdown}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
          {preview && (
            <button
              onClick={onConfirm}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
            >
              수정 진행하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

