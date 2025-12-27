# Chrome Extension 빌드 및 배포 가이드

## 1. 빌드 전 준비사항

### 1.1 아이콘 파일 준비

Chrome Extension은 다양한 크기의 아이콘이 필요합니다:
- 16x16: Extension 팝업 및 브라우저 툴바
- 32x32: Extension 관리 페이지
- 48x48: Extension 관리 페이지
- 128x128: Chrome Web Store

**현재 상태**: 아이콘 파일이 placeholder로 되어 있습니다.

**작업 필요**:
1. GAEO Analysis 로고를 기반으로 아이콘 디자인
2. 4가지 크기로 아이콘 생성 (PNG 형식)
3. `chrome-extension/public/icons/` 폴더에 저장
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`

**아이콘 생성 도구**:
- [Figma](https://www.figma.com/) - 디자인
- [ImageMagick](https://imagemagick.org/) - 리사이징
- [Online Icon Converter](https://convertio.co/kr/png-ico/) - 형식 변환

### 1.2 환경 변수 확인

현재 API URL이 하드코딩되어 있습니다. 프로덕션 환경에 맞게 확인:

```typescript
// src/utils/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gaeoanalysis.vercel.app'
  : 'http://localhost:3000';
```

**확인 사항**:
- 프로덕션 API URL이 올바른지 확인
- CORS 설정이 Extension 요청을 허용하는지 확인

### 1.3 manifest.json 최종 확인

```json
{
  "manifest_version": 3,
  "name": "GAEO Analysis",
  "version": "1.0.0",
  "description": "AI 검색 시대, 콘텐츠 최적화를 한 번에 - AEO/GEO/SEO 점수 측정 및 개선 가이드",
  ...
}
```

**확인 사항**:
- 버전 번호 (Semantic Versioning 권장)
- 설명이 명확하고 간결한지
- 권한이 최소한인지

---

## 2. 빌드 프로세스

### 2.1 개발 빌드

```bash
cd chrome-extension
npm install
npm run build
```

빌드 결과물은 `chrome-extension/dist/` 폴더에 생성됩니다.

**빌드 결과물 확인**:
```
dist/
├── manifest.json
├── popup.html
├── background.js
├── content.js
├── assets/
│   ├── popup.[hash].js
│   └── popup.[hash].css
└── icons/
    └── ...
