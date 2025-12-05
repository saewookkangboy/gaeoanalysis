import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getStatistics } from '@/lib/admin-helpers';

/**
 * 통계 데이터 조회 API
 * GET /api/admin/statistics
 * 
 * 쿼리 파라미터:
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin(request);

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // 통계 데이터 조회
    const statistics = await getStatistics(startDate, endDate);

    return NextResponse.json(statistics);
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    console.error('❌ [GET /api/admin/statistics] 오류:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '통계 데이터를 조회할 수 없습니다.',
      },
      { status: 500 }
    );
  }
}

