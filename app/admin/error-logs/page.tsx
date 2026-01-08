'use client';

import { useState, useEffect } from 'react';

interface ErrorLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  component_stack: string | null;
  url: string | null;
  user_agent: string | null;
  ip_address: string | null;
  metadata: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: number;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [filters, setFilters] = useState({
    severity: '',
    resolved: '',
    error_type: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // 에러 로그 조회
  const fetchErrorLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (filters.severity) params.append('severity', filters.severity);
      if (filters.resolved) params.append('resolved', filters.resolved);
      if (filters.error_type) params.append('error_type', filters.error_type);

      const response = await fetch(`/api/admin/error-logs?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '에러 로그를 조회할 수 없습니다.');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      console.error('에러 로그 조회 오류:', err);
      setError(err.message || '에러 로그를 조회할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 에러 로그 해결 처리
  const handleResolve = async (logId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/admin/error-logs/${logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '에러 로그 처리에 실패했습니다.');
      }

      // 목록 새로고침
      await fetchErrorLogs();
    } catch (err: any) {
      alert(err.message || '에러 로그 처리에 실패했습니다.');
    }
  };

  // 에러 로그 삭제
  const handleDelete = async (logId: string) => {
    if (!confirm('정말 이 에러 로그를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/error-logs/${logId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '에러 로그 삭제에 실패했습니다.');
      }

      // 목록 새로고침
      await fetchErrorLogs();
    } catch (err: any) {
      alert(err.message || '에러 로그 삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, [currentPage, filters]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getErrorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      type_error: '타입 오류',
      reference_error: '참조 오류',
      syntax_error: '문법 오류',
      network_error: '네트워크 오류',
      timeout_error: '타임아웃 오류',
      runtime_error: '실행 오류',
      unknown: '알 수 없음',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">에러 로그</h1>
        <p className="mt-2 text-gray-600">
          애플리케이션에서 발생한 에러를 모니터링하고 관리합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              심각도
            </label>
            <select
              value={filters.severity}
              onChange={(e) => {
                setFilters({ ...filters, severity: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해결 상태
            </label>
            <select
              value={filters.resolved}
              onChange={(e) => {
                setFilters({ ...filters, resolved: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="false">미해결</option>
              <option value="true">해결됨</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              에러 타입
            </label>
            <select
              value={filters.error_type}
              onChange={(e) => {
                setFilters({ ...filters, error_type: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="type_error">타입 오류</option>
              <option value="reference_error">참조 오류</option>
              <option value="syntax_error">문법 오류</option>
              <option value="network_error">네트워크 오류</option>
              <option value="timeout_error">타임아웃 오류</option>
              <option value="runtime_error">실행 오류</option>
            </select>
          </div>
        </div>
      </div>

      {/* 에러 로그 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">에러 로그 목록</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">에러 로그가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  log.resolved ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                          log.severity
                        )}`}
                      >
                        {log.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {getErrorTypeLabel(log.error_type)}
                      </span>
                      {log.resolved && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          해결됨
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {log.error_message}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      {log.user_email && (
                        <p>사용자: {log.user_email}</p>
                      )}
                      {log.url && (
                        <p>URL: <span className="font-mono">{log.url}</span></p>
                      )}
                      <p>발생 시간: {new Date(log.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      상세
                    </button>
                    {!log.resolved && (
                      <button
                        onClick={() => handleResolve(log.id, true)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        해결
                      </button>
                    )}
                    {log.resolved && (
                      <button
                        onClick={() => handleResolve(log.id, false)}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        미해결
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 {pagination.total}개 에러 로그 (페이지 {pagination.page}/{pagination.totalPages})
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setCurrentPage(pagination.page - 1)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setCurrentPage(pagination.page + 1)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 상세 보기 모달 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">에러 로그 상세</h3>
                <p className="mt-1 text-sm text-gray-500">
                  발생 시간: {new Date(selectedLog.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">기본 정보</h4>
                  <div className="bg-gray-50 rounded-md p-4 space-y-2 text-sm">
                    <div>
                      <span className="font-medium">에러 타입:</span>{' '}
                      {getErrorTypeLabel(selectedLog.error_type)}
                    </div>
                    <div>
                      <span className="font-medium">심각도:</span>{' '}
                      <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(selectedLog.severity)}`}>
                        {selectedLog.severity.toUpperCase()}
                      </span>
                    </div>
                    {selectedLog.user_email && (
                      <div>
                        <span className="font-medium">사용자:</span> {selectedLog.user_email}
                      </div>
                    )}
                    {selectedLog.url && (
                      <div>
                        <span className="font-medium">URL:</span>{' '}
                        <span className="font-mono text-xs">{selectedLog.url}</span>
                      </div>
                    )}
                    {selectedLog.ip_address && (
                      <div>
                        <span className="font-medium">IP 주소:</span> {selectedLog.ip_address}
                      </div>
                    )}
                    {selectedLog.user_agent && (
                      <div>
                        <span className="font-medium">User-Agent:</span>{' '}
                        <span className="font-mono text-xs">{selectedLog.user_agent}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">에러 메시지</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-900 font-mono break-words">
                      {selectedLog.error_message}
                    </p>
                  </div>
                </div>

                {selectedLog.error_stack && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">스택 트레이스</h4>
                    <pre className="bg-gray-900 text-gray-100 rounded-md p-4 text-xs overflow-x-auto">
                      {selectedLog.error_stack}
                    </pre>
                  </div>
                )}

                {selectedLog.component_stack && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">컴포넌트 스택</h4>
                    <pre className="bg-gray-900 text-gray-100 rounded-md p-4 text-xs overflow-x-auto">
                      {selectedLog.component_stack}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">메타데이터</h4>
                    <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-2">
              {!selectedLog.resolved && (
                <button
                  onClick={async () => {
                    await handleResolve(selectedLog.id, true);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  해결 처리
                </button>
              )}
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
