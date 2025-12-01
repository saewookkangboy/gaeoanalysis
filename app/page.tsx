'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { AnalysisResult } from '@/lib/analyzer';
import ScoreCard from '@/components/ScoreCard';
// import ScoreChart from '@/components/ScoreChart'; // 숨김 처리
import InsightList from '@/components/InsightList';
import CopyButton from '@/components/CopyButton';
import AIOCitationCards from '@/components/AIOCitationCards';
import ContentGuidelines from '@/components/ContentGuidelines';
import { useToast } from '@/components/Toast';
import ProgressBar from '@/components/ProgressBar';
import SkeletonLoader from '@/components/SkeletonLoader';
import UrlInput from '@/components/UrlInput';
import ShareButton from '@/components/ShareButton';
import { storage } from '@/lib/storage';
import { fetchWithRetry } from '@/lib/fetch-with-retry';

// 코드 스플리팅: AIAgent는 필요할 때만 로드
const AIAgent = lazy(() => import('@/components/AIAgent'));

type AnalysisStep = 'idle' | 'fetching' | 'parsing' | 'analyzing' | 'complete';

export default function Home() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('idle');
  const [retryCount, setRetryCount] = useState(0);

  // 로컬 스토리지에서 분석 결과 복구
  useEffect(() => {
    const saved = storage.getAnalysisResult();
    if (saved && !analysisData) {
      setAnalysisData(saved.data);
      setUrl(saved.url);
      showToast('이전 분석 결과를 불러왔습니다.', 'info', 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 분석 단계 정의
  const analysisSteps = [
    { label: 'URL 가져오기', completed: false },
    { label: 'HTML 파싱', completed: false },
    { label: '점수 계산', completed: false },
    { label: 'AI 분석', completed: false },
  ];

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

  const handleAnalyze = async (retry = false) => {
    if (!url.trim()) {
      const errorMsg = 'URL을 입력해주세요.';
      setError(errorMsg);
      showToast(errorMsg, 'warning');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    if (!retry) {
      setAnalysisData(null);
      setCurrentStep('idle');
      setRetryCount(0);
    }
    showToast('분석을 시작합니다...', 'info', 2000);

    try {
      // 단계별 진행 상태 시뮬레이션
      setCurrentStep('fetching');
      await new Promise((resolve) => setTimeout(resolve, 500));

      setCurrentStep('parsing');
      await new Promise((resolve) => setTimeout(resolve, 300));

      setCurrentStep('analyzing');

      // 재시도 로직이 포함된 fetch
      const response = await fetchWithRetry('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        maxRetries: 3,
        retryDelay: 1000,
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('complete');
        setAnalysisData(data);
        
        // 로컬 스토리지에 저장
        storage.saveAnalysisResult(data, url.trim());
        storage.addUrlToHistory(url.trim());
        
        showToast('분석이 완료되었습니다!', 'success');
        setRetryCount(0);
      } else {
        // 에러 타입별 처리
        const errorCode = data.error?.code || 'UNKNOWN_ERROR';
        let errorMsg = data.error?.message || '분석 중 오류가 발생했습니다.';
        
        if (errorCode === 'RATE_LIMIT_EXCEEDED') {
          errorMsg = '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (errorCode === 'NETWORK_ERROR') {
          errorMsg = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
        } else if (errorCode === 'TIMEOUT_ERROR') {
          errorMsg = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
        }
        
        setError(errorMsg);
        showToast(errorMsg, 'error');
        setCurrentStep('idle');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      let errorMsg = '분석 중 오류가 발생했습니다.';
      
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        errorMsg = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('timeout')) {
        errorMsg = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
      }
      
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setCurrentStep('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    handleAnalyze(true);
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
              <UrlInput
                value={url}
                onChange={setUrl}
                onAnalyze={() => handleAnalyze()}
                disabled={isAnalyzing}
                showHistory={true}
              />
              <button
                onClick={() => handleAnalyze()}
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
            
            {/* 진행 상태 표시 */}
            {isAnalyzing && currentStep !== 'idle' && (
              <div className="mt-4 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                <ProgressBar
                  steps={analysisSteps}
                  currentStep={
                    currentStep === 'fetching' ? 0 :
                    currentStep === 'parsing' ? 1 :
                    currentStep === 'analyzing' ? 2 : 3
                  }
                />
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-300 animate-slide-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    {retryCount > 0 && (
                      <p className="mt-1 text-xs opacity-75">
                        재시도 횟수: {retryCount}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleRetry}
                    disabled={isAnalyzing}
                    className="rounded-md bg-red-600 dark:bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 로딩 중 스켈레톤 UI */}
        {isAnalyzing && !analysisData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SkeletonLoader type="card" count={3} />
            </div>
            <SkeletonLoader type="chart" />
            <SkeletonLoader type="list" />
          </div>
        )}

        {/* 분석 결과 섹션 */}
        {analysisData && !isAnalyzing && (
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

            {/* 차트 - 숨김 처리 */}
            {/* <ScoreChart
              aeoScore={analysisData.aeoScore}
              geoScore={analysisData.geoScore}
              seoScore={analysisData.seoScore}
              overallScore={analysisData.overallScore}
              aioAnalysis={analysisData.aioAnalysis}
            /> */}

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
              <ShareButton analysisData={analysisData} url={url} />
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

      {/* AI Agent - Lazy Loading */}
      {analysisData && (
        <Suspense fallback={null}>
          <AIAgent analysisData={analysisData} aioAnalysis={analysisData?.aioAnalysis || null} />
        </Suspense>
      )}
    </div>
  );
}
