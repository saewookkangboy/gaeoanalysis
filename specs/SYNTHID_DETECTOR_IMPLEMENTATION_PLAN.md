# Google SynthID Detector 기술 도입 계획서

## 📋 문서 개요

**작성일**: 2025년 1월  
**대상**: PM, 기술 개발 담당자  
**목적**: Google SynthID Detector 기술 도입을 위한 실현 가능한 접근 방법 제시

---

## 1. 현재 상황 분석

### 1.1 Google SynthID Detector 현황 (2025년 1월 기준)

#### ✅ 사용 가능한 것
- **SynthID Text 오픈소스**: Hugging Face, GitHub에서 제공
  - 워터마킹 및 탐지 기능 직접 구현 가능
  - Python 라이브러리 형태
  - `transformers` 라이브러리 통합

#### ❌ 사용 불가능한 것
- **공개 API**: Google이 제공하는 REST API 없음
- **웹 포털 API**: SynthID Detector 웹 포털은 초기 테스터에게만 제한적 제공
- **직접 접근**: Google Cloud API로는 아직 제공되지 않음

### 1.2 기술적 제약사항

| 항목 | 상태 | 비고 |
|------|------|------|
| 공개 API | ❌ 없음 | Google이 공개 API 제공 계획 없음 |
| 오픈소스 라이브러리 | ✅ 있음 | Hugging Face에서 제공 |
| 웹 포털 | ⚠️ 제한적 | 초기 테스터 대기자 명단 필요 |
| 직접 구현 | ✅ 가능 | 오픈소스 코드 기반 |

---

## 2. PM 관점: 비즈니스 전략

### 2.1 비즈니스 가치

#### 🎯 핵심 가치 제안
1. **차별화 포인트**: AI 투명성 측정 기능은 경쟁사 대비 강력한 차별화 요소
2. **법적 준수 지원**: EU AI Act, Colorado AI Act 등 글로벌 규정 준수 지원
3. **사용자 신뢰 강화**: AI 활용 고지 탐지로 콘텐츠 신뢰도 향상
4. **프리미엄 기능**: Pro/Business 플랜의 고급 기능으로 포지셔닝 가능

#### 📊 시장 기회
- **타겟 시장**: 블로그 콘텐츠 크리에이터, 마케팅 담당자, 콘텐츠 팀
- **시장 규모**: AI 생성 콘텐츠 시장 급성장 중
- **경쟁 우위**: AI 투명성 측정 기능을 제공하는 서비스는 거의 없음

### 2.2 리스크 분석

#### ⚠️ 주요 리스크

| 리스크 | 영향도 | 확률 | 대응 방안 |
|--------|--------|------|-----------|
| Google API 공개 지연 | 중 | 중 | 오픈소스 라이브러리로 대체 |
| 탐지 정확도 한계 | 중 | 중 | 명시적 고지 탐지에 집중 |
| 구현 복잡도 증가 | 낮음 | 낮음 | 단계적 구현으로 리스크 분산 |
| 사용자 기대치 관리 | 중 | 낮음 | 베타 기능으로 출시, 정확도 한계 명시 |

### 2.3 우선순위 결정

#### 🎯 MVP (Minimum Viable Product) 범위
1. **Phase 1 (필수)**: 명시적 AI 활용 고지 탐지
   - 비즈니스 가치: ⭐⭐⭐⭐⭐
   - 기술 난이도: ⭐⭐
   - 구현 시간: 1주

2. **Phase 2 (중요)**: AI 윤리 기준 평가
   - 비즈니스 가치: ⭐⭐⭐⭐
   - 기술 난이도: ⭐⭐
   - 구현 시간: 1주

3. **Phase 3 (선택)**: SynthID 워터마킹 탐지
   - 비즈니스 가치: ⭐⭐⭐
   - 기술 난이도: ⭐⭐⭐⭐
   - 구현 시간: 2-3주

### 2.4 출시 전략

#### 📅 단계별 출시 계획

**Week 1-2: MVP 출시**
- 명시적 고지 탐지 기능
- 기본 점수 계산
- 베타 기능으로 출시

**Week 3-4: 기능 확장**
- AI 윤리 기준 평가 추가
- 상세 분석 리포트 제공

**Week 5-8: 고급 기능**
- SynthID 워터마킹 탐지 (오픈소스 기반)
- 향후 Google API 통합 준비

---

## 3. 기술 개발 담당자 관점: 구현 전략

### 3.1 접근 방법 비교

#### 방법 1: Google 웹 포털 대기 (비추천)
```typescript
// ❌ 비현실적: API 없음, 대기자 명단만 존재
// 장점: 없음
// 단점:
// - 공개 일정 불명확
// - API 제공 보장 없음
// - 제한적 접근
```

