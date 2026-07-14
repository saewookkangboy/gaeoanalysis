/**
 * LLM/알고리즘 회귀 평가(evals) 스캐폴드 (#13).
 *
 * 목적: "그린 상태를 지키는" 최소 회귀 게이트. GEMINI_API_KEY 없이도 실행되는
 * 구조 검증(structural)과, 키가 있을 때만 실행되는 라이브 스모크로 구성됩니다.
 *
 * 실행:  npx tsx scripts/run-evals.ts
 * CI:    green-before-merge 게이트로 사용 권장.
 */
import * as cheerio from 'cheerio';
import { MODEL_FOR_TASK, EMBEDDING_MODEL } from '../lib/llm/models';
import { DEFAULT_AIO_WEIGHTS, ENHANCED_AIO_WEIGHTS } from '../lib/algorithm-defaults';
import { analyzeModernAISignals, isCrawlerBlocked } from '../lib/modern-ai-signals';
import { providerStatus } from '../lib/llm/provider';

type Case = { name: string; run: () => Promise<void> | void };

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const WEIGHT_GROUPS: Record<string, string[]> = {
  chatgpt: ['chatgpt_seo_weight', 'chatgpt_aeo_weight', 'chatgpt_geo_weight'],
  perplexity: ['perplexity_geo_weight', 'perplexity_seo_weight', 'perplexity_aeo_weight'],
  grok: ['grok_geo_weight', 'grok_seo_weight', 'grok_aeo_weight'],
  gemini: ['gemini_geo_weight', 'gemini_seo_weight', 'gemini_aeo_weight'],
  claude: ['claude_aeo_weight', 'claude_geo_weight', 'claude_seo_weight'],
};

const structuralCases: Case[] = [
  {
    name: '모델 레지스트리: 모든 태스크가 비어있지 않은 모델 ID로 해석됨',
    run: () => {
      for (const [task, model] of Object.entries(MODEL_FOR_TASK)) {
        assert(typeof model === 'string' && model.length > 0, `빈 모델 ID: ${task}`);
      }
      assert(EMBEDDING_MODEL.length > 0, '임베딩 모델 미설정');
    },
  },
  {
    name: 'AIO 가중치: 각 그룹 합 = 1.0 (DEFAULT/ENHANCED)',
    run: () => {
      for (const [label, W] of [['DEFAULT', DEFAULT_AIO_WEIGHTS], ['ENHANCED', ENHANCED_AIO_WEIGHTS]] as const) {
        for (const [g, keys] of Object.entries(WEIGHT_GROUPS)) {
          const sum = keys.reduce((a, k) => a + (W as Record<string, number>)[k], 0);
          assert(Math.abs(sum - 1) < 1e-9, `${label}.${g} 합=${sum}`);
        }
      }
    },
  },
  {
    name: 'AIO 가중치: ENHANCED ≥ DEFAULT (chatgpt_aeo, claude_aeo)',
    run: () => {
      assert(ENHANCED_AIO_WEIGHTS.chatgpt_aeo_weight >= DEFAULT_AIO_WEIGHTS.chatgpt_aeo_weight, 'chatgpt_aeo');
      assert(ENHANCED_AIO_WEIGHTS.claude_aeo_weight >= DEFAULT_AIO_WEIGHTS.claude_aeo_weight, 'claude_aeo');
    },
  },
  {
    name: 'robots.txt 파서: GPTBot 차단 감지',
    run: () => {
      const robots = 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /';
      assert(isCrawlerBlocked(robots, 'GPTBot'), 'GPTBot 차단 미감지');
      assert(!isCrawlerBlocked(robots, 'PerplexityBot'), 'PerplexityBot 오탐');
    },
  },
  {
    name: 'modern-ai-signals: 기본 신호 점수 계산',
    run: () => {
      const $ = cheerio.load('<html><head><link href="/llms.txt"></head><body><h1>x</h1></body></html>');
      const sig = analyzeModernAISignals({ $, robotsTxt: '', llmsTxt: null });
      assert(sig.hasLlmsTxtHint, 'llms.txt 링크 미감지');
      assert(sig.score >= 0 && sig.score <= 100, '점수 범위 오류');
    },
  },
  {
    name: '프로바이더 상태 스냅샷: 5개 프로바이더 키 존재',
    run: () => {
      const s = providerStatus();
      assert(['gemini', 'openai', 'anthropic', 'perplexity', 'xai'].every((k) => k in s), '프로바이더 누락');
    },
  },
];

async function liveCases(): Promise<Case[]> {
  if (!process.env.GEMINI_API_KEY) return [];
  const { generateJSON, Type } = await import('../lib/llm/gemini');
  return [
    {
      name: '[LIVE] 구조화 출력 스모크: {ok:boolean} 반환',
      run: async () => {
        const { data } = await generateJSON<{ ok: boolean }>({
          model: MODEL_FOR_TASK.suggestions,
          prompt: '반드시 {"ok": true} 만 JSON으로 반환하세요.',
          schema: { type: Type.OBJECT, properties: { ok: { type: Type.BOOLEAN } }, required: ['ok'] },
          maxOutputTokens: 32,
        });
        assert(typeof data.ok === 'boolean', 'ok 필드 아님');
      },
    },
  ];
}

async function main() {
  const cases = [...structuralCases, ...(await liveCases())];
  console.log(`\n▶ GAEO evals — ${cases.length}건 (LIVE ${process.env.GEMINI_API_KEY ? 'ON' : 'OFF'})\n`);
  for (const c of cases) {
    try {
      await c.run();
      passed++;
      console.log(`  ✅ ${c.name}`);
    } catch (e) {
      failed++;
      console.log(`  ❌ ${c.name}\n     → ${(e as Error).message}`);
    }
  }
  console.log(`\n결과: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
