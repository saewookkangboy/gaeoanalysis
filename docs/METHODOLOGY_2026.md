# GAEO 분석 방법론 — 2026 리프레시

이 문서는 최신 LLM/AI 검색 동작에 맞춘 분석 방법론 갱신 내용을 정리합니다.
(코드: `lib/llm/*`, `lib/modern-ai-signals.ts`, `lib/algorithm-defaults.ts`)

## 1. 모델·SDK 최신화
- `@google/generative-ai`(deprecated) → `@google/genai` 통합 SDK.
- 모델 ID는 `lib/llm/models.ts`에서 중앙 관리, 기본 `gemini-flash-latest` 별칭 사용.
- 실제 `usageMetadata` 토큰 수 기반 비용 산정.

## 2. 휴리스틱 → 하이브리드(그라운딩) 신호
- 기존 인용 확률은 Cheerio 휴리스틱 + 가중치(추정치).
- `lib/llm/citation-grounding.ts`가 Google Search 그라운딩으로 **실제** 대표 질의에서
  대상 도메인이 근거로 참조되는지 검증하는 보강 신호를 제공(옵트인).
- 로드맵: 그라운딩 결과를 누적해 `DEFAULT_AIO_WEIGHTS`를 데이터 기반으로 재보정.

## 3. 의미 기반 점수 (임베딩)
- `lib/llm/semantic-relevance.ts`: 임베딩 코사인으로 **주제 일관성**과 **질의 관련도**를
  측정 → 키워드/구조 카운팅만으로 놓치던 토픽 권위를 보강.

## 4. 2026 AI 검색 전용 신호 (`lib/modern-ai-signals.ts`)
- **AI 크롤러 접근성**: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
  Google-Extended, Applebot-Extended, CCBot 등이 robots.txt에서 차단되지 않는지 점검.
  (AI 검색 노출의 사실상 전제 조건)
- **llms.txt**: 제공/링크 여부.
- **Speakable 스키마**: 음성/어시스턴트 노출 최적화.

## 5. 가중치 재보정(2026)
- Gemini 그룹: AI Overviews의 직답 선호를 반영해 SEO 0.35→0.30, AEO 0.25→0.30
  (GEO 0.40 유지). 그룹 합 1.0 불변식 유지.
- 그 외 모델은 기존 프라이어 유지 — 라이브 데이터(2번) 확보 후 재보정 예정.

## 6. 프로바이더 확장(로드맵)
- `lib/llm/provider.ts` 공통 인터페이스. 현재 Gemini 실동작.
- OpenAI/Anthropic(Claude)/Perplexity/xAI는 키 감지 가능한 스캐폴드 →
  각 SDK 연동 + 유료 키 + 라이브 검증 후 활성화.

## 7. 회귀 게이트(evals)
- `npm run evals` — 키 없이도 구조 검증(모델 레지스트리/가중치 불변식/robots 파서/
  신호 점수/프로바이더 상태), 키가 있으면 라이브 구조화 출력 스모크까지.
- CI에서 green-before-merge 게이트로 사용 권장.
