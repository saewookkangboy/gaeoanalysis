# 알고리즘 학습 시스템

## 개요

AEO, GEO, SEO, AIO 점수 계산 알고리즘을 지속적으로 학습하고 개선하는 시스템입니다. 리서치 결과를 반영하고, 실제 분석 데이터를 기반으로 가중치를 자동 조정하여 알고리즘의 정확도를 지속적으로 향상시킵니다.

## 핵심 기능

### 1. 알고리즘 버전 관리

각 알고리즘 타입(AEO, GEO, SEO, AIO)별로 버전을 관리하고, 성능을 추적합니다.

**주요 기능:**
- 알고리즘 버전 생성 및 활성화
- 가중치 및 설정 관리
- 성능 메트릭 추적 (정확도, 오차, 개선율)
- 리서치 기반 버전 표시

**데이터 구조:**
```typescript
interface AlgorithmVersion {
  id: string;
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
  version: number;
  weights: Record<string, number>; // 가중치 맵
  config: Record<string, any>; // 추가 설정
  performance: {
    avgAccuracy: number; // 평균 정확도
    avgError: number; // 평균 오차
    totalTests: number; // 총 테스트 수
    improvementRate: number; // 개선율
  };
  researchBased: boolean; // 리서치 기반 여부
  researchFindings: string[]; // 참조한 리서치 ID 목록
}
```

### 2. 리서치 결과 관리

외부 리서치 결과를 저장하고 알고리즘에 반영합니다.

**리서치 결과 저장:**
- 논문, 블로그, 연구 기관 등에서 발표된 최신 연구 결과 저장
- 각 리서치의 영향 요소, 영향도, 신뢰도 기록
- 알고리즘 타입별로 분류

**리서치 결과 적용:**
- 미적용 리서치 결과 조회
- 리서치 결과를 기반으로 가중치 자동 조정
- 새 알고리즘 버전 생성 및 적용

**데이터 구조:**
```typescript
interface ResearchFinding {
  id: string;
  title: string;
  source: string; // 출처
  url?: string;
  publishedDate?: string;
  findings: {
    algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
    factor: string; // 영향 요소 (예: 'faq_schema', 'content_length')
    impact: number; // 영향도 (예: 0.4 = 40% 증가)
    confidence: number; // 신뢰도 (0-1)
    description: string;
  }[];
  applied: boolean; // 적용 여부
  appliedAt?: Date;
  appliedVersion?: string; // 적용된 알고리즘 버전
}
```

### 3. 가중치 학습

실제 분석 결과와 예상 점수를 비교하여 가중치를 자동으로 조정합니다.

**학습 방식:**
- 그라디언트 디센트 방식으로 가중치 조정
- 실제 점수와 예상 점수의 차이를 기반으로 학습
- 각 특징(feature)별로 가중치 개별 조정

**학습 공식:**
```
adjusted_weight = current_weight + learning_rate * (actual_score - predicted_score) * feature_value
```

**예시:**
```typescript
// H1 태그 가중치 학습
// 현재 가중치: 20
// 실제 점수: 85, 예상 점수: 80
// H1 태그 존재: 1
// 학습률: 0.01

// 조정된 가중치 = 20 + 0.01 * (85 - 80) * 1 = 20.05
```

### 4. A/B 테스트

두 알고리즘 버전을 비교하여 더 나은 버전을 선택합니다.

**테스트 프로세스:**
1. 동일한 분석에 대해 두 버전의 알고리즘 실행
2. 두 버전의 점수 비교
3. 실제 점수가 있으면 오차 비교, 없으면 점수 차이로 승자 결정
4. 테스트 결과 저장 및 통계 분석

**데이터 구조:**
```typescript
interface AlgorithmTest {
  id: string;
  analysisId: string;
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
  versionA: string;
  versionB: string;
  scoreA: number;
  scoreB: number;
  actualScore?: number; // 검증용 실제 점수
  winner?: 'A' | 'B' | 'tie';
}
```

## API 엔드포인트

### 알고리즘 버전 조회

```bash
GET /api/algorithm-learning?algorithmType=aeo
GET /api/algorithm-learning?action=research&algorithmType=aeo
GET /api/algorithm-learning?action=ab-test&algorithmType=aeo&versionA=xxx&versionB=yyy
```

### 알고리즘 버전 생성

```bash
POST /api/algorithm-learning
{
  "action": "create-version",
  "algorithmType": "aeo",
  "weights": {
    "h1_tag": 20,
    "title_length": 15,
    "meta_description": 15
  },
  "config": {},
  "researchFindings": ["research-id-1"]
}
```

### 리서치 결과 저장

```bash
POST /api/algorithm-learning
{
  "action": "save-research",
  "title": "FAQPage 스키마가 AI 인용 확률을 40% 증가시킴",
  "source": "Google Research",
  "url": "https://example.com/research",
  "publishedDate": "2025-01-01",
  "findings": [
    {
      "algorithmType": "aeo",
      "factor": "faq_schema",
      "impact": 0.4,
      "confidence": 0.9,
      "description": "FAQPage 스키마 사용 시 AI 인용 확률 40% 증가"
    }
  ]
}
```

### 리서치 결과 적용

```bash
POST /api/algorithm-learning
{
  "action": "apply-research",
  "findingId": "research-id-1",
  "algorithmType": "aeo"
}
```

### 가중치 학습

```bash
POST /api/algorithm-learning
{
  "action": "learn-weights",
  "algorithmType": "aeo",
  "features": {
    "h1_count": 1,
    "title_length": 50,
    "has_faq": 1
  },
  "actualScore": 85,
  "predictedScore": 80
}
```

### A/B 테스트

