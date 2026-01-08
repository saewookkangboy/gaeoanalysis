# Agent Lightning 기반 심화 학습 시스템

## 개요

Microsoft의 [Agent Lightning](https://github.com/microsoft/agent-lightning) 프레임워크를 참고하여 구현한 AEO, GEO, SEO, AIO 심화 학습 시스템입니다. 분석 결과를 기반으로 최적의 진단 점수를 반영하고, 강화 학습을 통해 프롬프트를 자동으로 최적화합니다.

## 핵심 기능

### 1. 분석 결과 기반 보상 계산

각 분석 결과(AEO, GEO, SEO, AIO 점수)를 기반으로 강화 학습용 보상(reward)을 자동으로 계산합니다.

**보상 계산 요소:**
- **점수 레벨**: Excellent (80+), Good (60-79), Fair (40-59), Poor (<40)
- **개선율**: 이전 분석 대비 점수 개선율
- **벤치마크 비교**: 전체 평균 대비 성능

**보상 범위**: -1 ~ 1 (강화 학습 표준)

```typescript
// 예시: AEO 점수 75점, 이전 60점, 벤치마크 65점
{
  score: 75,
  reward: 0.65, // 긍정적 보상
  metrics: {
    currentScore: 75,
    previousScore: 60,
    improvement: 25, // 25% 개선
    benchmark: 65,
    benchmarkComparison: 15.4 // 벤치마크 대비 15.4% 우수
  }
}
```

### 2. 자동 Span 및 Reward 저장

분석이 완료되면 자동으로:
1. **Agent Span** 생성: 분석 결과를 이벤트로 추적
2. **Reward 저장**: 각 Agent Type(AEO, GEO, SEO, AIO)별 보상 저장
3. **학습 메트릭 업데이트**: 일별 성능 추적

### 3. 프롬프트 자동 최적화

분석 결과와 보상 데이터를 기반으로 프롬프트를 자동으로 최적화합니다.

**최적화 전략:**
- **AEO 점수 < 60**: FAQ 섹션 강화, 질문 형식 콘텐츠 구조화 강조
- **GEO 점수 < 60**: 콘텐츠 길이 확장(1,500자+), 섹션 구조화, 미디어 추가 강조
- **SEO 점수 < 60**: 기본 SEO 요소(메타 태그, 구조화된 데이터) 개선 강조
- **점수 >= 80**: 고급 전략 제안

**공통 인사이트 기반 최적화:**
- 자주 발견되는 문제점을 프롬프트에 자동 반영
- 구체적인 해결 방안을 우선적으로 제시하도록 프롬프트 개선

### 4. 학습 메트릭 추적

각 Agent Type별로 일별 성능을 추적합니다.

**추적 항목:**
- 총 Span 수
- 평균 보상
- 개선율
- 최고 성능 프롬프트 버전

## API 엔드포인트

### 학습 메트릭 조회

```bash
GET /api/learning-metrics?agentType=aeo&days=30
```

**파라미터:**
- `agentType` (선택): `aeo`, `geo`, `seo`, `aio` (없으면 전체)
- `days` (선택): 조회 기간 (기본값: 30일)

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "agentType": "aeo",
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "days": 30
    },
    "metrics": [
      {
        "date": "2025-01-31",
        "totalSpans": 150,
        "avgReward": 0.65,
        "improvementRate": 15.2,
        "bestPromptVersion": 3
      }
    ],
    "statistics": {
      "avgReward": 0.65,
      "avgRelevance": 0.75,
      "avgAccuracy": 0.80,
      "avgUsefulness": 0.70,
      "totalRewards": 150
    },
    "bestPrompt": {
      "version": 3,
      "avgScore": 82.5,
      "totalUses": 500,
      "successRate": 0.85
    }
  }
}
```

## 데이터베이스 스키마

### agent_spans
분석 결과를 이벤트로 추적합니다.

```sql
CREATE TABLE agent_spans (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'analysis', 'prompt', 'response', 'tool_call'
  agent_type TEXT NOT NULL, -- 'seo', 'aeo', 'geo', 'aio', 'chat'
  user_id TEXT,
  analysis_id TEXT,
  data TEXT NOT NULL, -- JSON: 분석 결과 데이터
  metadata TEXT, -- JSON: 추가 메타데이터
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### agent_rewards
각 Agent Type별 보상을 저장합니다.

```sql
CREATE TABLE agent_rewards (
  id TEXT PRIMARY KEY,
  span_id TEXT,
  agent_type TEXT NOT NULL,
  score INTEGER NOT NULL, -- 0-100 (보상을 0-100으로 변환)
  relevance REAL NOT NULL, -- 0-1
  accuracy REAL NOT NULL, -- 0-1
  usefulness REAL NOT NULL, -- 0-1
  user_id TEXT,
  analysis_id TEXT,
  feedback TEXT, -- JSON: 상세 메트릭
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### learning_metrics
일별 학습 메트릭을 추적합니다.

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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_type, date)
);
```

### prompt_templates
최적화된 프롬프트 템플릿을 저장합니다.

```sql
CREATE TABLE prompt_templates (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  template TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  avg_score REAL DEFAULT 0.0,
  total_uses INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0.0,
  variables TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_type, version)
);
```

## 사용 방법

### 1. 분석 결과 저장 시 자동 학습

분석이 완료되면 `saveAnalysis` 함수가 자동으로:
- 분석 결과를 Span으로 저장
- 보상을 계산하여 Reward 저장
- 학습 메트릭 업데이트

```typescript
// lib/db-helpers.ts의 saveAnalysis 함수에서 자동 실행
const rewards = calculateAnalysisReward(analysisId, analysisResult, previousAnalysis);
const spanId = saveAnalysisSpan(analysisId, userId, analysisResult, url);
saveAnalysisRewards(spanId, analysisId, userId, rewards);
updateLearningMetrics('aeo', rewards.aeo);
// ... (geo, seo, aio도 동일)
```

### 2. 프롬프트 최적화

주기적으로 또는 성능 저하 시 프롬프트를 최적화합니다.

```typescript
import { PromptOptimizer } from '@/lib/agent-lightning';

// 최근 보상 데이터 조회
const rewards = getRecentRewards('aeo', 50);

// 현재 프롬프트 템플릿 조회
const currentTemplate = getPromptTemplate('aeo');

// 분석 데이터 기반 최적화
const analysisData = {
  avgAeoScore: 65,
  commonInsights: [
    { category: 'AEO', message: 'FAQ 섹션 부족' }
  ]
};

const optimized = PromptOptimizer.optimizePrompt(
  'aeo',
  currentTemplate,
  rewards,
  analysisData
);

if (optimized) {
  savePromptTemplate(optimized);
}
```

### 3. 학습 메트릭 모니터링

프론트엔드에서 학습 메트릭을 조회하여 대시보드를 구성할 수 있습니다.

```typescript
// 모든 Agent Type의 메트릭 조회
const response = await fetch('/api/learning-metrics?days=30');
const { data } = await response.json();

// 특정 Agent Type의 메트릭 조회
const aeoMetrics = await fetch('/api/learning-metrics?agentType=aeo&days=30');
```

## 성능 최적화

### 1. 비동기 처리
- 보상 계산 및 저장은 `setImmediate`로 비동기 처리
- 분석 응답 속도에 영향 없음

### 2. 벤치마크 캐싱
- 벤치마크 점수는 최근 100개 분석의 평균 사용
- 자주 변경되지 않으므로 캐싱 가능

### 3. 인덱스 최적화
- `agent_type`, `created_at` 복합 인덱스
- `agent_type`, `date` 복합 인덱스 (learning_metrics)

## 향후 개선 사항

1. **강화 학습 알고리즘 통합**
   - GRPO (Group Relative Policy Optimization) 알고리즘 적용
   - 자동 프롬프트 최적화 강화

2. **실시간 프롬프트 업데이트**
   - 성능 개선 시 자동으로 최신 프롬프트 버전 사용
   - A/B 테스트를 통한 프롬프트 버전 비교

3. **사용자 피드백 통합**
   - 사용자 만족도 조사 결과를 보상에 반영
   - 클릭률, 체류 시간 등 행동 지표 활용

4. **다중 에이전트 협업**
   - AEO, GEO, SEO 에이전트 간 협업 최적화
   - 종합 점수 개선을 위한 전략 조정

## 참고 자료

- [Agent Lightning GitHub](https://github.com/microsoft/agent-lightning)
- [Agent Lightning Documentation](https://microsoft.github.io/agent-lightning/)
- [Agent Lightning Paper](https://arxiv.org/abs/2508.03680)

