# AI Agent 기능 명세서

## 📋 기본 정보

- **기능명**: AI Agent (AI 챗봇)
- **목적**: 콘텐츠 분석 결과를 기반으로 Google Gemini API를 사용하여 대화형 개선 방안을 제공하고, 사용자 질문에 실시간으로 답변
- **우선순위**: High
- **예상 소요 시간**: 이미 구현 완료
- **작성일**: 2025-12-04
- **작성자**: chunghyo, cursor ai(AI CODE IDE)

---

## 👤 사용자 스토리

### 주요 사용자 스토리
```
As a 콘텐츠 마케터/작성자,
I want 분석 결과를 기반으로 AI Agent와 대화하여 구체적인 개선 방안을 얻고 싶다,
So that 내 콘텐츠를 더 효과적으로 최적화할 수 있다.
```

### 추가 사용자 스토리
- **사용자 스토리 2**: 마크다운 형식의 답변을 받아 코드 블록, 리스트, 링크 등을 포함한 구조화된 정보를 얻고 싶다
- **사용자 스토리 3**: 동적으로 생성된 추천 질문을 통해 빠르게 자주 묻는 질문에 답변을 받고 싶다
- **사용자 스토리 4**: 이전 대화 이력을 저장하고 불러와서 연속적인 대화를 이어가고 싶다
- **사용자 스토리 5**: AI Agent의 답변을 복사하여 다른 곳에 활용하고 싶다

---

## 📝 기능 요구사항

### 기능적 요구사항 (Functional Requirements)

#### FR-1: AI 챗봇 대화
- **설명**: 사용자 메시지를 받아 Google Gemini API로 응답 생성
- **우선순위**: High
- **수용 기준**:
  - [x] 사용자 메시지 입력 및 전송
  - [x] Gemini API 2.5 Flash 모델 사용
  - [x] 분석 결과 컨텍스트 포함
  - [x] 대화 이력 컨텍스트 포함
  - [x] 스트리밍 응답 지원
  - [x] 응답 완전 수집 보장

#### FR-2: 마크다운 렌더링
- **설명**: AI 응답을 마크다운 형식으로 렌더링
- **우선순위**: High
- **수용 기준**:
  - [x] 제목 (H1-H6) 렌더링
  - [x] 리스트 (순서 있는/없는) 렌더링
  - [x] 코드 블록 렌더링
  - [x] 링크 렌더링
  - [x] 강조 (볼드, 이탤릭) 렌더링
  - [x] 인용문 렌더링
  - [x] 테이블 렌더링 (GFM)

#### FR-3: 코드 하이라이팅
- **설명**: 코드 블록의 구문 강조 표시
- **우선순위**: Medium
- **수용 기준**:
  - [x] Highlight.js를 사용한 구문 강조
  - [x] 다양한 프로그래밍 언어 지원
  - [x] 다크 모드 지원

#### FR-4: 답변 복사 기능
- **설명**: 각 답변을 클립보드에 복사
- **우선순위**: Medium
- **수용 기준**:
  - [x] 호버 시 복사 버튼 표시
  - [x] 클릭으로 전체 답변 복사
  - [x] 복사 성공 시 토스트 알림

#### FR-5: 동적 추천 질문 생성
- **설명**: 분석 결과와 대화 맥락을 기반으로 추천 질문 자동 생성
- **우선순위**: High
- **수용 기준**:
  - [x] 분석 결과 기반 추천 질문 생성
  - [x] 대화 맥락 학습
  - [x] 이미 질문한 내용과 중복 방지
  - [x] 응답 후 자동으로 새로운 추천 질문 생성
  - [x] 수동 새로고침 버튼 제공
  - [x] 각 질문은 20자 이내로 간결하게

#### FR-6: 대화 이력 저장 및 불러오기
- **설명**: 로그인 사용자의 대화 이력을 데이터베이스에 저장하고 불러오기
- **우선순위**: Medium
- **수용 기준**:
  - [x] 대화 이력 자동 저장 (메시지 변경 시)
  - [x] 분석 ID별 대화 이력 저장
  - [x] 대화 이력 불러오기
  - [x] 대화 ID 관리 (UUID)
  - [x] 플랜별 저장 제한 (Freemium 모델)

