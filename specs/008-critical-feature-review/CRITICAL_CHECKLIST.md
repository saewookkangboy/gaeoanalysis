# Critical 기능 점검 및 업데이트 체크리스트 (재설계)

## 📋 개요

- **작성일**: 2025-12-15
- **목적**: 기능 점검 및 개선사항 적용 (LLM Pulse + Freemium 통합)
- **기간**: 1주일 (7일)
- **우선순위**: Critical
- **참고 문서**: 
  - [LLM Pulse 분석](../../LLMPULSE_ANALYSIS.md)
  - [Freemium 모델 명세서](../003-freemium-model/spec.md)
  - [Freemium 다음 단계](../../FREEMIUM_NEXT_STEPS.md)

---

## 🎯 주요 목표

1. **소셜 로그인 후 분석 프로세스 검증** (최우선, 이미 구현됨)
2. **Freemium 모델 API 통합 및 UI 구현** (사용량 제한 적용)
3. **AI Visibility + AIO 인용 알고리즘 업데이트** (기존 데이터 기반 검증)
4. **Citation Sources Analysis 기본 구현** (LLM Pulse 핵심 기능)

---

## 📅 타임라인 (1주일 재설계)

### Day 1: 소셜 로그인 후 분석 프로세스 검증 (Critical)
### Day 2: Freemium API 통합 (사용량 제한 적용)
### Day 3: Freemium 프론트엔드 UI (UsageIndicator, UpgradeBanner, Pricing)
### Day 4: AI Visibility + AIO 알고리즘 업데이트
### Day 5: Citation Sources Analysis 기본 구현
### Day 6: Citation Sources Analysis 고급 기능
### Day 7: 통합 테스트 및 배포

---

## 🔴 Frontend 체크리스트

### ✅ Day 1: 소셜 로그인 후 분석 프로세스 검증 (Critical)

#### 1.1 로그인 상태 확인 및 모달 표시 검증
- [ ] **Critical**: 비로그인 상태에서 '분석 시작' 버튼 클릭 시 모달 표시 확인
- [ ] **Critical**: 모달에서 입력한 URL이 표시되는지 확인
- [ ] **Critical**: 모달 닫기 기능 정상 동작 확인
- [ ] **Critical**: 모달에서 소셜 로그인 버튼 클릭 시 로그인 페이지로 이동 확인
- [ ] **Critical**: URL 파라미터(`intent=analyze&url=...`) 전달 확인

#### 1.2 로그인 완료 후 자동 복귀 및 분석 시작 검증
- [ ] **Critical**: 로그인 완료 후 원래 페이지로 복귀 확인
- [ ] **Critical**: URL 파라미터에서 `intent=analyze` 확인 시 자동 분석 시작
- [ ] **Critical**: 입력한 URL이 자동으로 복원되는지 확인
- [ ] **Critical**: localStorage에 저장된 URL이 정상적으로 복원되는지 확인
- [ ] **Critical**: URL 파라미터와 localStorage URL 우선순위 확인 (파라미터 > localStorage)
- [ ] **Critical**: 분석 시작 시 로딩 상태 및 진행률 표시 정상 동작 확인

#### 1.3 에러 처리 검증
- [ ] **Critical**: 로그인 실패 시 에러 메시지 표시
- [ ] **Critical**: 분석 시작 실패 시 재시도 옵션 제공
- [ ] **Critical**: 네트워크 오류 시 적절한 에러 메시지 표시
- [ ] **Critical**: 세션 만료 시 자동 로그인 페이지 리디렉션

### ✅ Day 3: Freemium 프론트엔드 UI 구현

#### 3.1 UsageIndicator 컴포넌트 생성
- [ ] **Critical**: `components/UsageIndicator.tsx` 생성
- [ ] **Critical**: 현재 사용량 표시 (분석, 챗봇)
- [ ] **Critical**: 진행 바 표시 (색상: 정상/경고/위험)
- [ ] **Critical**: 남은 사용량 표시
- [ ] **Critical**: 무제한 플랜의 경우 적절한 표시
- [ ] API 연동 (`/api/usage`)
- [ ] 다크 모드 지원
- [ ] 반응형 디자인

