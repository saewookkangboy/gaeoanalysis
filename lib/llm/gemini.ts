/**
 * Gemini 클라이언트 — 통합 GenAI SDK(`@google/genai`) 래퍼.
 *
 * 이전 `@google/generative-ai`(deprecated) SDK를 대체합니다. 모든 Gemini 호출은
 * 이 파일을 통해서만 이루어지며, 다음 최신 역량을 노출합니다:
 *   - 텍스트 생성 (실제 usageMetadata 토큰 수 반환)
 *   - 구조화 출력(JSON Schema 강제) — 파싱 실패/할루시네이션 제거
 *   - Thinking(추론) 예산 제어
 *   - Google Search 그라운딩 — 실제 인용/검색 근거 확보
 *   - 임베딩 — 의미 기반 점수 계산
 */
import { GoogleGenAI } from '@google/genai';
import type { GenerateContentConfig, Schema } from '@google/genai';
import { EMBEDDING_MODEL } from './models';

let client: GoogleGenAI | null = null;

/** GEMINI_API_KEY로 초기화된 싱글턴 클라이언트를 반환합니다. */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Gemini API 키 설정 여부(키를 노출하지 않고 확인용). */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface GenerateOptions {
  /** 모델 ID (lib/llm/models.ts의 modelForTask() 사용 권장) */
  model: string;
  /** 사용자/콘텐츠 프롬프트 */
  prompt: string;
  /** 시스템 지시(역할/규칙) — 프롬프트와 분리하면 캐싱·품질에 유리 */
  systemInstruction?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  /**
   * 추론(thinking) 예산(토큰). 0=비활성, -1=자동.
   * 경량 태스크는 0/저예산, 심층 리포트는 고예산으로.
   */
  thinkingBudget?: number;
  /** Google Search 그라운딩 활성화 → 실제 검색 근거/인용 URL 확보 */
  googleSearch?: boolean;
}

export interface GenerateResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** googleSearch=true일 때 모델이 실제로 참조한 출처 URL */
  groundingUrls: string[];
}

function buildConfig(opts: GenerateOptions): GenerateContentConfig {
  const config: GenerateContentConfig = {
    temperature: opts.temperature,
    topK: opts.topK,
    topP: opts.topP,
    maxOutputTokens: opts.maxOutputTokens,
  };
  if (opts.systemInstruction) {
    config.systemInstruction = opts.systemInstruction;
  }
  if (typeof opts.thinkingBudget === 'number') {
    config.thinkingConfig = { thinkingBudget: opts.thinkingBudget };
  }
  if (opts.googleSearch) {
    config.tools = [{ googleSearch: {} }];
  }
  return config;
}

function extractGroundingUrls(response: unknown): string[] {
  const urls: string[] = [];
  try {
    const candidates = (response as { candidates?: unknown[] })?.candidates ?? [];
    for (const c of candidates) {
      const chunks =
        (c as { groundingMetadata?: { groundingChunks?: unknown[] } })?.groundingMetadata
          ?.groundingChunks ?? [];
      for (const chunk of chunks) {
        const uri = (chunk as { web?: { uri?: string } })?.web?.uri;
        if (uri && !urls.includes(uri)) urls.push(uri);
      }
    }
  } catch {
    // 그라운딩 메타데이터는 선택적 — 없으면 조용히 무시
  }
  return urls;
}

/** 자유 텍스트 생성. 실제 토큰 사용량과 그라운딩 URL을 함께 반환합니다. */
export async function generateText(opts: GenerateOptions): Promise<GenerateResult> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: opts.model,
    contents: opts.prompt,
    config: buildConfig(opts),
  });

  const text = response.text ?? '';
  const usage = response.usageMetadata;
  return {
    text,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
    groundingUrls: extractGroundingUrls(response),
  };
}

export interface GenerateJSONOptions<T> extends Omit<GenerateOptions, 'googleSearch'> {
  /** 응답 JSON 스키마 (responseSchema로 모델에 강제) */
  schema: Schema;
  /** 파싱된 결과 검증/변환 (선택) */
  parse?: (value: unknown) => T;
}

export interface GenerateJSONResult<T> {
  data: T;
  raw: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * 구조화 출력. responseMimeType=application/json + responseSchema로
 * 모델이 유효한 JSON만 반환하도록 강제합니다. free-text 정규식 파싱을 대체.
 */
export async function generateJSON<T = unknown>(
  opts: GenerateJSONOptions<T>,
): Promise<GenerateJSONResult<T>> {
  const ai = getGeminiClient();
  const config = buildConfig(opts);
  config.responseMimeType = 'application/json';
  config.responseSchema = opts.schema;

  const response = await ai.models.generateContent({
    model: opts.model,
    contents: opts.prompt,
    config,
  });

  const raw = response.text ?? '';
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(raw);
  } catch (e) {
    throw new Error(`구조화 응답 JSON 파싱 실패: ${(e as Error).message}`);
  }
  const data = opts.parse ? opts.parse(parsedUnknown) : (parsedUnknown as T);
  const usage = response.usageMetadata;
  return {
    data,
    raw,
    inputTokens: usage?.promptTokenCount ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
  };
}

/** 텍스트 배열을 임베딩 벡터로 변환합니다. (의미 기반 점수 계산용) */
export async function embedTexts(
  texts: string[],
  model: string = EMBEDDING_MODEL,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getGeminiClient();
  const response = await ai.models.embedContent({ model, contents: texts });
  const embeddings = response.embeddings ?? [];
  return embeddings.map((e) => e.values ?? []);
}
