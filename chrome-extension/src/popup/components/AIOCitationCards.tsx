import { AIOCitationAnalysis } from '@/types/analysis';

interface AIOCitationCardsProps {
  analysis: AIOCitationAnalysis;
}

export default function AIOCitationCards({ analysis }: AIOCitationCardsProps) {
  const getModelInfo = (model: string) => {
    switch (model) {
      case 'chatgpt':
        return { name: 'ChatGPT', icon: '🤖', color: 'bg-sky-500' };
      case 'perplexity':
        return { name: 'Perplexity', icon: '🔍', color: 'bg-sky-400' };
      case 'gemini':
        return { name: 'Gemini', icon: '✨', color: 'bg-sky-600' };
      case 'claude':
        return { name: 'Claude', icon: '🧠', color: 'bg-sky-500' };
      default:
        return { name: model, icon: '📊', color: 'bg-gray-400' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-sky-600';
    if (score >= 60) return 'text-sky-500';
    return 'text-gray-600';
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-sky-50/30 p-4 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-lg">
          🤖
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">AI 모델별 인용 확률</h3>
          <p className="text-xs text-gray-600">각 AI 모델에서 콘텐츠가 인용될 확률</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {analysis.insights.map((insight) => {
          const info = getModelInfo(insight.model);
          return (
            <div
              key={insight.model}
              className="relative overflow-hidden rounded-lg border-2 border-sky-200 bg-sky-50 p-3 transition-all hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{info.icon}</span>
                <h4 className="text-xs font-bold text-gray-900">{info.name}</h4>
              </div>
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${getScoreColor(insight.score)}`}>
                    {insight.score}
                  </span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/50">
                <div
                  className={`h-full ${info.color} transition-all duration-1000 ease-out`}
                  style={{ width: `${insight.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

