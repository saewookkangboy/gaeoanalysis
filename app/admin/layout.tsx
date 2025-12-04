'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminAccess } from '@/lib/admin-auth';

/**
 * 관리자 레이아웃
 * 모든 /admin/* 경로에 적용됩니다.
 * 
 * - 관리자 권한 확인
 * - 권한 없으면 메인 페이지로 리다이렉트
 * - Navigation/Footer 숨김 (별도 URL 접근)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const checkResult = await checkAdminAccess();
        
        if (checkResult.isAdmin) {
          setIsAuthorized(true);
        } else {
          // 권한이 없으면 메인 페이지로 리다이렉트
          console.warn('⚠️ [AdminLayout] 관리자 권한 없음:', checkResult.error);
          router.push('/');
        }
      } catch (error) {
        console.error('❌ [AdminLayout] 권한 확인 오류:', error);
        router.push('/');
      } finally {
        setIsChecking(false);
      }
    }

    verifyAdmin();
  }, [router]);

  // 권한 확인 중
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 권한 없음 (리다이렉트 중)
  if (!isAuthorized) {
    return null;
  }

  // 권한 있음 - 관리자 대시보드 표시
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">관리자 대시보드</h1>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              메인 페이지로
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}