```

### 2.2 프로덕션 빌드 최적화

현재 Vite 설정은 기본 최적화를 포함하고 있습니다. 추가 최적화가 필요하면:

**vite.config.ts 개선 사항**:
```typescript
build: {
  minify: 'terser', // 코드 압축
  terserOptions: {
    compress: {
      drop_console: true, // 콘솔 로그 제거
    },
  },
  rollupOptions: {
    output: {
      manualChunks: undefined, // 코드 스플리팅 비활성화 (Extension은 작은 번들이 유리)
    },
  },
}
```

---

## 3. 로컬 테스트

### 3.1 Extension 로드

1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단의 **"개발자 모드"** 활성화
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. `chrome-extension/dist/` 폴더 선택

### 3.2 테스트 체크리스트

#### 기본 기능 테스트
- [ ] Extension 아이콘이 툴바에 표시되는가?
- [ ] 팝업이 정상적으로 열리는가?
- [ ] 현재 탭 URL이 자동으로 감지되는가?

#### 분석 기능 테스트
- [ ] 로그인 상태 확인이 작동하는가?
- [ ] 분석 API 호출이 성공하는가?
- [ ] 점수 대시보드가 표시되는가?
- [ ] AI 모델별 인용 확률이 표시되는가?

#### 체크리스트 기능 테스트
- [ ] 체크리스트가 생성되는가?
- [ ] 체크 상태가 저장/복원되는가?
- [ ] 필터링이 작동하는가?

#### AI Agent 기능 테스트
- [ ] AI Agent 채팅이 작동하는가?
- [ ] 빠른 질문 버튼이 표시되는가?
- [ ] 대화 이력이 저장/불러오기 되는가?

#### 수정안 기능 테스트
- [ ] 수정안 생성이 작동하는가?
- [ ] Before/After 비교가 표시되는가?
- [ ] 수정안 복사가 작동하는가?
- [ ] Content Script가 정상적으로 주입되는가?
- [ ] 수정안 적용이 실제 페이지에 반영되는가?

#### 에러 처리 테스트
- [ ] 네트워크 오류 시 적절한 메시지가 표시되는가?
- [ ] 로그인 필요 시 안내가 표시되는가?
- [ ] 잘못된 URL 입력 시 에러가 표시되는가?

### 3.3 크로스 브라우저 테스트

- [ ] Chrome 최신 버전
- [ ] Chrome Beta
- [ ] Edge (Chromium 기반)

---

## 4. Chrome Web Store 등록 준비

### 4.1 필수 자료 준비

#### 1. 스토어 리스팅 정보
- **이름**: GAEO Analysis
- **간단한 설명** (80자 이내): "AI 검색 시대, 콘텐츠 최적화를 한 번에"
- **상세 설명** (132자 이내): "ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구. AEO/GEO/SEO 점수를 30초 안에 종합 진단하고, AI 모델별 인용 확률과 개선 가이드를 제공합니다."

#### 2. 스크린샷
- 최소 1개, 권장 5개
- 크기: 1280x800 또는 640x400
- Extension 팝업 스크린샷
- 주요 기능 하이라이트

#### 3. 프로모션 이미지 (선택)
- 작은 타일: 440x280
- 큰 타일: 920x680
- 마키: 1400x560

#### 4. 아이콘
- 128x128 PNG (이미 준비됨)

### 4.2 개인정보 보호 정책

Chrome Web Store 등록 시 개인정보 보호 정책 URL이 필요합니다.

**필요한 내용**:
- 수집하는 데이터 (URL, 분석 결과 등)
- 데이터 사용 목적
- 데이터 저장 위치
- 사용자 권리

**예시 위치**: `https://gaeoanalysis.vercel.app/privacy-policy`

### 4.3 서비스 약관

Extension 사용 약관도 필요할 수 있습니다.

**예시 위치**: `https://gaeoanalysis.vercel.app/terms`

---

## 5. 패키징 및 업로드

### 5.1 ZIP 파일 생성

```bash
cd chrome-extension
npm run build
cd dist
zip -r ../gaeo-analysis-extension-v1.0.0.zip .
```

또는:

```bash
# Windows
cd chrome-extension/dist
powershell Compress-Archive -Path * -DestinationPath ../gaeo-analysis-extension-v1.0.0.zip

# macOS/Linux
cd chrome-extension/dist
zip -r ../gaeo-analysis-extension-v1.0.0.zip .
```

### 5.2 ZIP 파일 검증

생성된 ZIP 파일을 다시 로드하여 테스트:
1. `chrome://extensions/` 접속
2. "압축해제된 확장 프로그램을 로드합니다" 클릭
3. ZIP 파일을 압축 해제한 폴더 선택
4. 정상 작동 확인

### 5.3 Chrome Web Store 업로드

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 접속
2. Google 계정으로 로그인
3. "새 항목" 클릭
4. ZIP 파일 업로드
5. 스토어 리스팅 정보 입력
6. 개인정보 보호 정책 URL 입력
7. 심사 제출

---

## 6. 심사 프로세스

### 6.1 심사 기간
- 일반적으로 1-3일 소요
- 첫 등록 시 더 오래 걸릴 수 있음

