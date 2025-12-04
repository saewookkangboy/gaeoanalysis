# Admin 대시보드 기능 명세서

## 📋 기본 정보

- **기능명**: Admin 대시보드 (Admin Dashboard)
- **목적**: 관리자가 사용자 활동, 로그인 이력, 분석 결과를 모니터링하고 종합적인 AI 리포트를 생성하는 관리자 대시보드
- **우선순위**: High
- **예상 소요 시간**: 2-3주
- **작성일**: 2025-12-04
- **작성자**: chunghyo, cursor ai(AI CODE IDE)

---

## 👤 사용자 스토리

### 주요 사용자 스토리
```
As a 관리자,
I want 사용자 활동과 분석 결과를 종합적으로 모니터링하고 싶다,
So that 서비스 운영 상태를 파악하고 개선 방안을 도출할 수 있다.
```

### 추가 사용자 스토리
- **사용자 스토리 2**: 소셜 로그인별로 로그인 이력을 분류하여 확인하고 싶다
- **사용자 스토리 3**: 사용자별 분석 이력을 모니터링하여 사용 패턴을 파악하고 싶다
- **사용자 스토리 4**: 사용자별 분석 횟수와 분석 URL을 확인하여 인기 콘텐츠를 파악하고 싶다
- **사용자 스토리 5**: 일일 방문수와 활동 수를 표 형식으로 확인하고 싶다
- **사용자 스토리 6**: 사용자별 분석 결과의 평균 점수와 각 분석 항목의 상세 내역을 확인하고 싶다
- **사용자 스토리 7**: 모든 사용자 데이터를 종합하여 AI 리포트를 생성하고 싶다
- **사용자 스토리 8**: 분석 결과를 데이터베이스에 적재하여 AI 심화 학습에 활용하고 싶다

---

## 📝 기능 요구사항

### 기능적 요구사항 (Functional Requirements)

#### FR-1: 관리자 인증 및 권한 관리
- **설명**: 관리자만 접근 가능한 페이지 및 API
- **우선순위**: High
- **수용 기준**:
  - [ ] 사용자 role이 'admin'인지 확인
  - [ ] 관리자 전용 라우트 보호
  - [ ] 관리자 전용 API 엔드포인트 보호
  - [ ] 권한 없음 시 403 에러 반환

#### FR-2: 사용자 로그인 이력 조회
- **설명**: 소셜 로그인 단위별로 분류된 로그인 이력 조회
- **우선순위**: High
- **수용 기준**:
  - [ ] Provider별 로그인 이력 조회 (Google, GitHub)
  - [ ] 날짜별 필터링
  - [ ] 사용자별 필터링
  - [ ] 성공/실패 구분
  - [ ] IP 주소, User Agent 표시
  - [ ] 페이지네이션

#### FR-3: 사용자별 분석 이력 모니터링
- **설명**: 사용자별 분석 이력을 실시간으로 모니터링
- **우선순위**: High
- **수용 기준**:
  - [ ] 사용자별 분석 이력 목록 조회
  - [ ] 분석 날짜별 필터링
  - [ ] 분석 점수별 필터링
  - [ ] URL별 그룹화
  - [ ] 상세 분석 결과 조회

#### FR-4: 사용자별 분석 통계
- **설명**: 사용자별 분석 횟수와 분석 URL 확인
- **우선순위**: High
- **수용 기준**:
  - [ ] 사용자별 총 분석 횟수
  - [ ] 사용자별 분석 URL 목록
  - [ ] URL별 분석 횟수
  - [ ] 최근 분석 URL 표시
  - [ ] 인기 URL 순위

#### FR-5: 사용자 활동 수 측정
- **설명**: 일일 방문수 및 활동 수를 표 형식으로 표시
- **우선순위**: High
- **수용 기준**:
  - [ ] 일일 방문수 (누적)
  - [ ] 일일 방문수 (개별 사용자)
  - [ ] 일일 활동 수 (분석, 챗봇, 내보내기)
  - [ ] 날짜 범위 선택
  - [ ] 표 형식으로 정리
  - [ ] CSV 내보내기 (선택적)

