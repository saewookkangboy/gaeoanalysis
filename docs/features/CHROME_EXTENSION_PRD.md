# Chrome Extension 개발 PRD (Product Requirements Document)

## 1. 개요

### 1.1 프로젝트 목적
현재 GAEO Analysis 웹 서비스의 핵심 기능인 콘텐츠 분석 기능을 Chrome Extension으로 확장하여, 사용자가 웹 브라우징 중 언제든지 현재 페이지의 콘텐츠를 빠르게 분석하고 요약 결과를 확인할 수 있도록 합니다.

### 1.2 핵심 가치 제안
- **즉시 분석**: 현재 보고 있는 웹페이지를 바로 분석
- **요약 보기**: Extension 팝업에서 핵심 점수와 인사이트를 빠르게 확인
- **상세 결과**: 전체 분석 결과는 웹 서비스에서 확인
- **원클릭 접근**: 브라우저 툴바에서 한 번의 클릭으로 분석 시작

### 1.3 대상 사용자
- 콘텐츠 크리에이터 (블로거, 유튜버, 인플루언서)
- SEO 전문가 및 마케터
- 콘텐츠 최적화에 관심이 있는 모든 사용자

---

## 2. 기능 요구사항

### 2.1 핵심 기능

#### 2.1.1 자동 URL 감지
- **기능**: 현재 활성화된 브라우저 탭의 URL을 자동으로 감지
- **동작**: Extension 팝업 열기 시 현재 탭의 URL을 자동으로 입력 필드에 표시
- **예외 처리**: 
  - `chrome://`, `chrome-extension://`, `about:` 등 특수 URL은 분석 불가 안내
  - 파일 시스템 URL (`file://`)은 분석 불가 안내

#### 2.1.2 분석 시작 버튼
- **위치**: Extension 팝업 상단의 주요 액션 버튼
- **동작**:
  1. 현재 URL이 유효한지 검증
  2. 로그인 상태 확인
  3. 미로그인 시 로그인 안내 및 웹 서비스 로그인 페이지로 리디렉션
  4. 로그인 완료 후 자동으로 분석 시작
- **상태 표시**:
  - 대기 중: "분석 시작" 버튼
  - 분석 중: "분석 중..." + 진행률 표시
  - 완료: 자동으로 요약 결과 표시

#### 2.1.3 요약 결과 표시
Extension 팝업에서 표시할 요약 정보:

**필수 표시 항목:**
1. **종합 점수** (Overall Score)
   - 큰 숫자로 표시 (예: 75/100)
   - 점수에 따른 색상 구분 (80+ 녹색, 60-79 노란색, 60 미만 빨간색)
   - 등급 표시 (우수/양호/개선 필요)

2. **세부 점수 카드** (3개)
   - AEO 점수
   - GEO 점수
   - SEO 점수
   - 각 점수는 작은 카드 형태로 표시

3. **주요 인사이트** (Top 3)
   - High severity 인사이트 우선 표시
   - 각 인사이트는 카테고리와 메시지 표시
   - "더 보기" 링크로 전체 인사이트 확인 가능

4. **AI 모델별 인용 확률** (간략 버전)
   - ChatGPT, Perplexity, Gemini, Claude 점수만 표시
   - 각 점수를 아이콘과 함께 표시

**선택적 표시 항목:**
- 분석 시간 표시
- 캐시된 결과 여부 표시

#### 2.1.4 전체 결과 보기 연결
- **버튼**: "전체 결과 보기" 또는 "상세 분석 보기" 버튼
- **동작**: 
  - 새 탭에서 웹 서비스의 분석 결과 페이지 열기
  - URL 형식: `https://[서비스도메인]/analysis/[analysisId]` 또는 `https://[서비스도메인]/?analysisId=[analysisId]`
  - 분석 ID를 쿼리 파라미터로 전달하여 해당 분석 결과를 바로 표시

#### 2.1.5 로그인 상태 관리
- **인증 확인**: Extension 시작 시 현재 로그인 상태 확인
- **세션 유지**: 웹 서비스의 NextAuth 세션 쿠키를 Extension에서 읽어 로그인 상태 확인
- **로그인 안내**: 미로그인 시 로그인 버튼 표시 및 웹 서비스 로그인 페이지로 리디렉션
- **로그인 완료 처리**: OAuth 콜백 후 Extension으로 돌아와서 자동 분석 시작

### 2.2 부가 기능

#### 2.2.1 분석 이력 조회
- Extension 팝업에서 최근 분석 이력 5개 표시
- 각 이력 항목 클릭 시 해당 분석 결과 요약 표시
- "전체 이력 보기" 링크로 웹 서비스 이력 페이지로 이동

