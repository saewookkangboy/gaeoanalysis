'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AnalysisResult } from '@/lib/analyzer';
import ScoreCard from '@/components/ScoreCard';
import ScoreChart from '@/components/ScoreChart';
import InsightList from '@/components/InsightList';
import AIAgent from '@/components/AIAgent';
import CopyButton from '@/components/CopyButton';
import AIOCitationCards from '@/components/AIOCitationCards';
import ContentGuidelines from '@/components/ContentGuidelines';
import { useToast } from '@/components/Toast';

export default function Home() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 로그인 시 등록된 블로그 URL 자동 로드 및 분석
  useEffect(() => {
    const loadBlogUrlAndAnalyze = async () => {
      if (session?.user?.id && !url) {
        try {
          const response = await fetch('/api/user/blog-url');
          if (response.ok) {
            const data = await response.json();
            if (data.blogUrl) {
              setUrl(data.blogUrl);
              // 자동 분석 시작
              setIsAnalyzing(true);
              setError(null);
              setAnalysisData(null);

              try {
                const analyzeResponse = await fetch('/api/analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: data.blogUrl.trim() }),
                });

                const analyzeData = await analyzeResponse.json();

                if (analyzeResponse.ok) {
                  setAnalysisData(analyzeData);
                  showToast('분석이 완료되었습니다!', 'success');
                } else {
                  const errorMsg = analyzeData.error || '분석 중 오류가 발생했습니다.';
                  setError(errorMsg);
                  showToast(errorMsg, 'error');
                }
              } catch (err) {
                const errorMsg = '분석 중 오류가 발생했습니다.';
                setError(errorMsg);
                showToast(errorMsg, 'error');
              } finally {
                setIsAnalyzing(false);
              }
            }
          }
        } catch (error) {
          console.error('블로그 URL 로드 실패:', error);
        }
      }
    };

    loadBlogUrlAndAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      const errorMsg = 'URL을 입력해주세요.';
      setError(errorMsg);
      showToast(errorMsg, 'warning');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisData(null);
    showToast('분석을 시작합니다...', 'info', 2000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisData(data);
        showToast('분석이 완료되었습니다!', 'success');
      } else {
        const errorMsg = data.error || '분석 중 오류가 발생했습니다.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = '분석 중 오류가 발생했습니다.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* URL 입력 섹션 */}
        <div className="mb-8 animate-fade-in">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
              GAEO Analysis by allrounder
            </h1>
            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              URL을 입력하여 콘텐츠의 AEO, GEO, SEO 점수를 분석하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
                placeholder="https://example.com"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:opacity-50"
                disabled={isAnalyzing}
                aria-label="분석할 URL 입력"
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !url.trim()}
                className="rounded-md bg-blue-600 dark:bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                aria-label="분석 시작"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse-slow">●</span>
                    분석 중...
                  </span>
                ) : (
                  '분석 시작'
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-300 animate-slide-in">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* 분석 결과 섹션 */}
        {analysisData && (
          <div className="space-y-6 animate-fade-in">
            {/* 점수 카드 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ScoreCard
                title="AEO 점수"
                score={analysisData.aeoScore}
                color="bg-blue-500"
              />
              <ScoreCard
                title="GEO 점수"
                score={analysisData.geoScore}
                color="bg-purple-500"
              />
              <ScoreCard
                title="SEO 점수"
                score={analysisData.seoScore}
                color="bg-green-500"
              />
            </div>

            {/* 차트 */}
            <ScoreChart
              aeoScore={analysisData.aeoScore}
              geoScore={analysisData.geoScore}
              seoScore={analysisData.seoScore}
            />

            {/* 종합 점수 */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">종합 점수</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    AEO, GEO, SEO 점수의 평균
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {analysisData.overallScore}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">/ 100</div>
                </div>
              </div>
            </div>

            {/* AI 모델별 인용 확률 */}
            {analysisData.aioAnalysis && (
              <AIOCitationCards analysis={analysisData.aioAnalysis} />
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-end gap-2">
              <CopyButton analysisData={analysisData} url={url} />
            </div>

            {/* 개선 가이드 */}
            <InsightList insights={analysisData.insights} />

            {/* 콘텐츠 작성 가이드라인 */}
            <ContentGuidelines analysisData={analysisData} />
          </div>
        )}

        {/* 빈 상태 */}
        {!analysisData && !isAnalyzing && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">위에 URL을 입력하고 분석을 시작하세요.</p>
            <p className="mt-2 text-sm">콘텐츠의 AEO, GEO, SEO 점수를 확인하고 개선 방안을 제시합니다.</p>
          </div>
        )}
      </main>

      {/* AI Agent */}
      <AIAgent analysisData={analysisData} aioAnalysis={analysisData?.aioAnalysis || null} />
    </div>
  );
}
