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

      {/* 빠른 사용자 검색 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">빠른 사용자 검색</h3>
        <div className="flex flex-wrap gap-2">
          {['chunghyo@troe.kr', 'chunghyo@kakao.com', 'pakseri@gmail.com'].map((email) => (
            <Link
              key={email}
              href={`/admin/users/${encodeURIComponent(email)}`}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              {email}
            </Link>
          ))}
        </div>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          href="/admin/analyses"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            분석 결과
          </h3>
          <p className="text-sm text-gray-600">
            모든 사용자의 분석 결과(점수, 진단 결과)를 조회합니다.
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

        <Link
          href="/admin/announcements"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            공지사항 관리
          </h3>
          <p className="text-sm text-gray-600">
            서비스 전체에 표시될 공지사항을 관리합니다.
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI 리포트
          </h3>
          <p className="text-sm text-gray-600">
            사용자 데이터를 종합적으로 분석하여 AI 리포트를 생성합니다.
          </p>
        </Link>
      </div>
    </div>
  );
}

