'use client';

import { ContentGuideline } from '@/lib/seo-guidelines';

interface GuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  guideline?: ContentGuideline;
  contentGuidelines?: string[];
  type: 'content' | 'seo' | 'aio';
}

export default function GuidelineModal({
  isOpen,
  onClose,
  title,
  guideline,
  contentGuidelines,
  type,
}: GuidelineModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[95vh] rounded-lg border border-gray-300 bg-white shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-300 px-4 py-3 z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              aria-label="닫기"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="overflow-y-auto flex-1 px-3 sm:px-4 py-3 sm:py-4 min-h-0">
          {type === 'content' && contentGuidelines ? (
            <div className="space-y-2">
              {contentGuidelines.map((guideline, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-md bg-sky-50 p-3 transition-all hover:bg-sky-100"
                >
                  <span className="mt-0.5 shrink-0 text-sky-600 text-sm">✓</span>
                  <span className="text-sm text-gray-700">{guideline}</span>
                </div>
              ))}
            </div>
          ) : guideline ? (
            <div className="space-y-4">
              {/* 설명 */}
              {guideline.description && (
                <p className="text-sm text-gray-600">{guideline.description}</p>
              )}

              {/* 핵심 포인트 */}
              {guideline.keyPoints && guideline.keyPoints.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {type === 'aio' ? '통합 최적화 전략' : '핵심 포인트'}
                  </h3>
                  <ul className="space-y-1.5">
                    {guideline.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 text-sky-600">
                          {type === 'aio' ? '★' : '•'}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 모범 사례 */}
              {guideline.bestPractices && guideline.bestPractices.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {type === 'aio' ? 'AI 모델별 모범 사례' : '모범 사례'}
                  </h3>
                  {type === 'aio' ? (
                    <div className="space-y-2 rounded-md bg-gray-50 p-3">
                      {guideline.bestPractices.slice(0, 10).map((practice, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-0.5 text-sky-600">→</span>
                          <span>{practice}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {guideline.bestPractices.map((practice, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 text-sky-500">✓</span>
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* 자주 하는 실수 */}
              {guideline.commonMistakes && guideline.commonMistakes.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">자주 하는 실수</h3>
                  <ul className="space-y-1.5">
                    {guideline.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 text-gray-600">✗</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 구현 단계 */}
              {guideline.implementationSteps && guideline.implementationSteps.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {type === 'aio' ? '통합 최적화 구현 단계' : '구현 단계'}
                  </h3>
                  <ol className="space-y-2">
                    {guideline.implementationSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-semibold">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {type === 'aio' && (
                    <p className="mt-2 text-xs text-gray-500">
                      * 전체 단계는 {guideline.implementationSteps.length}단계입니다
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">내용이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 px-3 sm:px-4 py-2 sm:py-3 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-black hover:bg-black hover:text-white transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

