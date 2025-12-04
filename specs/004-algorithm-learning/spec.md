# 알고리즘 자동 학습 시스템 기능 명세서

## 📋 기본 정보

- **기능명**: 알고리즘 자동 학습 시스템 (Algorithm Auto-Learning System)
- **목적**: AEO, GEO, SEO, AIO 점수 계산 알고리즘을 지속적으로 학습하고 개선하여 정확도를 향상시키는 시스템
- **우선순위**: High
- **예상 소요 시간**: 이미 구현 완료
- **작성일**: 2025-12-04
- **작성자**: chunghyo, cursor ai(AI CODE IDE)

---

## 👤 사용자 스토리

### 주요 사용자 스토리
```
As a 서비스 관리자/개발자,
I want 알고리즘이 분석 결과를 기반으로 자동으로 학습하고 개선되기를 원한다,
So that 점수 계산의 정확도가 지속적으로 향상되고 최신 연구 결과가 반영된다.
```

### 추가 사용자 스토리
- **사용자 스토리 2**: 리서치 결과를 저장하고 알고리즘에 반영하여 최신 연구 기반으로 알고리즘을 개선하고 싶다
- **사용자 스토리 3**: 여러 알고리즘 버전을 A/B 테스트하여 더 나은 버전을 선택하고 싶다
- **사용자 스토리 4**: 알고리즘 성능을 모니터링하여 개선율과 정확도를 추적하고 싶다
- **사용자 스토리 5**: 알고리즘 버전을 관리하고 필요시 이전 버전으로 롤백하고 싶다

---

## 📝 기능 요구사항

### 기능적 요구사항 (Functional Requirements)

#### FR-1: 알고리즘 버전 관리
- **설명**: 각 알고리즘 타입(AEO, GEO, SEO, AIO)별로 버전을 관리하고 활성화
- **우선순위**: High
- **수용 기준**:
  - [x] 알고리즘 버전 생성
  - [x] 가중치 및 설정 관리
  - [x] 활성 버전 조회
  - [x] 이전 버전 비활성화
  - [x] 버전별 성능 메트릭 추적

#### FR-2: 리서치 결과 관리
- **설명**: 외부 리서치 결과를 저장하고 알고리즘에 반영
- **우선순위**: High
- **수용 기준**:
  - [x] 리서치 결과 저장 (제목, 출처, URL, 발행일)
  - [x] 리서치 결과의 영향 요소 및 영향도 기록
  - [x] 미적용 리서치 결과 조회
  - [x] 리서치 결과를 기반으로 가중치 자동 조정
  - [x] 리서치 적용 여부 추적

#### FR-3: 가중치 자동 학습
- **설명**: 실제 분석 결과와 예상 점수를 비교하여 가중치 자동 조정
- **우선순위**: High
- **수용 기준**:
  - [x] 그라디언트 디센트 방식으로 가중치 조정
  - [x] 실제 점수와 예상 점수의 차이 기반 학습
  - [x] 각 특징(feature)별 가중치 개별 조정
  - [x] 학습률 설정 가능
  - [x] 성능 메트릭 업데이트

#### FR-4: A/B 테스트
- **설명**: 두 알고리즘 버전을 비교하여 더 나은 버전 선택
- **우선순위**: Medium
- **수용 기준**:
  - [x] 동일한 분석에 대해 두 버전 실행
  - [x] 점수 비교 및 승자 결정
  - [x] 실제 점수가 있으면 오차 비교
  - [x] 테스트 결과 저장 및 통계 분석

#### FR-5: 자동 학습 파이프라인
- **설명**: 분석 결과를 기반으로 자동으로 학습 수행
- **우선순위**: High
- **수용 기준**:
  - [x] 분석 결과에서 특징 추출
  - [x] 현재 알고리즘으로 예상 점수 계산
  - [x] 실제 점수와 비교하여 학습
  - [x] 성능 메트릭 업데이트
  - [x] A/B 테스트 자동 생성 (선택적)

#### FR-6: 성능 모니터링
- **설명**: 알고리즘 성능을 추적하고 대시보드로 시각화
- **우선순위**: Medium
- **수용 기준**:
  - [x] 평균 정확도 추적
  - [x] 평균 오차 추적
  - [x] 총 테스트 수 추적
  - [x] 개선율 계산
  - [x] 일별 성능 추이 조회
  - [x] 리서치 기반 개선 추적

#### FR-7: 알고리즘 초기화
- **설명**: 기본 알고리즘 버전 생성 및 초기화
- **우선순위**: Medium
- **수용 기준**:
  - [x] 기본 가중치로 초기 버전 생성
  - [x] 모든 알고리즘 타입 초기화
  - [x] 초기 성능 메트릭 설정

