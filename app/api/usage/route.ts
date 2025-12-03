import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllUsage, getUsage, checkUsageLimit } from '@/lib/usage-helpers';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * GET /api/usage
 * 현재 사용량 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('type') as 'analysis' | 'chat' | 'export' | null;

    if (resourceType) {
      const usage = getUsage(userId, resourceType);
      const limit = checkUsageLimit(userId, resourceType);
      
      return createSuccessResponse({
        usage,
        limit,
      });
    } else {
      const usage = getAllUsage(userId);
      
      return createSuccessResponse({
        usage,
      });
    }
  } catch (error: any) {
    console.error('사용량 조회 오류:', error);
    return createErrorResponse('INTERNAL_ERROR', '사용량을 조회할 수 없습니다.', 500);
  }
}

