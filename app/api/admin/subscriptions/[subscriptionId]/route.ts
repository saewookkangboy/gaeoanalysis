import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateSubscription } from '@/lib/admin-helpers';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * PATCH /api/admin/subscriptions/[subscriptionId]
 * 구독 정보 변경 (관리자용)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    // 관리자 권한 확인
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    // TODO: 실제 관리자 권한 확인 로직 추가

    const params = await context.params;
    const subscriptionId = params.subscriptionId;
    const body = await request.json();
    const { planType, cancelAtPeriodEnd } = body;

    if (planType && !['free', 'pro', 'business'].includes(planType)) {
      return createErrorResponse('VALIDATION_ERROR', '유효하지 않은 플랜 타입입니다.', 400);
    }

    const updated = await updateSubscription(subscriptionId, {
      planType,
      cancelAtPeriodEnd,
    });

    if (!updated) {
      return createErrorResponse('NOT_FOUND', '구독을 찾을 수 없습니다.', 404);
    }

    return createSuccessResponse({
      subscriptionId: updated.id,
      message: '구독이 변경되었습니다.',
    });
  } catch (error: any) {
    console.error('구독 변경 오류:', error);
    return createErrorResponse('INTERNAL_ERROR', '구독을 변경할 수 없습니다.', 500);
  }
}

