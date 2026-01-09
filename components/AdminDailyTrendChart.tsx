'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface DailyPoint {
  date: string;
  count: number;
}

interface AdminDailyTrendChartProps {
  dailyUsers: DailyPoint[];
  dailyAnalyses: DailyPoint[];
}

export default function AdminDailyTrendChart({
  dailyUsers,
  dailyAnalyses,
}: AdminDailyTrendChartProps) {
  const hasData = (dailyUsers && dailyUsers.length > 0) || (dailyAnalyses && dailyAnalyses.length > 0);

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-500">
        일일 트렌드 데이터가 없습니다.
      </div>
    );
  }

  const allDates = Array.from(
    new Set([
      ...dailyUsers.map((d) => d.date),
      ...dailyAnalyses.map((d) => d.date),
    ])
  ).sort();

  const userCounts = allDates.map(
    (date) => dailyUsers.find((d) => d.date === date)?.count ?? 0
  );
  const analysisCounts = allDates.map(
    (date) => dailyAnalyses.find((d) => d.date === date)?.count ?? 0
  );

  const data = {
    labels: allDates,
    datasets: [
      {
        label: '일일 신규 사용자(방문)',
        data: userCounts,
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: '일일 분석 수',
        data: analysisCounts,
        borderColor: 'rgba(34, 197, 94, 1)', // green-500
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? 0;
            return `${label}: ${new Intl.NumberFormat('ko-KR').format(value)}건`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  );
}