### 비기능적 요구사항 (Non-functional Requirements)

#### NFR-1: 성능
- **요구사항**: 
  - 학습 수행 시간 < 500ms
  - 버전 조회 < 100ms
  - A/B 테스트 생성 < 200ms
- **측정 기준**: 
  - 데이터베이스 쿼리 최적화
  - 인덱스 활용
- **현재 상태**: ✅ 구현 완료

#### NFR-2: 보안
- **요구사항**: 
  - 인증 필수 (모든 학습 API)
  - 관리자 권한 검증 (선택적)
  - 트랜잭션 보장
- **현재 상태**: ✅ 구현 완료

#### NFR-3: 확장성
- **요구사항**: 
  - 새로운 알고리즘 타입 추가 용이
  - 새로운 특징 추가 용이
  - 학습 알고리즘 교체 가능
- **현재 상태**: ✅ 구현 완료

#### NFR-4: 사용성
- **요구사항**: 
  - 명확한 성능 메트릭 표시
  - 리서치 결과 관리 UI
  - 버전 관리 UI
- **현재 상태**: ⚠️ 일부 구현 (백엔드 완료, 프론트엔드 UI 추가 필요)

### 제약사항 (Constraints)
- 학습은 실제 점수와 예상 점수의 차이를 기반으로 수행됨
- 리서치 결과는 수동으로 저장해야 함 (자동 수집 없음)
- A/B 테스트는 수동으로 생성하거나 자동 학습 파이프라인에서 생성됨

---

## 🔌 인터페이스 정의

### API 엔드포인트

#### 엔드포인트 1: 알고리즘 버전 조회
- **메서드**: GET
- **경로**: `/api/algorithm-learning?algorithmType={type}`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    version: {
      id: string; // UUID
      algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
      version: number;
      weights: Record<string, number>;
      config: Record<string, any>;
      performance: {
        avgAccuracy: number;
        avgError: number;
        totalTests: number;
        improvementRate: number;
      };
      researchBased: boolean;
      researchFindings: string[];
      createdAt: string; // ISO 8601
      isActive: boolean;
    } | null;
  }
  ```

#### 엔드포인트 2: 알고리즘 버전 생성
- **메서드**: POST
- **경로**: `/api/algorithm-learning`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    action: 'create-version';
    algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
    weights: Record<string, number>;
    config?: Record<string, any>;
    researchFindings?: string[]; // 리서치 ID 배열
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    version: AlgorithmVersion;
  }
  ```

#### 엔드포인트 3: 리서치 결과 저장
- **메서드**: POST
- **경로**: `/api/algorithm-learning`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    action: 'save-research';
    title: string;
    source: string;
    url?: string;
    publishedDate?: string; // ISO 8601
    findings: Array<{
      algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
      factor: string;
      impact: number; // 0-1 (예: 0.4 = 40% 증가)
      confidence: number; // 0-1
      description: string;
    }>;
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    findingId: string; // UUID
    message: string;
  }
  ```

#### 엔드포인트 4: 리서치 결과 적용
- **메서드**: POST
- **경로**: `/api/algorithm-learning`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    action: 'apply-research';
    findingId: string; // UUID
    algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    version: AlgorithmVersion; // 새로 생성된 버전
    message: string;
  }
  ```

#### 엔드포인트 5: 가중치 학습
- **메서드**: POST
- **경로**: `/api/algorithm-learning`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    action: 'learn-weights';
    algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
    features: Record<string, number>; // 특징 값
    actualScore: number; // 0-100
    predictedScore: number; // 0-100
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    updated: boolean;
    message: string;
  }
  ```

#### 엔드포인트 6: A/B 테스트 생성
- **메서드**: POST
- **경로**: `/api/algorithm-learning`
- **인증**: Required
- **요청 스키마**:
  ```typescript
  {
    action: 'ab-test';
    analysisId: string; // UUID
    algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
    versionA: string; // 버전 ID
    versionB: string; // 버전 ID
    scoreA: number; // 0-100
    scoreB: number; // 0-100
    actualScore?: number; // 0-100 (검증용)
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    testId: string; // UUID
    winner: 'A' | 'B' | 'tie';
    message: string;
  }
  ```

#### 엔드포인트 7: 미적용 리서치 결과 조회
- **메서드**: GET
- **경로**: `/api/algorithm-learning?action=research&algorithmType={type}`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    findings: Array<{
      id: string; // UUID
      title: string;
      source: string;
      url?: string;
      publishedDate?: string;
      findings: Array<{
        algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
        factor: string;
        impact: number;
        confidence: number;
        description: string;
      }>;
      applied: boolean;
    }>;
  }
  ```

