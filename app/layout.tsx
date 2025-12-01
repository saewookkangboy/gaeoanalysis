import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, Noto_Sans_KR, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navigation from "@/components/Navigation";

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

export const metadata: Metadata = {
  title: "GAEO Analysis by allrounder - AI 검색 최적화 분석 도구",
  description: "생성형 검색 환경(GEO/AEO)에 최적화된 콘텐츠 분석 및 개선 가이드를 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${ibmPlexSansKR.variable} ${notoSansKR.variable} ${ibmPlexSans.variable} antialiased bg-white text-gray-900`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <SessionProvider>
                <Navigation />
                {children}
              </SessionProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