#### FR-6: 사용자별 분석 결과 통계
- **설명**: 사용자별 분석 결과 건수 및 평균 점수, 각 분석 항목의 평균 점수 및 상세 내역
- **우선순위**: High
- **수용 기준**:
  - [ ] 사용자별 총 분석 건수
  - [ ] 사용자별 평균 종합 점수
  - [ ] 사용자별 평균 AEO 점수
  - [ ] 사용자별 평균 GEO 점수
  - [ ] 사용자별 평균 SEO 점수
  - [ ] 사용자별 AI 모델별 평균 점수 (ChatGPT, Perplexity, Gemini, Claude)
  - [ ] 각 분석 항목의 상세 내역 (점수 분포, 최고/최저 점수 등)

#### FR-7: AI 리포트 생성
- **설명**: 사용자 로그인 정보를 종합적으로 분석하여 AI 리포트 출력
- **우선순위**: Medium
- **수용 기준**:
  - [ ] 전체 사용자 데이터 종합 분석
  - [ ] 사용 패턴 분석
  - [ ] 트렌드 분석
  - [ ] 개선 제안 생성
  - [ ] 마크다운 형식 리포트 출력
  - [ ] PDF 다운로드 (선택적)

#### FR-8: 분석 결과 DB 적재 및 AI 학습
- **설명**: 분석 결과를 지속적으로 DB에 적재하여 AI 심화 학습에 활용
- **우선순위**: Medium
- **수용 기준**:
  - [ ] 분석 결과 자동 저장 (이미 구현됨)
  - [ ] 학습 데이터 추출
  - [ ] 학습 데이터 정제
  - [ ] 알고리즘 학습 시스템 연동
  - [ ] 학습 메트릭 추적

### 비기능적 요구사항 (Non-functional Requirements)

#### NFR-1: 성능
- **요구사항**: 
  - 대시보드 로드 시간 < 3초
  - 통계 조회 < 1초
  - AI 리포트 생성 < 30초
- **측정 기준**: 
  - 데이터베이스 쿼리 최적화
  - 캐싱 활용
  - 페이지네이션
- **현재 상태**: 구현 필요

#### NFR-2: 보안
- **요구사항**: 
  - 관리자 권한 필수
  - 민감 정보 마스킹 (선택적)
  - 활동 로그 기록
  - IP 주소 로깅
- **현재 상태**: 구현 필요

#### NFR-3: 확장성
- **요구사항**: 
  - 대량 데이터 처리 가능
  - 페이지네이션 필수
  - 필터링 및 검색 기능
- **현재 상태**: 구현 필요

#### NFR-4: 사용성
- **요구사항**: 
  - 직관적인 대시보드 레이아웃
  - 차트 및 그래프 시각화
  - 반응형 디자인
  - 다크 모드 지원
- **현재 상태**: 구현 필요

### 제약사항 (Constraints)
- 관리자 권한이 있는 사용자만 접근 가능
- 대량 데이터 조회 시 성능 고려 필요
- AI 리포트 생성은 시간이 소요될 수 있음

---

## 🔌 인터페이스 정의

### API 엔드포인트

#### 엔드포인트 1: 관리자 권한 확인
- **메서드**: GET
- **경로**: `/api/admin/check`
- **인증**: Required
- **응답 스키마**:
  ```typescript
  {
    isAdmin: boolean;
    user: {
      id: string;
      email: string;
      role: string;
    } | null;
  }
  ```

#### 엔드포인트 2: 사용자 로그인 이력 조회
- **메서드**: GET
- **경로**: `/api/admin/auth-logs`
- **인증**: Required (Admin only)
- **쿼리 파라미터**:
  - `provider?`: 'google' | 'github' | 'all'
  - `userId?`: string
  - `startDate?`: string (ISO 8601)
  - `endDate?`: string (ISO 8601)
  - `page?`: number (기본값: 1)
  - `limit?`: number (기본값: 50)