#### 방법 2: 오픈소스 라이브러리 직접 통합 (추천 ⭐⭐⭐⭐⭐)
```typescript
// ✅ 실현 가능: SynthID Text 오픈소스 활용
// 장점:
// - 즉시 구현 가능
// - 완전한 제어권
// - 커스터마이징 가능
// 단점:
// - 서버 측 Python 환경 필요
// - 초기 구현 복잡도
```

#### 방법 3: 하이브리드 접근 (최종 추천 ⭐⭐⭐⭐⭐)
```typescript
// ✅ 단계적 접근: 명시적 고지 탐지 + 향후 SynthID 통합
// Phase 1: 명시적 고지 탐지 (즉시 구현)
// Phase 2: 오픈소스 SynthID 통합 (2-3주 후)
// Phase 3: Google API 통합 (API 공개 시)
```

### 3.2 기술 스택 및 아키텍처

#### 현재 스택
- **Backend**: Next.js (Node.js/TypeScript)
- **Database**: PostgreSQL/SQLite
- **HTML Parsing**: Cheerio

#### SynthID 통합을 위한 추가 스택
```typescript
// 옵션 1: Python 마이크로서비스 (추천)
// - Next.js API → Python FastAPI 서비스
// - SynthID Text 라이브러리 사용
// - 비동기 처리

// 옵션 2: Node.js 직접 통합 (제한적)
// - SynthID Text는 Python 기반
// - Pyodide 또는 WebAssembly 변환 필요
// - 성능 및 호환성 이슈 가능
```

### 3.3 구현 방안 상세

#### 방안 A: Python 마이크로서비스 (추천)

**아키텍처**:
```
┌─────────────┐
│  Next.js    │
│   API       │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│  Python     │
│  FastAPI    │
│  Service    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ SynthID     │
│ Text Lib    │
└─────────────┘
```

**구현 예시**:
```python
# synthid_service.py (Python FastAPI)
from fastapi import FastAPI
from transformers import AutoModelForCausalLM, AutoTokenizer
from synthid_text import SynthIDTextWatermarkingConfig, detect_watermark

app = FastAPI()

@app.post("/detect-watermark")
async def detect_watermark(text: str):
    """
    텍스트에서 SynthID 워터마크 탐지
    """
    try:
        # SynthID 탐지 로직
        result = detect_watermark(text)
        return {
            "has_watermark": result.has_watermark,
            "confidence": result.confidence,
            "detected_patterns": result.patterns
        }
    except Exception as e:
        return {"error": str(e)}
```

```typescript
// lib/synthid-detector.ts (TypeScript)
export async function detectSynthIDWatermark(text: string): Promise<SynthIDResult> {
  const response = await fetch('http://localhost:8000/detect-watermark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  
  const result = await response.json();
  return {
    hasWatermark: result.has_watermark,
    confidence: result.confidence,
    detectedPatterns: result.detected_patterns,
  };
}
```

**장점**:
- ✅ Python 라이브러리 직접 사용 가능
- ✅ 성능 최적화 가능
- ✅ 독립적 스케일링
- ✅ 에러 격리

**단점**:
- ⚠️ 추가 인프라 필요
- ⚠️ 서비스 간 통신 오버헤드
- ⚠️ 배포 복잡도 증가

#### 방안 B: 통계적 패턴 분석 (즉시 구현 가능)

**구현 예시**:
```typescript
// lib/synthid-detector.ts
export function detectSynthIDWatermark($: cheerio.CheerioAPI, html: string): SynthIDResult {
  const text = $('body').text();
  
  // SynthID는 통계적 패턴을 사용하므로 간접 탐지
  // 실제 워터마크 키가 없으면 완벽한 탐지는 불가능
  // 하지만 AI 생성 텍스트의 일반적인 패턴을 분석
  
  const indicators = {
    // 1. 문장 길이 일관성 (AI 생성 텍스트는 일정한 패턴)
    sentenceLengthVariance: calculateSentenceLengthVariance(text),
    
    // 2. 어휘 다양성 (AI는 제한된 어휘 사용)
    vocabularyDiversity: calculateVocabularyDiversity(text),
    
    // 3. 반복 패턴 (특정 구문 반복)
    repetitivePhrases: detectRepetitivePhrases(text),
    
    // 4. 메타데이터 확인
    hasSynthIDMeta: $('meta[name="synthid"]').length > 0,
  };
  
  // 신뢰도 계산 (낮은 신뢰도 - 참고용)
  const confidence = indicators.hasSynthIDMeta ? 60 : 
                     calculateIndicatorsScore(indicators) * 0.4; // 최대 40점
  
  return {
    hasWatermark: confidence > 30,
    confidence: Math.round(confidence),
    watermarkType: 'text',
    detectedPatterns: Object.entries(indicators)
      .filter(([_, v]) => v)
      .map(([k]) => k),
  };
}
```

