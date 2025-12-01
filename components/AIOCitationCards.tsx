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
          color: 'bg-green-500',
          borderColor: 'border-green-200 dark:border-green-800',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
        };
      case 'perplexity':
        return {
          name: 'Perplexity',
          icon: '🔍',
          color: 'bg-blue-500',
          borderColor: 'border-blue-200 dark:border-blue-800',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        };
      case 'gemini':
        return {
          name: 'Gemini',
          icon: '✨',
          color: 'bg-purple-500',
          borderColor: 'border-purple-200 dark:border-purple-800',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        };
      case 'claude':
        return {
          name: 'Claude',
          icon: '🧠',
          color: 'bg-orange-500',
          borderColor: 'border-orange-200 dark:border-orange-800',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        };
      default:
        return {
          name: model,
          icon: '📊',
          color: 'bg-gray-500',
          borderColor: 'border-gray-200 dark:border-gray-700',
          bgColor: 'bg-gray-50 dark:bg-gray-800',
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">AI 모델별 인용 확률</h3>
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
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{info.name}</h4>
              </div>
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getScoreColor(insight.score)}`}>
                    {insight.score}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      insight.level === 'High'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : insight.level === 'Medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}
                  >
                    {insight.level === 'High' ? '높음' : insight.level === 'Medium' ? '보통' : '낮음'}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full transition-all duration-700 ease-out ${info.color} dark:opacity-80`}
                  style={{ width: `${insight.score}%` }}
                />
              </div>
              {insight.recommendations.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">개선 제안:</p>
                  <ul className="space-y-1">
                    {insight.recommendations.slice(0, 2).map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
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

