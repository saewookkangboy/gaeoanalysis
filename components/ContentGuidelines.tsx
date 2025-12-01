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
      {/* 개선 우선순위 */}
      {improvementPriorities && improvementPriorities.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">🎯 개선 우선순위</h3>
          <div className="space-y-3">
            {improvementPriorities.map((priority, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-md border p-3 transition-all hover:scale-[1.02] ${
                  priority.priority === 1
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : priority.priority === 2
                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${
                    priority.priority === 1
                      ? 'bg-red-500 text-white'
                      : priority.priority === 2
                      ? 'bg-yellow-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {priority.priority}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{priority.category}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{priority.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 콘텐츠 작성 유의사항 */}
      {contentGuidelines && contentGuidelines.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">✍️ 콘텐츠 작성 시 유의사항</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contentGuidelines.map((guideline, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30">
                <span className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400">{guideline}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 주요 가이드라인 상세 */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          📚 {primaryGuideline.title} 가이드라인
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{primaryGuideline.description}</p>

        <div className="space-y-4">
          {/* 핵심 포인트 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">핵심 포인트</h4>
            <ul className="space-y-1">
              {primaryGuideline.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-1 text-blue-600 dark:text-blue-400">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 모범 사례 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">모범 사례</h4>
            <ul className="space-y-1">
              {primaryGuideline.bestPractices.map((practice, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-1 text-green-600 dark:text-green-400">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 자주 하는 실수 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">자주 하는 실수</h4>
            <ul className="space-y-1">
              {primaryGuideline.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-1 text-red-600 dark:text-red-400">✗</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 구현 단계 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">구현 단계</h4>
            <ol className="space-y-2">
              {primaryGuideline.implementationSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
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
      <div className="rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          🌟 {aioGuideline.title} 가이드라인
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{aioGuideline.description}</p>

        <div className="space-y-4">
          {/* 핵심 포인트 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">통합 최적화 전략</h4>
            <ul className="space-y-1">
              {aioGuideline.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-1 text-purple-600 dark:text-purple-400">★</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI 모델별 모범 사례 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">AI 모델별 모범 사례</h4>
            <div className="space-y-2 rounded-md bg-white dark:bg-gray-800 p-3">
              {aioGuideline.bestPractices.slice(0, 4).map((practice, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-0.5 text-purple-600 dark:text-purple-400">→</span>
                  <span>{practice}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 구현 단계 */}
          <div>
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">통합 최적화 구현 단계</h4>
            <ol className="space-y-2">
              {aioGuideline.implementationSteps.slice(0, 5).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              * 전체 단계는 {aioGuideline.implementationSteps.length}단계입니다
            </p>
          </div>
        </div>
      </div>

      {/* 참고 자료 */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          📖 참고 자료:{' '}
          <a
            href="https://github.com/saewookkangboy/ai-seo-blogger"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            AI SEO Blogger GitHub 저장소
          </a>
        </p>
      </div>
    </div>
  );
}

