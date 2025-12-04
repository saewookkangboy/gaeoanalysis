'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 관리자 권한 확인 결과 타입
 */
interface AdminCheckResult {
  isAdmin: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  error?: string;
}

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        // API 라우트를 통해 권한 확인 (서버 전용 코드와 분리)
        const response = await fetch('/api/admin/check');
        
        if (!response.ok) {
          console.error('❌ [AdminLayout] API 응답 오류:', {
            status: response.status,
            statusText: response.statusText,
          });
          const errorText = await response.text();
          console.error('❌ [AdminLayout] 오류 응답 본문:', errorText);
          router.push('/');
          return;
        }
        
        const checkResult: AdminCheckResult = await response.json();
        
        console.log('🔍 [AdminLayout] 권한 확인 결과:', {
          isAdmin: checkResult.isAdmin,
          userId: checkResult.user?.id,
          email: checkResult.user?.email,
          role: checkResult.user?.role,
          error: checkResult.error,
        });
        
        if (checkResult.isAdmin) {
          setIsAuthorized(true);
        } else {
          // 권한이 없으면 에러 메시지 표시 후 리다이렉트
          const errorMsg = checkResult.error || '관리자 권한이 필요합니다.';
          console.warn('⚠️ [AdminLayout] 관리자 권한 없음:', {
            error: errorMsg,
            user: checkResult.user,
          });
          setErrorMessage(errorMsg);
          // 3초 후 메인 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error: any) {
        console.error('❌ [AdminLayout] 권한 확인 오류:', error);
        setErrorMessage(error.message || '권한 확인 중 오류가 발생했습니다.');
        // 3초 후 메인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/');
        }, 3000);
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

  // 권한 없음 (에러 메시지 표시)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">접근 권한 없음</h2>
            <p className="text-red-700 mb-4">
              {errorMessage || '관리자 권한이 필요합니다.'}
            </p>
            <p className="text-sm text-red-600 mb-4">
              잠시 후 메인 페이지로 이동합니다...
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              메인 페이지로 이동
            </a>
          </div>
        </div>
      </div>
    );
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

