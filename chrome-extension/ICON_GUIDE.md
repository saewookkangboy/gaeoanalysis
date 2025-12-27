# 아이콘 파일 생성 가이드

## 현재 상태
- ✅ icon16.png 존재 (placeholder)
- ❌ icon32.png 없음
- ❌ icon48.png 없음
- ❌ icon128.png 없음

## 필요한 아이콘 크기
- **16x16**: Extension 팝업 및 브라우저 툴바
- **32x32**: Extension 관리 페이지
- **48x48**: Extension 관리 페이지
- **128x128**: Chrome Web Store

## 생성 방법

### 방법 1: 기존 아이콘 리사이징 (권장)
기존 icon16.png가 있다면 다른 크기로 리사이징:

```bash
# ImageMagick 사용
cd chrome-extension/public/icons
convert icon16.png -resize 32x32 icon32.png
convert icon16.png -resize 48x48 icon48.png
convert icon16.png -resize 128x128 icon128.png
```

### 방법 2: 디자인 도구 사용
1. Figma, Photoshop, Sketch 등에서 디자인
2. GAEO Analysis 로고 기반으로 아이콘 디자인
3. 각 크기로 내보내기

### 방법 3: 온라인 도구
- [Favicon Generator](https://realfavicongenerator.net/)
- [Icon Generator](https://www.favicon-generator.org/)

## 임시 해결책
빌드 및 테스트를 위해 placeholder 아이콘을 생성할 수 있습니다.
실제 배포 전에는 반드시 실제 아이콘으로 교체해야 합니다.

## 아이콘 디자인 가이드라인
- **명확성**: 작은 크기에서도 알아볼 수 있어야 함
- **일관성**: GAEO Analysis 브랜드와 일치
- **단순함**: 복잡한 디자인은 작은 크기에서 보기 어려움
- **대비**: 배경과 명확한 대비

## 배치 위치
모든 아이콘 파일은 다음 위치에 있어야 합니다:
- `chrome-extension/public/icons/icon16.png`
- `chrome-extension/public/icons/icon32.png`
- `chrome-extension/public/icons/icon48.png`
- `chrome-extension/public/icons/icon128.png`

빌드 후 `dist/icons/` 폴더로 자동 복사됩니다.