#### 2.2.2 빠른 재분석
- 같은 URL에 대해 재분석 버튼 제공
- 캐시된 결과가 있어도 강제 재분석 옵션

#### 2.2.3 알림 기능
- 분석 완료 시 브라우저 알림 표시 (선택적)
- Extension 아이콘에 배지로 분석 완료 표시

---

## 3. 기술 스택 및 아키텍처

### 3.1 기술 스택

#### 3.1.1 Extension 개발
- **언어**: TypeScript
- **프레임워크**: React (또는 Vanilla JS)
- **빌드 도구**: Vite 또는 Webpack
- **스타일링**: Tailwind CSS (웹 서비스와 일관성 유지)
- **상태 관리**: React Context 또는 Zustand (간단한 상태의 경우)

#### 3.1.2 Chrome Extension API
- `chrome.tabs`: 현재 탭 정보 가져오기
- `chrome.storage`: 로컬 데이터 저장 (분석 이력, 설정 등)
- `chrome.runtime`: 메시지 전달, 백그라운드 스크립트
- `chrome.action`: Extension 아이콘 및 팝업 관리
- `chrome.cookies`: 웹 서비스 세션 쿠키 읽기 (인증 확인)

### 3.2 아키텍처 구조

```
chrome-extension/
├── manifest.json          # Extension 설정 파일
├── src/
│   ├── popup/            # 팝업 UI
│   │   ├── Popup.tsx
│   │   ├── components/
│   │   │   ├── AnalysisButton.tsx
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── InsightList.tsx
│   │   │   └── LoginPrompt.tsx
│   │   └── styles/
│   ├── background/       # 백그라운드 스크립트
│   │   └── background.ts
│   ├── content/         # 콘텐츠 스크립트 (필요시)
│   │   └── content.ts
│   ├── utils/
│   │   ├── api.ts        # API 호출 유틸리티
│   │   ├── auth.ts       # 인증 관련 유틸리티
│   │   └── storage.ts    # 로컬 스토리지 유틸리티
│   └── types/
│       └── analysis.ts   # 타입 정의
├── public/
│   ├── icons/           # Extension 아이콘
│   └── images/
└── package.json
```

### 3.3 데이터 흐름

```
[사용자] 
  ↓ 클릭
[Extension Popup]
  ↓ 현재 URL 가져오기
[chrome.tabs API]
  ↓ URL 검증
[Extension]
  ↓ 로그인 상태 확인
[chrome.cookies API] → [웹 서비스 세션 쿠키]
  ↓ 로그인 확인
[Extension]
  ↓ 분석 요청
[POST /api/analyze] → [웹 서비스 API]
  ↓ 분석 수행
[웹 서비스]
  ↓ 분석 결과 반환 (analysisId 포함)
[Extension]
  ↓ 요약 정보 추출 및 표시
[Popup UI]
  ↓ "전체 결과 보기" 클릭
[새 탭 열기] → [웹 서비스 분석 결과 페이지]
```

---

## 4. API 설계

### 4.1 기존 API 활용

#### 4.1.1 분석 요청 API
```
POST /api/analyze
Content-Type: application/json
Authorization: Cookie (NextAuth 세션 쿠키)

Request Body:
{
  "url": "https://example.com/article"
}

Response:
{
  "id": "analysis-uuid",
  "aeoScore": 75,
  "geoScore": 80,
  "seoScore": 70,
  "overallScore": 75,
  "insights": [
    {
      "severity": "High",
      "category": "Content Quality",
      "message": "콘텐츠 길이가 부족합니다."
    }
  ],
  "aioAnalysis": {
    "scores": {
      "chatgpt": 85,
      "perplexity": 80,
      "gemini": 75,
      "claude": 70
    }
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### 4.1.2 분석 결과 조회 API (신규 개발 필요)
```
GET /api/analysis/[analysisId]
Authorization: Cookie (NextAuth 세션 쿠키)

