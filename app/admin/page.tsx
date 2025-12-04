'use client';

import Link from 'next/link';

/**
 * 관리자 대시보드 메인 페이지
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="mt-2 text-gray-600">
          사용자 활동, 로그인 이력, 분석 결과를 모니터링하세요.
        </p>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/auth-logs"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            로그인 이력
          </h3>
          <p className="text-sm text-gray-600">
            소셜 로그인별 로그인 이력을 조회하고 분석합니다.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            사용자 관리
          </h3>
          <p className="text-sm text-gray-600">
            사용자 목록 및 분석 이력을 모니터링합니다.
          </p>
        </Link>

        <Link
          href="/admin/statistics"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            통계 대시보드
          </h3>
          <p className="text-sm text-gray-600">
            일일 방문수 및 활동 통계를 확인합니다.
          </p>
        </Link>
      </div>
    </div>
  );
}

