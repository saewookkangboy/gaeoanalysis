#!/bin/bash

# 프로덕션 DATABASE_URL 설정 (Railway에서 복사)
export DATABASE_URL="postgresql://postgres:KAPaIaUhyQdOEpcmVPjqlYhHWnEtdPUP@yamanote.proxy.rlwy.net:12487/railway"

echo "🔧 DATABASE_URL 환경 변수 설정 완료"
echo "📝 스크립트 실행 중..."

# Admin 권한 설정 스크립트 실행
npx tsx scripts/set-admin-role.ts chunghyo@troe.kr

