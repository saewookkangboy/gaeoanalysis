#!/bin/bash

# 데이터베이스 백업 스크립트
# 사용법: ./scripts/backup-db.sh [백업 디렉토리]

BACKUP_DIR="${1:-./backups}"
DB_PATH="./data/gaeo.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/gaeo_backup_${TIMESTAMP}.db"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 데이터베이스 파일 확인
if [ ! -f "$DB_PATH" ]; then
  echo "❌ 데이터베이스 파일을 찾을 수 없습니다: $DB_PATH"
  exit 1
fi

# 백업 실행
echo "📦 데이터베이스 백업 중..."
cp "$DB_PATH" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  # 백업 파일 크기 확인
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ 백업 완료: $BACKUP_FILE ($SIZE)"
  
  # 오래된 백업 파일 정리 (30일 이상)
  echo "🧹 오래된 백업 파일 정리 중..."
  find "$BACKUP_DIR" -name "gaeo_backup_*.db" -mtime +30 -delete
  echo "✅ 정리 완료"
  
  # 백업 파일 개수 확인
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/gaeo_backup_*.db 2>/dev/null | wc -l)
  echo "📊 현재 백업 파일 수: $BACKUP_COUNT"
else
  echo "❌ 백업 실패"
  exit 1
fi

