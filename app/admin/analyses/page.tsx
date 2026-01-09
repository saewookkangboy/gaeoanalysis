'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnalysisInfo {
  id: string;
  userId: string | null;
  userEmail: string | null;
  url: string;
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  chatgptScore: number | null;
  perplexityScore: number | null;
  grokScore: number | null;
  geminiScore: number | null;
  claudeScore: number | null;
  insights: any[];
  createdAt: string;
}

interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<AnalysisInfo[]>([]);
  const [pagination, setPagination] = useState<PaginationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2025-12-04');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // 날짜 기본값 설정 (2025-12-04 06:00 이후)
  useEffect(() => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);
    // 시작일은 2025-12-04로 고정
    setStartDate('2025-12-04');
  }, []);

  // 분석 결과 조회
  const fetchAnalyses = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (startDate) {
        params.append('startDate', `${startDate}T06:00:00.000Z`);
      }
      if (endDate) {
        params.append('endDate', `${endDate}T23:59:59.999Z`);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/analyses?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '분석 결과를 조회할 수 없습니다.');
      }

      const data = await response.json();
      setAnalyses(data.analyses || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      console.error('분석 결과 조회 오류:', err);
      setError(err.message || '분석 결과를 조회할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalyses();
    }
  }, [startDate, endDate, currentPage]);

  // 페이지 로드 시 자동으로 데이터 새로고침 (5분마다)
  useEffect(() => {
    if (startDate && endDate) {
      const interval = setInterval(() => {
        fetchAnalyses();
      }, 5 * 60 * 1000); // 5분마다 자동 갱신

      return () => clearInterval(interval);
    }
  }, [startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAnalyses();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '-';
    return `${score}점`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatInsights = (insights: any[]) => {
    if (!insights || insights.length === 0) return '-';
    return insights.slice(0, 3).map((insight: any) => insight.title || insight.message || insight).join(', ') + (insights.length > 3 ? '...' : '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">분석 결과</h2>
          <p className="mt-1 text-sm text-gray-600">
            2025년 12월 4일 06:00 이후의 모든 분석 결과를 조회합니다.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← 대시보드로
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL 검색
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="URL 입력..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료일
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              검색
            </button>
          </div>
        </form>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">분석 결과를 불러오는 중...</p>
        </div>
      )}

      {/* 분석 결과 목록 */}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      분석일시
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총점
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AEO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GEO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SEO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI 인용 점수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주요 진단 결과
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        분석 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    analyses.map((analysis) => (
                      <tr key={analysis.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(analysis.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.userEmail || '알 수 없음'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <a
                            href={analysis.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 truncate max-w-xs block"
                            title={analysis.url}
                          >
                            {analysis.url}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={getScoreColor(analysis.overallScore)}>
                            {analysis.overallScore.toFixed(1)}점
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.aeoScore}점
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.geoScore}점
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {analysis.seoScore}점
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="space-y-1">
                            {analysis.chatgptScore !== null && (
                              <div>ChatGPT: {formatScore(analysis.chatgptScore)}</div>
                            )}
                            {analysis.perplexityScore !== null && (
                              <div>Perplexity: {formatScore(analysis.perplexityScore)}</div>
                            )}
                            {analysis.grokScore !== null && (
                              <div>Grok: {formatScore(analysis.grokScore)}</div>
                            )}
                            {analysis.geminiScore !== null && (
                              <div>Gemini: {formatScore(analysis.geminiScore)}</div>
                            )}
                            {analysis.claudeScore !== null && (
                              <div>Claude: {formatScore(analysis.claudeScore)}</div>
                            )}
                            {analysis.chatgptScore === null && analysis.perplexityScore === null && 
                             analysis.grokScore === null && analysis.geminiScore === null && 
                             analysis.claudeScore === null && (
                              <div>-</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          <div className="truncate" title={formatInsights(analysis.insights)}>
                            {formatInsights(analysis.insights)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow px-4 py-3">
              <div className="text-sm text-gray-700">
                총 {pagination.total.toLocaleString()}개 중{' '}
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}개
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
