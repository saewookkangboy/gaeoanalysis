// 동적 렌더링 강제 (정적 생성 방지)
export const dynamic = 'force-dynamic';

import { AdminLayoutWrapper } from './layout-wrapper';

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
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}

