import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, Noto_Sans_KR, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ContentProtection from "@/components/ContentProtection";
import SecurityProtection from "@/components/SecurityProtection";
import '@/lib/navigation-error-handler'; // 네비게이션 오류 핸들러 초기화

const ibmPlexSansKR = IBM_Plex_Sans_KR({
  variable: "--font-ibm-plex-sans-kr",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gaeo.allrounder.im';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GAEO - Do it now! | AI 검색 최적화 분석 도구",
    template: "%s | GAEO",
  },
  description: "ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구. AEO, GEO, SEO 점수를 30초 안에 종합 진단하고, AI 모델별 인용 확률과 개선 가이드를 제공합니다.",
  keywords: [
    "AI SEO",
    "AEO",
    "GEO",
    "AI 검색 최적화",
    "ChatGPT 최적화",
    "Perplexity 최적화",
    "Gemini 최적화",
    "Claude 최적화",
    "AI 인용 확률",
    "콘텐츠 분석",
    "SEO 분석",
    "검색 엔진 최적화",
    "생성형 AI 최적화",
    "답변 엔진 최적화",
    "AI 검색 트래픽",
  ],
  authors: [{ name: "allrounder" }],
  creator: "allrounder",
  publisher: "allrounder",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: baseUrl,
    siteName: "GAEO Analysis",
    title: "GAEO - Do it now!",
    description: "ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구. 30초 안에 종합 진단 완료.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1376,
        height: 768,
        alt: "GAEO - Do it now!",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GAEO - Do it now!",
    description: "ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1376,
        height: 768,
        alt: "GAEO - Do it now!",
      },
    ],
    creator: "@allrounder",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'luDdCo5LmE8FDV3v9feFxnDB2mN9MZRVZHfZpuDfSXM',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  alternates: {
    canonical: "/",
  },
  other: {
    'google-fonts': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@100;200;300;400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Noto+Sans+KR:wght@100..900&display=swap',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@100;200;300;400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Noto+Sans+KR:wght@100..900&display=swap"
        />
        {/* 구조화된 데이터 - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "GAEO Analysis",
              "url": baseUrl,
              "logo": `${baseUrl}/og-image.png`,
              "description": "ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구",
              "sameAs": [
                process.env.NEXT_PUBLIC_TWITTER_URL,
                process.env.NEXT_PUBLIC_GITHUB_URL,
              ].filter(Boolean),
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Service",
                "availableLanguage": ["Korean", "English"],
              },
            }),
          }}
        />
        {/* 구조화된 데이터 - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "GAEO Analysis",
              "url": baseUrl,
              "description": "AI 검색 최적화 분석 도구",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${baseUrl}/?url={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* 구조화된 데이터 - SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "GAEO Analysis",
              "applicationCategory": "WebApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW",
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "100",
              },
              "description": "ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구",
              "featureList": [
                "AEO, GEO, SEO 종합 점수 분석",
                "AI 모델별 인용 확률 시뮬레이션",
                "실행 가능한 개선 가이드",
                "AI Agent 상담",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${ibmPlexSansKR.variable} ${notoSansKR.variable} ${ibmPlexSans.variable} antialiased bg-white text-gray-900`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ContentProtection />
          <SecurityProtection />
          <ThemeProvider>
            <ToastProvider>
              <SessionProvider>
                <div className="flex min-h-screen flex-col">
                  <Navigation />
                  <main className="flex-1 flex flex-col">
                    {children}
                  </main>
                  <Footer />
                </div>
              </SessionProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
