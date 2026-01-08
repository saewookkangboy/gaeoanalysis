# AI 모델별 인용 확률 시뮬레이션 기능 아이디어

## 개요
ChatGPT, Perplexity, Gemini, Claude 각 AI 모델의 특성을 반영하여 콘텐츠가 각 모델에서 인용될 확률을 계산하고 시각화하는 기능입니다.

## 각 AI 모델의 특성 분석

### 1. ChatGPT (OpenAI)
**특징:**
- 구조화된 데이터와 명확한 답변 선호
- 신뢰할 수 있는 출처와 전문성 중시
- 논리적 구조와 단계별 설명 선호
- 최신 정보보다는 검증된 정보 선호

**인용 확률에 영향을 주는 요소:**
- 구조화된 데이터 (JSON-LD) 존재 여부
- 전문 용어와 정의의 명확성
- 단계별 가이드나 튜토리얼 형식
- 출처 명시 및 참고 자료
- 콘텐츠의 논리적 구조

### 2. Perplexity
**특징:**
- 실시간 정보와 최신 데이터 선호
- 인용 가능한 출처 강조
- 검색 결과 기반 답변 생성
- 날짜와 업데이트 정보 중요

**인용 확률에 영향을 주는 요소:**
- 콘텐츠 업데이트 날짜 표시
- 최신 정보 포함 여부 (2024-2025)
- 출처 링크와 참고 자료
- 검색 가능한 키워드 밀도
- 실시간 데이터 포함 여부

### 3. Gemini (Google)
**특징:**
- Google 검색 결과 기반
- 다양한 미디어 형식 선호 (이미지, 비디오)
- 구조화된 정보와 표/리스트 선호
- 다국어 콘텐츠 지원

**인용 확률에 영향을 주는 요소:**
- 이미지와 비디오 포함 여부
- 표(table)와 리스트 구조
- 구조화된 데이터 (Schema.org)
- 다국어 메타데이터
- Google 검색 최적화 요소

### 4. Claude (Anthropic)
**특징:**
- 상세하고 포괄적인 설명 선호
- 윤리적이고 정확한 정보 중시
- 긴 형식의 콘텐츠 선호
- 맥락과 배경 정보 중요

**인용 확률에 영향을 주는 요소:**
- 콘텐츠 길이 (2000+ 단어)
- 상세한 설명과 배경 정보
- 윤리적 고려사항 포함
- 포괄적인 주제 다루기
- 참고 자료와 인용 출처

## 구현 아이디어

### 아이디어 1: AI 모델별 점수 계산 함수
각 AI 모델의 특성을 반영한 별도의 점수 계산 함수를 만들어 인용 확률을 0-100점으로 표시합니다.

```typescript
interface AIOCitationScores {
  chatgpt: number;      // ChatGPT 인용 확률
  perplexity: number;   // Perplexity 인용 확률
  gemini: number;       // Gemini 인용 확률
  claude: number;       // Claude 인용 확률
}
```

### 아이디어 2: AI 모델별 가중치 기반 계산
기존 AEO/GEO/SEO 점수를 기반으로 각 AI 모델의 선호도를 가중치로 적용합니다.

**예시:**
- ChatGPT: SEO(40%) + AEO(35%) + GEO(25%)
- Perplexity: GEO(45%) + SEO(30%) + AEO(25%)
- Gemini: GEO(40%) + SEO(35%) + AEO(25%)
- Claude: AEO(40%) + GEO(35%) + SEO(25%)

### 아이디어 3: AI 모델별 특화 지표 추가
각 AI 모델이 선호하는 특정 요소를 추가로 분석합니다.

**ChatGPT 특화 지표:**
- 구조화된 데이터 존재 여부
- FAQ 섹션 품질
- 단계별 가이드 구조

**Perplexity 특화 지표:**
- 최신성 점수 (날짜 표시, 업데이트 빈도)
- 출처 링크 수
- 검색 키워드 최적화

**Gemini 특화 지표:**
- 미디어 콘텐츠 품질
- 표와 리스트 구조
- 다국어 지원

**Claude 특화 지표:**
- 콘텐츠 깊이 (단어 수, 섹션 수)
- 포괄성 점수
- 참고 자료 품질

### 아이디어 4: 시각화 컴포넌트
각 AI 모델별 인용 확률을 시각적으로 표시합니다.

**옵션 A: 막대 그래프**
```
ChatGPT    ████████████████░░░░  85%
Perplexity ██████████████░░░░░░  72%
Gemini     ████████████████████  92%
Claude     ███████████████░░░░░  78%
```

**옵션 B: 원형 차트 (도넛 차트)**
각 AI 모델별로 별도의 도넛 차트 표시

**옵션 C: 비교 카드**
4개의 카드를 나란히 배치하여 각 AI 모델의 점수와 등급 표시

### 아이디어 5: AI 모델별 최적화 가이드
각 AI 모델에서 인용 확률을 높이기 위한 맞춤형 가이드를 제공합니다.

**예시:**
- "ChatGPT 인용 확률을 높이려면: 구조화된 데이터를 추가하세요"
- "Perplexity 인용 확률을 높이려면: 콘텐츠 업데이트 날짜를 명시하세요"
- "Gemini 인용 확률을 높이려면: 이미지와 비디오를 추가하세요"
- "Claude 인용 확률을 높이려면: 더 상세한 설명을 추가하세요"

### 아이디어 6: AI 모델별 인용 확률 예측
기존 점수와 특화 지표를 결합하여 각 AI 모델의 인용 확률을 예측합니다.

**계산 공식 예시:**
```typescript
function calculateChatGPTCitation(seo: number, aeo: number, geo: number, structuredData: boolean): number {
  const baseScore = (seo * 0.4) + (aeo * 0.35) + (geo * 0.25);
  const bonus = structuredData ? 15 : 0;
  return Math.min(100, baseScore + bonus);
}
```

## UI/UX 제안

### 1. 메인 대시보드에 AI 인용 확률 섹션 추가
- 기존 AEO/GEO/SEO 점수 카드 아래에 배치
- 4개의 AI 모델 카드를 그리드로 표시
- 각 카드에 점수, 등급(High/Medium/Low), 아이콘 표시

### 2. 상세 분석 페이지
- 각 AI 모델별 상세 분석 결과
- 인용 확률에 영향을 주는 요소 목록
- 개선 가이드 제공

### 3. 비교 뷰
- 4개 AI 모델을 한눈에 비교할 수 있는 차트
- 어떤 모델에서 가장 잘 인용될지 시각화

## 데이터베이스 스키마 확장

```sql
ALTER TABLE analyses ADD COLUMN chatgpt_score INTEGER;
ALTER TABLE analyses ADD COLUMN perplexity_score INTEGER;
ALTER TABLE analyses ADD COLUMN gemini_score INTEGER;
ALTER TABLE analyses ADD COLUMN claude_score INTEGER;
```

## 구현 우선순위

1. **Phase 1**: 기본 점수 계산 함수 구현
2. **Phase 2**: UI 컴포넌트 추가 (카드 형태)
3. **Phase 3**: 시각화 (차트)
4. **Phase 4**: AI 모델별 최적화 가이드
5. **Phase 5**: 데이터베이스 저장 및 이력 조회

## 참고 자료

- 각 AI 모델의 공식 문서
- AI 검색 엔진 최적화 관련 연구
- 실제 AI 모델의 인용 패턴 분석

