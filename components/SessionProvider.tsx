'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 개발 환경에서만 에러 로깅
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      console.error = (...args) => {
        // NextAuth 관련 에러는 필터링하여 너무 많은 로그 방지
        if (args[0]?.includes?.('Failed to fetch') && args[0]?.includes?.('auth')) {
          console.warn('⚠️ NextAuth 세션 조회 실패 (일시적 네트워크 오류일 수 있음)');
          return;
        }
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    }
  }, []);

  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60} // 5분마다 세션 갱신
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

