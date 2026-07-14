/**
 * 멀티 프로바이더 LLM 추상화 (#9).
 *
 * 제품은 ChatGPT/Perplexity/Grok/Claude 인용을 다루지만, 실제 생성은 지금까지
 * Gemini 단독이었습니다. 이 레이어는 프로바이더 교체/추가를 위한 공통 인터페이스를
 * 정의합니다.
 *
 * 현재 상태:
 *   - Gemini: 실동작(라이브).
 *   - OpenAI / Anthropic / Perplexity / xAI: 인터페이스에 맞춘 "스캐폴드"입니다.
 *     각 API 키가 설정되면 isConfigured()가 true가 되지만, generateText()는
 *     아직 실제 호출을 구현하지 않았으므로 명시적 에러를 던집니다.
 *     (실 연동은 각 SDK 추가 + 유료 키 + 라이브 검증이 필요하여 의도적으로 분리)
 */
import { generateText as geminiGenerateText } from './gemini';
import { modelForTask, type LLMTask } from './models';

export type ProviderName = 'gemini' | 'openai' | 'anthropic' | 'perplexity' | 'xai';

export interface LLMGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** 태스크(모델 매핑용). 기본 'chat' */
  task?: LLMTask;
  /** 그라운딩(지원 프로바이더만) */
  googleSearch?: boolean;
}

export interface LLMGenerateResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  provider: ProviderName;
  groundingUrls: string[];
}

export interface LLMProvider {
  readonly name: ProviderName;
  isConfigured(): boolean;
  generateText(opts: LLMGenerateOptions): Promise<LLMGenerateResult>;
}

/** 프로바이더 어댑터가 아직 구현되지 않았음을 알리는 에러. */
export class ProviderNotImplementedError extends Error {
  constructor(public provider: ProviderName) {
    super(
      `${provider} 프로바이더 어댑터는 아직 구현되지 않았습니다. ` +
        `SDK 연동 + API 키 + 라이브 검증이 필요합니다. (lib/llm/provider.ts 참고)`,
    );
    this.name = 'ProviderNotImplementedError';
  }
}

/** Gemini — 실동작 프로바이더. */
class GeminiProvider implements LLMProvider {
  readonly name = 'gemini' as const;
  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }
  async generateText(opts: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const r = await geminiGenerateText({
      model: modelForTask(opts.task ?? 'chat'),
      prompt: opts.prompt,
      systemInstruction: opts.systemInstruction,
      temperature: opts.temperature,
      maxOutputTokens: opts.maxOutputTokens,
      googleSearch: opts.googleSearch,
    });
    return { ...r, provider: this.name };
  }
}

/** 키 기반으로만 설정 여부를 판단하는 스캐폴드 프로바이더. */
class ScaffoldProvider implements LLMProvider {
  constructor(
    readonly name: ProviderName,
    private envKey: string,
  ) {}
  isConfigured(): boolean {
    return Boolean(process.env[this.envKey]);
  }
  async generateText(): Promise<LLMGenerateResult> {
    throw new ProviderNotImplementedError(this.name);
  }
}

const PROVIDERS: Record<ProviderName, LLMProvider> = {
  gemini: new GeminiProvider(),
  openai: new ScaffoldProvider('openai', 'OPENAI_API_KEY'),
  anthropic: new ScaffoldProvider('anthropic', 'ANTHROPIC_API_KEY'),
  perplexity: new ScaffoldProvider('perplexity', 'PERPLEXITY_API_KEY'),
  xai: new ScaffoldProvider('xai', 'XAI_API_KEY'),
};

/** 선호 순서 — 설정된 첫 프로바이더를 기본값으로 사용. */
const PREFERENCE: ProviderName[] = ['gemini', 'openai', 'anthropic', 'perplexity', 'xai'];

export function getProvider(name: ProviderName): LLMProvider {
  return PROVIDERS[name];
}

/** 설정된(키 존재) 프로바이더 중 선호 순서상 첫 번째. 없으면 Gemini. */
export function getDefaultProvider(): LLMProvider {
  const found = PREFERENCE.find((n) => PROVIDERS[n].isConfigured());
  return PROVIDERS[found ?? 'gemini'];
}

/** 각 프로바이더의 설정 상태 스냅샷 (관리자/헬스체크용). */
export function providerStatus(): Record<ProviderName, boolean> {
  return {
    gemini: PROVIDERS.gemini.isConfigured(),
    openai: PROVIDERS.openai.isConfigured(),
    anthropic: PROVIDERS.anthropic.isConfigured(),
    perplexity: PROVIDERS.perplexity.isConfigured(),
    xai: PROVIDERS.xai.isConfigured(),
  };
}
