'use client';

interface ScoreCardProps {
  title: string;
  score: number;
  color: string;
}

export default function ScoreCard({ title, score, color }: ScoreCardProps) {
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
    <div className={`group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br ${getCardGradient(score)} p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-sky-300 animate-fade-in`}>
      {/* 장식 요소 */}
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-sky-200/20 blur-2xl group-hover:bg-sky-300/30 transition-colors"></div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-xl text-gray-500">/ 100</span>
        </div>
        
        {/* 개선된 진행 바 */}
        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-gray-200/50 shadow-inner">
          <div
            className={`h-full ${getProgressColor(score)} transition-all duration-1000 ease-out shadow-lg`}
            style={{ width: `${score}%` }}
          />
        </div>
        
        {/* 점수 레벨 표시 */}
        <div className="mt-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
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
    </div>
  );
}

