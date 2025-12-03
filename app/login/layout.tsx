import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 - GAEO Analysis',
  description: 'GAEO Analysis에 로그인하여 AI 검색 최적화 분석 도구를 사용하세요. Google 또는 GitHub 계정으로 안전하게 로그인할 수 있습니다.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '로그인 - GAEO Analysis',
    description: 'GAEO Analysis에 안전하게 로그인하세요',
    url: '/login',
    type: 'website',
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

