#!/bin/bash

# AUTH_SECRET 환경 변수 확인 스크립트

echo "🔍 AUTH_SECRET 환경 변수 확인 중..."

if [ -f ".env.local" ]; then
  if grep -q "AUTH_SECRET=" .env.local || grep -q "NEXTAUTH_SECRET=" .env.local; then
    echo "✅ .env.local 파일에 AUTH_SECRET 또는 NEXTAUTH_SECRET이 설정되어 있습니다."
    
    # AUTH_SECRET 확인
    if grep -q "^AUTH_SECRET=" .env.local; then
      echo "✅ AUTH_SECRET 사용 중 (권장)"
    elif grep -q "^NEXTAUTH_SECRET=" .env.local; then
      echo "⚠️  NEXTAUTH_SECRET 사용 중 (AUTH_SECRET으로 변경 권장)"
    fi
  else
    echo "❌ .env.local 파일에 AUTH_SECRET 또는 NEXTAUTH_SECRET이 설정되지 않았습니다."
    echo ""
    echo "💡 해결 방법:"
    echo "   1. 다음 명령어로 시크릿 키 생성:"
    echo "      openssl rand -base64 32"
    echo ""
    echo "   2. .env.local 파일에 추가:"
    echo "      AUTH_SECRET=<생성한-시크릿-키>"
    exit 1
  fi
else
  echo "❌ .env.local 파일이 없습니다."
  echo ""
  echo "💡 해결 방법:"
  echo "   1. 프로젝트 루트에 .env.local 파일 생성"
  echo "   2. 다음 명령어로 시크릿 키 생성:"
  echo "      openssl rand -base64 32"
  echo "   3. .env.local 파일에 추가:"
  echo "      AUTH_SECRET=<생성한-시크릿-키>"
  exit 1
fi

echo ""
echo "✨ 확인 완료!"

