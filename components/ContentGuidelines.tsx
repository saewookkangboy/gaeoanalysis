'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/lib/analyzer';
import { SEO_GUIDELINES } from '@/lib/seo-guidelines';
import GuidelineModal from './GuidelineModal';

interface ContentGuidelinesProps {
  analysisData: AnalysisResult | null;
}

export default function ContentGuidelines({ analysisData }: ContentGuidelinesProps) {
  if (!analysisData) return null;

  const { aeoScore, geoScore, seoScore, improvementPriorities, contentGuidelines } = analysisData;
  const [openModal, setOpenModal] = useState<'content' | 'seo' | 'aio' | null>(null);

  // 가장 낮은 점수 카테고리 찾기
  const getLowestScoreCategory = () => {
    const scores = [
      { name: 'SEO', score: seoScore },
      { name: 'AEO', score: aeoScore },
      { name: 'GEO', score: geoScore },
    ];
    return scores.sort((a, b) => a.score - b.score)[0];
  };

  const lowestCategory = getLowestScoreCategory();
  const guidelineKey = lowestCategory.name.toLowerCase() === 'seo' ? 'ai_seo' : lowestCategory.name.toLowerCase();

  const primaryGuideline = SEO_GUIDELINES[guidelineKey] || SEO_GUIDELINES.ai_seo;
  const aioGuideline = SEO_GUIDELINES.aio;

  return (
    <div className="space-y-6">
      {/* 개선 우선순위 - 실행 가능한 팁 */}
      {improvementPriorities && improvementPriorities.length > 0 && (
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">🎯 개선 우선순위 - 실행 가능한 팁</h3>
          <div className="space-y-4">
            {improvementPriorities.map((priority, idx) => (
              <div
                key={idx}
                className={`rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                  priority.priority === 1
                    ? 'border-sky-200 bg-sky-50'
                    : priority.priority === 2
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* 카테고리 헤더 */}
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                      priority.priority === 1
                        ? 'bg-sky-500 text-white'
                        : priority.priority === 2
                        ? 'bg-gray-400 text-white'
                        : 'bg-gray-300 text-white'
                    }`}
                  >
                    {priority.priority}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-gray-900">{priority.category}</div>
                    <div className="text-sm text-gray-600">{priority.reason}</div>
                  </div>
                </div>

                {/* 실행 가능한 팁 */}
                {priority.actionableTips && priority.actionableTips.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {priority.actionableTips.map((tip, tipIdx) => (
                      <div
                        key={tipIdx}
                        className="rounded-md bg-white p-4 border border-gray-300"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-lg">💡</span>
                          <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs font-medium text-sky-600 mb-2">
                            📈 예상 효과: {tip.expectedImpact}
                          </p>
                          <ol className="space-y-2">
                            {tip.steps.map((step, stepIdx) => (
                              <li key={stepIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-semibold">
                                  {stepIdx + 1}
                                </span>
                                <span className="flex-1">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 콘텐츠 작성 유의사항 */}
      {contentGuidelines && contentGuidelines.length > 0 && (
        <div 
          className="rounded-lg border border-gray-300 bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md cursor-pointer animate-fade-in"
          onClick={() => setOpenModal('content')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">✍️ 콘텐츠 작성 시 유의사항</h3>
            <span className="text-xs sm:text-sm text-sky-600 font-medium">클릭하여 자세히 보기 →</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contentGuidelines.slice(0, 4).map((guideline, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-md bg-sky-50 p-2 sm:p-3">
                <span className="mt-0.5 shrink-0 text-sky-600 text-xs sm:text-sm">✓</span>
                <span className="text-xs sm:text-sm text-gray-700 line-clamp-2">{guideline}</span>
              </div>
            ))}
            {contentGuidelines.length > 4 && (
              <div className="flex items-center justify-center rounded-md bg-gray-50 p-2 sm:p-3">
                <span className="text-xs sm:text-sm text-gray-600">
                  +{contentGuidelines.length - 4}개 더 보기
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 주요 가이드라인 상세 */}
      <div 
        className="rounded-lg border border-gray-300 bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md cursor-pointer animate-fade-in"
        onClick={() => setOpenModal('seo')}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            📚 {primaryGuideline.title} 가이드라인
          </h3>
          <span className="text-xs sm:text-sm text-sky-600 font-medium">클릭하여 자세히 보기 →</span>
        </div>
        <p className="mb-3 text-xs sm:text-sm text-gray-600 line-clamp-2">{primaryGuideline.description}</p>
        
        {/* 미리보기 */}
        <div className="space-y-2">
          <div>
            <h4 className="mb-1 text-xs sm:text-sm font-semibold text-gray-900">핵심 포인트</h4>
            <ul className="space-y-1">
              {primaryGuideline.keyPoints.slice(0, 3).map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                  <span className="mt-1 text-sky-600">•</span>
                  <span className="line-clamp-1">{point}</span>
                </li>
              ))}
              {primaryGuideline.keyPoints.length > 3 && (
                <li className="text-xs text-gray-500">+{primaryGuideline.keyPoints.length - 3}개 더...</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* AIO 통합 최적화 가이드라인 */}
      <div 
        className="rounded-lg border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-md cursor-pointer animate-fade-in"
        onClick={() => setOpenModal('aio')}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            🌟 {aioGuideline.title} 가이드라인
          </h3>
          <span className="text-xs sm:text-sm text-sky-600 font-medium">클릭하여 자세히 보기 →</span>
        </div>
        <p className="mb-3 text-xs sm:text-sm text-gray-600 line-clamp-2">{aioGuideline.description}</p>

        {/* 미리보기 */}
        <div className="space-y-2">
          <div>
            <h4 className="mb-1 text-xs sm:text-sm font-semibold text-gray-900">통합 최적화 전략</h4>
            <ul className="space-y-1">
              {aioGuideline.keyPoints.slice(0, 3).map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                  <span className="mt-1 text-sky-600">★</span>
                  <span className="line-clamp-1">{point}</span>
                </li>
              ))}
              {aioGuideline.keyPoints.length > 3 && (
                <li className="text-xs text-gray-500">+{aioGuideline.keyPoints.length - 3}개 더...</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 참고 자료 */}
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <p className="text-xs text-gray-600">
          📖 참고 자료:{' '}
          <a
            href="https://github.com/saewookkangboy/ai-seo-blogger"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:underline"
          >
            AI SEO Blogger GitHub 저장소
          </a>
        </p>
      </div>

      {/* 가이드라인 모달들 */}
      <GuidelineModal
        isOpen={openModal === 'content'}
        onClose={() => setOpenModal(null)}
        title="✍️ 콘텐츠 작성 시 유의사항"
        contentGuidelines={contentGuidelines}
        type="content"
      />
      <GuidelineModal
        isOpen={openModal === 'seo'}
        onClose={() => setOpenModal(null)}
        title={`📚 ${primaryGuideline.title} 가이드라인`}
        guideline={primaryGuideline}
        type="seo"
      />
      <GuidelineModal
        isOpen={openModal === 'aio'}
        onClose={() => setOpenModal(null)}
        title={`🌟 ${aioGuideline.title} 가이드라인`}
        guideline={aioGuideline}
        type="aio"
      />
    </div>
  );
}

