import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Vercel 배포 환경 최적화
  experimental: {
    // Next.js 16 호환성
  },
  // Turbopack 설정 (Next.js 16 기본값)
  // 개발 환경에서는 Turbopack 사용, 프로덕션에서는 webpack 사용
  turbopack: {},
  // 프로덕션 빌드에서 webpack 사용 (Turbopack 안정성 이슈 해결)
  // Turbopack은 개발 환경에서만 사용
  // 소스맵 비활성화 (프로덕션 보안)
  productionBrowserSourceMaps: false,
  // 이미지 최적화 설정
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 컴파일러 옵션
  compiler: {
    // 프로덕션에서 콘솔 로그 제거
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // 에러와 경고는 유지
    } : false,
  },
  // Chunk 로딩 에러 방지 (webpack은 fallback으로 유지)
  webpack: (config, { isServer }) => {
    // Path alias 설정 (Railway 빌드 환경에서 모듈 해결 문제 해결)
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname),
      };
    }
    
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
        // 정적 파일 (manifest.json, favicon 등)은 CSP 제외 및 접근 허용
        source: '/(manifest.json|favicon.ico|robots.txt|sitemap.xml)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.googletagmanager.com https://*.vercel-insights.com https://vercel.live https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.google.com https://*.googletagmanager.com https://fonts.googleapis.com https://*.vercel-insights.com https://vercel.live https://va.vercel-scripts.com",
              "frame-src 'self' https://vercel.live https://accounts.google.com",
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
