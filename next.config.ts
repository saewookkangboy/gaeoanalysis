import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Vercel 배포 환경 최적화
  experimental: {
    // Next.js 16 호환성
  },
  // Turbopack 설정 (Next.js 16 기본)
  turbopack: {},
  // Chunk 로딩 에러 방지 (webpack은 fallback으로 유지)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드 chunk 로딩 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // AIAgent를 별도 chunk로 분리
            aiAgent: {
              name: 'ai-agent',
              test: /[\\/]components[\\/]AIAgent\.tsx$/,
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  // HTTP 헤더 설정 (Trusted Types 오류 해결)
  async headers() {
    return [
      {
        // OAuth 콜백 및 인증 관련 경로에 적용
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://*.google.com https://fonts.googleapis.com",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'trusted-types=*',
          },
        ],
      },
      {
        // 모든 페이지에 기본 보안 헤더 및 CSP 적용
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.vercel-insights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.google.com https://fonts.googleapis.com https://*.vercel-insights.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