- **응답 스키마**:
  ```typescript
  {
    logs: Array<{
      id: string;
      userId: string;
      userEmail: string;
      provider: 'google' | 'github';
      action: 'login' | 'logout' | 'signup';
      ipAddress: string | null;
      userAgent: string | null;
      success: boolean;
      errorMessage: string | null;
      createdAt: string; // ISO 8601
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    summary: {
      totalLogs: number;
      successCount: number;
      failureCount: number;
      byProvider: {
        google: number;
        github: number;
      };
    };
  }
  ```

#### 엔드포인트 3: 사용자 목록 조회
- **메서드**: GET
- **경로**: `/api/admin/users`
- **인증**: Required (Admin only)
- **쿼리 파라미터**:
  - `provider?`: 'google' | 'github' | 'all'
  - `role?`: 'user' | 'admin' | 'all'
  - `search?`: string (이메일 검색)
  - `page?`: number
  - `limit?`: number
- **응답 스키마**:
  ```typescript
  {
    users: Array<{
      id: string;
      email: string;
      name: string | null;
      provider: 'google' | 'github' | null;
      role: 'user' | 'admin';
      isActive: boolean;
      lastLoginAt: string | null; // ISO 8601
      createdAt: string; // ISO 8601
      totalAnalyses: number;
      totalChats: number;
      totalLogins: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  ```

#### 엔드포인트 4: 사용자별 분석 이력 조회
- **메서드**: GET
- **경로**: `/api/admin/users/[userId]/analyses`
- **인증**: Required (Admin only)
- **쿼리 파라미터**:
  - `startDate?`: string
  - `endDate?`: string
  - `minScore?`: number
  - `maxScore?`: number
  - `page?`: number
  - `limit?`: number
- **응답 스키마**:
  ```typescript
  {
    analyses: Array<{
      id: string;
      url: string;
      aeoScore: number;
      geoScore: number;
      seoScore: number;
      overallScore: number;
      aiScores: {
        chatgpt: number | null;
        perplexity: number | null;
        gemini: number | null;
        claude: number | null;
      };
      createdAt: string; // ISO 8601
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    statistics: {
      totalCount: number;
      avgOverallScore: number;
      avgAeoScore: number;
      avgGeoScore: number;
      avgSeoScore: number;
      avgAiScores: {
        chatgpt: number | null;
        perplexity: number | null;
        gemini: number | null;
        claude: number | null;
      };
    };
  }
  ```

#### 엔드포인트 5: 사용자별 분석 URL 목록
- **메서드**: GET
- **경로**: `/api/admin/users/[userId]/urls`
- **인증**: Required (Admin only)
- **응답 스키마**:
  ```typescript
  {
    urls: Array<{
      url: string;
      analysisCount: number;
      firstAnalyzedAt: string; // ISO 8601
      lastAnalyzedAt: string; // ISO 8601
      avgOverallScore: number;
      avgAeoScore: number;
      avgGeoScore: number;
      avgSeoScore: number;
    }>;
    totalUrls: number;
    totalAnalyses: number;
  }
  ```

#### 엔드포인트 6: 일일 방문수 및 활동 통계
- **메서드**: GET
- **경로**: `/api/admin/daily-statistics`
- **인증**: Required (Admin only)
- **쿼리 파라미터**:
  - `startDate?`: string (기본값: 30일 전)
  - `endDate?`: string (기본값: 오늘)
  - `groupBy?`: 'day' | 'week' | 'month'
- **응답 스키마**:
  ```typescript
  {
    statistics: Array<{
      date: string; // YYYY-MM-DD
      uniqueVisitors: number; // 개별 방문수
      totalVisits: number; // 누적 방문수
      totalAnalyses: number;
      totalChats: number;
      totalExports: number;
      newUsers: number;
      byProvider: {
        google: number;
        github: number;
      };
    }>;
    summary: {
      totalUniqueVisitors: number;
      totalVisits: number;
      totalAnalyses: number;
      totalChats: number;
      totalExports: number;
      avgDailyVisits: number;
    };
  }
  ```