```bash
POST /api/algorithm-learning
{
  "action": "ab-test",
  "analysisId": "analysis-id-1",
  "algorithmType": "aeo",
  "versionA": "version-a-id",
  "versionB": "version-b-id",
  "scoreA": 82,
  "scoreB": 85,
  "actualScore": 84
}
```

## 사용 시나리오

### 시나리오 1: 새로운 리서치 결과 반영

1. **리서치 결과 저장**
   ```typescript
   const findingId = saveResearchFinding({
     title: "H2→H3→bullets 구조가 Perplexity 인용을 40% 증가",
     source: "Perplexity Research",
     findings: [{
       algorithmType: "geo",
       factor: "h2_h3_bullets_structure",
       impact: 0.4,
       confidence: 0.95,
       description: "H2→H3→bullets 구조 사용 시 Perplexity 인용 40% 증가"
     }]
   });
   ```

2. **리서치 결과 적용**
   ```typescript
   // 리서치 결과 기반 가중치 조정
   const adjustedWeights = adjustWeightsFromResearch('geo', [finding]);
   
   // 새 알고리즘 버전 생성
   const version = createAlgorithmVersion('geo', adjustedWeights, {}, [findingId]);
   
   // 리서치 결과 적용 표시
   applyResearchFinding(findingId, version.id);
   ```

### 시나리오 2: 실제 데이터 기반 가중치 학습

1. **분석 수행 및 점수 계산**
   ```typescript
   const predictedScore = calculateGEOScore($);
   // 실제 점수는 사용자 피드백이나 외부 검증을 통해 얻음
   const actualScore = 85;
   ```

2. **가중치 학습**
   ```typescript
   const features = {
     content_length: 2000,
     has_h2: 1,
     has_h3: 1,
     has_bullets: 1,
     images_count: 5
   };
   
   const adjustedWeights = learnWeights('geo', features, actualScore, predictedScore);
   ```

3. **성능 업데이트**
   ```typescript
   const currentVersion = getActiveAlgorithmVersion('geo');
   if (currentVersion) {
     updateAlgorithmPerformance(
       currentVersion.id,
       actualScore,
       predictedScore
     );
   }
   ```

### 시나리오 3: A/B 테스트를 통한 알고리즘 개선

1. **두 버전의 알고리즘 실행**
   ```typescript
   const versionA = getActiveAlgorithmVersion('aeo');
   const versionB = createAlgorithmVersion('aeo', newWeights, {}, []);
   
   const scoreA = calculateWithVersion(versionA, features);
   const scoreB = calculateWithVersion(versionB, features);
   ```

2. **A/B 테스트 생성**
   ```typescript
   const test = createABTest(
     analysisId,
     'aeo',
     versionA.id,
     versionB.id,
     scoreA,
     scoreB,
     actualScore
   );
   ```

3. **테스트 결과 분석**
   ```typescript
   const results = getABTestResults('aeo', versionA.id, versionB.id);
   const winnerCount = results.filter(r => r.winner === 'B').length;
   const totalTests = results.length;
   
   if (winnerCount / totalTests > 0.6) {
     // 버전 B가 더 우수하므로 활성화
     activateVersion(versionB.id);
   }
   ```

## 데이터베이스 스키마

### algorithm_versions
알고리즘 버전 관리

```sql
CREATE TABLE algorithm_versions (
  id TEXT PRIMARY KEY,
  algorithm_type TEXT NOT NULL CHECK(algorithm_type IN ('aeo', 'geo', 'seo', 'aio')),
  version INTEGER NOT NULL,
  weights TEXT NOT NULL, -- JSON: 가중치 맵
  config TEXT, -- JSON: 추가 설정
  avg_accuracy REAL DEFAULT 0.0,
  avg_error REAL DEFAULT 0.0,
  total_tests INTEGER DEFAULT 0,
  improvement_rate REAL DEFAULT 0.0,
  research_based BOOLEAN DEFAULT 0,
  research_findings TEXT, -- JSON: 참조한 리서치 ID 목록
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 0,
  UNIQUE(algorithm_type, version)
);
```

### research_findings
리서치 결과 저장

```sql
CREATE TABLE research_findings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  published_date TEXT,
  findings TEXT NOT NULL, -- JSON: 리서치 결과 배열
  applied BOOLEAN DEFAULT 0,
  applied_at DATETIME,
  applied_version TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applied_version) REFERENCES algorithm_versions(id) ON DELETE SET NULL
);
```

### algorithm_tests
A/B 테스트 결과

```sql
CREATE TABLE algorithm_tests (
  id TEXT PRIMARY KEY,
  analysis_id TEXT,
  algorithm_type TEXT NOT NULL CHECK(algorithm_type IN ('aeo', 'geo', 'seo', 'aio')),
  version_a TEXT NOT NULL,
  version_b TEXT NOT NULL,
  score_a REAL NOT NULL,
  score_b REAL NOT NULL,
  actual_score REAL,
  winner TEXT CHECK(winner IN ('A', 'B', 'tie')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
  FOREIGN KEY (version_a) REFERENCES algorithm_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (version_b) REFERENCES algorithm_versions(id) ON DELETE CASCADE
);
```

## 향후 개선 사항

1. **자동 리서치 수집**
   - RSS 피드, 논문 데이터베이스 자동 수집
   - NLP를 통한 리서치 결과 자동 파싱

2. **고급 학습 알고리즘**
   - 딥러닝 기반 가중치 학습
   - 강화 학습을 통한 알고리즘 최적화

3. **실시간 성능 모니터링**
   - 대시보드를 통한 알고리즘 성능 시각화
   - 자동 알림 시스템

4. **다중 알고리즘 협업**
   - 앙상블 방식으로 여러 알고리즘 조합
   - 메타 학습을 통한 최적 알고리즘 선택

