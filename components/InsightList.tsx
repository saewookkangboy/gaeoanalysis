'use client';

import { Insight } from '@/lib/analyzer';

interface InsightListProps {
  insights: Insight[];
}

export default function InsightList({ insights }: InsightListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Medium':
        return 'bg-gray-50 text-gray-800 border-gray-200';
      case 'Low':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.severity] - order[b.severity];
  });

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

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-sky-50/30 p-6 sm:p-8 shadow-lg transition-all hover:shadow-xl animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl shadow-md">
          💡
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">개선 가이드</h3>
          <p className="text-sm text-gray-600">우선순위별 개선 사항</p>
        </div>
      </div>
      <div className="space-y-4">
        {sortedInsights.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-base font-medium text-gray-600">개선 사항이 없습니다.</p>
            <p className="mt-2 text-sm text-gray-500">완벽한 콘텐츠입니다! 🎉</p>
          </div>
        ) : (
          sortedInsights.map((insight, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${getSeverityColor(insight.severity)} animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 배경 장식 */}
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/30 blur-2xl group-hover:bg-white/50 transition-colors"></div>
              
              <div className="relative flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 text-xl shadow-sm">
                  {getSeverityIcon(insight.severity)}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-xs font-bold uppercase shadow-sm bg-white/80">
                      {insight.severity}
                    </span>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-white/80 shadow-sm">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

