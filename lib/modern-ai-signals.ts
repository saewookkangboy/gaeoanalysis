/**
 * 2026 AI 검색 신선 신호 (#11).
 *
 * 기존 SEO/AEO/GEO 점수가 다루지 않는 "AI 검색 시대 전용" 신호를 순수 함수로 검사합니다.
 * 네트워크 의존을 분리하기 위해 입력(로봇 규칙 텍스트, HTML)을 인자로 받습니다.
 *   - AI 크롤러 접근 허용 여부 (GPTBot / ClaudeBot / PerplexityBot / Google-Extended 등)
 *   - llms.txt 제공 여부
 *   - Speakable(음성) / 최신 스키마 신호
 */
import type { CheerioAPI } from 'cheerio';

/** 주요 AI 크롤러 User-Agent. */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
] as const;

export interface ModernAISignals {
  /** robots.txt에서 명시적으로 차단되지 않은 AI 크롤러 */
  allowedCrawlers: string[];
  /** robots.txt에서 Disallow로 차단된 AI 크롤러 */
  blockedCrawlers: string[];
  /** llms.txt 힌트 존재 여부 (링크/제공 여부) */
  hasLlmsTxtHint: boolean;
  /** Speakable 스키마 존재 (음성 검색 최적화) */
  hasSpeakable: boolean;
  /** 0~100 종합 신호 점수 */
  score: number;
}

/**
 * robots.txt에서 특정 봇이 루트 경로 기준으로 차단되는지 판별(간이 파서).
 * User-agent 블록의 `Disallow: /` 를 차단으로 간주합니다.
 */
export function isCrawlerBlocked(robotsTxt: string, userAgent: string): boolean {
  if (!robotsTxt) return false;
  const lines = robotsTxt.split(/\r?\n/).map((l) => l.trim());
  let inBlock = false;
  let applies = false;
  for (const line of lines) {
    if (/^user-agent:/i.test(line)) {
      const ua = line.split(':')[1]?.trim() ?? '';
      // 새 User-agent 그룹 시작
      if (!inBlock) applies = false;
      inBlock = true;
      if (ua === '*' || ua.toLowerCase() === userAgent.toLowerCase()) applies = true;
    } else if (/^(allow|disallow):/i.test(line)) {
      inBlock = false;
      if (applies && /^disallow:\s*\/\s*$/i.test(line)) return true;
    } else if (line === '') {
      inBlock = false;
      applies = false;
    }
  }
  return false;
}

export interface ModernSignalInput {
  robotsTxt?: string;
  /** llms.txt 본문(있으면) 또는 HEAD 링크 감지 결과 */
  llmsTxt?: string | null;
  $: CheerioAPI;
}

export function analyzeModernAISignals(input: ModernSignalInput): ModernAISignals {
  const robots = input.robotsTxt ?? '';
  const allowed: string[] = [];
  const blocked: string[] = [];
  for (const bot of AI_CRAWLERS) {
    if (isCrawlerBlocked(robots, bot)) blocked.push(bot);
    else allowed.push(bot);
  }

  const structuredData = input.$('script[type="application/ld+json"]').text();
  const hasSpeakable = /speakable/i.test(structuredData) || input.$('[class*="speakable"]').length > 0;

  const hasLlmsTxtHint =
    Boolean(input.llmsTxt && input.llmsTxt.trim().length > 0) ||
    input.$('link[href*="llms.txt"], a[href$="llms.txt"]').length > 0;

  // 점수: 크롤러 접근성(최대 70) + llms.txt(20) + speakable(10)
  const crawlerScore = Math.round((allowed.length / AI_CRAWLERS.length) * 70);
  const score = Math.min(
    100,
    crawlerScore + (hasLlmsTxtHint ? 20 : 0) + (hasSpeakable ? 10 : 0),
  );

  return { allowedCrawlers: allowed, blockedCrawlers: blocked, hasLlmsTxtHint, hasSpeakable, score };
}
