'use client';

import { useState } from 'react';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { AIOCitationAnalysis } from '@/lib/ai-citation-analyzer';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface ScoreChartProps {
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  aioAnalysis?: AIOCitationAnalysis;
}

type ChartType = 'doughnut' | 'bar' | 'radar' | 'all';

export default function ScoreChart({ aeoScore, geoScore, seoScore, overallScore, aioAnalysis }: ScoreChartProps) {
  const [chartType, setChartType] = useState<ChartType>('all');

  // 기본 점수 데이터
  const baseScores = {
    labels: ['AEO', 'GEO', 'SEO', '종합'],
    data: [aeoScore, geoScore, seoScore, overallScore],
    colors: [
      'rgba(59, 130, 246, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(251, 146, 60, 0.8)',
    ],
    borderColors: [
      'rgba(59, 130, 246, 1)',
      'rgba(168, 85, 247, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(251, 146, 60, 1)',
    ],
  };

  // AI 모델별 점수 포함
  const allScores = aioAnalysis
    ? {
        labels: [
          'AEO',
          'GEO',
          'SEO',
          '종합',
          'ChatGPT',
          'Perplexity',
          'Gemini',
          'Claude',
        ],
        data: [
          aeoScore,
          geoScore,
          seoScore,
          overallScore,
          aioAnalysis.scores.chatgpt,
          aioAnalysis.scores.perplexity,
          aioAnalysis.scores.gemini,
          aioAnalysis.scores.claude,
        ],
        colors: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(251, 146, 60, 0.6)',
        ],
        borderColors: [
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(251, 146, 60, 1)',
        ],
      }
    : baseScores;

  const doughnutData = {
    labels: baseScores.labels,
    datasets: [
      {
        data: baseScores.data,
        backgroundColor: baseScores.colors,
        borderColor: baseScores.borderColors,
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: allScores.labels,
    datasets: [
      {
        label: '점수',
        data: allScores.data,
        backgroundColor: allScores.colors,
        borderColor: allScores.borderColors,
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const radarData = {
    labels: baseScores.labels,
    datasets: [
      {
        label: '점수 분포',
        data: baseScores.data,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.parsed}점`;
          },
        },
      },
    },
  };

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">점수 분포</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('doughnut')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              chartType === 'doughnut'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            도넛
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            막대
          </button>
          <button
            onClick={() => setChartType('radar')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              chartType === 'radar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            레이더
          </button>
          <button
            onClick={() => setChartType('all')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              chartType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            전체
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(chartType === 'doughnut' || chartType === 'all') && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">기본 점수 (도넛 차트)</h4>
            <div className="flex justify-center">
              <div className="h-64 w-64">
                <Doughnut data={doughnutData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {(chartType === 'bar' || chartType === 'all') && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              전체 점수 비교 (막대 차트)
            </h4>
            <div className="h-80">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        )}

        {(chartType === 'radar' || chartType === 'all') && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">점수 분포 (레이더 차트)</h4>
            <div className="flex justify-center">
              <div className="h-80 w-80">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