### 6.2 심사 기준
- [Chrome Web Store 정책](https://developer.chrome.com/docs/webstore/program-policies/) 준수
- 기능이 정상 작동하는지
- 개인정보 보호 정책이 있는지
- 스팸/악성 코드가 없는지

### 6.3 거부 시 대응
- 거부 사유 확인
- 문제점 수정
- 재제출

---

## 7. 업데이트 프로세스

### 7.1 버전 관리

Semantic Versioning 사용:
- **MAJOR**: 호환되지 않는 변경
- **MINOR**: 새로운 기능 추가 (하위 호환)
- **PATCH**: 버그 수정

예: `1.0.0` → `1.0.1` (버그 수정) → `1.1.0` (새 기능)

### 7.2 업데이트 배포

1. 코드 수정 및 테스트
2. `manifest.json`의 `version` 업데이트
3. 빌드 및 ZIP 생성
4. Chrome Web Store에서 새 버전 업로드
5. 변경 사항 설명 작성
6. 심사 제출

---

## 8. 모니터링 및 유지보수

### 8.1 사용자 피드백

- Chrome Web Store 리뷰 모니터링
- 사용자 문의 대응
- 버그 리포트 수집

### 8.2 성능 모니터링

- Extension 사용 통계 (Chrome Web Store 제공)
- 에러 로깅 (선택적)
- 사용자 만족도 조사

### 8.3 정기 업데이트

- Chrome API 변경사항 모니터링
- 보안 업데이트
- 기능 개선

---

## 9. 체크리스트 요약

### 빌드 전
- [ ] 아이콘 파일 생성 (16, 32, 48, 128)
- [ ] manifest.json 최종 확인
- [ ] API URL 확인
- [ ] 환경 변수 설정

### 빌드
- [ ] `npm run build` 실행
- [ ] 빌드 오류 없음 확인
- [ ] dist 폴더 내용 확인

### 로컬 테스트
- [ ] Extension 로드 성공
- [ ] 모든 기능 정상 작동
- [ ] 에러 처리 확인
- [ ] 크로스 브라우저 테스트

### 배포 준비
- [ ] ZIP 파일 생성
- [ ] ZIP 파일 검증
- [ ] 스크린샷 준비
- [ ] 개인정보 보호 정책 작성
- [ ] 스토어 리스팅 정보 작성

### 업로드
- [ ] Chrome Web Store Developer 계정 생성
- [ ] ZIP 파일 업로드
- [ ] 스토어 리스팅 정보 입력
- [ ] 심사 제출

---

## 10. 다음 단계 (우선순위)

### 즉시 진행 (필수)
1. **아이콘 파일 생성** - Extension의 첫인상
2. **로컬 테스트 완료** - 모든 기능 검증
3. **개인정보 보호 정책 작성** - Chrome Web Store 필수

### 단기 (1주일 내)
4. **스크린샷 준비** - 스토어 리스팅 품질 향상
5. **ZIP 파일 생성 및 검증** - 배포 준비
6. **Chrome Web Store 계정 생성** - 등록 준비

### 중기 (1개월 내)
7. **Chrome Web Store 등록** - 공개 배포
8. **사용자 피드백 수집** - 개선 방향 파악
9. **성능 모니터링 설정** - 사용 패턴 분석

---

## 11. 참고 자료

- [Chrome Extension 개발 가이드](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store 등록 가이드](https://developer.chrome.com/docs/webstore/)
- [Chrome Extension API 레퍼런스](https://developer.chrome.com/docs/extensions/reference/)
- [Chrome Web Store 정책](https://developer.chrome.com/docs/webstore/program-policies/)

---

## 12. 문제 해결

### 빌드 오류
- TypeScript 오류: `npm run build` 실행 시 오류 메시지 확인
- 의존성 문제: `npm install` 재실행
- Vite 설정: `vite.config.ts` 확인

### Extension 로드 실패
- manifest.json 문법 오류 확인
- 권한 설정 확인
- Content Script 경로 확인

### API 호출 실패
- CORS 설정 확인
- 세션 쿠키 확인
- 네트워크 탭에서 요청 확인

### Content Script 작동 안 함
- manifest.json의 content_scripts 설정 확인
- 페이지 새로고침 필요
- 콘솔에서 에러 확인

---

이 가이드를 따라 단계별로 진행하시면 Chrome Extension을 성공적으로 배포할 수 있습니다!

