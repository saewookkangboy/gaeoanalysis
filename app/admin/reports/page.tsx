'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

interface Report {
  id: string;
  adminUserId: string;
  userId: string | null;
  reportType: 'summary' | 'detailed' | 'trend';
  createdAt: string;
}

interface ReportDetail {
  id: string;
  adminUserId: string;
  userId: string | null;
  reportType: 'summary' | 'detailed' | 'trend';
  reportContent: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<PaginationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

  // 리포트 생성 폼 상태
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'trend'>('summary');
  const [userId, setUserId] = useState<string>('');
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

  // 리포트 목록 조회
  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai-report');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '리포트 목록을 조회할 수 없습니다.');
      }

      const data = await response.json();
      setReports(data.reports || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      console.error('리포트 목록 조회 오류:', err);
      setError(err.message || '리포트 목록을 조회할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 리포트 상세 조회
  const fetchReportDetail = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-report/${reportId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '리포트를 조회할 수 없습니다.');
      }

      const data = await response.json();
      setSelectedReport(data.report);
    } catch (err: any) {
      console.error('리포트 조회 오류:', err);
      setError(err.message || '리포트를 조회할 수 없습니다.');
    }
  };

  // 리포트 생성
  const handleGenerateReport = async () => {
    setGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/admin/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || undefined,
          reportType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          includeCharts: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '리포트 생성에 실패했습니다.');
      }

      const data = await response.json();
      
      // 생성된 리포트 상세 조회
      await fetchReportDetail(data.reportId);
      
      // 리포트 목록 새로고침
      await fetchReports();
      
      // 폼 초기화
      setUserId('');
    } catch (err: any) {
      console.error('리포트 생성 오류:', err);
      setGenerateError(err.message || '리포트 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'summary':
        return '요약';
      case 'detailed':
        return '상세';
      case 'trend':
        return '트렌드';
      default:
        return type;
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI 리포트</h1>
        <p className="mt-2 text-gray-600">
          사용자 데이터를 종합적으로 분석하여 AI 리포트를 생성합니다.
        </p>
      </div>

      {/* 리포트 생성 폼 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">리포트 생성</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              리포트 타입
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'summary' | 'detailed' | 'trend')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">요약 리포트</option>
              <option value="detailed">상세 리포트</option>
              <option value="trend">트렌드 리포트</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사용자 ID (선택적, 전체 리포트는 비워두세요)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="사용자 ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 날짜
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 날짜
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {generateError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{generateError}</p>
            </div>
          )}

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? '리포트 생성 중...' : '리포트 생성'}
          </button>
        </div>
      </div>

      {/* 리포트 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">리포트 목록</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">생성된 리포트가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => fetchReportDetail(report.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {getReportTypeLabel(report.reportType)}
                      </span>
                      {report.userId && (
                        <span className="text-sm text-gray-500">
                          사용자: {report.userId.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      생성일: {new Date(report.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchReportDetail(report.id);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 {pagination.total}개 리포트 (페이지 {pagination.page}/{pagination.totalPages})
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 리포트 상세 보기 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {getReportTypeLabel(selectedReport.reportType)} 리포트
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  생성일: {new Date(selectedReport.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div ref={reportContentRef} className="prose prose-sm max-w-none text-gray-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                >
                  {selectedReport.reportContent}
                </ReactMarkdown>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={async () => {
                  try {
                    // 렌더링된 HTML 콘텐츠 가져오기
                    const contentElement = reportContentRef.current;
                    let html = '';
                    
                    if (contentElement) {
                      // 스타일이 적용된 HTML 추출 (ReactMarkdown이 렌더링한 내용)
                      html = contentElement.innerHTML;
                    }
                    
                    const plainText = selectedReport.reportContent;
                    
                    // HTML과 텍스트를 모두 클립보드에 복사 (일반 문서에서도 서식 유지)
                    if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined' && html) {
                      try {
                        const clipboardItem = new ClipboardItem({
                          'text/html': new Blob([html], { type: 'text/html' }),
                          'text/plain': new Blob([plainText], { type: 'text/plain' }),
                        });
                        
                        await navigator.clipboard.write([clipboardItem]);
                        alert('리포트가 클립보드에 복사되었습니다. (서식 포함)');
                        return;
                      } catch (clipboardError) {
                        // ClipboardItem이 지원되지 않는 경우 fallback
                        console.warn('ClipboardItem 미지원, 대체 방법 사용:', clipboardError);
                      }
                    }
                    
                    // 대체 방법: 일반 텍스트로 복사 (마크다운 서식 포함)
                    await navigator.clipboard.writeText(plainText);
                    alert('리포트가 클립보드에 복사되었습니다.');
                  } catch (error) {
                    // 최종 fallback: 일반 텍스트로 복사
                    console.warn('복사 실패:', error);
                    try {
                      await navigator.clipboard.writeText(selectedReport.reportContent);
                      alert('리포트가 클립보드에 복사되었습니다.');
                    } catch (fallbackError) {
                      alert('복사에 실패했습니다.');
                    }
                  }
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                복사
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

