'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScoreCard from '@/components/ScoreCard';
import AIOCitationCards from '@/components/AIOCitationCards';
import InsightList from '@/components/InsightList';
import ContentGuidelines from '@/components/ContentGuidelines';
import CopyButton from '@/components/CopyButton';
import ShareButton from '@/components/ShareButton';
import ComprehensiveChecklistModal from '@/components/ComprehensiveChecklistModal';
import { AnalysisResult } from '@/lib/analyzer';
import { AIOCitationAnalysis } from '@/lib/ai-citation-analyzer';

interface HistoryItem {
  id: string;
  url: string;
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  insights: any[];
  aioScores?: {
    chatgpt: number | null;
    perplexity: number | null;
    grok: number | null;
    gemini: number | null;
    claude: number | null;
  };
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchHistories();
    }
  }, [status, router]);

  // 분석 완료 이벤트 리스너 (분석 완료 후 즉시 이력 새로고침)
  useEffect(() => {
    const handleAnalysisCompleted = () => {
      // 분석 완료 후 즉시 이력 새로고침 (대기 시간 제거)
      // 로딩 표시 없이 백그라운드에서 새로고침
      fetchHistories(false);
    };

    window.addEventListener('analysisCompleted', handleAnalysisCompleted);
    
    // 페이지 포커스 시 자동 새로고침 (다른 탭에서 분석 완료 후 돌아온 경우)
    const handleFocus = () => {
      fetchHistories(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('analysisCompleted', handleAnalysisCompleted);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchHistories = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // 캐시 무효화를 위해 timestamp 추가
      const response = await fetch(`/api/history?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }));
        console.error('이력 조회 실패:', {
          status: response.status,
          error: errorData.error || '서버 오류'
        });
        // 에러 발생 시에도 기존 이력 유지 (낙관적 업데이트)
        return;
      }
      
      const data = await response.json();
      const analyses = data.analyses || [];
      
      console.log('✅ 분석 이력 조회 성공:', {
        count: analyses.length,
        analyses: analyses.map((a: HistoryItem) => ({
          id: a.id,
          url: a.url,
          createdAt: a.createdAt
        }))
      });
      
      // 즉시 UI 업데이트 (낙관적 업데이트)
      setHistories(analyses);
    } catch (error) {
      console.error('❌ 이력 조회 오류:', error);
      // 에러 발생 시에도 기존 이력 유지
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = (history: HistoryItem) => {
    setSelectedHistory(history);
    
    // AI 인용 확률 분석 데이터 재구성
    let aioAnalysis: AIOCitationAnalysis | undefined;
    if (history.aioScores) {
      const scores = {
        chatgpt: history.aioScores.chatgpt || 0,
        perplexity: history.aioScores.perplexity || 0,
        grok: history.aioScores.grok || 0,
        gemini: history.aioScores.gemini || 0,
        claude: history.aioScores.claude || 0,
      };
      
      // 간단한 insights 생성 (실제로는 저장된 데이터를 사용해야 함)
      aioAnalysis = {
        scores,
        insights: [
          {
            model: 'chatgpt' as const,
            score: scores.chatgpt,
            level: scores.chatgpt >= 80 ? 'High' : scores.chatgpt >= 60 ? 'Medium' : 'Low',
            recommendations: [
              '구조화된 데이터(JSON-LD)를 추가하여 AI가 콘텐츠를 더 잘 이해할 수 있도록 하세요',
              'FAQ 섹션을 추가하여 사용자의 질문에 직접적으로 답변할 수 있는 콘텐츠를 제공하세요',
            ],
          },
          {
            model: 'perplexity' as const,
            score: scores.perplexity,
            level: scores.perplexity >= 80 ? 'High' : scores.perplexity >= 60 ? 'Medium' : 'Low',
            recommendations: [
              '콘텐츠 업데이트 날짜를 명시하여 최신 정보임을 명확히 하세요',
              '출처 링크와 참고 자료를 추가하여 신뢰성을 높이세요',
            ],
          },
          {
            model: 'grok' as const,
            score: scores.grok,
            level: scores.grok >= 80 ? 'High' : scores.grok >= 60 ? 'Medium' : 'Low',
            recommendations: [
              '최신 날짜와 시간 정보를 명시하여 최신성을 강조하세요',
              '요약 또는 핵심 정리 섹션을 추가하세요',
            ],
          },
          {
            model: 'gemini' as const,
            score: scores.gemini,
            level: scores.gemini >= 80 ? 'High' : scores.gemini >= 60 ? 'Medium' : 'Low',
            recommendations: [
              '이미지와 비디오를 추가하여 시각적 정보를 풍부하게 하세요',
              '표와 리스트를 활용하여 정보를 구조화하고 가독성을 높이세요',
            ],
          },
          {
            model: 'claude' as const,
            score: scores.claude,
            level: scores.claude >= 80 ? 'High' : scores.claude >= 60 ? 'Medium' : 'Low',
            recommendations: [
              '콘텐츠를 더 상세하고 포괄적으로 작성하여 깊이 있는 정보를 제공하세요',
              '섹션을 추가하여 구조를 명확히 하고 독자가 쉽게 이해할 수 있도록 하세요',
            ],
          },
        ],
      };
    }

    setAnalysisData({
      aeoScore: history.aeoScore,
      geoScore: history.geoScore,
      seoScore: history.seoScore,
      overallScore: history.overallScore,
      insights: history.insights,
      aioAnalysis,
    });
  };

  // 스켈레톤 UI 컴포넌트
  const HistorySkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 h-5 w-3/4 bg-gray-200 rounded"></div>
              <div className="mb-3 flex gap-4">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="ml-4 h-10 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (status === 'loading') {
    return (
      <div className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">분석 이력</h1>
          </div>
          <HistorySkeleton />
        </div>
      </div>
    );
  }

  if (loading && histories.length === 0) {
    return (
      <div className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">분석 이력</h1>
          </div>
          <HistorySkeleton />
        </div>
      </div>
    );
  }

  if (selectedHistory && analysisData) {
    return (
      <div className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => {
                  setSelectedHistory(null);
                  setAnalysisData(null);
                  setIsChecklistModalOpen(false);
                }}
                className="mb-2 text-sm text-blue-600 hover:text-blue-700"
              >
                ← 이력 목록으로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">분석 상세</h1>
              <p className="mt-1 text-sm text-gray-600">{selectedHistory.url}</p>
              <p className="text-xs text-gray-500">
                {new Date(selectedHistory.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>

          {/* 분석 결과 섹션 - 실제 분석 결과와 동일한 포맷 */}
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
              <ShareButton analysisData={analysisData} url={selectedHistory.url} />
              <CopyButton analysisData={analysisData} url={selectedHistory.url} />
            </div>

            {/* 개선 가이드 */}
            <InsightList insights={analysisData.insights} />

            {/* 콘텐츠 작성 가이드라인 */}
            <ContentGuidelines analysisData={analysisData} />
          </div>

          {/* 종합 개선 체크리스트 모달 */}
          {analysisData && (
            <ComprehensiveChecklistModal
              isOpen={isChecklistModalOpen}
              onClose={() => setIsChecklistModalOpen(false)}
              analysisData={analysisData}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">분석 이력</h1>
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <span>🚀</span>
            새 분석하기
          </Link>
        </div>

        {histories.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-sky-50/50 to-indigo-50/50 p-16 text-center">
            {/* 배경 장식 */}
            <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-sky-100/50 blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-100/50 blur-2xl"></div>
            
            <div className="relative">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-4xl animate-float">
                  📋
                </div>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">
                저장된 분석 이력이 없습니다
              </h3>
              <p className="mb-6 text-base text-gray-600">
                분석을 수행하면 여기에 이력이 저장됩니다
              </p>
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                <span>🚀</span>
                첫 분석을 시작해보세요
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{histories.length}</span>개의 분석 이력이 있습니다.
              </div>
              <button
                onClick={() => fetchHistories()}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="새로고침"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                {loading ? '새로고침 중...' : '새로고침'}
              </button>
            </div>
            {loading && histories.length > 0 && <HistorySkeleton />}
            <div className={`space-y-4 ${loading && histories.length > 0 ? 'hidden' : ''}`}>
              {histories.map((history) => (
              <div
                key={history.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-gray-900">
                      <a
                        href={history.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {history.url}
                      </a>
                    </h3>
                    <div className="mb-3 flex gap-4 text-sm text-gray-600">
                      <span>AEO: {history.aeoScore}</span>
                      <span>GEO: {history.geoScore}</span>
                      <span>SEO: {history.seoScore}</span>
                      <span className="font-semibold">종합: {history.overallScore}</span>
                    </div>
                    {history.aioScores && (
                      <div className="mb-3 flex gap-4 text-xs text-gray-500">
                        <span>ChatGPT: {history.aioScores.chatgpt || 'N/A'}</span>
                        <span>Perplexity: {history.aioScores.perplexity || 'N/A'}</span>
                        <span>Grok: {history.aioScores.grok || 'N/A'}</span>
                        <span>Gemini: {history.aioScores.gemini || 'N/A'}</span>
                        <span>Claude: {history.aioScores.claude || 'N/A'}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(history.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDetails(history)}
                    className="ml-4 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
                  >
                    상세 보기
                  </button>
                </div>
              </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
