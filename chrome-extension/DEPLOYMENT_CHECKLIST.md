# Chrome Extension 배포 체크리스트

## ✅ 빌드 전 체크리스트

### 필수 항목
- [ ] **아이콘 파일 생성** (16x16, 32x32, 48x48, 128x128 PNG)
  - 위치: `public/icons/`
  - 파일명: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
  
- [ ] **manifest.json 확인**
  - [ ] 버전 번호 업데이트 (Semantic Versioning)
  - [ ] 이름과 설명이 명확한지
  - [ ] 권한이 최소한인지
  - [ ] host_permissions가 올바른지

- [ ] **API URL 확인**
  - [ ] 프로덕션 API URL이 올바른지 (`https://gaeoanalysis.vercel.app`)
  - [ ] CORS 설정 확인

- [ ] **환경 변수 확인**
  - [ ] NODE_ENV 설정 확인
  - [ ] API 키 등 민감한 정보가 하드코딩되지 않았는지

### 권장 항목
- [ ] 코드 주석 정리
- [ ] 콘솔 로그 제거 (프로덕션 빌드 시)
- [ ] 에러 메시지 사용자 친화적으로 개선
- [ ] 접근성 개선 (ARIA 라벨 등)

---

## 🔨 빌드 체크리스트

### 빌드 실행
```bash
cd chrome-extension
npm run build
# 또는
npm run build:store
```

- [ ] 빌드 오류 없음
- [ ] TypeScript 컴파일 오류 없음
- [ ] Vite 빌드 성공

### 빌드 결과 확인
- [ ] `dist/` 폴더 생성됨
- [ ] `dist/manifest.json` 존재
- [ ] `dist/popup.html` 존재
- [ ] `dist/background.js` 존재
- [ ] `dist/content.js` 존재
- [ ] `dist/assets/` 폴더에 JS/CSS 파일 존재
- [ ] `dist/icons/` 폴더에 아이콘 파일 존재

---

## 🧪 로컬 테스트 체크리스트

### Extension 로드
- [ ] Chrome에서 `chrome://extensions/` 접속
- [ ] "개발자 모드" 활성화
- [ ] `dist/` 폴더 로드 성공
- [ ] 에러 메시지 없음

### 기본 기능 테스트
- [ ] Extension 아이콘이 툴바에 표시됨
- [ ] 팝업이 정상적으로 열림
- [ ] 현재 탭 URL이 자동 감지됨
- [ ] 로그인 상태 확인 작동

### Phase 1: 점수 측정
- [ ] 분석 시작 버튼 작동
- [ ] 점수 대시보드 표시
- [ ] AEO/GEO/SEO 점수 표시
- [ ] AI 모델별 인용 확률 표시
- [ ] 점수 애니메이션 작동
- [ ] 점수 히스토리 그래프 표시

### Phase 2: 체크리스트
- [ ] 체크리스트 자동 생성
- [ ] 체크박스 작동
- [ ] 체크 상태 저장/복원
- [ ] 필터링 작동 (All/High/Medium/Low)
- [ ] 진행률 표시

### Phase 3: 개선 방향
- [ ] 개선 가이드 카드 표시
- [ ] AI Agent 채팅 작동
- [ ] 빠른 질문 버튼 작동
- [ ] 메시지 전송/수신
- [ ] 마크다운 렌더링
- [ ] 대화 이력 저장/불러오기

### Phase 4: 수정안
- [ ] 수정안 생성 버튼 작동
- [ ] AI 기반 수정안 생성
- [ ] Before/After 비교 표시
- [ ] 수정안 복사 작동
- [ ] Content Script 주입 확인
- [ ] 수정안 적용 작동 (선택적)

### 에러 처리 테스트
- [ ] 네트워크 오류 시 적절한 메시지
- [ ] 로그인 필요 시 안내
- [ ] 잘못된 URL 입력 시 에러
- [ ] API 오류 시 처리

### 크로스 브라우저
- [ ] Chrome 최신 버전
- [ ] Chrome Beta
- [ ] Edge (Chromium)

---

## 📦 패키징 체크리스트

### ZIP 파일 생성
```bash
npm run package
# 또는
bash scripts/build-for-store.sh
```

