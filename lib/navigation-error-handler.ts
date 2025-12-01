/**
 * Next.js 네비게이션 오류 처리 유틸리티
 * 클라이언트 사이드 네비게이션 중 발생하는 fetch 오류를 처리합니다.
 */

if (typeof window !== 'undefined') {
  // 전역 fetch 오류 핸들러 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error: any) {
        // 네비게이션 관련 fetch 오류는 조용히 처리
        let url = '';
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0] instanceof Request) {
          url = args[0].url;
        } else if (args[0] instanceof URL) {
          url = args[0].href;
        }
        
        if (
          error?.message?.includes('Failed to fetch') &&
          (url.includes('/_next/data') || url.includes('/api'))
        ) {
          console.warn('⚠️ 네비게이션 fetch 오류 (일시적 네트워크 문제일 수 있음):', url);
          
          // 네비게이션 오류인 경우, 전체 페이지 새로고침으로 대체
          if (url.includes('/_next/data')) {
            // Next.js 내부 라우팅 오류인 경우
            const pathMatch = url.match(/\/_next\/data\/[^/]+\/(.+?)\.json/);
            if (pathMatch) {
              const path = '/' + pathMatch[1];
              console.warn(`네비게이션 실패, 전체 페이지 새로고침으로 이동: ${path}`);
              setTimeout(() => {
                window.location.href = path;
              }, 100);
            }
          }
        }
        
        throw error;
      }
    };
  }

  // Next.js 라우터 오류 처리
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      // 네비게이션 관련 오류 필터링
      if (
        error?.message?.includes('Failed to fetch') &&
        (error?.stack?.includes('navigate') || error?.stack?.includes('fetchServerResponse'))
      ) {
        console.warn('⚠️ 네비게이션 오류가 발생했습니다. 페이지를 새로고침합니다.');
        event.preventDefault();
        
        // 짧은 지연 후 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });
  }
}

/**
 * 안전한 네비게이션 함수
 * router.push/replace를 사용할 때 에러 처리를 포함합니다.
 */
export function safeNavigate(
  navigateFn: () => void | Promise<void>,
  fallbackUrl?: string
) {
  try {
    const result = navigateFn();
    
    if (result instanceof Promise) {
      result.catch((error) => {
        console.error('네비게이션 오류:', error);
        
        if (error?.message?.includes('Failed to fetch')) {
          // 네비게이션 실패 시 전체 페이지 새로고침으로 대체
          if (fallbackUrl) {
            window.location.href = fallbackUrl;
          } else {
            window.location.reload();
          }
        }
      });
    }
  } catch (error: any) {
    console.error('네비게이션 오류:', error);
    
    if (error?.message?.includes('Failed to fetch')) {
      if (fallbackUrl) {
        window.location.href = fallbackUrl;
      } else {
        window.location.reload();
      }
    }
  }
}

