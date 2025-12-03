import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '분석 이력',
  description: '최근 분석 기록을 조회하고 관리할 수 있습니다. 콘텐츠 개선 전후를 비교하거나 팀과 공유할 수 있습니다.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '분석 이력 - GAEO Analysis',
    description: '최근 분석 기록을 조회하고 관리',
    url: '/history',
    type: 'website',
  },
  alternates: {
    canonical: '/history',
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

