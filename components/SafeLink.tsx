'use client';

import Link from 'next/link';
import { ReactNode, MouseEvent } from 'react';

interface SafeLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  [key: string]: any;
}

/**
 * 안전한 Link 컴포넌트
 * 네비게이션 오류 발생 시 전체 페이지 새로고침으로 대체합니다.
 */
export function SafeLink({ href, children, className, onClick, ...props }: SafeLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    // 네비게이션 오류를 방지하기 위해 일정 시간 후 체크
    const timeout = setTimeout(() => {
      // 네비게이션 실패 시 전체 페이지 새로고침으로 대체
      if (window.location.pathname !== href) {
        console.warn('네비게이션 실패 감지, 전체 페이지 새로고침으로 이동:', href);
        window.location.href = href;
      }
    }, 1000);

    // 성공적으로 네비게이션되면 타임아웃 취소
    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('popstate', cleanup);
    };
    
    window.addEventListener('popstate', cleanup);
    
    // 2초 후 자동 정리
    setTimeout(cleanup, 2000);
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}