#### 3.2 UpgradeBanner 컴포넌트 생성
- [ ] **Critical**: `components/UpgradeBanner.tsx` 생성
- [ ] **Critical**: 사용량 80% 이상 시 경고 표시
- [ ] **Critical**: 사용량 100% 도달 시 강한 업그레이드 유도
- [ ] **Critical**: 업그레이드 버튼 제공 (`/pricing` 링크)
- [ ] 리소스 타입별 메시지 커스터마이징
- [ ] 애니메이션 효과

#### 3.3 Pricing 페이지 생성
- [ ] **Critical**: `app/pricing/page.tsx` 생성
- [ ] **Critical**: 플랜 비교 표 (Free, Pro, Business)
- [ ] **Critical**: 가격 정보 표시
- [ ] **Critical**: 기능 비교 리스트
- [ ] **Critical**: 구독 버튼 (결제 시스템 통합 전까지 비활성화 가능)
- [ ] 현재 플랜 하이라이트
- [ ] 반응형 디자인

#### 3.4 메인 페이지 통합
- [ ] **Critical**: `app/page.tsx`에 `UsageIndicator` 추가
- [ ] **Critical**: 에러 처리에 `UpgradeBanner` 통합
- [ ] **Critical**: 사용량 제한 에러 시 업그레이드 유도
- [ ] 사용량 실시간 업데이트
- [ ] 로딩 상태 처리

### ✅ Day 4: AI Visibility + AIO 인용 알고리즘 업데이트

#### 4.1 AIO 인용 점수 계산 개선
- [ ] **Critical**: 기존 분석 결과 데이터 기반으로 알고리즘 검증
- [ ] **Critical**: ChatGPT 인용 확률 계산 로직 검토 및 개선
- [ ] **Critical**: Perplexity 인용 확률 계산 로직 검토 및 개선
- [ ] **Critical**: Gemini 인용 확률 계산 로직 검토 및 개선
- [ ] **Critical**: Claude 인용 확률 계산 로직 검토 및 개선
- [ ] 가중치 조정 (AEO/GEO/SEO 기반 계산)
- [ ] 보너스 점수 계산 로직 최적화
- [ ] 점수 범위 검증 (0-100)

#### 4.2 AI Visibility 점수 추가
- [ ] **Critical**: AI Visibility 점수 계산 함수 구현
- [ ] **Critical**: AI Visibility 점수 DB 저장 필드 추가
- [ ] **Critical**: AI Visibility 점수 UI 표시 컴포넌트 추가
- [ ] AI Visibility 점수 계산 기준 정의
- [ ] AI Visibility 점수 시각화 (차트/카드)
- [ ] AI Visibility 개선 가이드 제공

#### 4.3 AIO 인용 분석 결과 표시 개선
- [ ] **Critical**: AIOCitationCards 컴포넌트 정상 동작 확인
- [ ] **Critical**: AI 모델별 점수 정확성 검증
- [ ] **Critical**: AI 모델별 추천사항 정확성 검증
- [ ] AIOModal 상세 정보 표시 개선
- [ ] AI 모델별 인용 확률 비교 차트 추가

### ✅ Day 5-6: Citation Sources Analysis 기본 구현

#### 5.1 인용 URL 추출 및 위치 추적
- [ ] **Critical**: `lib/citation-extractor.ts` 생성
- [ ] **Critical**: AI 응답에서 인용 URL 추출 로직 구현
- [ ] **Critical**: 인용 위치 계산 (1st, 2nd, 3rd 등)
- [ ] **Critical**: 인용 맥락(context) 추출
- [ ] 정규표현식 패턴 매칭
- [ ] 다양한 인용 형식 지원 (링크, 각주 등)

