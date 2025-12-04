#!/bin/bash

# Railway에 DB 파일을 업로드하는 스크립트

echo "📤 Railway에 DB 파일 업로드 시작..."

# Railway CLI 확인
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI가 설치되지 않았습니다."
    echo "💡 설치 방법: npm i -g @railway/cli"
    exit 1
fi

# Railway 로그인 확인
if ! railway whoami &> /dev/null; then
    echo "❌ Railway에 로그인되지 않았습니다."
    echo "💡 로그인: railway login"
    exit 1
fi

# DB 파일 경로 확인
DB_FILE=""
if [ -f "backup/gaeo.db" ]; then
    DB_FILE="backup/gaeo.db"
    echo "✅ backup/gaeo.db 파일 발견"
elif [ -f "data/gaeo.db" ]; then
    DB_FILE="data/gaeo.db"
    echo "✅ data/gaeo.db 파일 발견"
else
    echo "❌ DB 파일을 찾을 수 없습니다."
    echo "💡 다음 위치에서 DB 파일을 확인하세요:"
    echo "   - backup/gaeo.db (Vercel에서 다운로드한 경우)"
    echo "   - data/gaeo.db (로컬 개발 환경의 DB)"
    echo ""
    echo "⚠️  참고: Railway는 자동으로 새 DB를 생성하므로 업로드하지 않아도 됩니다."
    exit 1
fi

# 파일 크기 확인
FILE_SIZE=$(ls -lh "$DB_FILE" | awk '{print $5}')
echo "📊 파일 크기: $FILE_SIZE"
echo "📤 업로드 중..."

# Railway에 업로드
# Railway에서는 프로젝트 루트의 data 디렉토리를 사용 (process.cwd()/data)
# /app은 읽기 전용이므로 사용하지 않음
echo "💡 Railway 경로 확인 중..."
railway run bash -c "pwd && ls -la" | head -10

echo "📤 DB 파일 업로드 중..."
# 프로젝트 루트의 data 디렉토리에 업로드
railway run bash -c "mkdir -p data && cat > data/gaeo.db" < "$DB_FILE"

if [ $? -eq 0 ]; then
    echo "✅ DB 파일 업로드 완료!"
    echo "💡 Railway 대시보드에서 배포 상태를 확인하세요."
else
    echo "❌ DB 파일 업로드 실패"
    exit 1
fi