- [ ] ZIP 파일 생성 성공
- [ ] ZIP 파일 크기 확인 (일반적으로 1-5MB)
- [ ] ZIP 파일 내용 확인

### ZIP 파일 검증
- [ ] ZIP 파일 압축 해제
- [ ] 압축 해제된 폴더를 Extension으로 로드
- [ ] 정상 작동 확인

---

## 🏪 Chrome Web Store 등록 체크리스트

### 필수 자료 준비
- [ ] **스크린샷** (최소 1개, 권장 5개)
  - 크기: 1280x800 또는 640x400
  - Extension 팝업 스크린샷
  - 주요 기능 하이라이트

- [ ] **개인정보 보호 정책**
  - URL 준비: `https://gaeoanalysis.vercel.app/privacy-policy`
  - 수집 데이터 명시
  - 데이터 사용 목적
  - 저장 위치 및 기간

- [ ] **서비스 약관** (선택)
  - URL: `https://gaeoanalysis.vercel.app/terms`

### 스토어 리스팅 정보
- [ ] **이름**: GAEO Analysis
- [ ] **간단한 설명** (80자 이내)
- [ ] **상세 설명** (132자 이내)
- [ ] **카테고리** 선택
- [ ] **언어** 선택 (한국어)

### Chrome Web Store 계정
- [ ] Developer 계정 생성
- [ ] 등록비 결제 ($5, 일회성)
- [ ] 계정 인증 완료

### 업로드 및 심사
- [ ] ZIP 파일 업로드
- [ ] 스토어 리스팅 정보 입력
- [ ] 개인정보 보호 정책 URL 입력
- [ ] 스크린샷 업로드
- [ ] 심사 제출
- [ ] 심사 결과 대기 (1-3일)

---

## 🚀 배포 후 체크리스트

### 배포 확인
- [ ] Chrome Web Store에서 Extension 확인
- [ ] 다운로드 및 설치 테스트
- [ ] 모든 기능 정상 작동 확인

### 모니터링
- [ ] 사용자 리뷰 모니터링
- [ ] 에러 리포트 확인
- [ ] 사용 통계 확인

### 업데이트 준비
- [ ] 버전 관리 전략 수립
- [ ] 변경 로그 작성
- [ ] 업데이트 프로세스 문서화

---

## 🔧 문제 해결 가이드

### 빌드 오류
**문제**: TypeScript 컴파일 오류
- **해결**: `tsc --noEmit` 실행하여 오류 확인
- **해결**: 타입 오류 수정

**문제**: Vite 빌드 실패
- **해결**: `node_modules` 삭제 후 `npm install` 재실행
- **해결**: `vite.config.ts` 설정 확인

### Extension 로드 실패
**문제**: manifest.json 오류
- **해결**: JSON 문법 확인
- **해결**: 필수 필드 확인

**문제**: Content Script 작동 안 함
- **해결**: manifest.json의 content_scripts 확인
- **해결**: 페이지 새로고침
- **해결**: 콘솔에서 에러 확인

### API 호출 실패
**문제**: CORS 오류
- **해결**: 서버 CORS 설정 확인
- **해결**: host_permissions 확인

**문제**: 세션 쿠키 문제
- **해결**: 쿠키 도메인 확인
- **해결**: 로그인 상태 확인

---

## 📝 다음 단계 우선순위

### 즉시 진행 (필수)
1. ✅ **아이콘 파일 생성** - 가장 우선
2. ✅ **로컬 테스트 완료** - 모든 기능 검증
3. ✅ **개인정보 보호 정책 작성** - Chrome Web Store 필수

### 단기 (1주일 내)
4. ✅ **스크린샷 준비** - 스토어 리스팅 품질
5. ✅ **ZIP 파일 생성 및 검증** - 배포 준비
6. ✅ **Chrome Web Store 계정 생성** - 등록 준비

### 중기 (1개월 내)
7. ✅ **Chrome Web Store 등록** - 공개 배포
8. ✅ **사용자 피드백 수집** - 개선 방향
9. ✅ **성능 모니터링 설정** - 사용 패턴 분석

---

이 체크리스트를 따라 단계별로 진행하시면 성공적으로 배포할 수 있습니다!

