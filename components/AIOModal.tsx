'use client';

import { AIOCitationAnalysis } from '@/lib/ai-citation-analyzer';

interface AIOModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: 'chatgpt' | 'perplexity' | 'grok' | 'gemini' | 'claude' | null;
  analysis: AIOCitationAnalysis | null;
}

export default function AIOModal({ isOpen, onClose, model, analysis }: AIOModalProps) {
  if (!isOpen || !model || !analysis) return null;

  const insight = analysis.insights.find((i) => i.model === model);
  if (!insight) return null;

  const getModelInfo = (model: string) => {
    switch (model) {
      case 'chatgpt':
        return {
          name: 'ChatGPT',
          icon: '🤖',
          description: 'OpenAI의 ChatGPT는 구조화된 데이터와 명확한 답변을 선호합니다. FAQ 섹션과 단계별 가이드 형식의 콘텐츠가 인용될 확률을 높입니다.',
          color: 'bg-sky-500',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      case 'perplexity':
        return {
          name: 'Perplexity',
          icon: '🔍',
          description: 'Perplexity는 실시간 정보와 최신 데이터를 선호합니다. 출처 링크와 업데이트 날짜가 명시된 콘텐츠가 더 잘 인용됩니다.',
          color: 'bg-sky-400',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      case 'grok':
        return {
          name: 'Grok',
          icon: '⚡',
          description: 'xAI의 Grok은 최신성, 출처 명시, 핵심 요약이 있는 콘텐츠를 선호합니다. 날짜/시간 정보와 인용 링크가 잘 정리된 글이 유리합니다.',
          color: 'bg-sky-700',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      case 'gemini':
        return {
          name: 'Gemini',
          icon: '✨',
          description: 'Google의 Gemini는 다양한 미디어 콘텐츠와 구조화된 정보를 선호합니다. 이미지, 비디오, 표가 포함된 콘텐츠가 인용될 확률이 높습니다.',
          color: 'bg-sky-600',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      case 'claude':
        return {
          name: 'Claude',
          icon: '🧠',
          description: 'Anthropic의 Claude는 상세하고 포괄적인 설명을 선호합니다. 깊이 있는 정보와 배경 맥락이 포함된 긴 형식의 콘텐츠가 잘 인용됩니다.',
          color: 'bg-sky-500',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      default:
        return {
          name: model,
          icon: '📊',
          description: '',
          color: 'bg-gray-400',
          borderColor: 'border-gray-300',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const info = getModelInfo(model);
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-sky-600';
    if (score >= 60) return 'text-sky-500';
    return 'text-gray-600';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-lg border-2 ${info.borderColor} ${info.bgColor} p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
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

        {/* 헤더 */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-4xl">{info.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{info.name}</h2>
            <p className="text-sm text-gray-600">인용 확률 상세 분석</p>
          </div>
        </div>

        {/* 점수 섹션 */}
        <div className="mb-6 rounded-lg bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">인용 확률 점수</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(insight.score)}`}>
                  {insight.score}
                </span>
                <span className="text-lg text-gray-500">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  insight.level === 'High'
                    ? 'bg-sky-100 text-sky-800'
                    : insight.level === 'Medium'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {insight.level === 'High' ? '높음' : insight.level === 'Medium' ? '보통' : '낮음'}
              </span>
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full transition-all duration-500 ${info.color}`}
              style={{ width: `${insight.score}%` }}
            />
          </div>
        </div>

        {/* 설명 */}
        <div className="mb-6 rounded-lg bg-white p-4">
          <h3 className="mb-2 font-semibold text-gray-900">모델 특성</h3>
          <p className="text-sm text-gray-700">{info.description}</p>
        </div>

        {/* 개선 제안 */}
        <div className="rounded-lg bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">개선 제안</h3>
          <ul className="space-y-3">
            {insight.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-semibold">
                  {idx + 1}
                </span>
                <p className="text-sm text-gray-700">{rec}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
