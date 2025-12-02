'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

// 개발 환경에서 네비게이션 오류를 조용히 처리
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Next.js Link 클릭 오류를 전역으로 처리
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';
    if (
      errorMessage.includes('Failed to fetch') &&
      (errorMessage.includes('navigate') || errorMessage.includes('fetchServerResponse'))
    ) {
      // 네비게이션 오류는 조용히 무시 (이미 unhandledrejection 핸들러에서 처리됨)
      return;
    }
    originalError.apply(console, args);
  };
}

export default function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/" 
              className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            >
              GAEO Analysis
            </Link>
            <Link
              href="/about"
              className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {status === 'loading' ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">로딩 중...</span>
            ) : session ? (
              <>
                <Link
                  href="/history"
                  className="group hidden sm:block rounded-lg border-2 border-transparent px-3 sm:px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all duration-200 hover:border-sky-200 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:shadow-sm"
                >
                  분석 이력
                </Link>
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                  {session.user.email}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await signOut({ 
                        callbackUrl: '/',
                        redirect: true 
                      });
                    } catch (error) {
                      console.error('로그아웃 오류:', error);
                      // 로그아웃 실패 시에도 페이지 새로고침으로 세션 초기화 시도
                      window.location.href = '/';
                    }
                  }}
                  className="group rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-200 hover:border-sky-300 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:shadow-md hover:scale-105"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="group rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

