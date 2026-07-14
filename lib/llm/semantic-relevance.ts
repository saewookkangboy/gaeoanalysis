/**
 * 임베딩 기반 의미 관련도/주제 일관성 점수 (#8).
 *
 * 기존 점수는 키워드/구조 카운팅만 사용합니다. 이 모듈은 최신 임베딩 모델로
 * 콘텐츠의 "주제 일관성(topical coherence)"과 "질의 관련도"를 의미 수준에서
 * 측정하여 GEO/AEO 점수를 보강하는 신호를 제공합니다.
 *
 * GEMINI_API_KEY가 없으면 null을 반환하므로 호출부에서 안전하게 폴백할 수 있습니다.
 */
import { embedTexts, isGeminiConfigured } from './gemini';
import { TTLCache, hashKey } from './cache';

const embedCache = new TTLCache<number[]>(6 * 60 * 60 * 1000, 1000);

function cosine(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

async function embedCached(texts: string[]): Promise<number[][]> {
  const missing: { index: number; text: string }[] = [];
  const result: number[][] = new Array(texts.length);

  texts.forEach((t, i) => {
    const key = hashKey(t);
    const cached = embedCache.get(key);
    if (cached) result[i] = cached;
    else missing.push({ index: i, text: t });
  });

  if (missing.length > 0) {
    const vectors = await embedTexts(missing.map((m) => m.text));
    missing.forEach((m, j) => {
      const vec = vectors[j] ?? [];
      embedCache.set(hashKey(m.text), vec);
      result[m.index] = vec;
    });
  }
  return result;
}

export interface SemanticRelevance {
  /** 섹션 간 주제 일관성 (0~100). 높을수록 하나의 주제로 잘 응집됨 */
  topicalCoherence: number;
  /** 대표 질의와 콘텐츠의 평균 의미 관련도 (0~100). 질의가 없으면 null */
  queryRelevance: number | null;
}

/**
 * 콘텐츠 섹션들과 (선택적) 대표 질의로 의미 점수를 계산합니다.
 * @param sections 제목/문단 등 콘텐츠 조각 (2개 이상 권장)
 * @param queries  이 콘텐츠가 답할 법한 대표 질의 (선택)
 */
export async function computeSemanticRelevance(
  sections: string[],
  queries: string[] = [],
): Promise<SemanticRelevance | null> {
  if (!isGeminiConfigured()) return null;

  const cleaned = sections.map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 20);
  if (cleaned.length < 2) {
    return { topicalCoherence: 0, queryRelevance: queries.length ? 0 : null };
  }

  try {
    const sectionVecs = await embedCached(cleaned);

    // 주제 일관성 = 문서 중심 벡터와 각 섹션의 평균 코사인 유사도
    const dim = sectionVecs[0]?.length ?? 0;
    const centroid = new Array(dim).fill(0);
    for (const v of sectionVecs) {
      for (let i = 0; i < dim; i++) centroid[i] += v[i] ?? 0;
    }
    for (let i = 0; i < dim; i++) centroid[i] /= sectionVecs.length;

    const coherence =
      sectionVecs.reduce((sum, v) => sum + cosine(v, centroid), 0) / sectionVecs.length;

    let queryRelevance: number | null = null;
    if (queries.length > 0) {
      const queryVecs = await embedCached(queries);
      const rel =
        queryVecs.reduce((sum, qv) => {
          const best = Math.max(...sectionVecs.map((sv) => cosine(qv, sv)));
          return sum + best;
        }, 0) / queryVecs.length;
      queryRelevance = Math.round(Math.max(0, Math.min(1, rel)) * 100);
    }

    return {
      topicalCoherence: Math.round(Math.max(0, Math.min(1, coherence)) * 100),
      queryRelevance,
    };
  } catch (e) {
    console.warn('의미 관련도 계산 실패 — 폴백(null):', (e as Error).message);
    return null;
  }
}
