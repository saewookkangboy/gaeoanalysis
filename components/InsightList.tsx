'use client';

import { Insight } from '@/lib/analyzer';

interface InsightListProps {
  insights: Insight[];
}

export default function InsightList({ insights }: InsightListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'Low':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">개선 가이드</h3>
      <div className="space-y-3">
        {sortedInsights.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">개선 사항이 없습니다.</p>
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