Response:
{
  "id": "analysis-uuid",
  "url": "https://example.com/article",
  "aeoScore": 75,
  "geoScore": 80,
  "seoScore": 70,
  "overallScore": 75,
  "insights": [...],
  "aioAnalysis": {...},
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 4.2 Extension 전용 API (선택적)

#### 4.2.1 인증 상태 확인 API
```
GET /api/auth/status
Authorization: Cookie (NextAuth 세션 쿠키)

Response:
{
  "authenticated": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

#### 4.2.2 요약 정보 조회 API (선택적)
```
GET /api/analysis/[analysisId]/summary
Authorization: Cookie (NextAuth 세션 쿠키)

Response:
{
  "id": "analysis-uuid",
  "overallScore": 75,
  "scores": {
    "aeo": 75,
    "geo": 80,
    "seo": 70
  },
  "topInsights": [
    {
      "severity": "High",
      "category": "Content Quality",
      "message": "콘텐츠 길이가 부족합니다."
    }
  ],
  "aioScores": {
    "chatgpt": 85,
    "perplexity": 80,
    "gemini": 75,
    "claude": 70
  }
}
```

### 4.3 CORS 및 인증 처리

#### 4.3.1 CORS 설정
- Extension의 origin을 허용하도록 웹 서비스 CORS 설정
- 또는 Extension에서 `chrome.identity` API를 사용하여 인증 처리

#### 4.3.2 세션 쿠키 전달
- Extension에서 웹 서비스의 세션 쿠키를 읽어 API 요청에 포함
- `chrome.cookies.get()` API 사용

---

## 5. UI/UX 설계

### 5.1 팝업 레이아웃

```
┌─────────────────────────────────┐
│  [GAEO Analysis]        [설정]  │
├─────────────────────────────────┤
│                                 │
│  현재 페이지:                   │
│  https://example.com/article    │
│                                 │
│  [🚀 분석 시작]                 │
│                                 │
├─────────────────────────────────┤
│  분석 결과 (요약)               │
│                                 │
│  ┌─────────────────────────┐   │
│  │   종합 점수: 75/100     │   │
│  │   ⭐ 양호              │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌───┐  ┌───┐  ┌───┐          │
│  │AEO│  │GEO│  │SEO│          │
│  │ 75│  │ 80│  │ 70│          │
│  └───┘  └───┘  └───┘          │
│                                 │
│  주요 인사이트:                 │
│  • [High] 콘텐츠 길이 부족      │
│  • [Medium] 이미지 최적화 필요  │
│  • [Low] 메타 설명 개선         │
│                                 │
│  AI 모델별 인용 확률:           │
│  🤖 ChatGPT: 85  🔍 Perplexity: 80│
│  💎 Gemini: 75  🧠 Claude: 70   │
│                                 │
│  [📊 전체 결과 보기]            │
│                                 │
└─────────────────────────────────┘
```

### 5.2 상태별 UI

#### 5.2.1 초기 상태 (분석 전)
- URL 입력 필드 (자동 채워짐)
- "분석 시작" 버튼
- 간단한 안내 문구

#### 5.2.2 분석 중 상태
- 진행률 표시 (Progress Bar)
- 단계별 상태 표시 (URL 가져오기 → HTML 파싱 → 점수 계산 → AI 분석)
- 예상 소요 시간 표시
- 취소 버튼

#### 5.2.3 분석 완료 상태
- 요약 결과 표시 (위 레이아웃 참조)
- "전체 결과 보기" 버튼
- "다시 분석" 버튼

#### 5.2.4 에러 상태
- 에러 메시지 표시
- 에러 타입별 해결 방법 안내
- "다시 시도" 버튼

#### 5.2.5 로그인 필요 상태
- 로그인 안내 메시지
- "로그인하기" 버튼
- 로그인 후 자동 분석 안내

### 5.3 반응형 디자인
- 팝업 크기: 최소 400px × 600px (Chrome Extension 팝업 표준)
- 모바일 대응: Extension은 데스크톱 전용이므로 모바일 대응 불필요
- 다크 모드: 시스템 설정에 따라 자동 전환 (선택적)

### 5.4 아이콘 및 브랜딩
- Extension 아이콘: 웹 서비스 로고와 일관성 유지
- 아이콘 상태:
  - 기본: 정적 아이콘
  - 분석 중: 애니메이션 또는 색상 변경
  - 완료: 배지 표시 (선택적)

---

## 6. 인증 처리 상세

### 6.1 세션 쿠키 확인

```typescript
// Extension에서 세션 쿠키 확인
async function checkAuthStatus(): Promise<boolean> {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: '.gaeoanalysis.vercel.app', // 웹 서비스 도메인
      name: 'authjs.session-token' // NextAuth 세션 쿠키 이름
    });
    
    return cookies.length > 0 && cookies[0].value !== '';
  } catch (error) {
    console.error('인증 상태 확인 실패:', error);
    return false;
  }
}
```

### 6.2 API 요청 시 쿠키 포함

```typescript
// Extension에서 API 요청
async function analyzeUrl(url: string): Promise<AnalysisResult> {
  // 세션 쿠키 가져오기
  const cookies = await chrome.cookies.getAll({
    domain: '.gaeoanalysis.vercel.app',
    name: 'authjs.session-token'
  });
  
  const sessionCookie = cookies[0];
  
  // API 요청
  const response = await fetch('https://gaeoanalysis.vercel.app/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${sessionCookie.name}=${sessionCookie.value}`
    },
    body: JSON.stringify({ url })
  });
  
  return response.json();
}
```

### 6.3 로그인 플로우

1. **Extension에서 로그인 필요 감지**
   - 세션 쿠키가 없거나 만료된 경우
   - API 요청 시 401 응답 받은 경우

2. **로그인 페이지로 리디렉션**
   ```typescript
   chrome.tabs.create({
     url: 'https://gaeoanalysis.vercel.app/login?returnTo=extension&url=' + encodeURIComponent(currentUrl)
   });
   ```

3. **로그인 완료 후 Extension으로 복귀**
   - OAuth 콜백 완료 후 Extension이 감지
   - 저장된 URL로 자동 분석 시작

### 6.4 대안: OAuth 직접 구현 (고급)

Extension에서 직접 OAuth 플로우를 구현하는 경우:
- `chrome.identity.launchWebAuthFlow()` API 사용
- Google/GitHub OAuth 직접 처리
- 더 복잡하지만 더 나은 사용자 경험 제공 가능

---

## 7. 데이터 저장 및 관리

### 7.1 로컬 스토리지 사용

#### 7.1.1 저장할 데이터
- 최근 분석 이력 (최대 10개)
- 사용자 설정 (알림 설정, 자동 분석 등)
- 캐시된 분석 결과 (선택적)

#### 7.1.2 chrome.storage API 사용
```typescript
// 분석 이력 저장
async function saveAnalysisHistory(analysis: AnalysisResult) {
  const history = await chrome.storage.local.get('analysisHistory');
  const updatedHistory = [
    analysis,
    ...(history.analysisHistory || []).slice(0, 9) // 최대 10개 유지
  ];
  
  await chrome.storage.local.set({ analysisHistory: updatedHistory });
}
```

### 7.2 데이터 동기화
- Extension과 웹 서비스 간 데이터 동기화는 불필요
- 분석 결과는 웹 서비스 DB에 저장되므로 Extension은 요약 정보만 표시

---

## 8. 구현 단계

### Phase 1: 기본 기능 (MVP)
**기간**: 2-3주

1. **Extension 기본 구조 설정**
   - manifest.json 작성
   - React 프로젝트 설정
   - 빌드 시스템 구성

2. **현재 URL 감지**
   - chrome.tabs API 연동
   - URL 검증 로직

3. **분석 API 연동**
   - API 호출 함수 구현
   - 에러 처리

4. **기본 UI 구현**
   - 팝업 레이아웃
   - 분석 시작 버튼
   - 로딩 상태 표시

5. **요약 결과 표시**
   - 점수 카드
   - 주요 인사이트
   - 전체 결과 보기 링크

### Phase 2: 인증 및 세션 관리
**기간**: 1-2주

1. **세션 쿠키 확인**
   - chrome.cookies API 연동
   - 인증 상태 확인 로직

2. **로그인 플로우**
   - 로그인 안내 UI
   - 로그인 페이지 리디렉션
   - 로그인 완료 후 복귀 처리

3. **API 요청 시 쿠키 포함**
   - 모든 API 요청에 세션 쿠키 자동 포함

### Phase 3: 고급 기능
**기간**: 1-2주

1. **분석 이력 조회**
   - 최근 분석 이력 표시
   - 이력 클릭 시 요약 표시

2. **에러 처리 강화**
   - 네트워크 에러 처리
   - 레이트 리미트 처리
   - 사용자 친화적 에러 메시지

3. **성능 최적화**
   - 결과 캐싱
   - 로딩 상태 개선

### Phase 4: 폴리싱 및 배포
**기간**: 1주

1. **UI/UX 개선**
   - 애니메이션 추가
   - 다크 모드 지원 (선택적)
   - 접근성 개선

2. **테스트**
   - 기능 테스트
   - 크로스 브라우저 테스트 (Chrome, Edge)
   - 사용자 테스트

3. **Chrome Web Store 등록**
   - 스토어 리스팅 작성
   - 스크린샷 및 설명
   - 개인정보 보호 정책

---

## 9. 보안 고려사항

### 9.1 데이터 보안
- 세션 쿠키는 암호화되어 저장됨 (NextAuth 기본 동작)
- API 요청은 HTTPS만 사용
- 민감한 정보는 로컬 스토리지에 저장하지 않음

### 9.2 권한 최소화
- 필요한 최소한의 Chrome API 권한만 요청
- `host_permissions`는 웹 서비스 도메인만 허용

### 9.3 Content Security Policy (CSP)
- manifest.json에 적절한 CSP 설정
- 인라인 스크립트 최소화

### 9.4 개인정보 보호
- 사용자 데이터 수집 최소화
- 분석 이력은 로컬에만 저장 (선택적)
- 개인정보 보호 정책 작성

---

## 10. 테스트 계획

### 10.1 단위 테스트
- API 호출 함수 테스트
- URL 검증 로직 테스트
- 데이터 변환 함수 테스트

### 10.2 통합 테스트
- Extension과 웹 서비스 API 연동 테스트
- 인증 플로우 테스트
- 분석 결과 표시 테스트

### 10.3 사용자 테스트
- 실제 사용자 그룹으로 베타 테스트
- 피드백 수집 및 개선

### 10.4 호환성 테스트
- Chrome 최신 버전
- Chrome 확장 프로그램 정책 준수
- Edge 브라우저 호환성 (선택적)

---

## 11. 배포 및 유지보수

### 11.1 배포 프로세스
1. Chrome Web Store 개발자 계정 등록
2. Extension 패키징 (zip 파일)
3. 스토어에 업로드 및 심사 제출
4. 심사 통과 후 공개

### 11.2 버전 관리
- Semantic Versioning (MAJOR.MINOR.PATCH)
- 변경 로그 작성
- 사용자에게 업데이트 알림

### 11.3 모니터링
- 에러 로깅 (선택적)
- 사용량 통계 (Chrome Web Store 제공)
- 사용자 피드백 수집

### 11.4 업데이트 계획
- 웹 서비스 API 변경 시 Extension 업데이트
- 새로운 기능 추가
- 버그 수정

---

## 12. 성공 지표 (KPI)

### 12.1 사용량 지표
- 일일 활성 사용자 수 (DAU)
- 주간 활성 사용자 수 (WAU)
- 월간 활성 사용자 수 (MAU)
- Extension 설치 수

### 12.2 사용 패턴
- 평균 분석 횟수 (사용자당)
- Extension에서 웹 서비스로 전환율
- 분석 완료율

### 12.3 사용자 만족도
- Chrome Web Store 평점
- 사용자 리뷰
- 피드백 수집

---

## 13. 향후 개선 사항

### 13.1 기능 확장
- 다른 브라우저 지원 (Firefox, Safari)
- 배치 분석 기능
- 분석 결과 비교 기능
- 알림 및 리마인더 기능

### 13.2 성능 개선
- 오프라인 모드 지원 (캐시된 결과 표시)
- 백그라운드 분석
- 결과 프리로딩

### 13.3 사용자 경험 개선
- 키보드 단축키 지원
- 컨텍스트 메뉴 통합
- 페이지 하이라이트 기능

---

## 14. 리스크 및 대응 방안

### 14.1 기술적 리스크

#### 리스크: Chrome Extension API 변경
- **대응**: 정기적인 Chrome 업데이트 모니터링 및 테스트

#### 리스크: 웹 서비스 API 변경
- **대응**: API 버전 관리 및 Extension 버전 호환성 유지

#### 리스크: 인증 세션 만료
- **대응**: 세션 만료 감지 및 자동 재로그인 유도

### 14.2 비즈니스 리스크

#### 리스크: 사용자 채택률 낮음
- **대응**: 마케팅 및 사용자 교육, 기능 개선

#### 리스크: Chrome Web Store 심사 실패
- **대응**: 심사 가이드라인 사전 검토 및 준수

---

## 15. 참고 자료

### 15.1 Chrome Extension 문서
- [Chrome Extension 개발 가이드](https://developer.chrome.com/docs/extensions/)
- [Chrome Extension API 레퍼런스](https://developer.chrome.com/docs/extensions/reference/)
- [Chrome Web Store 등록 가이드](https://developer.chrome.com/docs/webstore/)

### 15.2 웹 서비스 관련
- 현재 서비스 API 문서
- NextAuth 문서
- 분석 결과 데이터 구조

### 15.3 디자인 리소스
- 웹 서비스 디자인 시스템
- 아이콘 및 이미지 리소스

---

## 16. 결론

이 PRD는 GAEO Analysis Chrome Extension 개발을 위한 종합적인 가이드입니다. Phase 1의 MVP를 먼저 구현하여 핵심 기능을 검증하고, 사용자 피드백을 바탕으로 점진적으로 기능을 확장하는 것이 권장됩니다.

Extension을 통해 사용자가 더 쉽고 빠르게 콘텐츠 분석 기능에 접근할 수 있도록 하여, 전체 서비스의 사용자 경험을 향상시키는 것이 최종 목표입니다.

