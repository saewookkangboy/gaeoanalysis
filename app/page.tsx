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
import ComprehensiveChecklistModal from '@/components/ComprehensiveChecklistModal';
import { storage } from '@/lib/storage';
import { fetchWithRetry } from '@/lib/fetch-with-retry';

// 코드 스플리팅: AIAgent는 필요할 때만 로드
// 에러 핸들링을 포함한 안전한 lazy loading
const AIAgent = lazy(() => {
  return import('@/components/AIAgent').catch((error) => {
    console.error('AIAgent chunk 로드 실패:', error);
    // 페이지 새로고침으로 재시도
    if (typeof window !== 'undefined' && error.message?.includes('chunk')) {
      console.warn('Chunk 로드 실패, 페이지를 새로고침합니다...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    // 에러 발생 시 빈 컴포넌트 반환
    return { 
      default: () => (
        <div className="fixed bottom-6 right-6 z-40 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
          <div className="text-sm text-gray-600">
            AI Agent를 불러올 수 없습니다. 페이지를 새로고침해주세요.
          </div>
        </div>
      )
    };
  });
});

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
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  // 새 세션 시작: 페이지 로드 시 이전 분석 결과 초기화
  useEffect(() => {
    // 새로고침 시 항상 새로운 세션으로 시작
    storage.clearAnalysisResult();
    setAnalysisData(null);
    setUrl('');
    setError(null);
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
          const response = await fetch('/api/user/blog-url', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            // 404나 다른 에러는 무시 (블로그 URL이 등록되지 않은 경우)
            if (response.status === 404) {
              console.log('등록된 블로그 URL이 없습니다.');
              return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }

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

              if (!analyzeResponse.ok) {
                const errorData = await analyzeResponse.json().catch(() => ({ error: '분석 중 오류가 발생했습니다.' }));
                const errorMsg = errorData.error?.message || errorData.error || '분석 중 오류가 발생했습니다.';
                setError(errorMsg);
                showToast(errorMsg, 'error');
                return;
              }

              const analyzeData = await analyzeResponse.json();
              setAnalysisData(analyzeData);
              showToast('분석이 완료되었습니다!', 'success');
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              let errorMsg = '분석 중 오류가 발생했습니다.';
              
              if (error.message.includes('fetch failed') || error.message.includes('network')) {
                errorMsg = '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
              }
              
              setError(errorMsg);
              showToast(errorMsg, 'error');
            } finally {
              setIsAnalyzing(false);
            }
          }
        } catch (error) {
          // 네트워크 오류나 기타 오류는 조용히 무시 (사용자 경험을 위해)
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('fetch failed') || errorMessage.includes('network')) {
            console.warn('블로그 URL 로드 실패 (네트워크 오류):', errorMessage);
          } else {
            console.error('블로그 URL 로드 실패:', error);
          }
          // 에러를 표시하지 않음 (블로그 URL이 없을 수도 있으므로)
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
        
        // URL 히스토리만 저장 (분석 결과는 세션 동안만 유지)
        storage.addUrlToHistory(url.trim());
        
        // 로그인된 사용자의 경우 DB에 저장 (API에서 자동 처리됨)
        
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
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* URL 입력 섹션 */}
        <div className="mb-8 animate-fade-in">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-4 text-center text-3xl font-bold text-gray-900">
              블로그 콘텐츠 최적화를 진단하세요!
            </h1>
            <p className="mb-6 text-center text-gray-600">
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
                className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-4">
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
              <div className="mt-4 rounded-md bg-gray-50 border border-gray-300 p-4 text-sm text-gray-800 animate-slide-in">
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
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-black hover:text-white disabled:opacity-50 transition-all"
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
                color="bg-sky-500"
              />
              <ScoreCard
                title="GEO 점수"
                score={analysisData.geoScore}
                color="bg-sky-500"
              />
              <ScoreCard
                title="SEO 점수"
                score={analysisData.seoScore}
                color="bg-sky-500"
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
            <div 
              className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm transition-all hover:shadow-md cursor-pointer"
              onClick={() => setIsChecklistModalOpen(true)}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">종합 점수</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    AEO, GEO, SEO 점수의 평균
                  </p>
                  <p className="mt-2 text-xs text-sky-600 font-medium">
                    클릭하여 종합 개선 체크리스트 보기 →
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-4xl font-bold text-sky-600">
                    {analysisData.overallScore}
                  </div>
                  <div className="text-sm text-gray-500">/ 100</div>
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
          <div className="text-center text-gray-500 py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
            <p className="text-lg font-medium">URL 입력 후, '분석 시작' 을 진행하세요!</p>
            <p className="mt-2 text-sm">
              콘텐츠의 AEO, GEO, SEO 점수를 확인하고 개선 방안을 제시합니다.
              <br />
              <span className="text-gray-500">(특정 블로그는 진단이 어려울 수 있습니다 - 네이버, 브런치 등)</span>
            </p>
        </div>
        )}
      </main>

      {/* AI Agent - Lazy Loading */}
      {analysisData && (
        <Suspense fallback={
          <div className="fixed bottom-6 right-6 z-40">
            <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="animate-pulse">●</span>
                AI Agent 로딩 중...
              </div>
            </div>
          </div>
        }>
          <AIAgent analysisData={analysisData} aioAnalysis={analysisData?.aioAnalysis || null} />
        </Suspense>
      )}

      {/* 종합 개선 체크리스트 모달 */}
      {analysisData && (
        <ComprehensiveChecklistModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          analysisData={analysisData}
        />
      )}
    </div>
  );
}
