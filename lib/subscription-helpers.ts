import db from './db';
import { dbHelpers } from './db';

/**
 * 구독 플랜 타입
 */
export type PlanType = 'free' | 'pro' | 'business';

/**
 * 구독 상태
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

/**
 * 구독 정보 인터페이스
 */
export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 플랜별 제한 설정
 */
export const PLAN_LIMITS: {
  [key in PlanType]: {
    analysis: number;
    chat: number;
    export: number;
    aiModels: number;
    historyLimit: number;
    apiAccess: boolean;
    webhook: boolean;
    teamMembers?: number;
  };
} = {
  free: {
    analysis: 10, // 월간 분석 횟수
    chat: 20, // 월간 챗봇 질문 횟수
    export: 0, // 월간 내보내기 횟수
    aiModels: 2, // 사용 가능한 AI 모델 수 (ChatGPT, Perplexity)
    historyLimit: 5, // 저장 가능한 분석 이력 수
    apiAccess: false,
    webhook: false,
  },
  pro: {
    analysis: -1, // 무제한
    chat: -1,
    export: 50,
    aiModels: 4, // 모든 모델
    historyLimit: -1, // 무제한
    apiAccess: true,
    webhook: true,
  },
  business: {
    analysis: -1,
    chat: -1,
    export: -1,
    aiModels: 4,
    historyLimit: -1,
    apiAccess: true,
    webhook: true,
    teamMembers: 10,
  },
};

/**
 * 사용자 구독 정보 조회
 */
export function getUserSubscription(userId: string): Subscription | null {
  const stmt = db.prepare(`
    SELECT 
      id, user_id, plan_type, status, 
      current_period_start, current_period_end, 
      cancel_at_period_end, created_at, updated_at
    FROM subscriptions
    WHERE user_id = ? AND status IN ('active', 'trial')
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const row = stmt.get(userId) as any;
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    planType: row.plan_type,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 구독 생성 또는 업데이트
 */
export function createOrUpdateSubscription(data: {
  userId: string;
  planType: PlanType;
  status?: SubscriptionStatus;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}): string {
  return dbHelpers.transaction(() => {
    // 기존 구독 확인
    const existing = getUserSubscription(data.userId);

    const now = new Date();
    const periodStart = data.periodStart || now;
    const periodEnd = data.periodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후

    if (existing) {
      // 기존 구독 업데이트
      const updateStmt = db.prepare(`
        UPDATE subscriptions
        SET 
          plan_type = ?,
          status = ?,
          current_period_start = ?,
          current_period_end = ?,
          cancel_at_period_end = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(
        data.planType,
        data.status || existing.status,
        periodStart.toISOString(),
        periodEnd.toISOString(),
        data.cancelAtPeriodEnd !== undefined ? (data.cancelAtPeriodEnd ? 1 : 0) : existing.cancelAtPeriodEnd ? 1 : 0,
        existing.id
      );

      return existing.id;
    } else {
      // 새 구독 생성
      const { v4: uuidv4 } = require('uuid');
      const subscriptionId = uuidv4();

      const insertStmt = db.prepare(`
        INSERT INTO subscriptions (
          id, user_id, plan_type, status,
          current_period_start, current_period_end, cancel_at_period_end
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        subscriptionId,
        data.userId,
        data.planType,
        data.status || 'active',
        periodStart.toISOString(),
        periodEnd.toISOString(),
        data.cancelAtPeriodEnd ? 1 : 0
      );

      return subscriptionId;
    }
  });
}

/**
 * 구독 취소 (기간 종료 시 취소)
 */
export function cancelSubscription(userId: string, cancelAtPeriodEnd = true): boolean {
  return dbHelpers.transaction(() => {
    const subscription = getUserSubscription(userId);
    if (!subscription) return false;

    const updateStmt = db.prepare(`
      UPDATE subscriptions
      SET 
        cancel_at_period_end = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(cancelAtPeriodEnd ? 1 : 0, subscription.id);
    return true;
  });
}

/**
 * 만료된 구독 처리 (Free 플랜으로 다운그레이드)
 */
export function expireSubscriptions(): number {
  return dbHelpers.transaction(() => {
    const now = new Date().toISOString();
    
    // 만료된 구독 찾기
    const expiredStmt = db.prepare(`
      SELECT id, user_id
      FROM subscriptions
      WHERE status = 'active' 
        AND current_period_end < ?
        AND cancel_at_period_end = 1
    `);

    const expired = expiredStmt.all(now) as Array<{ id: string; user_id: string }>;
    
    // 만료 처리
    const updateStmt = db.prepare(`
      UPDATE subscriptions
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    let count = 0;
    for (const sub of expired) {
      updateStmt.run(sub.id);
      
      // Free 플랜으로 새 구독 생성
      createOrUpdateSubscription({
        userId: sub.user_id,
        planType: 'free',
        status: 'active',
      });
      
      count++;
    }

    return count;
  });
}

/**
 * 사용자 플랜 타입 조회 (기본값: free)
 */
export function getUserPlanType(userId: string): PlanType {
  const subscription = getUserSubscription(userId);
  return subscription?.planType || 'free';
}

/**
 * 기능 사용 가능 여부 확인
 */
export function canUseFeature(
  userId: string,
  feature: 'unlimited_analysis' | 'all_ai_models' | 'export' | 'api' | 'webhook'
): boolean {
  const planType = getUserPlanType(userId);
  
  switch (feature) {
    case 'unlimited_analysis':
      return planType === 'pro' || planType === 'business';
    case 'all_ai_models':
      return planType === 'pro' || planType === 'business';
    case 'export':
      return planType === 'pro' || planType === 'business';
    case 'api':
      return planType === 'pro' || planType === 'business';
    case 'webhook':
      return planType === 'pro' || planType === 'business';
    default:
      return false;
  }
}

