#!/bin/bash

# Vercel CLI를 사용하여 DB 파일을 다운로드하는 스크립트
# 이 방법은 VERCEL_BLOB_READ_WRITE_TOKEN이 필요하지 않습니다.

echo "📥 Vercel CLI를 사용하여 DB 파일 다운로드 시작..."

# Vercel CLI 설치 확인
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI가 설치되지 않았습니다."
    echo "💡 설치 방법: npm i -g vercel"
    exit 1
fi

# Vercel 로그인 확인
if ! vercel whoami &> /dev/null; then
    echo "❌ Vercel에 로그인되지 않았습니다."
    echo ""
    echo "💡 로그인 방법:"
    echo "   1. vercel login"
    echo "   2. 브라우저가 열리면 Vercel 계정으로 로그인"
    echo "   3. 이 스크립트를 다시 실행"
    echo ""
    echo "또는 토큰을 사용하여 로그인:"
    echo "   vercel login --token <your-vercel-token>"
    echo ""
    echo "토큰은 Vercel 대시보드 → Settings → Tokens에서 생성할 수 있습니다."
    exit 1
fi

# 프로젝트 링크 확인
if [ ! -f ".vercel/project.json" ]; then
    echo "⚠️  프로젝트가 링크되지 않았습니다. 링크 중..."
    vercel link
fi

# 환경 변수 다운로드
echo "📥 환경 변수 다운로드 중..."
vercel env pull .env.local

# Node.js 스크립트 실행
echo "📥 DB 파일 다운로드 중..."
npm run db:download-from-vercel

echo "✅ 완료!"