#### 엔드포인트 8: A/B 테스트 결과 조회
- **메서드**: GET
- **경로**: `/api/algorithm-learning?action=ab-test&algorithmType={type}&versionA={id}&versionB={id}`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    results: Array<{
      id: string; // UUID
      analysisId: string;
      scoreA: number;
      scoreB: number;
      actualScore?: number;
      winner: 'A' | 'B' | 'tie';
      createdAt: string; // ISO 8601
    }>;
  }
  ```

#### 엔드포인트 9: 알고리즘 성능 조회
- **메서드**: GET
- **경로**: `/api/algorithm-performance?algorithmType={type}&days={days}`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
    version: {
      id: string;
      version: number;
      performance: {
        avgAccuracy: number;
        avgError: number;
        totalTests: number;
        improvementRate: number;
      };
      researchBased: boolean;
    };
    statistics: {
      totalTests: number;
      avgErrorA: number;
      avgErrorB: number;
      winsA: number;
      winsB: number;
    };
    dailyPerformance: Array<{
      date: string; // YYYY-MM-DD
      testCount: number;
      avgError: number;
    }>;
    researchImprovements: Array<{
      title: string;
      source: string;
      appliedAt: string; // ISO 8601
      appliedVersion: number;
      improvementRate: number;
    }>;
  }
  ```

#### 엔드포인트 10: 알고리즘 초기화
- **메서드**: POST
- **경로**: `/api/algorithm-initialize`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    initialized: Array<{
      algorithmType: 'aeo' | 'geo' | 'seo' | 'aio';
      version: number;
      versionId: string;
    }>;
    message: string;
  }
  ```

### 데이터베이스 스키마

#### algorithm_versions 테이블
```sql
CREATE TABLE algorithm_versions (
  id TEXT PRIMARY KEY, -- UUID
  algorithm_type TEXT NOT NULL CHECK(algorithm_type IN ('aeo', 'geo', 'seo', 'aio')),
  version INTEGER NOT NULL,
  weights TEXT NOT NULL, -- JSON 문자열
  config TEXT, -- JSON 문자열
  avg_accuracy REAL DEFAULT 0,
  avg_error REAL DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  improvement_rate REAL DEFAULT 0,
  research_based INTEGER DEFAULT 0, -- 0 또는 1
  research_findings TEXT, -- JSON 문자열 (리서치 ID 배열)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1 -- 0 또는 1
);

