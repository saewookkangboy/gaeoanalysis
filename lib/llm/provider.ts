/**
 * 멀티 프로바이더 LLM 추상화 (#9).
 *
 * 공통 인터페이스로 프로바이더를 교체/추가합니다. 기본 경로는 Gemini이며,
 * 다른 프로바이더는 각 API 키(+모델 env)가 있을 때만 활성화됩니다.
 *
 * 어댑터 구현 방식: 외부 SDK 의존 없이 REST(fetch)로 호출합니다.
 *   - OpenAI / xAI(Grok) / Perplexity: OpenAI 호환 `/chat/completions`
 *   - Anthropic(Claude): `/v1/messages`
 *
 * ⚠️ 라이브 미검증: 이 환경에는 각 프로바이더 API 키가 없어 컴파일/구조만 검증했습니다.
 *    실제 사용 전 각 `*_API_KEY`와 `*_MODEL`을 설정하고 스모크 테스트를 수행하세요.
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

export class ProviderConfigError extends Error {
  constructor(public provider: ProviderName, detail: string) {
    super(`${provider} 프로바이더 설정 오류: ${detail}`);
    this.name = 'ProviderConfigError';
  }
}

/** Gemini — 기본/실동작 프로바이더. */
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

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/** OpenAI 호환 `/chat/completions` 어댑터 (OpenAI · xAI · Perplexity). */
class OpenAICompatibleProvider implements LLMProvider {
  constructor(
    readonly name: ProviderName,
    private baseUrl: string,
    private keyEnv: string,
    private modelEnv: string,
  ) {}

  isConfigured(): boolean {
    return Boolean(process.env[this.keyEnv]);
  }

  async generateText(opts: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const apiKey = process.env[this.keyEnv];
    const model = process.env[this.modelEnv];
    if (!apiKey) throw new ProviderConfigError(this.name, `${this.keyEnv} 미설정`);
    if (!model) throw new ProviderConfigError(this.name, `${this.modelEnv} 미설정(모델 ID 필요)`);

    const messages: Array<{ role: string; content: string }> = [];
    if (opts.systemInstruction) messages.push({ role: 'system', content: opts.systemInstruction });
    messages.push({ role: 'user', content: opts.prompt });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxOutputTokens,
      }),
    });
    if (!res.ok) {
      throw new ProviderConfigError(this.name, `HTTP ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as OpenAIChatResponse;
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      provider: this.name,
      groundingUrls: [],
    };
  }
}

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

/** Anthropic(Claude) `/v1/messages` 어댑터. */
class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const;

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async generateText(opts: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL;
    if (!apiKey) throw new ProviderConfigError(this.name, 'ANTHROPIC_API_KEY 미설정');
    if (!model) throw new ProviderConfigError(this.name, 'ANTHROPIC_MODEL 미설정(모델 ID 필요)');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxOutputTokens ?? 4096,
        temperature: opts.temperature,
        system: opts.systemInstruction,
        messages: [{ role: 'user', content: opts.prompt }],
      }),
    });
    if (!res.ok) {
      throw new ProviderConfigError(this.name, `HTTP ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as AnthropicResponse;
    const text = (data.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('');
    return {
      text,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      provider: this.name,
      groundingUrls: [],
    };
  }
}

const PROVIDERS: Record<ProviderName, LLMProvider> = {
  gemini: new GeminiProvider(),
  openai: new OpenAICompatibleProvider('openai', 'https://api.openai.com/v1', 'OPENAI_API_KEY', 'OPENAI_MODEL'),
  anthropic: new AnthropicProvider(),
  perplexity: new OpenAICompatibleProvider('perplexity', 'https://api.perplexity.ai', 'PERPLEXITY_API_KEY', 'PERPLEXITY_MODEL'),
  xai: new OpenAICompatibleProvider('xai', 'https://api.x.ai/v1', 'XAI_API_KEY', 'XAI_MODEL'),
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
