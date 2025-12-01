#!/bin/bash

# Next.js 개발 서버 정리 스크립트
# 실행 중인 프로세스와 lock 파일을 정리합니다

echo "🧹 Next.js 개발 서버 정리 중..."

# 포트 3000, 3001에서 실행 중인 프로세스 찾기
PIDS=$(lsof -ti:3000,3001 2>/dev/null)

if [ -n "$PIDS" ]; then
  echo "📌 실행 중인 프로세스 발견: $PIDS"
  echo "$PIDS" | xargs kill -9 2>/dev/null
  echo "✅ 프로세스 종료 완료"
else
  echo "✅ 실행 중인 프로세스 없음"
fi

# Next.js dev 프로세스 찾기
NEXT_PIDS=$(ps aux | grep -i "next dev" | grep -v grep | awk '{print $2}')

if [ -n "$NEXT_PIDS" ]; then
  echo "📌 Next.js dev 프로세스 발견: $NEXT_PIDS"
  echo "$NEXT_PIDS" | xargs kill -9 2>/dev/null
  echo "✅ Next.js 프로세스 종료 완료"
else
  echo "✅ Next.js 프로세스 없음"
fi

# Lock 파일 삭제
if [ -f ".next/dev/lock" ]; then
  rm -f .next/dev/lock
  echo "✅ Lock 파일 삭제 완료"
else
  echo "✅ Lock 파일 없음"
fi

# .next 폴더 선택적 삭제 (옵션)
if [ "$1" == "--clean" ]; then
  echo "🗑️  .next 폴더 삭제 중..."
  rm -rf .next
  echo "✅ .next 폴더 삭제 완료"
fi

echo "✨ 정리 완료! 이제 'npm run dev'를 실행할 수 있습니다."

