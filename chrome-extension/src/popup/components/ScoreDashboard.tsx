import { useEffect, useState } from 'react';
import { AnalysisResult } from '@/types/analysis';
import ScoreCard from './ScoreCard';
import AIOCitationCards from './AIOCitationCards';

interface ScoreDashboardProps {
  analysisData: AnalysisResult | null;
  isLoading?: boolean;
}

export default function ScoreDashboard({ analysisData, isLoading }: ScoreDashboardProps) {
  const [animatedScore, setAnimatedScore] = useState({
    overall: 0,
    aeo: 0,
    geo: 0,
    seo: 0,
  });

  useEffect(() => {
    if (analysisData) {
      // 점수 애니메이션
      const duration = 1000;
      const steps = 60;
      const interval = duration / steps;

      const animate = (target: number, key: keyof typeof animatedScore) => {
        let current = 0;
        const increment = target / steps;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setAnimatedScore(prev => ({ ...prev, [key]: Math.round(current) }));
        }, interval);
      };

      animate(analysisData.overallScore, 'overall');
      animate(analysisData.aeoScore, 'aeo');
      animate(analysisData.geoScore, 'geo');
      animate(analysisData.seoScore, 'seo');
    }
  }, [analysisData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-sky-600';
    if (score >= 60) return 'text-sky-500';
    return 'text-gray-600';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return '우수';
    if (score >= 60) return '양호';
    return '개선 필요';
  };

  return (
    <div className="space-y-4">
      {/* 종합 점수 */}
      <div className="relative overflow-hidden rounded-lg border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50 p-4 shadow-md">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-sm">
            ⭐
          </div>
          <h3 className="text-base font-bold text-gray-900">종합 점수</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(animatedScore.overall)}`}>
                {animatedScore.overall}
              </span>
              <span className="text-lg text-gray-500">/ 100</span>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                analysisData.overallScore >= 80 
                  ? 'bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-800' 
                  : analysisData.overallScore >= 60 
                  ? 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {getScoreLevel(analysisData.overallScore)}
              </span>
            </div>
          </div>
          <div className="h-16 w-16">
            <div className="h-full w-full rounded-full border-4 border-gray-200 relative">
              <div 
                className="absolute inset-0 rounded-full border-4 border-sky-500"
                style={{
                  clipPath: `inset(0 ${100 - analysisData.overallScore}% 0 0)`,
                  transform: 'rotate(-90deg)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700">{analysisData.overallScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 세부 점수 카드 */}
      <div className="grid grid-cols-3 gap-2">
        <ScoreCard title="AEO" score={animatedScore.aeo} />
        <ScoreCard title="GEO" score={animatedScore.geo} />
        <ScoreCard title="SEO" score={animatedScore.seo} />
      </div>

      {/* AI 모델별 인용 확률 */}
      {analysisData.aioAnalysis && (
        <AIOCitationCards analysis={analysisData.aioAnalysis} />
      )}
    </div>
  );
}

