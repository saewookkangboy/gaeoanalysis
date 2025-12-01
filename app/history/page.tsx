'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScoreCard from '@/components/ScoreCard';
import AIOCitationCards from '@/components/AIOCitationCards';
import InsightList from '@/components/InsightList';
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchHistories();
    }
  }, [status, router]);

  const fetchHistories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/history');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }));
        console.error('이력 조회 실패:', {
          status: response.status,
          error: errorData.error || '서버 오류'
        });
        setHistories([]);
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
      
      setHistories(analyses);
    } catch (error) {
      console.error('❌ 이력 조회 오류:', error);
      setHistories([]);
    } finally {
      setLoading(false);
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (selectedHistory && analysisData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => {
                  setSelectedHistory(null);
                  setAnalysisData(null);
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

          {/* 분석 결과 */}
          <div className="space-y-6">
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

            {/* 종합 점수 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">종합 점수</h3>
                  <p className="mt-1 text-sm text-gray-500">AEO, GEO, SEO 점수의 평균</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">
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

            {/* 개선 가이드 */}
            <InsightList insights={analysisData.insights} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">분석 이력</h1>
          <Link
            href="/"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            새 분석하기
          </Link>
        </div>

        {histories.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="mb-2 text-lg font-medium text-gray-900">저장된 분석 이력이 없습니다</p>
            <p className="mb-4 text-sm text-gray-600">
              분석을 수행하면 여기에 이력이 저장됩니다.
            </p>
            <Link
              href="/"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              첫 분석을 시작해보세요 →
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{histories.length}</span>개의 분석 이력이 있습니다.
            </div>
            <div className="space-y-4">
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
                    className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    상세 보기
                  </button>
                </div>
              </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

