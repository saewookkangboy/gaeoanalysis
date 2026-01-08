# 데이터베이스 안정화 요약

## ✅ 완료된 작업

### 1. 통계 테이블 추가 (마이그레이션 v12)

#### 분석 항목별 통계 테이블 (`analysis_item_statistics`)
- AEO, GEO, SEO 점수별 통계
- AI 모델별 인용 확률 통계 (ChatGPT, Perplexity, Gemini, Claude)
- 점수 범위별 분포 (0-20, 21-40, 41-60, 61-80, 81-100)
- 일일 집계 및 평균/최소/최대 점수 추적

#### 사용자 활동 통계 테이블 (`user_activity_statistics`)
- 사용자별 일일 활동 통계
- 분석, 챗봇, 내보내기 사용량 추적
- 평균 분석 점수 추적
- 로그인 제공업체별 통계

#### 분석 결과 상세 통계 테이블 (`analysis_detail_statistics`)
- 도메인별 분석 통계
- 평균 점수 추적 (AEO, GEO, SEO, Overall)
- 개선 항목별 통계

#### AI 학습 데이터 테이블 (`ai_training_data`)
- 학습용 데이터셋 저장
- 입력/출력 데이터 저장
- 보상 점수 및 피드백 저장
- 모델 버전 추적

#### AI 모델 성능 추적 테이블 (`ai_model_performance`)
- 모델 버전별 성능 추적
- 요청 수, 성공/실패 횟수
- 평균 응답 시간
- 평균 보상 점수
- 총 비용 추적

### 2. 통계 헬퍼 함수 (`lib/statistics-helpers.ts`)

#### 업데이트 함수
- `updateAnalysisItemStatistics()`: 분석 항목별 통계 업데이트
- `updateUserActivityStatistics()`: 사용자 활동 통계 업데이트
- `updateAnalysisDetailStatistics()`: 분석 상세 통계 업데이트
- `aggregateDailyStatistics()`: 일일 통계 집계

#### 조회 함수
- `getAnalysisItemStatistics()`: 분석 항목별 통계 조회
- `getUserActivityStatistics()`: 사용자 활동 통계 조회
- `getAnalysisDetailStatistics()`: 분석 상세 통계 조회

### 3. 자동 통계 업데이트

#### 분석 저장 시 자동 업데이트
- `saveAnalysis()` 함수에 통계 업데이트 로직 추가
- 분석 항목별 통계 자동 업데이트
- 사용자 활동 통계 자동 업데이트
- 분석 상세 통계 자동 업데이트
- 비동기 처리로 응답 속도에 영향 없음

#### 채팅 대화 저장 시 자동 업데이트
- `saveOrUpdateChatConversation()` 함수에 통계 업데이트 로직 추가
- 사용자 활동 통계 자동 업데이트

### 4. 통계 API 엔드포인트 (`/api/statistics`)

#### GET /api/statistics
- `type=item`: 분석 항목별 통계 조회
- `type=user`: 사용자 활동 통계 조회
- `type=detail`: 분석 상세 통계 조회
- `type=daily&aggregate=true`: 일일 통계 집계

### 5. 일일 통계 집계 스크립트

#### `scripts/daily-statistics-aggregator.ts`
- 전날 통계 자동 집계
- `npm run stats:aggregate` 명령어로 실행

## 📊 데이터 흐름

```
로그인 (Google/GitHub)
  ↓
사용자 정보 저장 (users 테이블)
  ↓
분석 수행
  ↓
분석 결과 저장 (analyses 테이블)
  ↓
통계 자동 업데이트
  ├─ analysis_item_statistics (항목별 통계)
  ├─ user_activity_statistics (사용자 활동)
  └─ analysis_detail_statistics (도메인별 통계)
  ↓
AI 학습 데이터 수집 (ai_training_data)
  ↓
AI 모델 성능 추적 (ai_model_performance)
  ↓
강화 학습 (agent_rewards, learning_metrics)
```

## 🔧 사용 방법

### 1. 마이그레이션 실행

```bash
npm run db:migrate
```

### 2. 통계 조회

```typescript
// 분석 항목별 통계
GET /api/statistics?type=item&itemType=aeo&startDate=2025-12-01&endDate=2025-12-03

// 사용자 활동 통계
GET /api/statistics?type=user&userId=xxx&startDate=2025-12-01&endDate=2025-12-03

// 분석 상세 통계
GET /api/statistics?type=detail&domain=example.com&startDate=2025-12-01&endDate=2025-12-03
```

### 3. 일일 통계 집계

```bash
npm run stats:aggregate
```

또는 특정 날짜:

```bash
npx tsx scripts/daily-statistics-aggregator.ts 2025-12-02
```

## 📈 성능 최적화

### 인덱스
- 날짜별 인덱스 (빠른 날짜 범위 조회)
- 항목 타입별 인덱스
- 사용자 ID별 인덱스
- 도메인별 인덱스
- 복합 인덱스 (날짜 + 타입, 날짜 + 사용자 등)

### 트랜잭션
- 모든 통계 업데이트는 트랜잭션으로 보호
- 데이터 일관성 보장

### 비동기 처리
- 통계 업데이트는 `setImmediate()`로 비동기 처리
- 분석 저장 응답 속도에 영향 없음

## 🔐 데이터 무결성

### 외래 키 제약 조건
- 모든 관계에 외래 키 설정
- CASCADE 삭제로 관련 데이터 자동 정리

### UNIQUE 제약 조건
- 중복 통계 방지 (날짜 + 타입 + 범위)
- 데이터 일관성 보장

### 트리거
- `updated_at` 자동 업데이트
- 통계 자동 집계 (향후 추가 예정)

## 📝 다음 단계

### 단기 (1주)
- [ ] 통계 대시보드 UI 개발
- [ ] 실시간 통계 업데이트 모니터링
- [ ] 통계 데이터 시각화

### 중기 (1개월)
- [ ] 자동 일일 통계 집계 스케줄러
- [ ] 통계 데이터 백업 및 복구
- [ ] 성능 모니터링 및 최적화

### 장기 (3개월)
- [ ] AI 강화 학습 파이프라인 완성
- [ ] 예측 분석 기능 추가
- [ ] 대용량 데이터 처리 최적화

## 🎯 예상 효과

1. **통계 조회 성능**: 10배 이상 향상
2. **데이터 일관성**: 100% 보장
3. **AI 학습 데이터**: 체계적 수집 및 관리
4. **확장성**: 대용량 데이터 처리 가능
5. **사용자 인사이트**: 상세한 활동 패턴 분석 가능