#### 엔드포인트 7: 사용자별 분석 통계
- **메서드**: GET
- **경로**: `/api/admin/users/[userId]/statistics`
- **인증**: Required (Admin only)
- **응답 스키마**:
  ```typescript
  {
    userId: string;
    userEmail: string;
    provider: 'google' | 'github' | null;
    statistics: {
      totalAnalyses: number;
      avgOverallScore: number;
      avgAeoScore: number;
      avgGeoScore: number;
      avgSeoScore: number;
      avgAiScores: {
        chatgpt: number | null;
        perplexity: number | null;
        gemini: number | null;
        claude: number | null;
      };
      scoreDistribution: {
        overall: Array<{ range: string; count: number }>;
        aeo: Array<{ range: string; count: number }>;
        geo: Array<{ range: string; count: number }>;
        seo: Array<{ range: string; count: number }>;
      };
      minScores: {
        overall: number;
        aeo: number;
        geo: number;
        seo: number;
      };
      maxScores: {
        overall: number;
        aeo: number;
        geo: number;
        seo: number;
      };
    };
  }
  ```

#### 엔드포인트 8: AI 리포트 생성
- **메서드**: POST
- **경로**: `/api/admin/ai-report`
- **인증**: Required (Admin only)
- **요청 스키마**:
  ```typescript
  {
    userId?: string; // 특정 사용자 리포트 (선택적, 없으면 전체 리포트)
    reportType: 'summary' | 'detailed' | 'trend';
    includeCharts?: boolean;
  }
  ```
- **응답 스키마**:
  ```typescript
  {
    reportId: string; // UUID
    report: string; // 마크다운 형식 리포트
    generatedAt: string; // ISO 8601
    metadata: {
      userId: string | null;
      reportType: string;
      dataRange: {
        startDate: string;
        endDate: string;
      };
      totalUsers: number;
      totalAnalyses: number;
    };
  }
  ```

### 데이터베이스 스키마

#### 기존 테이블 활용
- `users`: 사용자 정보
- `auth_logs`: 인증 로그
- `analyses`: 분석 결과
- `user_activity_statistics`: 사용자 활동 통계
- `admin_logs`: 관리자 활동 로그

#### 새로 필요한 테이블 (선택적)

#### ai_reports 테이블 (AI 리포트 저장)
```sql
CREATE TABLE IF NOT EXISTS ai_reports (
  id TEXT PRIMARY KEY, -- UUID
  admin_user_id TEXT NOT NULL, -- users.id 참조
  user_id TEXT, -- users.id 참조 (NULL이면 전체 리포트)
  report_type TEXT NOT NULL, -- 'summary' | 'detailed' | 'trend'
  report_content TEXT NOT NULL, -- 마크다운 형식 리포트
  metadata TEXT, -- JSON 문자열
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX idx_ai_reports_admin_user_id ON ai_reports(admin_user_id);
CREATE INDEX idx_ai_reports_user_id ON ai_reports(user_id);
CREATE INDEX idx_ai_reports_created_at ON ai_reports(created_at);
```

### UI/UX 요구사항

#### Admin 대시보드 페이지
- **페이지명**: `Admin Dashboard`
- **위치**: `app/admin/page.tsx`
- **기능**: 
  - 대시보드 메인 페이지
  - 통계 요약 카드
  - 차트 및 그래프
  - 빠른 링크

#### 사용자 관리 페이지
- **페이지명**: `User Management`
- **위치**: `app/admin/users/page.tsx`
- **기능**: 
  - 사용자 목록 표시
  - 검색 및 필터링
  - 사용자 상세 정보
  - 사용자별 통계

#### 로그인 이력 페이지
- **페이지명**: `Login History`
- **위치**: `app/admin/auth-logs/page.tsx`
- **기능**: 
  - 로그인 이력 목록
  - Provider별 필터링
  - 날짜별 필터링
  - 상세 정보 표시