#### FR-7: 실시간 피드백
- **설명**: 사용자에게 실시간 상태 피드백 제공
- **우선순위**: Medium
- **수용 기준**:
  - [x] 질문 전송 시 로딩 상태 표시
  - [x] "잠시만요, 곧 답변 드릴게요..." 메시지
  - [x] 스트리밍 응답 표시
  - [x] 에러 발생 시 명확한 메시지

#### FR-8: 프롬프트 최적화
- **설명**: 토큰 사용량 최소화 및 응답 품질 향상을 위한 프롬프트 최적화
- **우선순위**: Medium
- **수용 기준**:
  - [x] 토큰 최적화된 프롬프트 생성
  - [x] 핵심 인사이트만 선택 (최대 5개)
  - [x] 대화 이력 최소화 (최근 2개만)
  - [x] 최대 4096 토큰 제한

#### FR-9: Agent Lightning 통합
- **설명**: 프롬프트 최적화, 응답 품질 평가, 학습 메트릭 추적
- **우선순위**: Medium
- **수용 기준**:
  - [x] 프롬프트 Span 추적
  - [x] 응답 Span 추적
  - [x] 응답 품질 평가 (Reward)
  - [x] 학습 메트릭 추적
  - [x] 프롬프트 자동 최적화 (선택적)

### 비기능적 요구사항 (Non-functional Requirements)

#### NFR-1: 성능
- **요구사항**: 
  - API 응답 시간 < 10초 (일반적인 경우)
  - 스트리밍 응답으로 첫 토큰 수신 < 2초
- **측정 기준**: 
  - 프롬프트 생성: < 100ms
  - Gemini API 호출: < 8초
  - 응답 렌더링: < 1초
- **현재 상태**: ✅ 구현 완료

#### NFR-2: 보안
- **요구사항**: 
  - 모든 입력 검증 (Zod)
  - 메시지 길이 제한 (2000자)
  - XSS 방지 (마크다운 sanitization)
  - 레이트 리미팅 (사용자당 1분에 20회)
- **현재 상태**: ✅ 구현 완료

#### NFR-3: 확장성
- **요구사항**: 
  - 새로운 Agent Type 추가 용이
  - 프롬프트 템플릿 버전 관리
  - 학습 메트릭 확장 가능
- **현재 상태**: ✅ 구현 완료 (Agent Lightning)

#### NFR-4: 사용성
- **요구사항**: 
  - 직관적인 UI/UX
  - 반응형 디자인
  - 접근성 고려 (키보드 네비게이션)
- **현재 상태**: ✅ 구현 완료

### 제약사항 (Constraints)
- Gemini API 키가 필요함
- 최대 토큰 제한: 4096 토큰
- 메시지 길이 제한: 2000자
- 대화 이력은 로그인 사용자만 저장 가능

---

## 🔌 인터페이스 정의

### API 엔드포인트

#### 엔드포인트 1: 챗봇 메시지 전송
- **메서드**: POST
- **경로**: `/api/chat`
- **인증**: Optional (로그인 시 이력 저장)
- **요청 스키마**:
  ```typescript
  {
    message: string; // 1-2000자
    analysisData?: {
      overallScore: number;
      aeoScore: number;
      geoScore: number;
      seoScore: number;
      insights: Array<{
        category: string;
        message: string;
        severity: 'High' | 'Medium' | 'Low';
      }>;
    };
    aioAnalysis?: {
      scores: {
        chatgpt: number;
        perplexity: number;
        gemini: number;
        claude: number;
      };
    };
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    message: string; // 마크다운 형식의 응답
  }
  ```
- **에러 응답**:
  ```typescript
  {
    error: string; // 에러 코드
    message: string; // 에러 메시지
    statusCode: number; // HTTP 상태 코드
  }
  ```

#### 엔드포인트 2: 추천 질문 생성
- **메서드**: POST
- **경로**: `/api/chat/suggestions`
- **인증**: Optional
- **요청 스키마**:
  ```typescript
  {
    analysisData?: AnalysisResult;
    aioAnalysis?: AIOCitationAnalysis;
    conversationHistory?: Array<Message>;
    askedQuestions?: string[]; // 이미 질문한 내용
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    suggestions: string[]; // 추천 질문 배열 (최대 3개)
  }
  ```