**장점**:
- ✅ 즉시 구현 가능
- ✅ 추가 인프라 불필요
- ✅ 빠른 응답 시간

**단점**:
- ⚠️ 낮은 정확도 (30-40% 신뢰도)
- ⚠️ 오탐/미탐 가능성 높음
- ⚠️ 참고용으로만 사용 가능

### 3.4 최종 추천 방안: 하이브리드 접근

#### 🎯 단계별 구현 전략

**Phase 1: 즉시 구현 (Week 1-2)**
```typescript
// 1. 명시적 고지 탐지 (정확도 높음)
const explicitDisclosure = detectAIDisclosure($, html);

// 2. 통계적 패턴 분석 (참고용)
const synthidDetection = detectSynthIDWatermark($, html); // 낮은 신뢰도

// 3. 점수 계산 시 가중치 조정
const overallScore = 
  explicitDisclosure.score * 0.7 +  // 높은 가중치
  synthidDetection.score * 0.3;      // 낮은 가중치
```

**Phase 2: Python 서비스 통합 (Week 3-5)**
```typescript
// Python 마이크로서비스 구축
// - Docker 컨테이너로 배포
// - SynthID Text 라이브러리 통합
// - 비동기 처리로 성능 최적화
```

**Phase 3: Google API 대기 (향후)**
```typescript
// Google API 공개 시 즉시 통합
// - 기존 코드와 호환성 유지
// - 점진적 마이그레이션
```

---

## 4. 실현 가능한 구현 계획

### 4.1 즉시 구현 가능한 기능 (Week 1-2)

#### ✅ 명시적 AI 활용 고지 탐지
- **정확도**: 높음 (80-90%)
- **구현 난이도**: 낮음
- **비즈니스 가치**: 높음

```typescript
// 구현 예시
export function detectAIDisclosure($: cheerio.CheerioAPI): AIDisclosureResult {
  const patterns = [
    /AI\s*(?:로|에\s*의해|를\s*사용하여)\s*(?:작성|생성)/i,
    /(?:This|This content)\s+(?:was\s+)?(?:generated|created)\s+(?:by|using)\s+AI/i,
    /AI\s*(?:assisted|powered|generated)/i,
  ];
  
  const text = $('body').text();
  const hasDisclosure = patterns.some(p => p.test(text));
  const metaDisclosure = $('meta[name="ai-generated"]').attr('content') === 'true';
  
  return {
    hasExplicitDisclosure: hasDisclosure || metaDisclosure,
    confidence: hasDisclosure ? 90 : metaDisclosure ? 85 : 0,
  };
}
```

#### ✅ AI 윤리 기준 평가
- **정확도**: 중간 (60-70%)
- **구현 난이도**: 낮음
- **비즈니스 가치**: 높음

### 4.2 단기 구현 가능한 기능 (Week 3-5)

#### ⚠️ SynthID 통계적 패턴 분석
- **정확도**: 낮음 (30-40%)
- **구현 난이도**: 중간
- **비즈니스 가치**: 중간
- **주의사항**: "참고용"으로 명시 필요

### 4.3 중장기 구현 가능한 기능 (Week 6+)

#### 🔄 Python 마이크로서비스 통합
- **정확도**: 높음 (70-80%)
- **구현 난이도**: 높음
- **비즈니스 가치**: 높음
- **인프라 요구사항**: Python 서버, Docker

---

## 5. 기술적 의사결정 매트릭스

### 5.1 구현 방법 비교

| 방법 | 정확도 | 구현 시간 | 인프라 비용 | 유지보수 | 추천도 |
|------|--------|----------|-------------|----------|--------|
| 명시적 고지 탐지 | 80-90% | 1주 | 낮음 | 낮음 | ⭐⭐⭐⭐⭐ |
| 통계적 패턴 분석 | 30-40% | 2주 | 낮음 | 낮음 | ⭐⭐⭐ |
| Python 마이크로서비스 | 70-80% | 3-4주 | 중간 | 중간 | ⭐⭐⭐⭐ |
| Google API 대기 | 90%+ | 불명확 | 낮음 | 낮음 | ⭐ |

### 5.2 최종 추천: 단계적 접근

```
Week 1-2: 명시적 고지 탐지 + AI 윤리 평가
    ↓
Week 3-4: 통계적 패턴 분석 추가 (참고용)
    ↓
Week 5-8: Python 마이크로서비스 구축 (선택)
    ↓
향후: Google API 통합 (API 공개 시)
```

---

## 6. PM 체크리스트

