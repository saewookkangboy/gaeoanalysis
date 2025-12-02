'use client';

import { useState } from 'react';
import { AIOCitationScores, AIOCitationAnalysis } from '@/lib/ai-citation-analyzer';
import AIOModal from './AIOModal';

interface AIOCitationCardsProps {
  analysis: AIOCitationAnalysis;
}

export default function AIOCitationCards({ analysis }: AIOCitationCardsProps) {
  const [selectedModel, setSelectedModel] = useState<'chatgpt' | 'perplexity' | 'gemini' | 'claude' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (model: 'chatgpt' | 'perplexity' | 'gemini' | 'claude') => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModel(null);
  };

  const getModelInfo = (model: string) => {
    switch (model) {
      case 'chatgpt':
        return {
          name: 'ChatGPT',
          icon: '🤖',
          color: 'bg-sky-500',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      case 'perplexity':
        return {
          name: 'Perplexity',
          icon: '🔍',
          color: 'bg-sky-400',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      case 'gemini':
        return {
          name: 'Gemini',
          icon: '✨',
          color: 'bg-sky-600',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      case 'claude':
        return {
          name: 'Claude',
          icon: '🧠',
          color: 'bg-sky-500',
          borderColor: 'border-sky-200',
          bgColor: 'bg-sky-50',
        };
      default:
        return {
          name: model,
          icon: '📊',
          color: 'bg-gray-400',
          borderColor: 'border-gray-300',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-sky-600';
    if (score >= 60) return 'text-sky-500';
    return 'text-gray-600';
  };

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-sky-50/30 p-6 sm:p-8 shadow-lg transition-all hover:shadow-xl animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl shadow-md">
          🤖
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI 모델별 인용 확률</h3>
          <p className="text-sm text-gray-600">각 AI 모델에서 콘텐츠가 인용될 확률</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analysis.insights.map((insight) => {
          const info = getModelInfo(insight.model);
          return (
            <div
              key={insight.model}
              onClick={() => handleCardClick(insight.model)}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 ${info.borderColor} ${info.bgColor} p-5 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-sky-400`}
            >
              {/* 호버 시 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/80 text-2xl shadow-sm">
                    {info.icon}
                  </div>
                  <h4 className="font-bold text-gray-900">{info.name}</h4>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${getScoreColor(insight.score)}`}>
                      {insight.score}
                    </span>
                    <span className="text-lg text-gray-500">/ 100</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                        insight.level === 'High'
                          ? 'bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-800'
                          : insight.level === 'Medium'
                          ? 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {insight.level === 'High' ? '⭐ 높음' : insight.level === 'Medium' ? '✓ 보통' : '⚠ 낮음'}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200/50 shadow-inner">
                  <div
                    className={`h-full bg-gradient-to-r ${info.color} transition-all duration-1000 ease-out shadow-md`}
                    style={{ width: `${insight.score}%` }}
                  />
                </div>
                {insight.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-medium text-gray-700">개선 제안:</p>
                    <ul className="space-y-1">
                      {insight.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="text-xs text-gray-600">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 모달 */}
      <AIOModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        model={selectedModel}
        analysis={analysis}
      />
    </div>
  );
}

