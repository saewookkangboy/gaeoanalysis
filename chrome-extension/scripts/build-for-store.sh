#!/bin/bash

# Chrome Extension 빌드 및 패키징 스크립트

set -e

echo "🚀 Chrome Extension 빌드 시작..."

# 1. 의존성 확인
if [ ! -d "node_modules" ]; then
  echo "📦 의존성 설치 중..."
  npm install
fi

# 2. 빌드
echo "🔨 빌드 중..."
npm run build

# 3. 빌드 결과 확인
if [ ! -d "dist" ]; then
  echo "❌ 빌드 실패: dist 폴더가 생성되지 않았습니다."
  exit 1
fi

# 4. 필수 파일 확인
echo "✅ 필수 파일 확인 중..."
REQUIRED_FILES=("dist/manifest.json" "dist/popup.html" "dist/background.js" "dist/content.js")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ 필수 파일 누락: $file"
    exit 1
  fi
done

# 5. 아이콘 확인
echo "🖼️  아이콘 확인 중..."
ICON_SIZES=(16 32 48 128)
MISSING_ICONS=()
for size in "${ICON_SIZES[@]}"; do
  if [ ! -f "dist/icons/icon${size}.png" ]; then
    MISSING_ICONS+=("icon${size}.png")
  fi
done

if [ ${#MISSING_ICONS[@]} -gt 0 ]; then
  echo "⚠️  경고: 다음 아이콘 파일이 없습니다:"
  for icon in "${MISSING_ICONS[@]}"; do
    echo "   - $icon"
  done
  echo "   Chrome Web Store 등록 전에 아이콘을 추가해주세요."
fi

# 6. 버전 정보 확인
VERSION=$(grep -o '"version": "[^"]*"' dist/manifest.json | cut -d'"' -f4)
echo "📌 현재 버전: $VERSION"

# 7. ZIP 파일 생성
ZIP_NAME="gaeo-analysis-extension-v${VERSION}.zip"
echo "📦 ZIP 파일 생성 중: $ZIP_NAME"

cd dist
zip -r "../${ZIP_NAME}" . -x "*.DS_Store" "*.git*"
cd ..

# 8. ZIP 파일 크기 확인
ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo "✅ ZIP 파일 생성 완료: $ZIP_NAME ($ZIP_SIZE)"

# 9. 빌드 요약
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 빌드 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 패키지: $ZIP_NAME"
echo "📁 빌드 폴더: dist/"
echo "📌 버전: $VERSION"
echo ""
echo "다음 단계:"
echo "1. dist/ 폴더를 Chrome Extension으로 로드하여 테스트"
echo "2. $ZIP_NAME 파일을 Chrome Web Store에 업로드"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