#### 분석 모니터링 페이지
- **페이지명**: `Analysis Monitoring`
- **위치**: `app/admin/analyses/page.tsx`
- **기능**: 
  - 전체 분석 이력
  - 사용자별 분석 이력
  - 통계 및 차트

#### AI 리포트 페이지
- **페이지명**: `AI Reports`
- **위치**: `app/admin/reports/page.tsx`
- **기능**: 
  - 리포트 생성
  - 리포트 목록
  - 리포트 상세 보기
  - 리포트 다운로드

---

## ⚠️ 에러 처리

### 예상되는 에러 케이스

#### 에러 1: 권한 없음
- **발생 조건**: 관리자가 아닌 사용자가 접근 시도
- **에러 코드**: `FORBIDDEN`
- **에러 메시지**: "관리자 권한이 필요합니다."
- **처리 방법**: 403 상태 코드 반환, 로그인 페이지로 리다이렉트

#### 에러 2: 인증되지 않은 요청
- **발생 조건**: 로그인하지 않은 사용자가 접근 시도
- **에러 코드**: `UNAUTHORIZED`
- **에러 메시지**: "인증이 필요합니다."
- **처리 방법**: 401 상태 코드 반환, 로그인 페이지로 리다이렉트

#### 에러 3: 데이터 조회 실패
- **발생 조건**: 데이터베이스 오류 등
- **에러 코드**: `INTERNAL_ERROR`
- **에러 메시지**: "데이터를 조회할 수 없습니다."
- **처리 방법**: 500 상태 코드 반환, 에러 로깅

#### 에러 4: AI 리포트 생성 실패
- **발생 조건**: Gemini API 오류, 타임아웃 등
- **에러 코드**: `REPORT_GENERATION_ERROR`
- **에러 메시지**: "리포트 생성 중 오류가 발생했습니다."
- **처리 방법**: 에러 로깅, 재시도 옵션 제공

---

## 🧪 테스트 요구사항

### 단위 테스트
- [ ] 관리자 권한 확인 함수 테스트
- [ ] 통계 계산 함수 테스트
- [ ] 데이터 필터링 함수 테스트

### 통합 테스트
- [ ] Admin API 엔드포인트 테스트
- [ ] 데이터베이스 쿼리 테스트
- [ ] AI 리포트 생성 테스트

### E2E 테스트
- [ ] 관리자 로그인 → 대시보드 접근 플로우
- [ ] 사용자 목록 조회 플로우
- [ ] 로그인 이력 조회 플로우
- [ ] AI 리포트 생성 플로우

### 수동 테스트 체크리스트
- [ ] 관리자 권한 확인 테스트
- [ ] 비관리자 접근 차단 테스트
- [ ] 사용자 목록 조회 테스트
- [ ] 로그인 이력 조회 테스트
- [ ] 분석 이력 조회 테스트
- [ ] 통계 조회 테스트
- [ ] AI 리포트 생성 테스트
- [ ] 반응형 디자인 테스트

---

## 📚 참고 자료

### 관련 문서
- [프로젝트 README](../README.md)
- [프로젝트 아키텍처](../ARCHITECTURE.md)
- [Freemium 모델 명세서](../003-freemium-model/spec.md)
- [알고리즘 자동 학습 명세서](../004-algorithm-learning/spec.md)
- [프로젝트 Constitution](../../memory/constitution.md)

### 외부 리소스
- [Next.js Admin Dashboard 예시](https://nextjs.org/docs)
- [Chart.js 문서](https://www.chartjs.org/docs/)

### 기존 기능과의 연관성
- **인증 시스템**: 관리자 권한 확인
- **분석 시스템**: 분석 결과 조회 및 통계
- **Freemium 모델**: 사용자 활동 추적
- **알고리즘 학습**: 분석 결과를 학습 데이터로 활용

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
**상태**: 명세서 작성 완료, 구현 필요  
**다음 단계**: [Plan 작성](./plan.md)

