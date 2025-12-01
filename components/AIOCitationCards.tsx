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
    <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <h3 className="mb-6 text-xl font-semibold text-gray-900">AI 모델별 인용 확률</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analysis.insights.map((insight) => {
          const info = getModelInfo(insight.model);
          return (
            <div
              key={insight.model}
              onClick={() => handleCardClick(insight.model)}
              className={`cursor-pointer rounded-lg border-2 ${info.borderColor} ${info.bgColor} p-4 transition-all hover:shadow-lg hover:scale-105`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">{info.icon}</span>
                <h4 className="font-semibold text-gray-900">{info.name}</h4>
              </div>
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getScoreColor(insight.score)}`}>
                    {insight.score}
                  </span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
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
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all duration-700 ease-out ${info.color}`}
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

