'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/lib/analyzer';

interface ScoreImprovementGuideProps {
  analysisData: AnalysisResult;
}

export default function ScoreImprovementGuide({ analysisData }: ScoreImprovementGuideProps) {
  const [expandedCategory, setExpandedCategory] = useState<'aeo' | 'geo' | 'seo' | null>(null);

  // 가장 낮은 점수 카테고리 찾기
  const getLowestScoreCategory = (): 'aeo' | 'geo' | 'seo' => {
    const { aeoScore, geoScore, seoScore } = analysisData;
    if (aeoScore <= geoScore && aeoScore <= seoScore) return 'aeo';
    if (geoScore <= aeoScore && geoScore <= seoScore) return 'geo';
    return 'seo';
  };

  const lowestCategory = getLowestScoreCategory();
  const lowestScore = analysisData[`${lowestCategory}Score` as keyof AnalysisResult] as number;

  // 개선 가이드 데이터
  const improvementGuides = {
    aeo: {
      title: 'AEO (Answer Engine Optimization) 점수 향상',
      description: 'AI 검색 엔진이 콘텐츠를 인용하고 답변에 활용할 수 있도록 최적화합니다.',
      tips: [
        {
          title: '명확하고 직접적인 답변 제공',
          description: '질문에 대한 명확한 답변을 콘텐츠 상단에 배치하세요. "이것은...입니다" 형식의 직접적인 답변이 효과적입니다.',
          priority: 'high',
        },
        {
          title: '구조화된 데이터 활용',
          description: '표, 리스트, FAQ 형식으로 정보를 구조화하면 AI가 콘텐츠를 더 쉽게 이해하고 인용할 수 있습니다.',
          priority: 'high',
        },
        {
          title: '핵심 키워드 강조',
          description: '주요 키워드를 제목, 소제목, 본문 초반에 배치하여 AI가 콘텐츠의 핵심을 빠르게 파악할 수 있도록 합니다.',
          priority: 'medium',
        },
        {
          title: '신뢰할 수 있는 출처 인용',
          description: '공신력 있는 출처를 인용하고 링크를 제공하면 AI가 콘텐츠를 더 신뢰하고 인용할 가능성이 높아집니다.',
          priority: 'medium',
        },
        {
          title: '최신 정보 제공',
          description: '콘텐츠를 정기적으로 업데이트하여 최신 정보를 제공하면 AI가 최신 데이터로 인식합니다.',
          priority: 'low',
        },
      ],
    },
    geo: {
      title: 'GEO (Generative Engine Optimization) 점수 향상',
      description: '생성형 AI가 콘텐츠를 생성할 때 참조할 수 있도록 최적화합니다.',
      tips: [
        {
          title: '맥락이 풍부한 콘텐츠 작성',
          description: '단순한 정보 나열이 아닌, 배경 지식과 맥락을 포함한 깊이 있는 콘텐츠를 작성하세요.',
          priority: 'high',
        },
        {
          title: '다양한 관점 제시',
          description: '단일 관점이 아닌 여러 관점을 제시하면 생성형 AI가 더 풍부한 콘텐츠를 생성할 수 있습니다.',
          priority: 'high',
        },
        {
          title: '예시와 사례 포함',
          description: '추상적인 설명보다 구체적인 예시와 사례를 포함하면 AI가 콘텐츠를 더 잘 이해하고 활용합니다.',
          priority: 'medium',
        },
        {
          title: '시각적 요소 활용',
          description: '이미지, 차트, 그래프 등을 활용하여 정보를 시각적으로 표현하면 AI가 콘텐츠를 더 잘 이해합니다.',
          priority: 'medium',
        },
        {
          title: '관련 주제 연결',
          description: '관련 주제와의 연결고리를 만들어 콘텐츠의 네트워크를 구축하면 AI가 더 넓은 맥락에서 활용할 수 있습니다.',
          priority: 'low',
        },
      ],
    },
    seo: {
      title: 'SEO (Search Engine Optimization) 점수 향상',
      description: '검색 엔진 최적화를 통해 검색 결과에서 더 높은 순위를 차지합니다.',
      tips: [
        {
          title: '메타 태그 최적화',
          description: 'title, description, keywords 메타 태그를 명확하고 검색 의도에 맞게 작성하세요.',
          priority: 'high',
        },
        {
          title: '제목 구조 개선',
          description: 'H1, H2, H3 태그를 논리적으로 구조화하여 콘텐츠의 계층 구조를 명확히 하세요.',
          priority: 'high',
        },
        {
          title: '내부/외부 링크 최적화',
          description: '관련 콘텐츠로의 내부 링크와 신뢰할 수 있는 외부 링크를 적절히 배치하세요.',
          priority: 'medium',
        },
        {
          title: '모바일 최적화',
          description: '반응형 디자인을 적용하여 모바일 환경에서도 콘텐츠가 잘 보이도록 최적화하세요.',
          priority: 'medium',
        },
        {
          title: '페이지 로딩 속도 개선',
          description: '이미지 최적화, 코드 압축 등을 통해 페이지 로딩 속도를 개선하세요.',
          priority: 'low',
        },
      ],
    },
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">점수 개선 가이드</h3>
        <p className="mt-1 text-sm text-gray-600">
          현재 가장 낮은 점수인 <strong>{lowestCategory.toUpperCase()}</strong> 점수({lowestScore}/100)를 개선하여 
          종합 점수를 향상시킬 수 있습니다.
        </p>
      </div>

      <div className="space-y-3">
        {(['aeo', 'geo', 'seo'] as const).map((category) => {
          const guide = improvementGuides[category];
          const score = analysisData[`${category}Score` as keyof AnalysisResult] as number;
          const isExpanded = expandedCategory === category;
          const isLowest = category === lowestCategory;

          return (
            <div
              key={category}
              className={`rounded-lg border-2 transition-all ${
                isLowest
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {category.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {score}/100
                    </span>
                    {isLowest && (
                      <span className="rounded-full bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800">
                        개선 필요
                      </span>
                    )}
                  </div>
                  <svg
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-4">
                  <p className="mb-4 text-sm text-gray-600">{guide.description}</p>
                  <div className="space-y-3">
                    {guide.tips.map((tip, index) => (
                      <div
                        key={index}
                        className="rounded-lg border bg-white p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{tip.title}</h4>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getPriorityColor(
                              tip.priority
                            )}`}
                          >
                            {getPriorityLabel(tip.priority)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{tip.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 팁:</strong> 점수 개선 가이드를 따라 콘텐츠를 수정한 후 다시 분석하면 
          개선된 점수를 확인할 수 있습니다. AI Agent를 통해 더 구체적인 개선 방안을 문의해보세요!
        </p>
      </div>
    </div>
  );
}