### 6.1 출시 전 확인사항

- [ ] **기능 범위 결정**
  - [ ] MVP: 명시적 고지 탐지만 출시
  - [ ] 확장: AI 윤리 평가 포함
  - [ ] 고급: SynthID 탐지 포함

- [ ] **사용자 기대치 관리**
  - [ ] 베타 기능으로 출시
  - [ ] 정확도 한계 명시
  - [ ] "참고용" 안내 문구 추가

- [ ] **프리미엄 기능 포지셔닝**
  - [ ] Free 플랜: 기본 점수만
  - [ ] Pro 플랜: 상세 분석
  - [ ] Business 플랜: SynthID 탐지 포함

### 6.2 성공 지표 (KPI)

- **기능 사용률**: 전체 분석 중 AI 고지 탐지 사용 비율
- **사용자 만족도**: 기능 유용성 평가
- **정확도 피드백**: 사용자 리포트 기반 정확도 개선

---

## 7. 기술 개발 담당자 체크리스트

### 7.1 구현 전 준비사항

- [ ] **기술 스택 결정**
  - [ ] Python 마이크로서비스 필요 여부 결정
  - [ ] Docker 인프라 준비
  - [ ] API 통신 방식 결정 (REST/gRPC)

- [ ] **라이브러리 조사**
  - [ ] SynthID Text 오픈소스 코드 검토
  - [ ] Hugging Face 통합 방법 확인
  - [ ] 의존성 관리 계획

- [ ] **성능 고려사항**
  - [ ] 분석 시간 예상 (목표: <1초)
  - [ ] 캐싱 전략 수립
  - [ ] 비동기 처리 설계

### 7.2 구현 단계별 작업

#### Phase 1: 명시적 고지 탐지
- [ ] `ai-disclosure-detector.ts` 모듈 구현
- [ ] 정규식 패턴 정의 및 테스트
- [ ] 메타 태그 및 구조화된 데이터 탐지
- [ ] 단위 테스트 작성

#### Phase 2: AI 윤리 평가
- [ ] `ai-ethics-analyzer.ts` 모듈 구현
- [ ] 5가지 윤리 기준 평가 로직
- [ ] 가중치 기반 점수 계산
- [ ] 통합 테스트

#### Phase 3: SynthID 탐지 (선택)
- [ ] 통계적 패턴 분석 구현
- [ ] 또는 Python 마이크로서비스 구축
- [ ] API 통합 및 에러 핸들링
- [ ] 성능 테스트

### 7.3 기술 문서화

- [ ] API 문서 작성
- [ ] 아키텍처 다이어그램
- [ ] 에러 처리 가이드
- [ ] 성능 최적화 가이드

---

## 8. 리스크 관리 및 대응 방안

### 8.1 기술적 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|-----------|
| SynthID 탐지 정확도 낮음 | 높음 | 중 | 명시적 고지 탐지에 집중, SynthID는 보조 기능 |
| Python 서비스 통합 복잡도 | 중 | 중 | 단계적 구현, 충분한 테스트 기간 확보 |
| 성능 저하 | 낮음 | 중 | 캐싱, 비동기 처리, 성능 모니터링 |
| Google API 공개 지연 | 중 | 낮음 | 오픈소스 라이브러리로 대체 |

### 8.2 비즈니스 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|-----------|
| 사용자 기대치 과다 | 중 | 중 | 베타 기능, 정확도 한계 명시 |
| 경쟁사 선점 | 낮음 | 중 | 빠른 MVP 출시, 지속적 개선 |
| 법적 규정 변화 | 중 | 낮음 | 정기적 규정 모니터링, 유연한 아키텍처 |

---

## 9. 결론 및 권장사항

### 9.1 PM 관점 권장사항

1. **즉시 출시 가능한 MVP로 시작**
   - 명시적 고지 탐지 기능 (높은 정확도)
   - AI 윤리 기준 평가 (중간 정확도)
   - 베타 기능으로 출시, 사용자 피드백 수집

2. **단계적 기능 확장**
   - Week 1-2: MVP 출시
   - Week 3-4: 통계적 패턴 분석 추가
   - Week 5-8: Python 서비스 통합 (선택)

3. **프리미엄 기능으로 포지셔닝**
   - Free: 기본 점수
   - Pro: 상세 분석
   - Business: SynthID 탐지 포함

### 9.2 기술 개발 담당자 관점 권장사항

1. **하이브리드 접근 방식 채택**
   - Phase 1: 명시적 고지 탐지 (즉시 구현)
   - Phase 2: 통계적 패턴 분석 (참고용)
   - Phase 3: Python 마이크로서비스 (선택)