#### 5.2 도메인 분석 기본 기능
- [ ] **Critical**: `lib/domain-analyzer.ts` 생성
- [ ] **Critical**: 도메인별 인용 빈도 집계
- [ ] **Critical**: 타겟 URL 인용 여부 확인
- [ ] 도메인 추출 로직
- [ ] 도메인별 통계 계산

#### 5.3 데이터베이스 스키마 확장
- [ ] **Critical**: `citations` 테이블 생성
- [ ] **Critical**: `citation_position` 필드 추가
- [ ] **Critical**: `domain` 필드 추가
- [ ] **Critical**: `is_target_url` 필드 추가
- [ ] 인덱스 추가 (도메인, 위치 기반)

#### 5.4 Citation Sources Dashboard 기본 UI
- [ ] **Critical**: `components/CitationSourcesDashboard.tsx` 생성
- [ ] **Critical**: 인용 위치 시각화 (차트)
- [ ] **Critical**: 도메인 분석 테이블
- [ ] 타겟 URL 인용 여부 표시
- [ ] 기본 필터링 기능

### ✅ Day 6: Citation Sources Analysis 고급 기능

#### 6.1 도메인 권위성 평가
- [ ] **Critical**: 도메인 권위성 점수 계산 (0-100)
- [ ] **Critical**: 평균 인용 위치 계산
- [ ] **Critical**: 인용 트렌드 분석 (증가/감소/안정)
- [ ] 외부 API 통합 (선택적: Moz, Ahrefs 등)
- [ ] 내부 알고리즘 기반 권위성 평가

#### 6.2 품질 관리 (Quality Control)
- [ ] **Critical**: 오래된 소스 감지 (콘텐츠 업데이트 날짜 확인)
- [ ] **Critical**: 부정확한 소스 식별
- [ ] **Critical**: 부정적 소스 감지 (브랜드에 대한 부정적 언급)
- [ ] E-E-A-T 점수 계산 (Experience, Expertise, Authoritativeness, Trustworthiness)
- [ ] 품질 알림 시스템

#### 6.3 기회 발견 (Opportunity Discovery)
- [ ] **Critical**: 고권위 도메인 목록 생성
- [ ] **Critical**: 타겟이 인용되지 않은 고권위 도메인 식별
- [ ] **Critical**: 인용 획득 가능성 점수 계산
- [ ] PR 및 콘텐츠 전략 제안 생성
- [ ] 기회 도메인 우선순위 정렬

#### 6.4 경쟁사 비교 (Competitive Intelligence)
- [ ] **Critical**: 경쟁사 URL 등록 기능
- [ ] **Critical**: 경쟁사 인용 분석
- [ ] **Critical**: 경쟁사가 인용되지만 타겟은 아닌 고가치 도메인 식별
- [ ] **Critical**: 인용 빈도 차이(gap) 계산
- [ ] 경쟁사 비교 대시보드

---

## 🔵 Backend 체크리스트

### ✅ Day 1: 소셜 로그인 후 분석 프로세스 검증 (Critical)

#### 1.1 분석 API 검증
- [ ] **Critical**: `/api/analyze` 엔드포인트에서 세션 확인 로직 검증
- [ ] **Critical**: 로그인된 사용자만 분석 가능하도록 검증 강화
- [ ] **Critical**: Provider별 사용자 ID 처리 정확성 확인
- [ ] **Critical**: 분석 결과 저장 시 사용자 ID 정확성 확인
- [ ] 분석 요청 시 URL 파라미터 처리 검증
- [ ] 분석 결과 반환 시 캐시 처리 확인

#### 1.2 인증 및 세션 관리 검증
- [ ] **Critical**: NextAuth 세션 관리 정확성 확인
- [ ] **Critical**: Provider별 사용자 식별 정확성 확인
- [ ] **Critical**: 세션 만료 처리
- [ ] OAuth 콜백 처리 검증

### ✅ Day 2: Freemium API 통합

