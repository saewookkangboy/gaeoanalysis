'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SubscriptionInfo {
  id: string;
  userId: string;
  userEmail: string;
  planType: 'free' | 'pro' | 'business';
  status: 'active' | 'cancelled' | 'expired';
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsageInfo {
  analysis: { used: number; limit: number };
  chat: { used: number; limit: number };
  export: { used: number; limit: number };
}

interface SubscriptionWithUsage extends SubscriptionInfo {
  usage: UsageInfo;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'free' | 'pro' | 'business'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all');
  const [search, setSearch] = useState<string>('');

  // 구독 목록 조회
  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('planType', filter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '구독 목록을 조회할 수 없습니다.');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      console.error('구독 목록 조회 오류:', err);
      setError(err.message || '구독 목록을 조회할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [filter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscriptions();
  };

  const handlePlanChange = async (subscriptionId: string, newPlanType: 'free' | 'pro' | 'business') => {
    if (!confirm(`플랜을 ${newPlanType.toUpperCase()}로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: newPlanType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '플랜 변경에 실패했습니다.');
      }

      alert('플랜이 변경되었습니다.');
      fetchSubscriptions();
    } catch (err: any) {
      alert(`플랜 변경 실패: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
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

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'business':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">구독 관리</h1>
        <p className="mt-2 text-gray-600">
          사용자 구독 정보 및 사용량을 관리합니다.
        </p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              플랜 필터
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">전체</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태 필터
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="cancelled">취소됨</option>
              <option value="expired">만료됨</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일 검색
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이메일로 검색..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                검색
              </button>
            </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 구독 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  플랜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용량
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    구독 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/users/${encodeURIComponent(subscription.userEmail)}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {subscription.userEmail}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(subscription.planType)}`}>
                        {subscription.planType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(subscription.status)}`}>
                        {subscription.status === 'active' ? '활성' : 
                         subscription.status === 'cancelled' ? '취소됨' : '만료됨'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(subscription.periodStart)}</div>
                      <div className="text-xs">~ {formatDate(subscription.periodEnd)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <div>
                          분석: {subscription.usage.analysis.used} / {subscription.usage.analysis.limit === -1 ? '∞' : subscription.usage.analysis.limit}
                        </div>
                        <div>
                          챗봇: {subscription.usage.chat.used} / {subscription.usage.chat.limit === -1 ? '∞' : subscription.usage.chat.limit}
                        </div>
                        <div>
                          내보내기: {subscription.usage.export.used} / {subscription.usage.export.limit === -1 ? '∞' : subscription.usage.export.limit}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {subscription.planType !== 'free' && (
                          <button
                            onClick={() => handlePlanChange(subscription.id, 'free')}
                            className="text-gray-600 hover:text-gray-800"
                            title="Free로 변경"
                          >
                            Free
                          </button>
                        )}
                        {subscription.planType !== 'pro' && (
                          <button
                            onClick={() => handlePlanChange(subscription.id, 'pro')}
                            className="text-blue-600 hover:text-blue-800"
                            title="Pro로 변경"
                          >
                            Pro
                          </button>
                        )}
                        {subscription.planType !== 'business' && (
                          <button
                            onClick={() => handlePlanChange(subscription.id, 'business')}
                            className="text-purple-600 hover:text-purple-800"
                            title="Business로 변경"
                          >
                            Business
                          </button>
                        )}
                      </div>
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