2. **기술 부채 최소화**
   - 모듈화된 구조로 확장성 확보
   - 향후 Google API 통합 시 호환성 유지
   - 명확한 인터페이스 정의

3. **성능 및 정확도 균형**
   - 명시적 고지 탐지에 높은 가중치
   - SynthID 탐지는 보조 기능으로 제공
   - 사용자에게 정확도 한계 명시

### 9.3 최종 결정

**✅ 추천 방안: 단계적 하이브리드 접근**

1. **즉시 구현** (Week 1-2)
   - 명시적 AI 활용 고지 탐지
   - AI 윤리 기준 평가
   - 베타 기능으로 출시

2. **단기 확장** (Week 3-4)
   - 통계적 패턴 분석 추가
   - "참고용" 명시

3. **중장기 고도화** (Week 5-8, 선택)
   - Python 마이크로서비스 구축
   - SynthID Text 라이브러리 통합

4. **향후 대비**
   - Google API 공개 시 즉시 통합 가능한 구조
   - 모니터링 및 대기자 명단 참여

---

## 10. 참고 자료

- [Google SynthID 공식 문서](https://deepmind.google/models/synthid/)
- [SynthID Text 오픈소스 (Hugging Face)](https://huggingface.co/docs/transformers/main/en/model_doc/synthid)
- [Google AI Responsible AI Toolkit](https://ai.google.dev/responsible/docs/safeguards/synthid)
- [SynthID Detector 웹 포털](https://blog.google/technology/ai/google-synthid-ai-content-detector/)

---

## 11. 디자이너 관점: UI/UX 설계

### 11.1 현재 분석 결과 페이지 구조 분석

#### 기존 레이아웃 구조
```
┌─────────────────────────────────────────┐
│  Hero Section (URL 입력)                  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  점수 카드 (3개)                          │
│  [AEO] [GEO] [SEO]                       │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  종합 점수 카드 (큰 카드)                 │
│  ⭐ 종합 점수: 85/100                    │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  AI 모델별 인용 확률                      │
│  [ChatGPT] [Perplexity] [Gemini] [Claude]│
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  개선 가이드 (InsightList)                │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  콘텐츠 작성 가이드라인                   │
└─────────────────────────────────────────┘
```

#### 기존 디자인 시스템
- **색상 팔레트**: Sky-500/600, Indigo-500/600 (그라데이션)
- **카드 스타일**: rounded-xl, border-2, shadow-lg, hover 효과
- **아이콘**: 이모지 기반 (🤖, 💡, ⭐ 등)
- **반응형**: 모바일 우선, sm/md/lg 브레이크포인트

### 11.2 AI 활용 고지 탐지 UI 통합 전략

#### 전략 1: 독립 섹션 추가 (추천 ⭐⭐⭐⭐⭐)

**위치**: AI 모델별 인용 확률 카드 다음, 개선 가이드 전

**레이아웃**:
```
┌─────────────────────────────────────────┐
│  AI 모델별 인용 확률                      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🛡️ AI 활용 고지 분석 (NEW)              │
│  ┌─────────┬─────────┬─────────┬──────┐ │
│  │ 고지점수 │ SynthID │ 윤리점수 │ 종합 │ │
│  │   85    │   60    │   75    │  73  │ │
│  └─────────┴─────────┴─────────┴──────┘ │
│  [상세 분석 보기]                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  개선 가이드                              │
└─────────────────────────────────────────┘
```

**디자인 원칙**:
1. **시각적 계층**: 기존 섹션과 동일한 스타일, "NEW" 배지로 신규 기능 강조
2. **정보 밀도**: 4개 점수를 한눈에 볼 수 있도록 컴팩트하게 배치
3. **확장성**: 클릭 시 상세 분석 모달/아코디언으로 확장
4. **접근성**: 색상 코딩 + 텍스트 라벨, 스크린 리더 지원

#### 전략 2: 점수 카드에 통합 (대안)

**위치**: 기존 AEO/GEO/SEO 점수 카드 옆에 4번째 카드 추가

**레이아웃**:
```
┌─────────────────────────────────────────┐
│  점수 카드 (4개)                          │
│  [AEO] [GEO] [SEO] [AI 고지]             │
└─────────────────────────────────────────┘
```

**장단점**:
- ✅ 기존 패턴과 일관성
- ❌ AI 고지가 단일 점수로 축약되어 정보 손실
- ❌ 상세 분석 접근 어려움

**결론**: 전략 1 (독립 섹션) 추천

### 11.3 컴포넌트 설계 상세

#### 11.3.1 AIDisclosureCard 컴포넌트

**기본 레이아웃**:
```tsx
<div className="rounded-xl border-2 border-gray-200 
                bg-gradient-to-br from-white to-purple-50/30 
                p-6 sm:p-8 shadow-lg transition-all 
                hover:shadow-xl animate-fade-in">
  {/* 헤더 */}
  <div className="mb-6 flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center 
                    rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 
                    text-2xl shadow-md">
      🛡️
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-900">
        AI 활용 고지 분석
        <span className="ml-2 inline-flex items-center rounded-full 
                        bg-purple-100 px-2 py-0.5 text-xs font-bold 
                        text-purple-800">
          NEW
        </span>
      </h3>
      <p className="text-sm text-gray-600">
        AI 활용 투명성 및 윤리 준수 평가
      </p>
    </div>
  </div>

  {/* 점수 그리드 */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    {/* 고지 점수 */}
    <ScoreMiniCard 
      label="고지 점수"
      score={disclosureScore}
      icon="📝"
      color="purple"
    />
    {/* SynthID 점수 */}
    <ScoreMiniCard 
      label="SynthID 탐지"
      score={synthidScore}
      icon="🔍"
      color="blue"
      badge="참고용"
    />
    {/* 윤리 점수 */}
    <ScoreMiniCard 
      label="윤리 점수"
      score={ethicsScore}
      icon="⚖️"
      color="green"
    />
    {/* 종합 점수 */}
    <ScoreMiniCard 
      label="AI 투명성 종합"
      score={overallScore}
      icon="⭐"
      color="amber"
      highlight
    />
  </div>

  {/* 상세 분석 버튼 */}
  <button 
    onClick={handleExpand}
    className="w-full rounded-lg border-2 border-purple-200 
               bg-gradient-to-r from-purple-50 to-indigo-50 
               px-4 py-3 text-sm font-semibold text-purple-700 
               hover:from-purple-100 hover:to-indigo-100 
               transition-all"
  >
    상세 분석 보기 →
  </button>
</div>
```

**ScoreMiniCard 서브 컴포넌트**:
```tsx
interface ScoreMiniCardProps {
  label: string;
  score: number;
  icon: string;
  color: 'purple' | 'blue' | 'green' | 'amber';
  badge?: string;
  highlight?: boolean;
}

function ScoreMiniCard({ label, score, icon, color, badge, highlight }: ScoreMiniCardProps) {
  const colorClasses = {
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`
      rounded-lg border-2 ${colors.border} ${colors.bg} 
      p-4 transition-all hover:scale-105
      ${highlight ? 'ring-2 ring-amber-300' : ''}
    `}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {badge && (
          <span className="rounded-full bg-white/80 px-2 py-0.5 
                          text-xs font-medium text-gray-600">
            {badge}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${colors.text}`}>
        {score}
      </div>
      <div className="mt-1 text-xs font-medium text-gray-600">
        {label}
      </div>
      {/* 진행 바 */}
      <div className="mt-3 h-2 w-full rounded-full bg-gray-200/50">
        <div 
          className={`h-full ${colors.bg} rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
```

#### 11.3.2 상세 분석 모달/아코디언

**옵션 A: 모달 방식 (추천)**
- 클릭 시 전체 화면 모달로 상세 정보 표시
- 장점: 충분한 공간, 집중도 높음
- 단점: 페이지 이동 느낌

**옵션 B: 아코디언 방식**
- 클릭 시 카드 내부 확장
- 장점: 빠른 접근, 컨텍스트 유지
- 단점: 공간 제약

**추천**: 옵션 A (모달) - 상세 정보가 많으므로

**모달 레이아웃**:
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="AI 활용 고지 상세 분석">
  {/* 탭 네비게이션 */}
  <Tabs>
    <Tab label="명시적 고지">
      <DisclosureDetails data={explicitDisclosure} />
    </Tab>
    <Tab label="SynthID 탐지">
      <SynthIDDetails data={synthidDetection} />
      <WarningBadge>
        ⚠️ 참고용: SynthID 탐지는 통계적 분석 기반으로 
        정확도가 제한적입니다.
      </WarningBadge>
    </Tab>
    <Tab label="AI 윤리 평가">
      <EthicsDetails data={ethicsCompliance} />
    </Tab>
    <Tab label="개선 권장사항">
      <RecommendationsList items={recommendations} />
    </Tab>
  </Tabs>
</Modal>
```

#### 11.3.3 명시적 고지 탐지 결과 표시

```tsx
function DisclosureDetails({ data }: { data: AIDisclosureResult }) {
  return (
    <div className="space-y-4">
      {/* 상태 표시 */}
      <div className={`
        rounded-lg border-2 p-4
        ${data.hasExplicitDisclosure 
          ? 'border-green-200 bg-green-50' 
          : 'border-red-200 bg-red-50'}
      `}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {data.hasExplicitDisclosure ? '✅' : '❌'}
          </span>
          <div>
            <div className="font-bold text-gray-900">
              {data.hasExplicitDisclosure 
                ? 'AI 활용 고지가 탐지되었습니다' 
                : 'AI 활용 고지가 탐지되지 않았습니다'}
            </div>
            <div className="text-sm text-gray-600">
              신뢰도: {data.confidence}%
            </div>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard 
          label="고지 유형"
          value={data.disclosureType}
          icon="📋"
        />
        <InfoCard 
          label="고지 위치"
          value={data.disclosureLocation}
          icon="📍"
        />
      </div>

      {/* 탐지된 텍스트 */}
      {data.disclosureText && (
        <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 text-sm font-semibold text-gray-700">
            탐지된 고지 텍스트:
          </div>
          <div className="text-sm text-gray-600 italic">
            "{data.disclosureText}"
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 11.3.4 AI 윤리 평가 결과 표시

```tsx
function EthicsDetails({ data }: { data: EthicsComplianceResult }) {
  const criteria = [
    { key: 'transparency', label: '투명성', icon: '🔍' },
    { key: 'accuracy', label: '정확성', icon: '✓' },
    { key: 'accountability', label: '책임성', icon: '👤' },
    { key: 'fairness', label: '공정성', icon: '⚖️' },
    { key: 'privacy', label: '프라이버시', icon: '🔒' },
  ];

  return (
    <div className="space-y-4">
      {/* 종합 점수 */}
      <div className="rounded-lg border-2 border-purple-200 
                      bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-purple-600">
            {data.overallScore}
          </div>
          <div className="mt-2 text-sm font-medium text-gray-600">
            AI 윤리 종합 점수 / 100
          </div>
        </div>
      </div>

      {/* 각 기준별 평가 */}
      <div className="space-y-3">
        {criteria.map(({ key, label, icon }) => {
          const criterion = data[key as keyof EthicsComplianceResult];
          return (
            <div 
              key={key}
              className="rounded-lg border-2 border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className="font-semibold text-gray-900">{label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-700">
                  {criterion.score}
                </div>
              </div>
              
              {/* 진행 바 */}
              <div className="mb-3 h-2 w-full rounded-full bg-gray-200">
                <div 
                  className="h-full rounded-full bg-gradient-to-r 
                            from-purple-400 to-indigo-400 transition-all"
                  style={{ width: `${criterion.score}%` }}
                />
              </div>

              {/* 이슈 목록 */}
              {criterion.issues.length > 0 && (
                <div className="mt-3 space-y-1">
                  {criterion.issues.map((issue, i) => (
                    <div 
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <span className="text-red-500">•</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 긍정적 피드백 */}
              {criterion.issues.length === 0 && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ {label} 기준을 잘 준수하고 있습니다.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### 11.3.5 SynthID 탐지 결과 표시 (참고용 강조)

```tsx
function SynthIDDetails({ data }: { data: SynthIDResult }) {
  return (
    <div className="space-y-4">
      {/* 경고 배지 */}
      <div className="rounded-lg border-2 border-yellow-200 
                      bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-yellow-800">
              참고용 정보
            </div>
            <div className="mt-1 text-sm text-yellow-700">
              SynthID 탐지는 통계적 패턴 분석 기반으로 정확도가 
              제한적입니다. Google SynthID Detector API가 공개되면 
              더 정확한 탐지가 가능합니다.
            </div>
          </div>
        </div>
      </div>

      {/* 탐지 결과 */}
      <div className={`
        rounded-lg border-2 p-4
        ${data.hasWatermark 
          ? 'border-blue-200 bg-blue-50' 
          : 'border-gray-200 bg-gray-50'}
      `}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">
              {data.hasWatermark 
                ? '워터마크 패턴이 탐지되었습니다' 
                : '워터마크 패턴이 탐지되지 않았습니다'}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              신뢰도: {data.confidence}%
            </div>
          </div>
          <span className="text-3xl">
            {data.hasWatermark ? '🔍' : '❓'}
          </span>
        </div>
      </div>

      {/* 탐지된 패턴 */}
      {data.detectedPatterns && data.detectedPatterns.length > 0 && (
        <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-gray-700">
            탐지된 패턴:
          </div>
          <div className="flex flex-wrap gap-2">
            {data.detectedPatterns.map((pattern, i) => (
              <span 
                key={i}
                className="rounded-full bg-blue-100 px-3 py-1 
                          text-xs font-medium text-blue-800"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 11.4 반응형 디자인 고려사항

#### 모바일 (< 640px)
- 점수 그리드: 2열 (고지/SynthID, 윤리/종합)
- 카드 패딩: p-4 (기존 p-6에서 축소)
- 텍스트 크기: text-sm (기존 text-base에서 축소)
- 모달: 전체 화면

#### 태블릿 (640px - 1024px)
- 점수 그리드: 2x2 또는 4열 (가로 스크롤)
- 카드 패딩: p-6
- 텍스트 크기: text-base

#### 데스크톱 (> 1024px)
- 점수 그리드: 4열
- 카드 패딩: p-8
- 텍스트 크기: text-base/lg
- 모달: 중앙 정렬, 최대 너비 800px

### 11.5 접근성 (A11y) 고려사항

1. **키보드 네비게이션**
   - 모든 인터랙티브 요소에 tabindex
   - Enter/Space로 모달 열기/닫기

2. **스크린 리더 지원**
   - ARIA 라벨: `aria-label="AI 활용 고지 분석"`
   - 상태 알림: `aria-live="polite"`로 점수 변경 알림
   - 역할 정의: `role="region"`, `role="dialog"`

3. **색상 대비**
   - WCAG AA 기준 준수 (4.5:1)
   - 색상만으로 정보 전달하지 않음 (텍스트 라벨 병행)

4. **포커스 관리**
   - 모달 열릴 때 첫 번째 포커스 가능 요소로 이동
   - 모달 닫힐 때 트리거 버튼으로 포커스 복귀

### 11.6 다크 모드 지원

기존 다크 모드 스타일과 일관성 유지:
```tsx
className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
  bg-gradient-to-br from-white to-purple-50/30 
  dark:from-gray-800 dark:to-purple-900/20
"
```

### 11.7 애니메이션 및 인터랙션

1. **카드 등장**: `animate-fade-in` (기존과 동일)
2. **호버 효과**: `hover:scale-105`, `hover:shadow-xl`
3. **모달 전환**: Fade in/out (300ms)
4. **점수 애니메이션**: 숫자 카운트업 (0 → 목표 점수)

### 11.8 플랜별 UI 차별화

#### Free 플랜
- 기본 점수만 표시 (4개 점수)
- "상세 분석 보기" 버튼 비활성화
- 업그레이드 CTA 표시

#### Pro 플랜
- 전체 기능 사용 가능
- 상세 분석 모달 접근 가능

#### Business 플랜
- SynthID 탐지 강조 (Python 서비스 연동 시)
- 고급 분석 리포트 다운로드

### 11.9 디자인 시스템 통합 체크리스트

- [ ] **색상 팔레트**: Purple/Indigo 계열 추가 (기존 Sky/Indigo와 조화)
- [ ] **타이포그래피**: 기존 폰트 크기/두께 규칙 준수
- [ ] **간격 시스템**: Tailwind spacing scale 준수 (4px 단위)
- [ ] **그림자**: 기존 shadow-lg, shadow-xl 사용
- [ ] **보더**: border-2, rounded-xl 일관성 유지
- [ ] **아이콘**: 이모지 + 필요시 Heroicons 추가
- [ ] **애니메이션**: 기존 transition-all, duration-300 유지

### 11.10 사용자 플로우

```
1. 분석 완료
   ↓
2. AI 활용 고지 분석 카드 표시 (자동 스크롤)
   ↓
3. 사용자가 점수 확인
   ↓
4. "상세 분석 보기" 클릭 (선택)
   ↓
5. 모달 열림 (탭 네비게이션)
   ↓
6. 각 탭에서 상세 정보 확인
   ↓
7. "개선 권장사항" 탭에서 액션 아이템 확인
   ↓
8. 모달 닫기 → 메인 페이지로 복귀
```

### 11.11 디자이너 체크리스트

#### 디자인 단계
- [ ] **컴포넌트 디자인**: Figma/Sketch로 컴포넌트 설계
- [ ] **상태 디자인**: 로딩, 에러, 빈 상태 포함
- [ ] **반응형 디자인**: 모바일/태블릿/데스크톱 3가지 뷰포트
- [ ] **다크 모드**: 다크 모드 스타일 정의
- [ ] **접근성 검토**: 색상 대비, 키보드 네비게이션 확인

#### 개발 협업
- [ ] **디자인 시스템 문서화**: 컴포넌트 스펙 문서 작성
- [ ] **개발자 리뷰**: 구현 전 개발자와 디자인 리뷰
- [ ] **프로토타입**: 인터랙티브 프로토타입 제공 (선택)

#### QA 단계
- [ ] **시각적 QA**: 실제 구현물과 디자인 비교
- [ ] **반응형 테스트**: 다양한 디바이스에서 테스트
- [ ] **접근성 테스트**: 스크린 리더, 키보드 네비게이션 테스트

---

**문서 버전**: 2.0  
**최종 업데이트**: 2025년 1월  
**검토자**: PM, 기술 개발 담당자, 디자이너
