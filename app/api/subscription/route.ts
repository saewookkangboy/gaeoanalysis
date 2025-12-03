import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserSubscription, createOrUpdateSubscription, cancelSubscription, getUserPlanType } from '@/lib/subscription-helpers';
import { getAllUsage } from '@/lib/usage-helpers';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * GET /api/subscription
 * 현재 구독 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('인증이 필요합니다.', 401);
    }

    const userId = session.user.id;
    const subscription = getUserSubscription(userId);
    const planType = getUserPlanType(userId);
    const usage = getAllUsage(userId);

    return createSuccessResponse({
      subscription: subscription || null,
      planType,
      usage,
    });
  } catch (error: any) {
    console.error('구독 정보 조회 오류:', error);
    return createErrorResponse('구독 정보를 조회할 수 없습니다.', 500);
  }
}

/**
 * POST /api/subscription
 * 구독 생성 또는 업그레이드
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('인증이 필요합니다.', 401);
    }

    const body = await request.json();
    const { planType, periodStart, periodEnd } = body;

    if (!planType || !['free', 'pro', 'business'].includes(planType)) {
      return createErrorResponse('유효하지 않은 플랜 타입입니다.', 400);
    }

    const userId = session.user.id;
    const subscriptionId = createOrUpdateSubscription({
      userId,
      planType,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
    });

    return createSuccessResponse({
      subscriptionId,
      message: '구독이 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('구독 생성 오류:', error);
    return createErrorResponse('구독을 생성할 수 없습니다.', 500);
  }
}

/**
 * PATCH /api/subscription
 * 구독 변경 (업그레이드/다운그레이드)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('인증이 필요합니다.', 401);
    }

    const body = await request.json();
    const { planType, cancelAtPeriodEnd } = body;

    if (!planType || !['free', 'pro', 'business'].includes(planType)) {
      return createErrorResponse('유효하지 않은 플랜 타입입니다.', 400);
    }

    const userId = session.user.id;
    const subscriptionId = createOrUpdateSubscription({
      userId,
      planType,
      cancelAtPeriodEnd,
    });

    return createSuccessResponse({
      subscriptionId,
      message: '구독이 변경되었습니다.',
    });
  } catch (error: any) {
    console.error('구독 변경 오류:', error);
    return createErrorResponse('구독을 변경할 수 없습니다.', 500);
  }
}

/**
 * DELETE /api/subscription
 * 구독 취소
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('인증이 필요합니다.', 401);
    }

    const userId = session.user.id;
    const cancelled = cancelSubscription(userId, true);

    if (!cancelled) {
      return createErrorResponse('구독을 찾을 수 없습니다.', 404);
    }

    return createSuccessResponse({
      message: '구독이 취소되었습니다. 기간 종료 시 자동으로 Free 플랜으로 전환됩니다.',
    });
  } catch (error: any) {
    console.error('구독 취소 오류:', error);
    return createErrorResponse('구독을 취소할 수 없습니다.', 500);
  }
}