-- 인덱스
CREATE INDEX idx_algorithm_versions_type ON algorithm_versions(algorithm_type);
CREATE INDEX idx_algorithm_versions_active ON algorithm_versions(algorithm_type, is_active);
CREATE INDEX idx_algorithm_versions_version ON algorithm_versions(algorithm_type, version);
```

#### research_findings 테이블
```sql
CREATE TABLE research_findings (
  id TEXT PRIMARY KEY, -- UUID
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  published_date TEXT,
  findings TEXT NOT NULL, -- JSON 문자열
  applied INTEGER DEFAULT 0, -- 0 또는 1
  applied_at DATETIME,
  applied_version TEXT, -- algorithm_versions.id 참조
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_research_findings_applied ON research_findings(applied);
CREATE INDEX idx_research_findings_applied_version ON research_findings(applied_version);
```

#### algorithm_tests 테이블
```sql
CREATE TABLE algorithm_tests (
  id TEXT PRIMARY KEY, -- UUID
  analysis_id TEXT NOT NULL, -- analyses.id 참조
  algorithm_type TEXT NOT NULL CHECK(algorithm_type IN ('aeo', 'geo', 'seo', 'aio')),
  version_a TEXT NOT NULL, -- algorithm_versions.id 참조
  version_b TEXT NOT NULL, -- algorithm_versions.id 참조
  score_a REAL NOT NULL CHECK(score_a >= 0 AND score_a <= 100),
  score_b REAL NOT NULL CHECK(score_b >= 0 AND score_b <= 100),
  actual_score REAL CHECK(actual_score IS NULL OR (actual_score >= 0 AND actual_score <= 100)),
  winner TEXT CHECK(winner IN ('A', 'B', 'tie')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (version_a) REFERENCES algorithm_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (version_b) REFERENCES algorithm_versions(id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_algorithm_tests_type ON algorithm_tests(algorithm_type);
CREATE INDEX idx_algorithm_tests_created ON algorithm_tests(created_at);
CREATE INDEX idx_algorithm_tests_versions ON algorithm_tests(version_a, version_b);
```

### UI/UX 요구사항

#### 알고리즘 성능 대시보드 (구현 필요)
- **컴포넌트명**: `AlgorithmPerformanceDashboard`
- **위치**: `components/AlgorithmPerformanceDashboard.tsx`
- **기능**: 
  - 알고리즘 타입별 성능 표시
  - 일별 성능 추이 차트
  - 리서치 기반 개선 추적
  - A/B 테스트 결과 표시
- **프로퍼티**:
  ```typescript
  interface AlgorithmPerformanceDashboardProps {
    algorithmType?: 'aeo' | 'geo' | 'seo' | 'aio';
    days?: number; // 기본값: 30
  }
  ```

#### 리서치 관리 UI (구현 필요)
- **컴포넌트명**: `ResearchManagement`
- **위치**: `components/ResearchManagement.tsx`
- **기능**: 
  - 리서치 결과 목록 표시
  - 리서치 결과 추가/수정/삭제
  - 미적용 리서치 결과 필터링
  - 리서치 적용 버튼

---

## ⚠️ 에러 처리

### 예상되는 에러 케이스

#### 에러 1: 인증되지 않은 요청
- **발생 조건**: 로그인하지 않은 사용자가 학습 API 호출
- **에러 코드**: `UNAUTHORIZED`
- **에러 메시지**: "인증이 필요합니다."
- **처리 방법**: 401 상태 코드 반환

#### 에러 2: 유효하지 않은 알고리즘 타입
- **발생 조건**: 존재하지 않는 알고리즘 타입 지정
- **에러 코드**: `VALIDATION_ERROR`
- **에러 메시지**: "유효하지 않은 알고리즘 타입입니다."
- **처리 방법**: 400 상태 코드 반환

#### 에러 3: 활성 버전 없음
- **발생 조건**: 활성 알고리즘 버전이 없을 때
- **에러 코드**: `NOT_FOUND`
- **에러 메시지**: "활성 알고리즘 버전을 찾을 수 없습니다."
- **처리 방법**: 404 상태 코드 반환

#### 에러 4: 리서치 결과 저장 실패
- **발생 조건**: 데이터베이스 오류 등
- **에러 코드**: `INTERNAL_ERROR`
- **에러 메시지**: "리서치 결과를 저장할 수 없습니다."
- **처리 방법**: 500 상태 코드 반환, 에러 로깅

#### 에러 5: 가중치 학습 실패
- **발생 조건**: 특징 추출 실패, 계산 오류 등
- **에러 코드**: `LEARNING_ERROR`
- **에러 메시지**: "가중치 학습 중 오류가 발생했습니다."
- **처리 방법**: 에러 로깅, 사용자는 계속 진행 가능하도록 처리

---

## 🧪 테스트 요구사항

### 단위 테스트
- [x] 알고리즘 버전 생성/조회 함수 테스트
- [x] 리서치 결과 저장/조회 함수 테스트
- [x] 가중치 학습 함수 테스트
- [x] A/B 테스트 생성 함수 테스트
- [x] 특징 추출 함수 테스트

### 통합 테스트
- [x] 알고리즘 학습 API 엔드포인트 테스트
- [x] 알고리즘 성능 API 엔드포인트 테스트
- [x] 데이터베이스 저장/조회 테스트
- [x] 자동 학습 파이프라인 테스트

### E2E 테스트
- [ ] 전체 학습 플로우 테스트 (리서치 저장 → 적용 → 학습 → 성능 확인)
- [ ] A/B 테스트 플로우 테스트
- [ ] 성능 모니터링 플로우 테스트

### 수동 테스트 체크리스트
- [x] 알고리즘 버전 생성 테스트
- [x] 리서치 결과 저장 테스트
- [x] 리서치 결과 적용 테스트
- [x] 가중치 학습 테스트
- [x] A/B 테스트 생성 테스트
- [x] 성능 조회 테스트
- [x] 알고리즘 초기화 테스트

---

## 📚 참고 자료

### 관련 문서
- [프로젝트 README](../README.md)
- [프로젝트 아키텍처](../ARCHITECTURE.md)
- [알고리즘 학습 시스템 가이드](../ALGORITHM_LEARNING_SYSTEM.md)
- [Agent Lightning 통합](../AGENT_LIGHTNING_INTEGRATION.md)
- [콘텐츠 분석 기능 명세서](../001-content-analysis/spec.md)

### 외부 리소스
- [그라디언트 디센트 알고리즘](https://en.wikipedia.org/wiki/Gradient_descent)
- [A/B 테스트 방법론](https://en.wikipedia.org/wiki/A/B_testing)

### 기존 기능과의 연관성
- **콘텐츠 분석**: 분석 결과를 기반으로 학습 수행
- **AI Agent**: Agent Lightning과 통합하여 프롬프트 최적화
- **Freemium 모델**: 플랜별 알고리즘 버전 제한 (선택적)

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
**상태**: 구현 완료 (프론트엔드 UI 일부 추가 필요)  
**다음 단계**: [Plan 작성](./plan.md) (선택사항 - 이미 구현 완료)

