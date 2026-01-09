import { getActiveAlgorithmVersion } from './algorithm-learning';
import { isPostgreSQL } from './db-adapter';

const WEIGHTS_CACHE_TTL_MS = 5 * 60 * 1000;

const weightsCache = new Map<
  string,
  {
    expiresAt: number;
    weights: Record<string, number>;
  }
>();

function mergeWeights<T extends Record<string, number>>(
  defaults: T,
  overrides?: Record<string, number> | null
): T {
  const merged: Record<string, number> = { ...defaults };
  if (!overrides) {
    return merged as T;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      merged[key] = value;
    }
  }

  return merged as T;
}

export function getResolvedAlgorithmWeights<T extends Record<string, number>>(
  algorithmType: 'aeo' | 'geo' | 'seo' | 'aio',
  defaults: T
): T {
  if (isPostgreSQL()) {
    return { ...defaults };
  }

  const now = Date.now();
  const cached = weightsCache.get(algorithmType);
  if (cached && cached.expiresAt > now) {
    return cached.weights as T;
  }

  let resolved = { ...defaults } as T;
  try {
    const version = getActiveAlgorithmVersion(algorithmType);
    if (version?.weights) {
      resolved = mergeWeights(defaults, version.weights);
    }
  } catch {
    // Fail-soft: fall back to defaults without noisy logging.
  }

  weightsCache.set(algorithmType, {
    expiresAt: now + WEIGHTS_CACHE_TTL_MS,
    weights: resolved,
  });

  return resolved;
}
