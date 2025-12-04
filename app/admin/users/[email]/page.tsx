'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserDetailData {
  found: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    provider: 'google' | 'github' | null;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
  statistics: {
    totalLogins: number;
    successLogins: number;
    failureLogins: number;
    totalAnalyses: number;
    todayLogins: number;
    todayAnalyses: number;
  };
  authLogs: Array<{
    id: string;
    provider: 'google' | 'github';
    action: string;
    success: boolean;
    ipAddress: string | null;
    createdAt: string;
    errorMessage: string | null;
  }>;
  analyses: Array<{
    id: string;
    url: string;
    overallScore: number;
    aeoScore: number;
    geoScore: number;
    seoScore: number;
    chatgptScore: number | null;
    perplexityScore: number | null;
    geminiScore: number | null;
    claudeScore: number | null;
    createdAt: string;
  }>;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const email = decodeURIComponent(params.email as string);

  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
          throw new Error('사용자 정보를 조회할 수 없습니다.');
        }

        const userData = await response.json();
        setData(userData);
      } catch (err: any) {
        console.error('사용자 정보 조회 오류:', err);
        setError(err.message || '사용자 정보를 조회할 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchUserData();
    }
  }, [email]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatProvider = (provider: string | null) => {
    if (!provider) return '-';
    return provider === 'google' ? 'Google' : 'GitHub';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.found) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">사용자를 찾을 수 없습니다</h2>
          <p className="text-red-700 mb-4">
            이메일: <strong>{email}</strong>
          </p>
          <Link
            href="/admin/users"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            사용자 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/users"
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← 사용자 목록으로
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">사용자 상세 정보</h2>
        </div>
      </div>

      {/* 사용자 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">이메일</label>
            <p className="mt-1 text-sm text-gray-900">{data.user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">이름</label>
            <p className="mt-1 text-sm text-gray-900">{data.user.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Provider</label>
            <p className="mt-1 text-sm text-gray-900">{formatProvider(data.user.provider)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Role</label>
            <p className="mt-1">
              {data.user.role === 'admin' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  User
                </span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">가입일</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(data.user.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">최근 로그인</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(data.user.lastLoginAt)}</p>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">총 로그인</h4>
          <p className="text-2xl font-bold text-gray-900">{data.statistics.totalLogins}</p>
          <p className="text-sm text-gray-600 mt-1">
            성공: {data.statistics.successLogins} / 실패: {data.statistics.failureLogins}
          </p>
          <p className="text-xs text-gray-500 mt-1">오늘: {data.statistics.todayLogins}회</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">총 분석</h4>
          <p className="text-2xl font-bold text-gray-900">{data.statistics.totalAnalyses}</p>
          <p className="text-xs text-gray-500 mt-1">오늘: {data.statistics.todayAnalyses}회</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">상태</h4>
          <p className="mt-1">
            {data.user.isActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                활성
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                비활성
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 로그인 이력 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">로그인 이력 (최근 20건)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜/시간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP 주소</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">오류</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.authLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    로그인 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                data.authLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatProvider(log.provider)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.success ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          성공
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          실패
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {log.errorMessage || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 분석 결과 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">분석 결과 (최근 20건)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜/시간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AEO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GEO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SEO</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.analyses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    분석 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                data.analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(analysis.createdAt)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {analysis.overallScore.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analysis.aeoScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analysis.geoScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analysis.seoScore}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

