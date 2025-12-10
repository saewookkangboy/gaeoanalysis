'use client';

import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import LoginRequiredModal from '@/components/LoginRequiredModal';
import Tooltip from '@/components/Tooltip';
import NetworkStatus from '@/components/NetworkStatus';
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

function HomeContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 새 세션 시작: 페이지 로드 시 이전 분석 결과 초기화
  useEffect(() => {
    // 새로고침 시 항상 새로운 세션으로 시작
    storage.clearAnalysisResult();
    setAnalysisData(null);
    setUrl('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 분석 단계 정의 (예상 소요 시간 포함)
  const analysisSteps = [
    { 
      label: 'URL 가져오기', 
      completed: false,
      description: '웹페이지를 가져오는 중...',
      estimatedTime: 2
    },
    { 
      label: 'HTML 파싱', 
      completed: false,
      description: '콘텐츠를 분석하는 중...',
      estimatedTime: 3
    },
    { 
      label: '점수 계산', 
      completed: false,
      description: '점수를 계산하는 중...',
      estimatedTime: 5
    },
    { 
      label: 'AI 분석', 
      completed: false,
      description: 'AI가 콘텐츠를 평가하는 중...',
      estimatedTime: 15
    },
  ];

  // 예상 소요 시간 계산
  const calculateEstimatedTime = (step: AnalysisStep): number => {
    const stepIndex = step === 'fetching' ? 0 : step === 'parsing' ? 1 : step === 'analyzing' ? 2 : 3;
    let total = 0;
    for (let i = 0; i <= stepIndex; i++) {
      total += analysisSteps[i]?.estimatedTime || 0;
    }
    return total;
  };

  // 로그인 완료 후 자동 분석 시작 (URL 파라미터 확인)
  useEffect(() => {
    const handleAutoAnalyze = async () => {
      const intent = searchParams?.get('intent');
      const urlParam = searchParams?.get('url');

      // 로그인 상태이고 분석 의도가 있으며 URL이 있는 경우
      if (session?.user && intent === 'analyze' && urlParam) {
        const decodedUrl = decodeURIComponent(urlParam);
        
        // URL 설정
        setUrl(decodedUrl);
        
        // URL 파라미터 정리 (히스토리 정리)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('intent');
        newUrl.searchParams.delete('url');
        window.history.replaceState({}, '', newUrl.toString());
        
        // 약간의 지연 후 분석 시작 (URL 설정이 완료된 후)
        setTimeout(() => {
          handleAnalyze();
        }, 100);
      }
    };

    handleAutoAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, searchParams]);

  // 로그인 시 등록된 블로그 URL 자동 로드 및 분석
  useEffect(() => {
    const loadBlogUrlAndAnalyze = async () => {
      // URL 파라미터가 있으면 자동 분석 로직이 처리하므로 스킵
      const intent = searchParams?.get('intent');
      if (intent === 'analyze') {
        return;
      }

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

  // 분석 취소 핸들러
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setCurrentStep('idle');
    setError(null);
    setElapsedTime(0);
    setEstimatedTime(0);
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
    showToast('분석이 취소되었습니다.', 'info');
  };

  // 네비게이션 가드 (분석 중 페이지 이동 시 경고)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAnalyzing) {
        e.preventDefault();
        e.returnValue = '분석이 진행 중입니다. 정말 나가시겠습니까?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAnalyzing]);

  // 경과 시간 추적
  useEffect(() => {
    if (isAnalyzing) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      timeIntervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isAnalyzing]);

  const handleAnalyze = async (retry = false) => {
    if (!url.trim()) {
      const errorMsg = 'URL을 입력해주세요.';
      setError(errorMsg);
      showToast(errorMsg, 'warning');
      return;
    }

    // 로그인 상태 확인
    if (!session?.user) {
      setIsLoginModalOpen(true);
      return;
    }

    // 이전 분석 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

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
      setEstimatedTime(calculateEstimatedTime('fetching'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setCurrentStep('parsing');
      setEstimatedTime(calculateEstimatedTime('parsing'));
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setCurrentStep('analyzing');
      setEstimatedTime(calculateEstimatedTime('analyzing'));

      // 재시도 로직이 포함된 fetch (AbortSignal 지원)
      const response = await fetchWithRetry('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        maxRetries: 3,
        retryDelay: 1000,
        signal: abortControllerRef.current?.signal,
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentStep('complete');
        setAnalysisData(data);
        
        // URL 히스토리만 저장 (분석 결과는 세션 동안만 유지)
        storage.addUrlToHistory(url.trim());
        
        // 로그인된 사용자의 경우 DB에 저장 (API에서 자동 처리됨)
        // 이력 조회를 즉시 새로고침하기 위한 이벤트 발생
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('analysisCompleted', { 
            detail: { url: url.trim(), analysisId: data.id } 
          }));
        }
        
        showToast('분석이 완료되었습니다!', 'success');
        setRetryCount(0);
      } else {
        // 에러 타입별 처리 (해결 방법 포함)
        const errorCode = data.error?.code || 'UNKNOWN_ERROR';
        let errorMsg = data.error?.message || '분석 중 오류가 발생했습니다.';
        let solution = '';
        
        if (errorCode === 'RATE_LIMIT_EXCEEDED') {
          errorMsg = '요청 한도를 초과했습니다.';
          solution = '잠시 후 다시 시도해주세요 (약 1분 후).';
        } else if (errorCode === 'NETWORK_ERROR') {
          errorMsg = '네트워크 연결에 실패했습니다.';
          solution = '인터넷 연결을 확인하고 페이지를 새로고침한 후 다시 시도해주세요.';
        } else if (errorCode === 'TIMEOUT_ERROR') {
          errorMsg = '요청 시간이 초과되었습니다.';
          solution = '네트워크 상태를 확인하고 다시 시도해주세요.';
        } else {
          solution = '잠시 후 다시 시도하거나 페이지를 새로고침해주세요.';
        }
        
        setError(`${errorMsg} ${solution}`);
        showToast(`${errorMsg} ${solution}`, 'error');
        setCurrentStep('idle');
      }
    } catch (err) {
      // AbortError는 취소된 것으로 간주
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      let errorMsg = '분석 중 오류가 발생했습니다.';
      let solution = '';
      
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        errorMsg = '네트워크 연결에 실패했습니다.';
        solution = '인터넷 연결을 확인하고 페이지를 새로고침한 후 다시 시도해주세요.';
      } else if (error.message.includes('timeout')) {
        errorMsg = '요청 시간이 초과되었습니다.';
        solution = '네트워크 상태를 확인하고 다시 시도해주세요.';
      } else {
        solution = '잠시 후 다시 시도하거나 페이지를 새로고침해주세요.';
      }
      
      setError(`${errorMsg} ${solution}`);
      showToast(`${errorMsg} ${solution}`, 'error');
      setCurrentStep('idle');
    } finally {
      setIsAnalyzing(false);
      setElapsedTime(0);
      setEstimatedTime(0);
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    handleAnalyze(true);
  };

  return (
    <div className="flex-1 bg-white">
      <NetworkStatus />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Hero 섹션 - 강화된 반응형 디자인 */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="mx-auto max-w-4xl">
            {/* Hero 배경 그라데이션 */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6 sm:p-8 md:p-12 shadow-lg">
              {/* 배경 장식 요소 - 모바일에서 숨김 */}
              <div className="hidden sm:block absolute -top-20 -right-20 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl"></div>
              <div className="hidden sm:block absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight px-2">
                  <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    AI 검색 시대, 콘텐츠 최적화를 한 번에
                  </span>
                </h1>
                <p className="mb-6 sm:mb-8 text-center text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed px-2">
                  ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 <span className="font-semibold text-sky-600">실전 최적화 도구</span>
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto max-w-6xl">
                    <div className="flex-1 min-w-0">
                      <UrlInput
                        value={url}
                        onChange={setUrl}
                        onAnalyze={() => handleAnalyze()}
                        disabled={isAnalyzing}
                        showHistory={true}
                      />
                    </div>
                    <Tooltip 
                      content={!url.trim() ? "URL을 입력해주세요" : isAnalyzing ? "분석이 진행 중입니다" : ""}
                      disabled={!(!url.trim() || isAnalyzing)}
                    >
                      <div className="flex flex-col sm:flex-row gap-2">
                        {isAnalyzing ? (
                          <button
                            onClick={handleCancel}
                            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-500 to-pink-500 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 whitespace-nowrap"
                            aria-label="분석 취소"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <span>✕</span>
                              취소
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAnalyze()}
                            disabled={isAnalyzing || !url.trim()}
                            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                            aria-label="분석 시작"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              <span>🚀</span>
                              분석 시작
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-sky-700 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
                          </button>
                        )}
                      </div>
                    </Tooltip>
                  </div>
                </div>
                <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 px-2">
                  ⚡ 30초 안에 종합 진단 완료 · 무료로 시작하기
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 진행 상태 표시 */}
        {isAnalyzing && currentStep !== 'idle' && (
          <div className="mx-auto max-w-4xl mt-4 sm:mt-6 rounded-xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-4 sm:p-6 shadow-md">
            <ProgressBar
              steps={analysisSteps}
              currentStep={
                currentStep === 'fetching' ? 0 :
                currentStep === 'parsing' ? 1 :
                currentStep === 'analyzing' ? 2 : 3
              }
              estimatedTime={estimatedTime}
              elapsedTime={elapsedTime}
            />
            {retryCount > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2">
                <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">
                  재시도 중... ({retryCount}/3)
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* 에러 표시 */}
        {error && (
          <div className="mx-auto max-w-4xl mt-4 sm:mt-6 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-4 sm:p-6 text-sm text-gray-800 animate-slide-in shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="font-semibold text-red-800 whitespace-pre-line">
                      {error.split('\n').map((line, index) => (
                        <p key={index} className={index > 0 ? 'mt-2' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                    {retryCount > 0 && (
                      <p className="mt-2 text-xs text-red-700 opacity-75">
                        재시도 횟수: {retryCount}/3
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleRetry}
                disabled={isAnalyzing}
                className="w-full sm:w-auto rounded-lg border-2 border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 transition-all whitespace-nowrap"
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

            {/* 종합 점수 - 개선된 반응형 디자인 */}
            <div 
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50 p-6 sm:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] cursor-pointer animate-fade-in"
              onClick={() => setIsChecklistModalOpen(true)}
            >
              {/* 배경 장식 - 모바일에서 숨김 */}
              <div className="hidden sm:block absolute -top-20 -right-20 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl group-hover:bg-sky-400/30 transition-colors"></div>
              <div className="hidden sm:block absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-indigo-300/20 blur-3xl group-hover:bg-indigo-400/30 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg text-sm sm:text-base">
                      ⭐
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">종합 점수</h3>
                  </div>
                  <p className="mb-2 text-sm sm:text-base text-gray-600">
                    AEO, GEO, SEO 점수의 평균
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-600">
                    <span>클릭하여 종합 개선 체크리스트 보기</span>
                    <span className="hidden sm:inline transition-transform group-hover:translate-x-1">→</span>
                  </p>
                </div>
                <div className="w-full sm:w-auto text-center sm:text-right">
                  <div className="mb-2 text-5xl sm:text-6xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    {Math.round(analysisData.overallScore)}
                  </div>
                  <div className="text-base sm:text-lg font-medium text-gray-500">/ 100</div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold ${
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
          <div className="mx-auto max-w-2xl py-6">
            <div className="relative">
              {/* 배경 장식 */}
              <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-sky-100/50 blur-2xl animate-pulse-slow"></div>
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-100/50 blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
              
              <div className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-sky-50/50 to-indigo-50/50 p-10 text-center shadow-lg">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-4xl animate-float shadow-md">
                    🔍
                  </div>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  분석을 시작해보세요!
                </h3>
                <p className="mb-1.5 text-base text-gray-600">
                  URL을 입력하고 <span className="font-semibold text-sky-600">분석 시작</span> 버튼을 클릭하세요
                </p>
                <p className="text-sm text-gray-500">
                  콘텐츠의 AEO, GEO, SEO 점수를 확인하고 개선 방안을 제시합니다
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <div className="group flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 hover:shadow-md hover:scale-105">
                    <span className="text-lg transition-transform group-hover:scale-110">⚡</span>
                    <span>30초 진단</span>
                  </div>
                  <div className="group flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 hover:shadow-md hover:scale-105">
                    <span className="text-lg transition-transform group-hover:scale-110">🤖</span>
                    <span>AI 분석</span>
                  </div>
                  <div className="group flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 hover:shadow-md hover:scale-105">
                    <span className="text-lg transition-transform group-hover:scale-110">📊</span>
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

      {/* 로그인 안내 모달 */}
      <LoginRequiredModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(provider) => {
          setIsLoginModalOpen(false);
          // 로그인 페이지로 리디렉션 (URL 파라미터 포함)
          const params = new URLSearchParams();
          params.set('intent', 'analyze');
          if (url.trim()) {
            params.set('url', encodeURIComponent(url.trim()));
          }
          router.push(`/login?${params.toString()}`);
        }}
        url={url}
      />
    </div>
  );
}

export default function Home(): React.ReactElement {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl">로딩 중...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