#### 2.1 Analyze API에 사용량 제한 적용
- [ ] **Critical**: `app/api/analyze/route.ts`에 사용량 제한 체크 추가
- [ ] **Critical**: 캐시된 결과는 사용량에 포함하지 않음
- [ ] **Critical**: 제한 초과 시 429 에러 반환
- [ ] **Critical**: 분석 성공 시 사용량 증가 (`incrementUsage`)
- [ ] 사용자 ID 정확성 확인 (Provider별)
- [ ] 에러 메시지 개선

#### 2.2 Chat API에 사용량 제한 적용
- [ ] **Critical**: `app/api/chat/route.ts`에 사용량 제한 체크 추가
- [ ] **Critical**: 로그인 필수 (이미 구현됨)
- [ ] **Critical**: 제한 초과 시 429 에러 반환
- [ ] **Critical**: 챗봇 응답 성공 시 사용량 증가
- [ ] 사용자 ID 정확성 확인
- [ ] 에러 메시지 개선

#### 2.3 사용량 조회 API 검증
- [ ] **Critical**: `GET /api/usage` 정상 동작 확인
- [ ] **Critical**: 사용량, 제한, 남은 사용량 정확성 확인
- [ ] 월간 기간 계산 정확성 확인
- [ ] 무제한 플랜 처리 확인

### ✅ Day 4: AI Visibility + AIO 인용 알고리즘 업데이트

#### 4.1 AIO 인용 점수 계산 API 개선
- [ ] **Critical**: `lib/ai-citation-analyzer.ts` 알고리즘 검증
- [ ] **Critical**: 기존 분석 결과 데이터 기반 알고리즘 검증
- [ ] **Critical**: AIO 점수 계산 정확성 검증
- [ ] ChatGPT 보너스 점수 계산 로직 개선
- [ ] Perplexity 보너스 점수 계산 로직 개선
- [ ] Gemini 보너스 점수 계산 로직 개선
- [ ] Claude 보너스 점수 계산 로직 개선
- [ ] 가중치 조정 및 최적화

#### 4.2 AI Visibility 점수 계산 구현
- [ ] **Critical**: AI Visibility 점수 계산 함수 구현
- [ ] **Critical**: AI Visibility 점수 계산 기준 정의
- [ ] AI Visibility 점수 계산 알고리즘 설계
- [ ] AI Visibility 점수 계산 API 엔드포인트 추가
- [ ] AI Visibility 점수 DB 저장 로직 추가

#### 4.3 분석 결과 저장 개선
- [ ] **Critical**: AIO 점수 저장 정확성 확인
- [ ] **Critical**: AI Visibility 점수 저장 필드 추가
- [ ] 분석 결과 저장 시 트랜잭션 처리
- [ ] 분석 결과 저장 시 데이터 검증 강화

### ✅ Day 5-6: Citation Sources Analysis 구현

#### 5.1 인용 추출 API 구현
- [ ] **Critical**: `app/api/citations/extract/route.ts` 생성
- [ ] **Critical**: AI 응답 텍스트에서 인용 URL 추출
- [ ] **Critical**: 인용 위치 계산 및 저장
- [ ] **Critical**: 인용 맥락 추출 및 저장
- [ ] 배치 처리 지원

#### 5.2 도메인 분석 API 구현
- [ ] **Critical**: `app/api/citations/domains/route.ts` 생성
- [ ] **Critical**: 도메인별 인용 빈도 집계
- [ ] **Critical**: 타겟 URL 인용 여부 확인
- [ ] 도메인 통계 계산
- [ ] 캐싱 전략 적용

#### 5.3 품질 관리 API 구현
- [ ] **Critical**: `app/api/citations/quality/route.ts` 생성
- [ ] **Critical**: 오래된 소스 감지 로직
- [ ] **Critical**: 부정확한 소스 식별 로직
- [ ] **Critical**: 부정적 소스 감지 로직
- [ ] E-E-A-T 점수 계산

#### 6.1 기회 발견 API 구현
- [ ] **Critical**: `app/api/citations/opportunities/route.ts` 생성
- [ ] **Critical**: 고권위 도메인 목록 생성
- [ ] **Critical**: 타겟 미인용 고권위 도메인 식별
- [ ] **Critical**: 인용 획득 가능성 점수 계산
- [ ] PR 및 콘텐츠 전략 제안 생성

