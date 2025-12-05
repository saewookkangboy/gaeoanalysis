import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getReport, extractRequestInfo, logAdminAction } from '@/lib/admin-helpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * 리포트 조회 API
 * GET /api/admin/ai-report/[reportId]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<any> }
) {
  try {
    // 관리자 권한 확인
    const { userId: adminUserId } = await requireAdmin(request);

    // 요청 정보 추출 (로그용)
    const { ipAddress, userAgent } = extractRequestInfo(request);

    const params = await context.params;
    const { reportId } = params as { reportId: string };

    // 리포트 조회
    const report = await getReport(reportId);

    if (!report) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: '리포트를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 관리자 활동 로그 저장 (비동기)
    logAdminAction({
      id: uuidv4(),
      adminUserId,
      action: 'ai_report_view',
      targetType: 'ai_report',
      targetId: reportId,
      details: {},
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    }).catch(() => {
      // 로그 저장 실패는 조용히 무시
    });

    return NextResponse.json({
      report,
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    console.error('❌ [GET /api/admin/ai-report/[reportId]] 리포트 조회 오류:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '리포트를 조회할 수 없습니다.',
      },
      { status: 500 }
    );
  }
}

