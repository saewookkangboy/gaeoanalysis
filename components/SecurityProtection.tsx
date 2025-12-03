'use client';

import { useEffect } from 'react';

/**
 * 클라이언트 사이드 보안 보호 컴포넌트
 * 개발자 도구 접근 방지 및 디버깅 차단
 */
export default function SecurityProtection() {
  useEffect(() => {
    // SEO 크롤러 및 검색 엔진 봇 감지
    const isSearchEngineBot = () => {
      if (typeof window === 'undefined') return false;
      const userAgent = navigator.userAgent.toLowerCase();
      const bots = [
        'googlebot',
        'bingbot',
        'slurp',
        'duckduckbot',
        'baiduspider',
        'yandexbot',
        'sogou',
        'exabot',
        'facebot',
        'ia_archiver',
        'linkedinbot',
        'facebookexternalhit',
        'twitterbot',
        'whatsapp',
        'telegrambot',
        'applebot',
        'crawler',
        'spider',
      ];
      return bots.some(bot => userAgent.includes(bot));
    };

    // SEO 크롤러인 경우 보호 기능 비활성화
    if (isSearchEngineBot()) {
      return;
    }

    // 프로덕션 환경에서만 보안 보호 활성화
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // 개발자 도구 감지 및 차단
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // 개발자 도구가 열린 것으로 감지
        // 경고만 표시 (사용자 경험을 위해 완전 차단하지 않음)
        console.clear();
        console.warn('%c경고', 'color: red; font-size: 50px; font-weight: bold;');
        console.warn('%c이 콘솔은 개발자용입니다. 여기에 코드를 붙여넣으면 계정이 해킹될 수 있습니다.', 'color: red; font-size: 16px;');
      }
    };

    // 주기적으로 개발자 도구 감지
    const devToolsInterval = setInterval(detectDevTools, 500);

    // 콘솔 로그 난독화 (프로덕션)
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalDebug = console.debug;
    const originalInfo = console.info;

    // 콘솔 메서드 오버라이드 (난독화)
    console.log = (...args: any[]) => {
      // 프로덕션에서는 로그를 비활성화하거나 난독화
      if (process.env.NODE_ENV === 'production') {
        return;
      }
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      // 에러는 최소한의 정보만 표시
      if (process.env.NODE_ENV === 'production') {
        originalError.apply(console, ['An error occurred']);
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (process.env.NODE_ENV === 'production') {
        return;
      }
      originalWarn.apply(console, args);
    };

    console.debug = (...args: any[]) => {
      // 프로덕션에서는 완전히 비활성화
      if (process.env.NODE_ENV === 'production') {
        return;
      }
      originalDebug.apply(console, args);
    };

    console.info = (...args: any[]) => {
      if (process.env.NODE_ENV === 'production') {
        return;
      }
      originalInfo.apply(console, args);
    };

    // 디버거 방지
    const preventDebugger = () => {
      // 디버거 키워드 사용 시 경고
      const originalEval = window.eval;
      // eval 함수는 정확히 하나의 string 인자를 받음
      window.eval = function(code: string): any {
        if (process.env.NODE_ENV === 'production') {
          console.warn('eval() 사용이 차단되었습니다.');
        }
        // eval은 Function이므로 call 사용
        return (originalEval as Function).call(this, code);
      };
    };

    // React DevTools 감지
    const detectReactDevTools = () => {
      const devtools = {
        open: false,
        orientation: null as 'vertical' | 'horizontal' | null,
      };

      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: function() {
          devtools.open = true;
          return '';
        },
      });

      setInterval(() => {
        devtools.open = false;
        // React DevTools 감지를 위한 더미 로그
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        element;
        if (devtools.open) {
          console.clear();
          console.warn('%cReact DevTools가 감지되었습니다.', 'color: red; font-size: 16px;');
        }
      }, 1000);
    };

    // Right-click 방지 (선택적, 사용자 경험에 영향)
    // const preventRightClick = (e: MouseEvent) => {
    //   if (e.button === 2) {
    //     e.preventDefault();
    //     return false;
    //   }
    // };
    // document.addEventListener('contextmenu', preventRightClick);

    // 텍스트 선택 방지 (선택적)
    // const preventSelection = (e: Event) => {
    //   e.preventDefault();
    // };
    // document.addEventListener('selectstart', preventSelection);

    // 키보드 단축키 방지 (F12, Ctrl+Shift+I 등)
    const preventDevToolsShortcuts = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (Chrome DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (Chrome Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (소스 보기) - SEO 및 Open Graph 확인을 위해 허용
      // 검색 엔진 크롤러와 사용자가 메타 태그를 확인할 수 있도록 허용
      // if (e.ctrlKey && e.key === 'u') {
      //   e.preventDefault();
      //   return false;
      // }
      // Ctrl+S (저장)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', preventDevToolsShortcuts);

    // 초기화
    preventDebugger();
    detectReactDevTools();

    // Cleanup
    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener('keydown', preventDevToolsShortcuts);
      
      // 콘솔 메서드 복원
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.debug = originalDebug;
      console.info = originalInfo;
    };
  }, []);

  return null;
}

