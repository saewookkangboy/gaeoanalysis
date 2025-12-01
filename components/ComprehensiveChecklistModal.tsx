'use client';

import { AnalysisResult } from '@/lib/analyzer';

interface ComprehensiveChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: AnalysisResult | null;
}

export default function ComprehensiveChecklistModal({
  isOpen,
  onClose,
  analysisData,
}: ComprehensiveChecklistModalProps) {
  if (!isOpen || !analysisData) return null;

  // 체크리스트 항목 생성
  const generateChecklist = () => {
    const checklist: Array<{ category: string; items: string[] }> = [];

    // 1. AI 모델별 인용 확률 추천사항
    if (analysisData.aioAnalysis) {
      const aioItems: string[] = [];
      analysisData.aioAnalysis.insights.forEach((insight) => {
        insight.recommendations.forEach((rec) => {
          if (!aioItems.includes(rec)) {
            aioItems.push(rec);
          }
        });
      });
      if (aioItems.length > 0) {
        checklist.push({
          category: 'AI 모델 최적화',
          items: aioItems.slice(0, 6), // 최대 6개
        });
      }
    }

    // 2. 개선 가이드 (High 우선순위)
    const highPriorityInsights = analysisData.insights
      .filter((insight) => insight.severity === 'High')
      .map((insight) => insight.message)
      .slice(0, 5);
    
    if (highPriorityInsights.length > 0) {
      checklist.push({
        category: '긴급 개선 사항',
        items: highPriorityInsights,
      });
    }

    // 3. 개선 우선순위의 실행 가능한 팁
    if (analysisData.improvementPriorities) {
      const priorityItems: string[] = [];
      analysisData.improvementPriorities.forEach((priority) => {
        if (priority.actionableTips) {
          priority.actionableTips.forEach((tip) => {
            // 각 팁의 제목과 첫 번째 단계를 체크리스트 항목으로
            priorityItems.push(`${tip.title}: ${tip.steps[0]}`);
          });
        }
      });
      if (priorityItems.length > 0) {
        checklist.push({
          category: '실행 가능한 개선 팁',
          items: priorityItems.slice(0, 5),
        });
      }
    }

    // 4. 콘텐츠 작성 시 유의사항
    if (analysisData.contentGuidelines && analysisData.contentGuidelines.length > 0) {
      checklist.push({
        category: '콘텐츠 작성 체크리스트',
        items: analysisData.contentGuidelines.slice(0, 6),
      });
    }

    // 5. Medium 우선순위 인사이트
    const mediumPriorityInsights = analysisData.insights
      .filter((insight) => insight.severity === 'Medium')
      .map((insight) => insight.message)
      .slice(0, 4);
    
    if (mediumPriorityInsights.length > 0) {
      checklist.push({
        category: '추가 개선 사항',
        items: mediumPriorityInsights,
      });
    }

    return checklist;
  };

  const checklist = generateChecklist();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-sky-600';
    if (score >= 60) return 'text-sky-500';
    return 'text-gray-600';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return '우수';
    if (score >= 60) return '보통';
    return '개선 필요';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-lg border border-gray-300 bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-300 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">종합 개선 체크리스트</h2>
              <p className="mt-1 text-sm text-gray-600">분석 결과를 기반으로 한 핵심 개선 사항</p>
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

          {/* 종합 점수 표시 */}
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${getScoreColor(analysisData.overallScore)}`}>
                {analysisData.overallScore}
              </span>
              <span className="text-lg text-gray-500">/ 100</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">종합 점수</span>
                <span className={`text-sm font-semibold ${getScoreColor(analysisData.overallScore)}`}>
                  ({getScoreLevel(analysisData.overallScore)})
                </span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-sky-500 transition-all duration-500`}
                  style={{ width: `${analysisData.overallScore}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">AEO: {analysisData.aeoScore}</div>
              <div className="text-sm text-gray-600">GEO: {analysisData.geoScore}</div>
              <div className="text-sm text-gray-600">SEO: {analysisData.seoScore}</div>
            </div>
          </div>
        </div>

        {/* 체크리스트 내용 */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {checklist.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>표시할 체크리스트 항목이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {checklist.map((section, sectionIdx) => (
                <div key={sectionIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">
                      {sectionIdx + 1}
                    </span>
                    {section.category}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          id={`check-${sectionIdx}-${itemIdx}`}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label
                          htmlFor={`check-${sectionIdx}-${itemIdx}`}
                          className="flex-1 text-sm text-gray-700 cursor-pointer"
                        >
                          {item}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

