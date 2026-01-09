import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 소개',
  description: 'GAEO Analysis는 ChatGPT, Perplexity, Grok, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구입니다. AI 검색 시대에 뒤처지지 않으려면 지금 시작하세요.',
  openGraph: {
    title: 'GAEO Analysis 서비스 소개 - AI 검색 최적화 분석 도구',
    description: 'ChatGPT, Perplexity, Grok, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구',
    url: '/about',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GAEO Analysis 서비스 소개',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GAEO Analysis 서비스 소개',
    description: 'AI 검색 최적화 분석 도구',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
