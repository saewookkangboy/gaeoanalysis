#!/bin/bash

# 자동 커밋 및 푸시 스크립트
# 사용법: ./scripts/auto-push.sh [커밋 메시지]

COMMIT_MSG="${1:-chore: 자동 커밋}"

# 변경사항 확인
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ 커밋할 변경사항이 없습니다."
  exit 0
fi

# 변경사항 표시
echo "📝 변경된 파일:"
git status --short

# 모든 변경사항 스테이징
echo ""
echo "📦 변경사항 스테이징 중..."
git add .

# 커밋
echo "💾 커밋 중..."
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
  echo "❌ 커밋 실패"
  exit 1
fi

# 푸시
echo "🚀 푸시 중..."
git push

if [ $? -eq 0 ]; then
  echo "✅ 푸시 완료!"
else
  echo "❌ 푸시 실패"
  exit 1
fi

