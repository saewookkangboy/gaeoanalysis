'use client';

import { AnalysisResult } from '@/lib/analyzer';
import { SEO_GUIDELINES } from '@/lib/seo-guidelines';

interface ContentGuidelinesProps {
  analysisData: AnalysisResult | null;
}

export default function ContentGuidelines({ analysisData }: ContentGuidelinesProps) {
  if (!analysisData) return null;

  const { aeoScore, geoScore, seoScore, improvementPriorities, contentGuidelines } = analysisData;

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
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">✍️ 콘텐츠 작성 시 유의사항</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contentGuidelines.map((guideline, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-md bg-sky-50 p-3 transition-all hover:bg-sky-100">
                <span className="mt-0.5 shrink-0 text-sky-600">{guideline}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 주요 가이드라인 상세 */}
      <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          📚 {primaryGuideline.title} 가이드라인
        </h3>
        <p className="mb-4 text-sm text-gray-600">{primaryGuideline.description}</p>

        <div className="space-y-4">
          {/* 핵심 포인트 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900">핵심 포인트</h4>
            <ul className="space-y-1">
              {primaryGuideline.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 text-sky-600">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 모범 사례 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900">모범 사례</h4>
            <ul className="space-y-1">
              {primaryGuideline.bestPractices.map((practice, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 text-sky-500">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 자주 하는 실수 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900">자주 하는 실수</h4>
            <ul className="space-y-1">
              {primaryGuideline.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 text-gray-600">✗</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 구현 단계 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900">구현 단계</h4>
            <ol className="space-y-2">
              {primaryGuideline.implementationSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* AIO 통합 최적화 가이드라인 */}
      <div className="rounded-lg border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          🌟 {aioGuideline.title} 가이드라인
        </h3>
        <p className="mb-4 text-sm text-gray-600">{aioGuideline.description}</p>

        <div className="space-y-4">
          {/* 핵심 포인트 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900">통합 최적화 전략</h4>
            <ul className="space-y-1">
              {aioGuideline.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 text-sky-600">★</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI 모델별 모범 사례 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900">AI 모델별 모범 사례</h4>
            <div className="space-y-2 rounded-md bg-white p-3">
              {aioGuideline.bestPractices.slice(0, 4).map((practice, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-sky-600">→</span>
                  <span>{practice}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 구현 단계 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900">통합 최적화 구현 단계</h4>
            <ol className="space-y-2">
              {aioGuideline.implementationSteps.slice(0, 5).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-gray-500">
              * 전체 단계는 {aioGuideline.implementationSteps.length}단계입니다
            </p>
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
    </div>
  );
}

