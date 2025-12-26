import { ScoreHistory } from '@/types/analysis';

interface ScoreHistoryChartProps {
  history: ScoreHistory[];
}

export default function ScoreHistoryChart({ history }: ScoreHistoryChartProps) {
  if (history.length === 0) {
    return null;
  }

  // 최근 5개만 표시
  const recentHistory = history.slice(0, 5).reverse();
  const maxScore = 100;

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-md">
      <h3 className="mb-3 text-sm font-bold text-gray-900">점수 변화 추이</h3>
      <div className="space-y-2">
        {recentHistory.map((item, index) => {
          const date = new Date(item.timestamp);
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-12 text-xs text-gray-600">{dateStr}</div>
              <div className="flex-1">
                <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${(item.scores.overall / maxScore) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-10 text-right text-xs font-semibold text-gray-700">
                {item.scores.overall}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

