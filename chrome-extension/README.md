# GAEO Analysis Chrome Extension

Chrome Extension for GAEO Analysis - AI 검색 시대, 콘텐츠 최적화를 한 번에

## 개발 환경 설정

### 1. 의존성 설치

```bash
cd chrome-extension
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 4. Chrome Extension 로드

1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `chrome-extension/dist` 폴더 선택

## 프로젝트 구조

```
chrome-extension/
├── src/
│   ├── popup/              # Extension 팝업 UI
│   │   ├── Popup.tsx       # 메인 팝업 컴포넌트
│   │   ├── components/     # 팝업 컴포넌트
│   │   │   ├── ScoreDashboard.tsx
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── AIOCitationCards.tsx
│   │   │   └── ScoreHistoryChart.tsx
│   │   └── index.css
│   ├── background/         # 백그라운드 스크립트
│   ├── content/           # 콘텐츠 스크립트
│   ├── utils/             # 유틸리티
│   │   ├── api.ts
│   │   └── storage.ts
│   └── types/             # 타입 정의
│       └── analysis.ts
├── public/                # 정적 파일
│   └── icons/            # Extension 아이콘
├── manifest.json          # Extension 설정
├── popup.html            # 팝업 HTML
└── vite.config.ts        # Vite 설정
```

## 기능

### Phase 1: 점수 측정 기능 ✅

- 실시간 점수 표시 (AEO/GEO/SEO + AI 모델별 인용 확률)
- 점수 애니메이션 효과
- 점수 히스토리 추적 및 그래프 표시
- 종합 점수 대시보드

## 개발 상태

- [x] 기본 구조 설정
- [x] 점수 대시보드 컴포넌트
- [x] API 연동
- [x] 점수 히스토리 저장 및 표시
- [ ] 아이콘 추가
- [ ] 에러 처리 강화
- [ ] 로딩 상태 개선

## 참고

웹 서비스 API는 `https://gaeoanalysis.vercel.app` 또는 `http://localhost:3000`에서 실행 중이어야 합니다.