#### 엔드포인트 3: 대화 저장
- **메서드**: POST
- **경로**: `/api/chat/save`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    analysisId?: string; // UUID (선택적)
    conversationId?: string; // UUID (선택적, 업데이트 시)
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp?: string; // ISO 8601
    }>;
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    success: boolean;
    conversationId: string; // UUID
  }
  ```

#### 엔드포인트 4: 대화 이력 조회
- **메서드**: GET
- **경로**: `/api/chat/history?analysisId={analysisId}`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    conversations: Array<{
      id: string; // UUID
      userId: string;
      analysisId: string | null;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string; // ISO 8601
      }>;
      created_at: string; // ISO 8601
      updated_at: string; // ISO 8601
    }>;
  }
  ```

### 데이터베이스 스키마

#### chat_conversations 테이블
```sql
CREATE TABLE chat_conversations (
  id TEXT PRIMARY KEY, -- UUID
  user_id TEXT NOT NULL, -- users.id 참조
  analysis_id TEXT, -- analyses.id 참조 (NULL 가능)
  messages TEXT NOT NULL, -- JSON 문자열
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_chat_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_analysis_id ON chat_conversations(analysis_id);
CREATE INDEX idx_chat_user_updated ON chat_conversations(user_id, updated_at DESC);
```

#### agent_lightning_spans 테이블 (Agent Lightning)
```sql
CREATE TABLE agent_lightning_spans (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'prompt' | 'response' | 'tool_call' | 'reward'
  agent_type TEXT NOT NULL, -- 'seo' | 'aeo' | 'geo' | 'aio' | 'chat'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  data TEXT NOT NULL, -- JSON 문자열
  metadata TEXT, -- JSON 문자열 (선택적)
  user_id TEXT, -- users.id 참조 (선택적)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_spans_agent_type ON agent_lightning_spans(agent_type);
CREATE INDEX idx_spans_timestamp ON agent_lightning_spans(timestamp);
```

### UI/UX 요구사항

#### AIAgent 컴포넌트
- **컴포넌트명**: `AIAgent`
- **위치**: `components/AIAgent.tsx`
- **기능**: 
  - 챗봇 UI 렌더링
  - 메시지 입력 및 전송
  - 마크다운 렌더링
  - 추천 질문 표시
  - 대화 이력 관리
- **프로퍼티**:
  ```typescript
  interface AIAgentProps {
    analysisData: AnalysisResult | null;
    aioAnalysis: AIOCitationAnalysis | null;
  }
  ```

#### 사용자 인터랙션
- **메시지 입력**: 입력 필드에 메시지 입력 후 Enter 또는 전송 버튼 클릭
- **추천 질문 클릭**: 추천 질문 버튼 클릭 시 자동으로 질문 전송
- **답변 복사**: 답변 호버 시 복사 버튼 클릭
- **새로고침**: 추천 질문 새로고침 버튼 클릭
- **대화 이력**: 분석 ID별로 자동으로 이전 대화 불러오기

---

## ⚠️ 에러 처리

### 예상되는 에러 케이스

#### 에러 1: 유효하지 않은 메시지
- **발생 조건**: 메시지가 비어있거나 2000자 초과
- **에러 코드**: `VALIDATION_ERROR`
- **에러 메시지**: "메시지는 2000자 이하여야 합니다."
- **처리 방법**: Zod 스키마 검증 실패 시 400 에러 반환

#### 에러 2: Gemini API 키 없음
- **발생 조건**: 환경 변수에 GEMINI_API_KEY가 없을 때
- **에러 코드**: `CONFIG_ERROR`
- **에러 메시지**: "Gemini API 키가 설정되지 않았습니다."
- **처리 방법**: 500 에러 반환

#### 에러 3: Gemini API 호출 실패
- **발생 조건**: 네트워크 오류, API 오류 등
- **에러 코드**: `API_ERROR`
- **에러 메시지**: "AI 응답 생성 중 오류가 발생했습니다."
- **처리 방법**: 에러 로깅 및 사용자에게 친화적 메시지 제공

