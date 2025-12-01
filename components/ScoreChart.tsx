'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ScoreChartProps {
  aeoScore: number;
  geoScore: number;
  seoScore: number;
}

export default function ScoreChart({ aeoScore, geoScore, seoScore }: ScoreChartProps) {
  const data = {
    labels: ['AEO', 'GEO', 'SEO'],
    datasets: [
      {
        data: [aeoScore, geoScore, seoScore],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}점`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">점수 분포</h3>
      <div className="flex justify-center">
        <div className="h-64 w-64">
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>
  );
}