#### 6.2 경쟁사 비교 API 구현
- [ ] **Critical**: `app/api/citations/competitors/route.ts` 생성
- [ ] **Critical**: 경쟁사 URL 등록 기능
- [ ] **Critical**: 경쟁사 인용 분석
- [ ] **Critical**: 인용 빈도 차이(gap) 계산
- [ ] 고가치 도메인 식별

---

## 🗄️ Database 체크리스트

### ✅ Day 1: 소셜 로그인 후 분석 프로세스 검증

#### 1.1 사용자 테이블 검증
- [ ] **Critical**: `users` 테이블 스키마 정확성 확인
- [ ] **Critical**: Provider별 사용자 식별 정확성 확인
- [ ] **Critical**: `idx_users_email_provider` 인덱스 정확성 확인
- [ ] 사용자 생성 시 데이터 무결성 확인

#### 1.2 분석 결과 테이블 검증
- [ ] **Critical**: `analyses` 테이블 스키마 정확성 확인
- [ ] **Critical**: `user_id` 외래 키 제약 조건 확인
- [ ] **Critical**: 분석 결과 저장 시 데이터 무결성 확인

### ✅ Day 2: Freemium 데이터베이스 검증

#### 2.1 구독 및 사용량 테이블 검증
- [ ] **Critical**: `subscriptions` 테이블 스키마 정확성 확인
- [ ] **Critical**: `usage_tracking` 테이블 스키마 정확성 확인
- [ ] **Critical**: 인덱스 정확성 확인
- [ ] 트랜잭션 처리 확인

### ✅ Day 4: AI Visibility + AIO 데이터베이스 업데이트

#### 4.1 AI Visibility 점수 필드 추가
- [ ] **Critical**: `analyses` 테이블에 `ai_visibility_score` 필드 추가
- [ ] **Critical**: 필드 타입 및 제약 조건 정의 (INTEGER, 0-100)
- [ ] **Critical**: 기존 분석 결과에 대한 마이그레이션 스크립트 작성
- [ ] AI Visibility 점수 인덱스 추가 (필요시)

#### 4.2 AIO 점수 필드 검증
- [ ] **Critical**: `chatgpt_score` 필드 정확성 확인
- [ ] **Critical**: `perplexity_score` 필드 정확성 확인
- [ ] **Critical**: `gemini_score` 필드 정확성 확인
- [ ] **Critical**: `claude_score` 필드 정확성 확인
- [ ] AIO 점수 범위 검증 (0-100)

### ✅ Day 5-6: Citation Sources Analysis 데이터베이스

#### 5.1 Citations 테이블 생성
- [ ] **Critical**: `citations` 테이블 생성
- [ ] **Critical**: `citation_position` 필드 (INTEGER, 1st, 2nd, 3rd 등)
- [ ] **Critical**: `domain` 필드 (TEXT)
- [ ] **Critical**: `is_target_url` 필드 (BOOLEAN)
- [ ] **Critical**: `is_competitor` 필드 (BOOLEAN)
- [ ] **Critical**: `citation_context` 필드 (TEXT)
- [ ] 외래 키 제약 조건 (execution_id)

#### 5.2 Domain Analysis 테이블 생성
- [ ] **Critical**: `domain_analysis` 테이블 생성
- [ ] **Critical**: `domain` 필드 (TEXT, UNIQUE)
- [ ] **Critical**: `total_citations` 필드 (INTEGER)
- [ ] **Critical**: `average_position` 필드 (REAL)
- [ ] **Critical**: `domain_authority` 필드 (INTEGER, 0-100)
- [ ] **Critical**: `is_opportunity` 필드 (BOOLEAN)
- [ ] 인덱스 추가