#### 에러 4: 레이트 리미트 초과
- **발생 조건**: 요청 횟수가 제한을 초과할 때
- **에러 코드**: `RATE_LIMIT_EXCEEDED`
- **에러 메시지**: "요청 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요."
- **처리 방법**: 429 상태 코드 반환

#### 에러 5: 대화 저장 실패
- **발생 조건**: 데이터베이스 오류, 인증 오류 등
- **에러 코드**: `SAVE_ERROR` 또는 `UNAUTHORIZED`
- **에러 메시지**: 상황별 맞춤 메시지
- **처리 방법**: 에러 로깅, 대화는 계속 진행되지만 저장 실패는 경고로 처리

#### 에러 6: 대화 이력 불러오기 실패
- **발생 조건**: 데이터베이스 오류, 인증 오류 등
- **에러 코드**: `LOAD_ERROR`
- **에러 메시지**: "대화 이력을 불러올 수 없습니다."
- **처리 방법**: 에러 로깅, 새 대화로 시작

### 재시도 로직
- **재시도 조건**: 네트워크 오류, 타임아웃, 5xx 서버 오류
- **최대 재시도 횟수**: 3회 (스트리밍 실패 시 일반 모드로 전환)
- **재시도 전략**: Exponential Backoff

---

## 🧪 테스트 요구사항

### 단위 테스트
- [x] 프롬프트 생성 함수 테스트
- [x] 마크다운 렌더링 테스트
- [x] 추천 질문 생성 로직 테스트
- [x] Agent Lightning Span 추적 테스트

### 통합 테스트
- [x] API 엔드포인트 테스트 (성공 케이스)
- [x] API 엔드포인트 테스트 (에러 케이스)
- [x] 데이터베이스 저장/조회 테스트
- [x] Gemini API 연동 테스트

### E2E 테스트
- [ ] 전체 대화 플로우 테스트 (질문 → 응답 → 저장)
- [ ] 추천 질문 생성 및 클릭 테스트
- [ ] 대화 이력 불러오기 테스트
- [ ] 답변 복사 기능 테스트

### 수동 테스트 체크리스트
- [x] 정상적인 질문/답변 테스트
- [x] 마크다운 렌더링 테스트
- [x] 코드 블록 하이라이팅 테스트
- [x] 추천 질문 생성 테스트
- [x] 대화 저장/불러오기 테스트
- [x] 답변 복사 기능 테스트
- [x] 레이트 리미팅 테스트
- [x] 에러 처리 테스트

---

## 📚 참고 자료

### 관련 문서
- [프로젝트 README](../README.md)
- [프로젝트 아키텍처](../ARCHITECTURE.md)
- [상세 기능 가이드](../FEATURES.md)
- [Agent Lightning 통합](../AGENT_LIGHTNING_INTEGRATION.md)
- [콘텐츠 분석 기능 명세서](../001-content-analysis/spec.md)

### 외부 리소스
- [Google Gemini API 문서](https://ai.google.dev/docs)
- [React Markdown 문서](https://github.com/remarkjs/react-markdown)
- [Highlight.js 문서](https://highlightjs.org/)
- [Agent Lightning GitHub](https://github.com/microsoft/agent-lightning)

### 기존 기능과의 연관성
- **콘텐츠 분석**: 분석 결과를 컨텍스트로 사용
- **AI 모델별 인용 확률**: AIO 분석 결과를 컨텍스트로 사용
- **분석 이력**: 분석 ID를 통해 대화 이력 연결
- **Freemium 모델**: 플랜별 챗봇 사용량 제한
- **Agent Lightning**: 프롬프트 최적화 및 학습 메트릭 추적

---

## ✅ 명세서 검증 체크리스트

- [x] 모든 사용자 스토리 명세됨
- [x] 모든 기능 요구사항 정의됨
- [x] 모든 에러 케이스 정의됨
- [x] API 인터페이스 명확함
- [x] 데이터베이스 스키마 명확함
- [x] UI/UX 요구사항 명확함
- [x] 테스트 요구사항 정의됨
- [x] 기존 기능과의 호환성 확인됨

---

**명세서 버전**: 1.0  
**최종 업데이트**: 2025-12-04  
**상태**: 구현 완료  
**다음 단계**: [Plan 작성](./plan.md) (선택사항 - 이미 구현 완료)

