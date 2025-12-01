/**
 * Next.js 네비게이션 오류 처리 유틸리티
 * 클라이언트 사이드 네비게이션 중 발생하는 fetch 오류를 처리합니다.
 */

if (typeof window !== 'undefined') {
  // 전역 에러 핸들러로 네비게이션 오류 처리
  const handleNavigationError = (error: any) => {
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack || '';
    
    // 네비게이션 관련 오류인지 확인
    const isNavigationError = 
      errorMessage.includes('Failed to fetch') &&
      (errorStack.includes('navigate') || 
       errorStack.includes('fetchServerResponse') ||
       errorStack.includes('linkClicked') ||
       errorStack.includes('navigateDynamically'));
    
    if (isNavigationError) {
      // 개발 환경에서만 경고 로그
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ 네비게이션 오류 감지 (자동 복구 시도):', errorMessage);
      }
      
      // 오류를 조용히 처리 (콘솔에 표시하지 않음)
      return true;
    }
    
    return false;
  };

  // unhandledrejection 이벤트 리스너
  window.addEventListener('unhandledrejection', (event) => {
    if (handleNavigationError(event.reason)) {
      // 네비게이션 오류는 조용히 처리 (이벤트 기본 동작 방지)
      event.preventDefault();
    }
  });

  // 전역 에러 핸들러
  window.addEventListener('error', (event) => {
    if (handleNavigationError(event.error)) {
      // 네비게이션 오류는 조용히 처리
      event.preventDefault();
    }
  }, true);

  // 개발 환경에서만 fetch 래핑 (프로덕션에서는 성능 영향 최소화)
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
          // 네비게이션 오류인 경우, 전체 페이지 새로고침으로 대체
          if (url.includes('/_next/data')) {
            const pathMatch = url.match(/\/_next\/data\/[^/]+\/(.+?)\.json/);
            if (pathMatch) {
              const path = '/' + pathMatch[1];
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

