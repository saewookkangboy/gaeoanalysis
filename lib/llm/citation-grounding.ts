/**
 * 실제 검색 그라운딩 기반 인용 검증 (#7).
 *
 * 기존 인용 확률은 순수 휴리스틱(Cheerio + 가중치)입니다. 이 모듈은 Gemini의
 * Google Search 그라운딩을 사용해 "해당 주제 질의에서 이 페이지가 실제로 근거로
 * 참조되는가"를 검증하는 하이브리드 신호를 제공합니다.
 *
 * 비용이 발생하므로 기본 비활성이며, ENABLE_CITATION_GROUNDING=true 일 때만 동작합니다.
 */
import { generateText, isGeminiConfigured } from './gemini';
import { modelForTask } from './models';
import { TTLCache, hashKey } from './cache';

export interface GroundingInput {
  /** 검증 대상 페이지 URL */
  url: string;
  /** 페이지 제목/주제 */
  title: string;
  /** 이 페이지가 답을 제공할 법한 대표 질문들 (2~4개 권장) */
  questions: string[];
}

export interface GroundingResult {
  enabled: boolean;
  /** 대표 질의에서 실제로 참조된 출처 URL */
  citedSources: string[];
  /** 참조 출처 중 대상 도메인이 포함되었는지 */
  targetDomainCited: boolean;
  /** 모델의 인용 가능성 평가 요약 */
  assessment: string;
}

const groundingCache = new TTLCache<GroundingResult>(6 * 60 * 60 * 1000, 200);

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isGroundingEnabled(): boolean {
  return process.env.ENABLE_CITATION_GROUNDING === 'true' && isGeminiConfigured();
}

/**
 * 대표 질의를 실제 검색 그라운딩으로 실행하여, 대상 페이지가 근거로 참조되는지
 * 확인합니다. 비활성 시 enabled=false 결과를 즉시 반환합니다.
 */
export async function verifyCitationGrounding(
  input: GroundingInput,
): Promise<GroundingResult> {
  if (!isGroundingEnabled()) {
    return {
      enabled: false,
      citedSources: [],
      targetDomainCited: false,
      assessment: '그라운딩 검증 비활성 (ENABLE_CITATION_GROUNDING).',
    };
  }

  const targetDomain = domainOf(input.url);
  const cacheKey = hashKey(`${input.url}|${input.questions.join('|')}`);

  return groundingCache.wrap(cacheKey, async () => {
    const prompt = `아래 질문들에 대해 웹 검색 근거를 바탕으로 간결히 답하고,
"${targetDomain}" 도메인(${input.title})의 콘텐츠가 이런 질의에서 인용될 만한지 평가하세요.

질문:
${input.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

마지막 줄에 "평가:"로 시작하는 한 문장 요약을 포함하세요.`;

    const { text, groundingUrls } = await generateText({
      model: modelForTask('report'),
      prompt,
      temperature: 0.3,
      googleSearch: true,
    });

    const assessmentMatch = text.match(/평가:\s*(.+)$/m);
    const assessment = assessmentMatch?.[1]?.trim() || text.slice(-300).trim();
    const targetDomainCited = groundingUrls.some((u) => domainOf(u) === targetDomain);

    return {
      enabled: true,
      citedSources: groundingUrls,
      targetDomainCited,
      assessment,
    };
  });
}
