'use client';

import { usePathname } from 'next/navigation';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/**
 * 조건부 레이아웃 컴포넌트
 * Admin 경로에서는 Navigation과 Footer를 숨김
 */
export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Admin 경로: Navigation/Footer 없이 children만 표시
    return <>{children}</>;
  }

  // 일반 경로: Navigation과 Footer 포함
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}