#### 6.1 Competitor Citations 테이블 생성
- [ ] **Critical**: `competitor_citations` 테이블 생성
- [ ] **Critical**: `target_url` 필드 (TEXT)
- [ ] **Critical**: `competitor_url` 필드 (TEXT)
- [ ] **Critical**: `citation_count` 필드 (INTEGER)
- [ ] **Critical**: `competitor_citation_count` 필드 (INTEGER)
- [ ] **Critical**: `gap` 필드 (INTEGER)
- [ ] 인덱스 추가

---

## 🧪 테스트 체크리스트

### ✅ Day 1: 소셜 로그인 후 분석 프로세스 테스트

#### 1.1 통합 테스트
- [ ] **Critical**: 비로그인 → 모달 표시 → 로그인 → 분석 시작 플로우 테스트
- [ ] **Critical**: 로그인 완료 후 자동 분석 시작 테스트
- [ ] **Critical**: URL 파라미터 전달 및 복원 테스트
- [ ] **Critical**: localStorage URL 복원 테스트
- [ ] 에러 케이스 테스트 (로그인 실패, 분석 실패 등)

### ✅ Day 2-3: Freemium 모델 테스트

#### 2.1 사용량 제한 테스트
- [ ] **Critical**: Free 플랜 사용자가 10회 분석 후 제한 확인
- [ ] **Critical**: Free 플랜 사용자가 20회 챗봇 질문 후 제한 확인
- [ ] **Critical**: Pro 플랜 사용자는 무제한 사용 가능 확인
- [ ] **Critical**: 캐시된 분석 결과는 사용량 증가하지 않음 확인
- [ ] **Critical**: 제한 초과 시 적절한 에러 메시지 반환 확인

#### 2.2 UI 테스트
- [ ] **Critical**: 로그인 시 사용량 표시 확인
- [ ] **Critical**: 사용량 80% 이상 시 경고 배너 표시
- [ ] **Critical**: 사용량 100% 도달 시 에러 및 업그레이드 배너 표시
- [ ] 가격 페이지 접근 확인
- [ ] 다크 모드에서 정상 작동 확인

### ✅ Day 4: AI Visibility + AIO 알고리즘 테스트

#### 4.1 알고리즘 검증 테스트
- [ ] **Critical**: 기존 분석 결과 데이터 기반 알고리즘 검증
- [ ] **Critical**: AIO 점수 정확성 검증
- [ ] **Critical**: AI Visibility 점수 정확성 검증
- [ ] 분석 결과 저장 및 조회 테스트

### ✅ Day 5-6: Citation Sources Analysis 테스트

#### 5.1 인용 추출 테스트
- [ ] **Critical**: AI 응답에서 인용 URL 추출 정확성
- [ ] **Critical**: 인용 위치 계산 정확성
- [ ] **Critical**: 인용 맥락 추출 정확성
- [ ] 다양한 인용 형식 지원 확인

#### 5.2 도메인 분석 테스트
- [ ] **Critical**: 도메인별 인용 빈도 집계 정확성
- [ ] **Critical**: 타겟 URL 인용 여부 확인 정확성
- [ ] 도메인 권위성 점수 계산 정확성

#### 6.1 고급 기능 테스트
- [ ] **Critical**: 기회 발견 알고리즘 정확성
- [ ] **Critical**: 경쟁사 비교 정확성
- [ ] 품질 관리 감지 정확성

### ✅ Day 7: 통합 테스트

#### 7.1 전체 시스템 테스트
- [ ] **Critical**: 전체 플로우 통합 테스트
- [ ] **Critical**: 에러 케이스 통합 테스트
- [ ] **Critical**: 성능 통합 테스트
- [ ] 사용자 수용 테스트

---

## 📊 검증 기준

### Critical 항목 검증 기준

#### 소셜 로그인 후 분석 프로세스
- ✅ 비로그인 상태에서 분석 시작 버튼 클릭 시 모달 표시
- ✅ 로그인 완료 후 자동으로 분석 시작
- ✅ 입력한 URL이 정상적으로 복원 및 분석 시작
- ✅ 에러 발생 시 적절한 에러 메시지 표시

