import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAnalyses, extractRequestInfo, logAdminAction } from '@/lib/admin-helpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * 분석 결과 조회 API
 * GET /api/admin/analyses
 * 
 * 쿼리 파라미터:
 * - userId?: string
 * - search?: string (URL 검색)
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 * - page?: number
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId, userEmail } = await requireAdmin(request);

    // 요청 정보 추출 (로그용)
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const userIdFilter = searchParams.get('userId') || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 분석 결과 조회
    const { analyses, pagination } = await getAnalyses({
      userId: userIdFilter,
      search,
      startDate,
      endDate,
      page,
      limit,
    });

    // 관리자 활동 로그 저장 (비동기)
    logAdminAction({
      id: uuidv4(),
      adminUserId: userId,
      action: 'analyses_view',
      targetType: 'analyses',
      details: {
        userId: userIdFilter,
        search,
        startDate,
        endDate,
        page,
        limit,
      },
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    }).catch(() => {
      // 로그 저장 실패는 조용히 무시
    });

    return NextResponse.json({
      analyses,
      pagination,
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    console.error('❌ [GET /api/admin/analyses] 오류:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '분석 결과를 조회할 수 없습니다.',
      },
      { status: 500 }
    );
  }
}

