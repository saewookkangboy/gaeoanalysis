'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

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
                  className="hidden sm:block rounded-md px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  분석 이력
                </Link>
                <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="rounded-md bg-gray-100 dark:bg-gray-800 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-blue-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
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

