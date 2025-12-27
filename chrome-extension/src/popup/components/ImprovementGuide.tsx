import { AnalysisResult } from '@/types/analysis';

interface ImprovementGuideProps {
  analysisData: AnalysisResult;
}

export default function ImprovementGuide({ analysisData }: ImprovementGuideProps) {
  const sortedInsights = [...analysisData.insights].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High':
        return '🔴';
      case 'Medium':
        return '🟡';
      case 'Low':
        return '🟢';
      default:
        return 'ℹ️';
    }
  };

  if (sortedInsights.length === 0) {
    return null;
  }

  // 최대 3개만 표시
  const topInsights = sortedInsights.slice(0, 3);

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-white to-sky-50/30 p-4 shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm">
          💡
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">개선 가이드</h3>
          <p className="text-xs text-gray-600">우선순위별 개선 사항</p>
        </div>
      </div>
      <div className="space-y-2">
        {topInsights.map((insight, index) => (
          <div
            key={index}
            className={`rounded-lg border-2 p-2 transition-all ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm">{getSeverityIcon(insight.severity)}</span>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-1">
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase bg-white/80">
                    {insight.severity}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-white/80">
                    {insight.category}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
        {sortedInsights.length > 3 && (
          <p className="text-xs text-center text-gray-500">
            +{sortedInsights.length - 3}개 더 보기
          </p>
        )}
      </div>
    </div>
  );
}

