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
};

export default nextConfig;
