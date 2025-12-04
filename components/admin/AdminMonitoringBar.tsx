'use client';

import { useState, useEffect } from 'react';

interface MonitoringData {
  timestamp: string;
  collection: {
    recentHour: number;
    today: number;
    active: number;
  };
  server: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
  };
  currentAnalyses: Array<{
    id: string;
    url: string;
    userEmail: string | null;
    createdAt: string;
  }>;
}

/**
 * 관리자 대시보드 실시간 모니터링 바
 * 상단에 가로로 일렬로 미니멀하게 표시
 */
export default function AdminMonitoringBar() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoring = async () => {
    try {
      const response = await fetch('/api/admin/monitoring', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('모니터링 데이터 조회 실패');
      }

      const monitoringData = await response.json();
      setData(monitoringData);
      setError(null);
    } catch (err: any) {
      console.error('모니터링 데이터 조회 오류:', err);
      setError(err.message || '데이터 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 5초마다 갱신
  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="animate-pulse">모니터링 데이터 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2">
        <div className="flex items-center gap-4 text-sm text-red-600">
          <span>⚠️ 모니터링 오류: {error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-6 text-sm text-gray-700 flex-wrap">
        {/* 수집 상태 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">수집:</span>
          <span className="font-semibold text-blue-600">{data.collection.today}</span>
          <span className="text-gray-400">오늘</span>
          <span className="text-gray-400">|</span>
          <span className="font-semibold text-purple-600">{data.collection.recentHour}</span>
          <span className="text-gray-400">1시간</span>
          {data.collection.active > 0 && (
            <>
              <span className="text-gray-400">|</span>
              <span className="font-semibold text-green-600 animate-pulse">
                {data.collection.active} 진행중
              </span>
            </>
          )}
        </div>

        {/* 서버 상태 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">서버:</span>
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(data.server.status)}`}
            title={data.server.status}
          />
          <span className={data.server.database ? 'text-green-600' : 'text-red-600'}>
            {data.server.database ? 'DB ✓' : 'DB ✗'}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            메모리 {data.server.memory.used}MB ({data.server.memory.percentage}%)
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{formatUptime(data.server.uptime)}</span>
        </div>

        {/* 현재 분석하는 상황 */}
        {data.currentAnalyses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">진행중:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {data.currentAnalyses.slice(0, 3).map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                  title={analysis.url}
                >
                  <span className="truncate max-w-[200px]">{analysis.url}</span>
                  {analysis.userEmail && (
                    <span className="text-gray-500">({analysis.userEmail.split('@')[0]})</span>
                  )}
                </div>
              ))}
              {data.currentAnalyses.length > 3 && (
                <span className="text-gray-500">+{data.currentAnalyses.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>실시간</span>
        </div>
      </div>
    </div>
  );
}

