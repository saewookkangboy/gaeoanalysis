# Agent Lightning 통합 가이드

이 문서는 GAEO Analysis에 Microsoft Agent Lightning을 통합한 내용을 설명합니다.

## 📋 개요

Agent Lightning은 AI 에이전트를 강화 학습(Reinforcement Learning)으로 최적화할 수 있는 프레임워크입니다. 본 프로젝트에서는 Agent Lightning의 핵심 개념을 TypeScript로 구현하여 SEO, AIO, AEO, GEO 학습에 필요한 방향으로 AI Agent를 최적화합니다.

**참고:** [Agent Lightning GitHub](https://github.com/microsoft/agent-lightning)

## 🎯 주요 기능

### 1. 프롬프트 최적화 시스템

- **SEO/AEO/GEO/AIO 특화 프롬프트**: 각 영역별로 최적화된 프롬프트 템플릿 제공
- **자동 프롬프트 최적화**: 성능 기반으로 프롬프트를 자동으로 개선
- **버전 관리**: 프롬프트 템플릿의 버전 관리 및 성능 추적

### 2. 응답 품질 평가 시스템

- **다차원 평가**: 관련성(Relevance), 정확성(Accuracy), 유용성(Usefulness) 측정
- **자동 평가**: AI Agent 응답을 자동으로 평가하여 점수 부여
- **피드백 수집**: 사용자 만족도 및 피드백 수집

### 3. 학습 메트릭 추적

- **성능 모니터링**: 각 Agent Type별 성능 추적
- **개선율 계산**: 시간에 따른 성능 개선율 측정
- **최적 프롬프트 식별**: 가장 성능이 좋은 프롬프트 버전 자동 식별

### 4. 이벤트 추적 (Spans)

- **프롬프트 추적**: 생성된 프롬프트 추적
- **응답 추적**: AI Agent 응답 추적
- **도구 호출 추적**: 외부 도구 호출 추적
- **Reward 추적**: 품질 평가 결과 추적

## 🏗️ 아키텍처

```
┌─────────────────┐
│  AI Agent API   │
│  (/api/chat)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agent Lightning │
│   (통합 모듈)    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Spans  │ │ Rewards  │
│ Store  │ │ Evaluator│
└────────┘ └──────────┘
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│  Prompt         │
│  Optimizer      │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  (SQLite)       │
└─────────────────┘
```

## 📦 설치 및 설정

### 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Agent Lightning 활성화 (선택 사항)
ENABLE_AGENT_LIGHTNING=true
```

### 2. 데이터베이스 마이그레이션

Agent Lightning 테이블을 생성하기 위해 마이그레이션을 실행하세요:

```bash
npm run db:migrate
```

이 명령어는 다음 테이블을 생성합니다:
- `agent_spans`: 이벤트 추적 데이터
- `prompt_templates`: 프롬프트 템플릿
- `agent_rewards`: 품질 평가 결과
- `learning_metrics`: 학습 메트릭

## 🚀 사용 방법

### 기본 사용

Agent Lightning은 자동으로 통합되어 있습니다. AI Agent API를 호출하면 자동으로:

1. 프롬프트 생성 시 Span 발생
2. 응답 생성 시 Span 발생
3. 응답 품질 자동 평가
4. Reward 저장

### 최적화된 프롬프트 사용

`ENABLE_AGENT_LIGHTNING=true`로 설정하면 최적화된 프롬프트를 사용합니다.

### 프로그래밍 방식 사용

```typescript
import { agentLightning } from '@/lib/agent-lightning';

// Span 발생
agentLightning.emitSpan({
  type: 'prompt',
  agentType: 'seo',
  data: { /* ... */ },
});

// 최적화된 프롬프트 생성
const prompt = agentLightning.getOptimizedPrompt(
  'seo',
  analysisData,
  aioAnalysis,
  context
);

// 응답 품질 평가
const reward = agentLightning.evaluateResponse('seo', response, {
  userMessage: '...',
  analysisData,
});

// 학습 메트릭 조회
const metrics = agentLightning.getLearningMetrics('seo');
```

## 📊 Agent Type별 특화

### SEO Agent

- **목적**: 검색 엔진 최적화 조언 제공
- **특화 프롬프트**: SEO 점수, 인사이트 기반 개선 방안
- **평가 기준**: 기술적 정확성, 실행 가능성

### AEO Agent

- **목적**: Answer Engine Optimization 조언 제공
- **특화 프롬프트**: AEO 점수, 질문 형식 콘텐츠 구조화
- **평가 기준**: 답변 명확성, FAQ 구조화

### GEO Agent

- **목적**: Generative Engine Optimization 조언 제공
- **특화 프롬프트**: GEO 점수, 생성형 검색 엔진 최적화
- **평가 기준**: 콘텐츠 깊이, 다중 미디어 활용

### AIO Agent

- **목적**: AI 모델별 인용 확률 최적화 조언 제공
- **특화 프롬프트**: AI 모델별 인용 확률, 맞춤형 전략
- **평가 기준**: 모델별 특성 반영, 맞춤형 조언

### Chat Agent

- **목적**: 종합적인 GAEO 조언 제공
- **특화 프롬프트**: 모든 분석 결과 통합
- **평가 기준**: 종합성, 유용성, 사용자 만족도

## 🔍 학습 메트릭 조회

### API를 통한 조회

```typescript
// 특정 Agent Type의 메트릭 조회
const metrics = agentLightning.getLearningMetrics('seo');

// 모든 Agent Type의 메트릭 조회
const allMetrics = agentLightning.getLearningMetrics();
```

### 메트릭 정보

- `totalSpans`: 총 이벤트 수
- `avgReward`: 평균 Reward 점수
- `improvementRate`: 개선율 (%)
- `bestPromptVersion`: 최고 성능 프롬프트 버전
- `lastOptimized`: 마지막 최적화 시간

## 📈 성능 최적화

### 프롬프트 자동 최적화

Agent Lightning은 다음 조건에서 프롬프트를 자동으로 최적화합니다:

1. 최근 50개 이상의 Reward 데이터 수집
2. 평균 점수가 현재 프롬프트보다 높음
3. 성공률이 일정 수준 이상

### 수동 최적화

```typescript
import { PromptOptimizer } from '@/lib/agent-lightning';

const currentTemplate = agentLightning.getPromptTemplate('seo');
const rewards = agentLightning.getRewards('seo');

const optimized = PromptOptimizer.optimizePrompt(
  'seo',
  currentTemplate,
  rewards
);

if (optimized) {
  agentLightning.savePromptTemplate(optimized);
}
```

## 🗄️ 데이터베이스 스키마

### agent_spans

이벤트 추적 데이터를 저장합니다.

```sql
CREATE TABLE agent_spans (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'prompt', 'response', 'tool_call', 'reward'
  agent_type TEXT NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  user_id TEXT,
  analysis_id TEXT,
  conversation_id TEXT,
  data TEXT NOT NULL, -- JSON
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### prompt_templates

프롬프트 템플릿을 저장합니다.

```sql
CREATE TABLE prompt_templates (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  template TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  avg_score REAL DEFAULT 0.0,
  total_uses INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0,
  variables TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### agent_rewards

품질 평가 결과를 저장합니다.

```sql
CREATE TABLE agent_rewards (
  id TEXT PRIMARY KEY,
  span_id TEXT,
  agent_type TEXT NOT NULL,
  score INTEGER NOT NULL, -- 0-100
  relevance REAL NOT NULL, -- 0-1
  accuracy REAL NOT NULL, -- 0-1
  usefulness REAL NOT NULL, -- 0-1
  user_satisfaction REAL, -- 0-1 (선택적)
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### learning_metrics

학습 메트릭을 저장합니다.

```sql
CREATE TABLE learning_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_type TEXT NOT NULL,
  date DATE NOT NULL,
  total_spans INTEGER DEFAULT 0,
  avg_reward REAL DEFAULT 0.0,
  improvement_rate REAL DEFAULT 0.0,
  best_prompt_version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 고급 설정

### 커스텀 평가 기준

`ResponseQualityEvaluator` 클래스를 확장하여 커스텀 평가 기준을 추가할 수 있습니다.

### 커스텀 프롬프트 템플릿

`PromptOptimizer` 클래스를 확장하여 커스텀 프롬프트 템플릿을 추가할 수 있습니다.

## 📚 참고 자료

- [Agent Lightning GitHub](https://github.com/microsoft/agent-lightning)
- [Agent Lightning 문서](https://microsoft.github.io/agent-lightning/)
- [Agent Lightning 논문](https://arxiv.org/abs/2508.03680)

## 🐛 문제 해결

### Agent Lightning이 활성화되지 않음

`ENABLE_AGENT_LIGHTNING=true` 환경 변수가 설정되어 있는지 확인하세요.

### 데이터베이스 마이그레이션 실패

```bash
# 마이그레이션 상태 확인
npm run db:migrate

# 데이터베이스 최적화
npm run db:optimize
```

### 성능 이슈

인메모리 스토어는 최근 1000개의 Span과 500개의 Reward만 유지합니다. 대량의 데이터가 필요한 경우 데이터베이스 스토어로 전환하세요.

## 🔮 향후 개선 사항

1. **데이터베이스 스토어 통합**: 인메모리 스토어를 데이터베이스로 전환
2. **고급 강화 학습 알고리즘**: 더 정교한 RL 알고리즘 구현
3. **사용자 피드백 통합**: 사용자 만족도 직접 수집
4. **A/B 테스트**: 여러 프롬프트 버전 동시 테스트
5. **실시간 대시보드**: 학습 메트릭 시각화

## 📝 라이선스

이 통합은 Agent Lightning의 MIT 라이선스를 따릅니다.

