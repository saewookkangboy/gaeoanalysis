/**
 * LLM 모델 레지스트리 — 모델 ID 단일 소스.
 *
 * 이전에는 `gemini-2.5-flash` 문자열이 6개 파일에 하드코딩되어 있었습니다.
 * 이제 모든 호출부는 문자열 대신 "태스크"를 참조하고, 실제 모델 ID는 이 파일에서만
 * 관리합니다. 모델 세대가 바뀌면 여기 한 곳만 수정하면 됩니다.
 *
 * `*-latest` 별칭은 Google이 GA로 승격한 최신 모델을 자동 추적합니다.
 * (예: gemini-flash-latest → 2026-05 기준 Gemini 3.5 Flash)
 * 특정 버전으로 고정하려면 아래 환경 변수로 오버라이드하세요.
 */

export type LLMTask = 'chat' | 'suggestions' | 'revision' | 'report' | 'preview';

/** Gemini 모델 별칭 (2026-07 기준). */
export const GEMINI_MODELS = {
  /** 범용 고성능 Flash (챗봇/리포트) */
  flash: 'gemini-flash-latest',
  /** 저비용·저지연 Flash-Lite (추천 질문 등 경량 태스크) */
  flashLite: 'gemini-flash-lite-latest',
  /** 최고 품질 Pro (심층 생성이 필요할 때) */
  pro: 'gemini-pro-latest',
  /** 임베딩 (의미 기반 점수 계산) */
  embedding: 'gemini-embedding-001',
} as const;

function envModel(key: string, fallback: string): string {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : fallback;
}

/**
 * 태스크 → 모델 매핑. 각 항목은 환경 변수로 무중단 오버라이드 가능.
 * 기본값은 비용/지연/품질 균형을 고려해 선택했습니다.
 */
export const MODEL_FOR_TASK: Record<LLMTask, string> = {
  chat: envModel('GEMINI_MODEL_CHAT', GEMINI_MODELS.flash),
  suggestions: envModel('GEMINI_MODEL_SUGGESTIONS', GEMINI_MODELS.flashLite),
  revision: envModel('GEMINI_MODEL_REVISION', GEMINI_MODELS.flash),
  report: envModel('GEMINI_MODEL_REPORT', GEMINI_MODELS.flash),
  preview: envModel('GEMINI_MODEL_PREVIEW', GEMINI_MODELS.flashLite),
};

export function modelForTask(task: LLMTask): string {
  return MODEL_FOR_TASK[task];
}

export const EMBEDDING_MODEL = envModel('GEMINI_EMBEDDING_MODEL', GEMINI_MODELS.embedding);