#### Freemium 모델
- ✅ 사용량 제한 정확히 적용
- ✅ 사용량 표시 정확성
- ✅ 제한 초과 시 적절한 에러 메시지 및 업그레이드 유도
- ✅ 캐시된 결과는 사용량 증가하지 않음

#### AI Visibility + AIO 알고리즘
- ✅ AIO 점수 계산 정확성 (기존 데이터 기반 검증)
- ✅ AI Visibility 점수 계산 정확성
- ✅ 분석 결과 저장 및 조회 정상 동작
- ✅ UI에 점수 정상 표시

#### Citation Sources Analysis
- ✅ 인용 URL 추출 정확성
- ✅ 인용 위치 추적 정확성
- ✅ 도메인 분석 정확성
- ✅ 기회 발견 알고리즘 정확성

---

## 🚀 배포 체크리스트

### Day 7: 배포 준비

- [ ] 모든 Critical 항목 완료 확인
- [ ] 테스트 통과 확인
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트 완료
- [ ] 배포 전 백업 완료
- [ ] 배포 스크립트 검증
- [ ] 롤백 계획 수립

---

## 📝 진행 상황 추적

### Day 1 진행 상황
- [ ] Frontend: 소셜 로그인 후 분석 프로세스 검증
- [ ] Backend: 분석 API 검증
- [ ] Database: 사용자 및 분석 결과 테이블 검증

### Day 2 진행 상황
- [ ] Backend: Freemium API 통합 (Analyze, Chat)
- [ ] Database: 구독 및 사용량 테이블 검증

### Day 3 진행 상황
- [ ] Frontend: UsageIndicator 컴포넌트
- [ ] Frontend: UpgradeBanner 컴포넌트
- [ ] Frontend: Pricing 페이지
- [ ] Frontend: 메인 페이지 통합

### Day 4 진행 상황
- [ ] Frontend: AI Visibility + AIO UI 개선
- [ ] Backend: AI Visibility + AIO 알고리즘 업데이트
- [ ] Database: AI Visibility 점수 필드 추가

### Day 5 진행 상황
- [ ] Backend: 인용 추출 API
- [ ] Backend: 도메인 분석 API
- [ ] Frontend: Citation Sources Dashboard 기본 UI
- [ ] Database: Citations 테이블 생성

### Day 6 진행 상황
- [ ] Backend: 품질 관리 API
- [ ] Backend: 기회 발견 API
- [ ] Backend: 경쟁사 비교 API
- [ ] Frontend: 고급 기능 UI
- [ ] Database: Domain Analysis, Competitor Citations 테이블

### Day 7 진행 상황
- [x] 통합 테스트 (빌드 성공 확인)
- [x] 배포 준비 (Git 커밋 및 푸시 완료)
- [x] 배포 실행 (Git 푸시 완료, 자동 배포 대기 중)

---

## 🔗 관련 문서

- [로그인 전 분석 시작 UX 개선 명세서](../007-login-before-analysis/spec.md)
- [Freemium 모델 명세서](../003-freemium-model/spec.md)
- [Freemium 다음 단계](../../FREEMIUM_NEXT_STEPS.md)
- [LLM Pulse 분석](../../LLMPULSE_ANALYSIS.md)
- [AIO 기능 아이디어](../../AIO_FEATURE_IDEA.md)
- [데이터베이스 스키마](../../database/schema.sql)

---

## 📌 우선순위 요약

### 최우선 (Day 1)
1. 소셜 로그인 후 분석 프로세스 검증 (이미 구현됨)

### 높음 (Day 2-3)
2. Freemium 모델 API 통합 및 UI 구현

### 중간 (Day 4)
3. AI Visibility + AIO 알고리즘 업데이트

### 추가 기능 (Day 5-6)
4. Citation Sources Analysis 기본 및 고급 기능

---

**최종 업데이트**: 2025-12-15  
**상태**: 진행 중  
**담당자**: 개발팀
