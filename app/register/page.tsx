'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  // OAuth 로그인으로 전환되었으므로 로그인 페이지로 리다이렉트
  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 shadow-sm">
          <div className="text-center text-gray-600 dark:text-gray-400">
            로그인 페이지로 이동 중...
          </div>
        </div>
      </div>
    </div>
  );
}

