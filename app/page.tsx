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
    <div className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero 섹션 - 강화된 디자인 */}
        <div className="mb-12 animate-fade-in">
          <div className="mx-auto max-w-4xl">
            {/* Hero 배경 그라데이션 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-8 sm:p-12 shadow-lg">
              {/* 배경 장식 요소 */}
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="mb-4 text-center text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                  <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    AI 검색 시대,
                  </span>
                  <br />
                  <span className="text-gray-900">콘텐츠 최적화를 한 번에</span>
                </h1>
                <p className="mb-8 text-center text-lg sm:text-xl text-gray-700 leading-relaxed">
                  ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는
                  <br />
                  <span className="font-semibold text-sky-600">실전 최적화 도구</span>
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                      className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="분석 시작"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isAnalyzing ? (
                          <>
                            <span className="animate-pulse-slow">●</span>
                            분석 중...
                          </>
                        ) : (
                          <>
                            <span>🚀</span>
                            분석 시작
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
                    </button>
                  </div>
                </div>
                <p className="mt-6 text-center text-sm text-gray-600">
                  ⚡ 30초 안에 종합 진단 완료 · 무료로 시작하기
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 진행 상태 표시 */}
        {isAnalyzing && currentStep !== 'idle' && (
          <div className="mx-auto max-w-4xl mt-6 rounded-xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-6 shadow-md">
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
        
        {/* 에러 표시 */}
        {error && (
          <div className="mx-auto max-w-4xl mt-6 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-6 text-sm text-gray-800 animate-slide-in shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-red-800">{error}</p>
                {retryCount > 0 && (
                  <p className="mt-1 text-xs opacity-75">
                    재시도 횟수: {retryCount}
                  </p>
                )}
              </div>
              <button
                onClick={handleRetry}
                disabled={isAnalyzing}
                className="rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

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

            {/* 종합 점수 - 개선된 디자인 */}
            <div 
              className="group relative overflow-hidden rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50 p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-pointer animate-fade-in"
              onClick={() => setIsChecklistModalOpen(true)}
            >
              {/* 배경 장식 */}
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl group-hover:bg-sky-400/30 transition-colors"></div>
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl group-hover:bg-indigo-400/30 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg">
                      ⭐
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">종합 점수</h3>
                  </div>
                  <p className="mb-2 text-base text-gray-600">
                    AEO, GEO, SEO 점수의 평균
                  </p>
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600">
                    <span>클릭하여 종합 개선 체크리스트 보기</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="mb-2 text-6xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    {Math.round(analysisData.overallScore)}
                  </div>
                  <div className="text-lg font-medium text-gray-500">/ 100</div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold ${
                      analysisData.overallScore >= 80 
                        ? 'bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-800' 
                        : analysisData.overallScore >= 60 
                        ? 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {analysisData.overallScore >= 80 ? '⭐ 우수' : analysisData.overallScore >= 60 ? '✓ 양호' : '⚠ 개선 필요'}
                    </span>
                  </div>
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

        {/* 빈 상태 - 개선된 디자인 */}
        {!analysisData && !isAnalyzing && (
          <div className="mx-auto max-w-2xl py-16">
            <div className="relative">
              {/* 배경 장식 */}
              <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-sky-100/50 blur-2xl"></div>
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-100/50 blur-2xl"></div>
              
              <div className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-sky-50/50 to-indigo-50/50 p-12 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-4xl animate-float">
                    🔍
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900">
                  분석을 시작해보세요!
                </h3>
                <p className="mb-2 text-base text-gray-600">
                  URL을 입력하고 <span className="font-semibold text-sky-600">분석 시작</span> 버튼을 클릭하세요
                </p>
                <p className="text-sm text-gray-500">
                  콘텐츠의 AEO, GEO, SEO 점수를 확인하고 개선 방안을 제시합니다
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                    <span>⚡</span>
                    <span>30초 진단</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                    <span>🤖</span>
                    <span>AI 분석</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                    <span>📊</span>
                    <span>종합 리포트</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
