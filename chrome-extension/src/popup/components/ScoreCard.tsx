interface ScoreCardProps {
  title: string;
  score: number;
}

export default function ScoreCard({ title, score }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-sky-600';
    if (score >= 60) return 'text-sky-500';
    return 'text-gray-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-sky-500 to-indigo-500';
    if (score >= 60) return 'bg-gradient-to-r from-sky-400 to-blue-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const getCardGradient = (score: number) => {
    if (score >= 80) return 'from-sky-50 to-indigo-50';
    if (score >= 60) return 'from-blue-50 to-sky-50';
    return 'from-gray-50 to-gray-100';
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gradient-to-br ${getCardGradient(score)} p-4 shadow-md transition-all duration-300 hover:shadow-lg`}>
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-lg text-gray-500">/ 100</span>
      </div>
      
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/50">
        <div
          className={`h-full ${getProgressColor(score)} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      <div className="mt-3">
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
          score >= 80 
            ? 'bg-sky-100 text-sky-800' 
            : score >= 60 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {score >= 80 ? '⭐ 우수' : score >= 60 ? '✓ 양호' : '⚠ 개선 필요'}
        </span>
      </div>
    </div>
  );
}

