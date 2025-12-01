'use client';

interface ScoreCardProps {
  title: string;
  score: number;
  color: string;
}

export default function ScoreCard({ title, score, color }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${getScoreColor(score)} dark:text-opacity-90`}>
          {score}
        </span>
        <span className="text-lg text-gray-500 dark:text-gray-400">/ 100</span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-700 ease-out ${color} dark:opacity-80`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

