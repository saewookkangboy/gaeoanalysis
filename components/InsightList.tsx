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

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">개선 가이드</h3>
      <div className="space-y-3">
        {sortedInsights.length === 0 ? (
          <p className="text-sm text-gray-500">개선 사항이 없습니다.</p>
        ) : (
          sortedInsights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-md border p-3 transition-all hover:scale-[1.02] ${getSeverityColor(insight.severity)} animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase">
                      {insight.severity}
                    </span>
                    <span className="text-xs font-medium opacity-75">
                      {insight.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{insight.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

