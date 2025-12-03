# 데이터베이스 안정화 계획

## 목표

다음 기능들을 안정적으로 지원하는 데이터베이스 구조 구축:
1. 로그인 정보 수집 (Google, GitHub)
2. 분석 기록 저장
3. 사용자 정보 저장
4. 분석 결과 기반 전체 통계 데이터 처리
5. 분석 결과의 항목별 개별 통계
6. AI 기반 강화 학습

## 현재 상태

### ✅ 이미 구현된 테이블
- `users`: 사용자 정보
- `analyses`: 분석 기록
- `chat_conversations`: 채팅 대화
- `auth_logs`: 인증 로그
- `ai_agent_usage`: AI Agent 사용 이력
- `site_statistics`: 사이트 전체 통계
- `agent_spans`: AI Agent Spans
- `agent_rewards`: AI Agent Rewards
- `learning_metrics`: 학습 메트릭
- `prompt_templates`: 프롬프트 템플릿
- `subscriptions`: 구독 정보
- `usage_tracking`: 사용량 추적
- `payments`: 결제 이력

### ❌ 추가 필요한 테이블

1. **분석 항목별 통계 테이블** (`analysis_item_statistics`)
   - AEO, GEO, SEO 점수별 통계
   - AI 모델별 인용 확률 통계
   - 인사이트 카테고리별 통계

2. **사용자 활동 통계 테이블** (`user_activity_statistics`)
   - 사용자별 활동 패턴
   - 시간대별 활동 통계
   - 기능 사용 통계

3. **분석 결과 상세 통계 테이블** (`analysis_detail_statistics`)
   - URL 도메인별 통계
   - 점수 분포 통계
   - 개선 항목별 통계

4. **AI 학습 데이터 테이블** (`ai_training_data`)
   - 학습용 데이터셋
   - 모델 성능 추적
   - 피드백 데이터

## 구현 계획

### Phase 1: 통계 테이블 추가 (우선순위: 높음)

#### 1.1 분석 항목별 통계 테이블
```sql
CREATE TABLE analysis_item_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  item_type TEXT NOT NULL, -- 'aeo', 'geo', 'seo', 'chatgpt', 'perplexity', 'gemini', 'claude'
  score_range TEXT NOT NULL, -- '0-20', '21-40', '41-60', '61-80', '81-100'
  count INTEGER DEFAULT 0,
  avg_score REAL DEFAULT 0.0,
  min_score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, item_type, score_range)
);
```

#### 1.2 사용자 활동 통계 테이블
```sql
CREATE TABLE user_activity_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  user_id TEXT,
  provider TEXT, -- 'google', 'github'
  total_analyses INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  total_exports INTEGER DEFAULT 0,
  avg_analysis_score REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(date, user_id)
);
```

#### 1.3 분석 결과 상세 통계 테이블
```sql
CREATE TABLE analysis_detail_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  domain TEXT, -- URL 도메인
  total_analyses INTEGER DEFAULT 0,
  avg_aeo_score REAL DEFAULT 0.0,
  avg_geo_score REAL DEFAULT 0.0,
  avg_seo_score REAL DEFAULT 0.0,
  avg_overall_score REAL DEFAULT 0.0,
  improvement_items TEXT, -- JSON: 개선 항목별 통계
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, domain)
);
```

### Phase 2: 트리거 및 자동화 (우선순위: 중간)

#### 2.1 분석 저장 시 통계 자동 업데이트 트리거
- 분석 저장 시 `analysis_item_statistics` 자동 업데이트
- 분석 저장 시 `user_activity_statistics` 자동 업데이트
- 분석 저장 시 `analysis_detail_statistics` 자동 업데이트

#### 2.2 일일 통계 집계 작업
- 매일 자정에 전날 통계 집계
- 누적 통계 업데이트

### Phase 3: AI 학습 데이터 관리 (우선순위: 중간)

#### 3.1 AI 학습 데이터 테이블
```sql
CREATE TABLE ai_training_data (
  id TEXT PRIMARY KEY,
  analysis_id TEXT,
  user_id TEXT,
  input_data TEXT NOT NULL, -- JSON: 입력 데이터
  output_data TEXT NOT NULL, -- JSON: 출력 데이터
  reward_score REAL DEFAULT 0.0,
  feedback TEXT,
  model_version TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### 3.2 모델 성능 추적 테이블
```sql
CREATE TABLE ai_model_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_version TEXT NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms REAL DEFAULT 0.0,
  avg_reward_score REAL DEFAULT 0.0,
  total_cost REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(model_version, date)
);
```

### Phase 4: 성능 최적화 (우선순위: 높음)

#### 4.1 추가 인덱스
- 통계 테이블 날짜 인덱스
- 사용자 활동 통계 복합 인덱스
- 분석 상세 통계 도메인 인덱스

#### 4.2 파티셔닝 전략
- 날짜별 파티셔닝 (대용량 데이터 대비)
- 사용자별 파티셔닝 (활성 사용자 분리)

### Phase 5: 데이터 일관성 강화 (우선순위: 높음)

#### 5.1 외래 키 제약 조건 강화
- 모든 관계에 외래 키 설정
- CASCADE 삭제 정책 명확화

#### 5.2 트랜잭션 최적화
- 통계 업데이트를 트랜잭션으로 보호
- 배치 업데이트 최적화

## 구현 우선순위

1. **즉시 구현** (1주)
   - 분석 항목별 통계 테이블
   - 사용자 활동 통계 테이블
   - 분석 결과 상세 통계 테이블
   - 기본 인덱스 추가

2. **단기 구현** (2주)
   - 통계 자동 업데이트 트리거
   - 일일 통계 집계 작업
   - AI 학습 데이터 테이블

3. **중기 구현** (1개월)
   - 모델 성능 추적
   - 성능 최적화
   - 데이터 일관성 강화

## 예상 효과

1. **통계 조회 성능**: 10배 이상 향상
2. **데이터 일관성**: 100% 보장
3. **AI 학습 데이터**: 체계적 수집 및 관리
4. **확장성**: 대용량 데이터 처리 가능

