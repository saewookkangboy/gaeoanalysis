import db from './db';
import { dbHelpers } from './db';
import { getUserPlanType, PLAN_LIMITS } from './subscription-helpers';

/**
 * 리소스 타입
 */
export type ResourceType = 'analysis' | 'chat' | 'export';

/**
 * 사용량 정보
 */
export interface UsageInfo {
  resourceType: ResourceType;
  used: number;
  limit: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * 현재 기간의 시작일과 종료일 계산 (월간)
 */
function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * 사용량 증가
 */
export function incrementUsage(
  userId: string,
  resourceType: ResourceType,
  count = 1
): void {
  dbHelpers.transaction(() => {
    const { start, end } = getCurrentPeriod();
    
    // 기존 사용량 확인
    const existingStmt = db.prepare(`
      SELECT id, count
      FROM usage_tracking
      WHERE user_id = ? 
        AND resource_type = ?
        AND period_start = ?
        AND period_end = ?
    `);

    const existing = existingStmt.get(
      userId,
      resourceType,
      start.toISOString(),
      end.toISOString()
    ) as { id: string; count: number } | undefined;

    if (existing) {
      // 업데이트
      const updateStmt = db.prepare(`
        UPDATE usage_tracking
        SET count = count + ?
        WHERE id = ?
      `);
      updateStmt.run(count, existing.id);
    } else {
      // 새로 생성
      const { v4: uuidv4 } = require('uuid');
      const insertStmt = db.prepare(`
        INSERT INTO usage_tracking (
          id, user_id, resource_type, count,
          period_start, period_end
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        uuidv4(),
        userId,
        resourceType,
        count,
        start.toISOString(),
        end.toISOString()
      );
    }
  });
}

/**
 * 사용량 조회
 */
export function getUsage(
  userId: string,
  resourceType: ResourceType
): UsageInfo {
  const { start, end } = getCurrentPeriod();
  const planType = getUserPlanType(userId);
  const limit = PLAN_LIMITS[planType][resourceType];

  const stmt = db.prepare(`
    SELECT COALESCE(SUM(count), 0) as total
    FROM usage_tracking
    WHERE user_id = ? 
      AND resource_type = ?
      AND period_start = ?
      AND period_end = ?
  `);

  const result = stmt.get(
    userId,
    resourceType,
    start.toISOString(),
    end.toISOString()
  ) as { total: number } | undefined;

  const used = result?.total || 0;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

  return {
    resourceType,
    used,
    limit,
    remaining,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

/**
 * 모든 리소스 사용량 조회
 */
export function getAllUsage(userId: string): {
  analysis: UsageInfo;
  chat: UsageInfo;
  export: UsageInfo;
} {
  return {
    analysis: getUsage(userId, 'analysis'),
    chat: getUsage(userId, 'chat'),
    export: getUsage(userId, 'export'),
  };
}

/**
 * 사용량 제한 확인
 */
export function checkUsageLimit(
  userId: string,
  resourceType: ResourceType
): { allowed: boolean; remaining: number; limit: number } {
  const usage = getUsage(userId, resourceType);
  
  // 무제한인 경우
  if (usage.limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
    };
  }

  // 제한 확인
  const allowed = usage.remaining > 0;
  
  return {
    allowed,
    remaining: usage.remaining,
    limit: usage.limit,
  };
}

/**
 * 사용량 초기화 (테스트용)
 */
export function resetUsage(userId: string, resourceType?: ResourceType): void {
  dbHelpers.transaction(() => {
    if (resourceType) {
      const { start, end } = getCurrentPeriod();
      const deleteStmt = db.prepare(`
        DELETE FROM usage_tracking
        WHERE user_id = ?
          AND resource_type = ?
          AND period_start = ?
          AND period_end = ?
      `);
      deleteStmt.run(userId, resourceType, start.toISOString(), end.toISOString());
    } else {
      const deleteStmt = db.prepare(`
        DELETE FROM usage_tracking
        WHERE user_id = ?
      `);
      deleteStmt.run(userId);
    }
  });
}

