import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  collectReportData,
  generateAIReport,
  saveReport,
  extractRequestInfo,
  logAdminAction,
} from '@/lib/admin-helpers';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

/**
 * AI 리포트 생성 요청 스키마
 */
const createReportSchema = z.object({
  userId: z.string().optional(),
  reportType: z.enum(['summary', 'detailed', 'trend']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeCharts: z.boolean().optional().default(false),
});

/**
 * AI 리포트 생성 API
 * POST /api/admin/ai-report
 * 
 * 요청 본문:
 * - userId?: string (특정 사용자 리포트)
 * - reportType: 'summary' | 'detailed' | 'trend'
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 * - includeCharts?: boolean
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId: adminUserId, userEmail } = await requireAdmin(request);

    // 요청 정보 추출 (로그용)
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // 요청 본문 파싱
    const body = await request.json();
    const {
      userId,
      reportType,
      startDate,
      endDate,
      includeCharts,
    } = createReportSchema.parse(body);

    console.log('🔄 [POST /api/admin/ai-report] 리포트 생성 시작...', {
      adminUserId,
      userId,
      reportType,
      startDate,
      endDate,
    });

    // 리포트 데이터 수집
    const reportData = await collectReportData(userId, startDate, endDate);

    // AI 리포트 생성
    const reportContent = await generateAIReport(reportData, reportType);

    // 리포트 저장
    const reportId = uuidv4();
    const metadata = {
      userId: userId || null,
      reportType,
      startDate: startDate || null,
      endDate: endDate || null,
      includeCharts: includeCharts || false,
      dataRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      totalUsers: reportData.overview.totalUsers,
      totalAnalyses: reportData.overview.totalAnalyses,
    };

    await saveReport({
      id: reportId,
      adminUserId,
      userId: userId || undefined,
      reportType,
      reportContent,
      metadata,
    });

    // 관리자 활동 로그 저장 (비동기)
    logAdminAction({
      id: uuidv4(),
      adminUserId,
      action: 'ai_report_generated',
      targetType: 'ai_report',
      targetId: reportId,
      details: {
        userId,
        reportType,
        startDate,
        endDate,
      },
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    }).catch(() => {
      // 로그 저장 실패는 조용히 무시
    });

    console.log('✅ [POST /api/admin/ai-report] 리포트 생성 완료:', {
      reportId,
      reportType,
    });

    return NextResponse.json({
      reportId,
      report: reportContent,
      generatedAt: new Date().toISOString(),
      metadata,
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    // Zod 검증 오류
    if (error.name === 'ZodError') {
      console.error('❌ [POST /api/admin/ai-report] 요청 검증 오류:', error.errors);
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '요청 데이터가 올바르지 않습니다.',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [POST /api/admin/ai-report] 리포트 생성 오류:', error);
    return NextResponse.json(
      {
        error: 'REPORT_GENERATION_ERROR',
        message: error.message || '리포트 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * 리포트 목록 조회 API
 * GET /api/admin/ai-report
 * 
 * 쿼리 파라미터:
 * - userId?: string
 * - page?: number
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId: adminUserId } = await requireAdmin(request);

    // 요청 정보 추출 (로그용)
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 리포트 목록 조회
    const { getReports } = await import('@/lib/admin-helpers');
    const { reports, pagination } = await getReports({
      adminUserId,
      userId,
      page,
      limit,
    });

    // 관리자 활동 로그 저장 (비동기)
    logAdminAction({
      id: uuidv4(),
      adminUserId,
      action: 'ai_reports_view',
      targetType: 'ai_reports',
      details: {
        userId,
        page,
        limit,
      },
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    }).catch(() => {
      // 로그 저장 실패는 조용히 무시
    });

    return NextResponse.json({
      reports,
      pagination,
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    console.error('❌ [GET /api/admin/ai-report] 리포트 목록 조회 오류:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '리포트 목록을 조회할 수 없습니다.',
      },
      { status: 500 }
    );
  }
}

