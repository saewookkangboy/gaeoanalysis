import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getAnalysisItemStatistics,
  getUserActivityStatistics,
  getAnalysisDetailStatistics,
  aggregateDailyStatistics,
} from '@/lib/statistics-helpers';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * GET /api/statistics
 * 통계 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') as 'item' | 'user' | 'detail' | 'daily' | null;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const itemType = searchParams.get('itemType') as 'aeo' | 'geo' | 'seo' | 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | null;
    const userId = searchParams.get('userId') || undefined;
    const domain = searchParams.get('domain') || undefined;
    const aggregate = searchParams.get('aggregate') === 'true';

    // 일일 통계 집계 요청
    if (type === 'daily' && aggregate) {
      // 관리자 권한 확인 (간단한 체크)
      if (!session?.user?.id) {
        return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
      }
      
      aggregateDailyStatistics(startDate);
      return createSuccessResponse({ message: '일일 통계 집계가 완료되었습니다.' });
    }

    // 통계 조회
    let data: any = null;

    switch (type) {
      case 'item':
        if (!itemType) {
          return createErrorResponse('VALIDATION_ERROR', 'itemType 파라미터가 필요합니다.', 400);
        }
        data = getAnalysisItemStatistics(itemType, startDate, endDate);
        break;

      case 'user':
        if (!userId && !session?.user?.id) {
          return createErrorResponse('UNAUTHORIZED', '인증이 필요하거나 userId가 필요합니다.', 401);
        }
        const targetUserId = userId || session.user.id;
        data = getUserActivityStatistics(targetUserId, startDate, endDate);
        break;

      case 'detail':
        data = getAnalysisDetailStatistics(domain, startDate, endDate);
        break;

      default:
        return createErrorResponse('VALIDATION_ERROR', 'type 파라미터가 필요합니다. (item, user, detail, daily)', 400);
    }

    return createSuccessResponse({ data, type, filters: { startDate, endDate, itemType, userId, domain } });
  } catch (error: any) {
    console.error('통계 조회 오류:', error);
    return createErrorResponse('INTERNAL_ERROR', '통계를 조회할 수 없습니다.', 500);
  }
}

