#!/bin/bash

# 데이터베이스 복구 스크립트
# 사용법: ./scripts/restore-db.sh [백업 파일 경로]

BACKUP_FILE="${1}"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ 백업 파일 경로를 지정해주세요."
  echo "사용법: ./scripts/restore-db.sh [백업 파일 경로]"
  echo ""
  echo "사용 가능한 백업 파일:"
  ls -1t ./backups/gaeo_backup_*.db 2>/dev/null | head -5
  exit 1
fi

DB_PATH="./data/gaeo.db"

# 백업 파일 확인
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ 백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
  exit 1
fi

# 현재 데이터베이스 백업 (안전장치)
if [ -f "$DB_PATH" ]; then
  SAFETY_BACKUP="./data/gaeo_safety_backup_$(date +%Y%m%d_%H%M%S).db"
  echo "🛡️  현재 데이터베이스를 안전 백업 중: $SAFETY_BACKUP"
  cp "$DB_PATH" "$SAFETY_BACKUP"
fi

# 복구 확인
echo "⚠️  경고: 이 작업은 현재 데이터베이스를 덮어씁니다."
echo "백업 파일: $BACKUP_FILE"
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ 복구가 취소되었습니다."
  exit 0
fi

# 복구 실행
echo "🔄 데이터베이스 복구 중..."
cp "$BACKUP_FILE" "$DB_PATH"

if [ $? -eq 0 ]; then
  SIZE=$(du -h "$DB_PATH" | cut -f1)
  echo "✅ 복구 완료: $DB_PATH ($SIZE)"
  echo "💡 서버를 재시작해주세요."
else
  echo "❌ 복구 실패"
  exit 1
fi

