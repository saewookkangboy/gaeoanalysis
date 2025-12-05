'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StatisticsData {
  overview: {
    totalUsers: number;
    totalAnalyses: number;
    totalLogins: number;
    totalChats: number;
  };
  today: {
    newUsers: number;
    analyses: number;
    logins: number;
    chats: number;
  };
  averages: {
    aeoScore: number;
    geoScore: number;
    seoScore: number;
    overallScore: number;
  };
  trends: {
    dailyUsers: Array<{ date: string; count: number }>;
    dailyAnalyses: Array<{ date: string; count: number }>;
    dailyLogins: Array<{ date: string; count: number }>;
  };
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 날짜 기본값 설정
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  // 통계 데이터 조회
  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        params.append('endDate', `${endDate}T23:59:59.999Z`);
      }

      const response = await fetch(`/api/admin/statistics?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '통계 데이터를 조회할 수 없습니다.');
      }

      const data = await response.json();
      setStatistics(data);
    } catch (err: any) {
      console.error('통계 데이터 조회 오류:', err);
      setError(err.message || '통계 데이터를 조회할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [startDate, endDate]);

  // 페이지 로드 시 자동으로 데이터 새로고침 (5분마다)
  useEffect(() => {
    if (startDate && endDate) {
      const interval = setInterval(() => {
        fetchStatistics();
      }, 5 * 60 * 1000); // 5분마다 자동 갱신

      return () => clearInterval(interval);
    }
  }, [startDate, endDate]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !statistics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">통계 대시보드</h2>
          <Link
            href="/admin"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← 대시보드로
          </Link>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">통계 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">통계 대시보드</h2>
          <p className="mt-1 text-sm text-gray-600">
            전체 통계, 오늘의 활동, 평균 점수 및 트렌드를 확인합니다.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← 대시보드로
        </Link>
      </div>

      {/* 날짜 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchStatistics}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              조회
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {statistics && (
        <>
          {/* 전체 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 사용자</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatNumber(statistics.overview.totalUsers)}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 분석</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatNumber(statistics.overview.totalAnalyses)}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 로그인</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatNumber(statistics.overview.totalLogins)}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 채팅</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatNumber(statistics.overview.totalChats)}
                  </p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 오늘의 활동 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 활동</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{formatNumber(statistics.today.newUsers)}</p>
                <p className="text-sm text-gray-600 mt-1">신규 사용자</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatNumber(statistics.today.analyses)}</p>
                <p className="text-sm text-gray-600 mt-1">분석</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{formatNumber(statistics.today.logins)}</p>
                <p className="text-sm text-gray-600 mt-1">로그인</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(statistics.today.chats)}</p>
                <p className="text-sm text-gray-600 mt-1">채팅</p>
              </div>
            </div>
          </div>

          {/* 평균 점수 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">평균 점수</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.averages.overallScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 mt-1">총점</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.averages.aeoScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 mt-1">AEO</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.averages.geoScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 mt-1">GEO</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.averages.seoScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 mt-1">SEO</p>
              </div>
            </div>
          </div>

          {/* 트렌드 (일별 통계) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 트렌드</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      신규 사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      분석 수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      로그인 수
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statistics.trends.dailyUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        트렌드 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    // 날짜별로 병합하여 표시
                    Array.from(new Set([
                      ...statistics.trends.dailyUsers.map(d => d.date),
                      ...statistics.trends.dailyAnalyses.map(d => d.date),
                      ...statistics.trends.dailyLogins.map(d => d.date),
                    ])).sort().map((date) => {
                      const users = statistics.trends.dailyUsers.find(d => d.date === date)?.count || 0;
                      const analyses = statistics.trends.dailyAnalyses.find(d => d.date === date)?.count || 0;
                      const logins = statistics.trends.dailyLogins.find(d => d.date === date)?.count || 0;
                      
                      return (
                        <tr key={date} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(users)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(analyses)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(logins)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
