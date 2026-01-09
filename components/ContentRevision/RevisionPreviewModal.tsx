'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const [copySuccess, setCopySuccess] = useState(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[95vh] rounded-xl border-2 border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-sky-50 to-indigo-50 border-b-2 border-gray-200 px-6 py-5 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">✍️</span>
                콘텐츠 수정안 미리 보기
              </h2>
              <p className="mt-1.5 text-sm text-gray-600">개선된 콘텐츠를 완성형으로 확인하세요</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-white rounded-full p-2 transition-all"
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

              {/* 미리보기 콘텐츠 - 완성형 */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>📄</span>
                    수정된 콘텐츠 (완성형)
                  </h3>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(preview.revisedMarkdown);
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      } catch (err) {
                        console.error('복사 실패:', err);
                      }
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    {copySuccess ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        복사됨!
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        복사
                      </>
                    )}
                  </button>
                </div>
                <div className="rounded-lg border-2 border-gray-200 bg-white p-6 max-h-[60vh] overflow-y-auto shadow-inner" data-allow-copy="true">
                  <div className="markdown-content" data-allow-copy="true">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-gray-900 mt-5 mb-3 pb-2 border-b border-gray-200" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2" {...props} />,
                        h4: ({node, ...props}) => <h4 className="text-lg font-semibold text-gray-900 mt-3 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
                        a: ({node, ...props}) => <a className="text-sky-600 hover:text-sky-700 underline font-medium" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700" {...props} />,
                        li: ({node, ...props}) => <li className="ml-4" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-sky-500 pl-4 italic text-gray-600 my-4" {...props} />,
                        code: ({node, inline, ...props}: any) => 
                          inline ? (
                            <code className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                          ) : (
                            <code className="block bg-gray-50 text-gray-800 p-4 rounded-lg overflow-x-auto text-sm font-mono" {...props} />
                          ),
                        pre: ({node, ...props}) => <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                        hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                        table: ({node, ...props}) => <table className="w-full border-collapse border border-gray-300 mb-4" {...props} />,
                        th: ({node, ...props}) => <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold text-gray-900" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />,
                      }}
                    >
                      {preview.revisedMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 px-6 py-4 flex justify-end gap-3 shadow-lg">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            닫기
          </button>
          {preview && (
            <button
              onClick={onConfirm}
              className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-sky-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              수정 진행하기 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

