import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { query } from '@/lib/db-adapter';
import { isPostgreSQL } from '@/lib/db-adapter';

/**
 * 특정 이메일 사용자의 상세 정보 조회 API
 * GET /api/admin/users/search?email=<email>
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'EMAIL_REQUIRED', message: '이메일 주소가 필요합니다.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. 사용자 정보 조회
    const userResult = await query(
      `SELECT id, email, name, provider, role, created_at, last_login_at, is_active 
       FROM users 
       WHERE LOWER(TRIM(email)) = $1 
       LIMIT 1`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        found: false,
        email: normalizedEmail,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    const user = userResult.rows[0] as any;
    const userId = user.id;

    // 2. 로그인 이력 조회 (최근 20건)
    const successCondition = isPostgreSQL() ? 'success = true' : 'success = 1';
    
    const authLogsResult = await query(
      `SELECT id, provider, action, ${successCondition} as success, ip_address, created_at, error_message
       FROM auth_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    const authLogs = authLogsResult.rows.map((log: any) => ({
      id: log.id,
      provider: log.provider,
      action: log.action,
      success: log.success === 1 || log.success === true,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
      errorMessage: log.error_message,
    }));

    // 전체 로그인 통계
    const totalLogsResult = await query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN ${successCondition} THEN 1 ELSE 0 END) as success_count,
         SUM(CASE WHEN NOT ${successCondition} THEN 1 ELSE 0 END) as failure_count
       FROM auth_logs 
       WHERE user_id = $1`,
      [userId]
    );
    const logStats = totalLogsResult.rows[0] as any;

    // 3. 분석 결과 조회 (최근 20건)
    const analysesResult = await query(
      `SELECT id, url, overall_score, aeo_score, geo_score, seo_score, 
              chatgpt_score, perplexity_score, grok_score, gemini_score, claude_score,
              created_at 
       FROM analyses 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    const analyses = analysesResult.rows.map((analysis: any) => ({
      id: analysis.id,
      url: analysis.url,
      overallScore: analysis.overall_score || 0,
      aeoScore: analysis.aeo_score || 0,
      geoScore: analysis.geo_score || 0,
      seoScore: analysis.seo_score || 0,
      chatgptScore: analysis.chatgpt_score,
      perplexityScore: analysis.perplexity_score,
      grokScore: analysis.grok_score,
      geminiScore: analysis.gemini_score,
      claudeScore: analysis.claude_score,
      createdAt: analysis.created_at,
    }));

    // 전체 분석 통계
    const totalAnalysesResult = await query(
      `SELECT COUNT(*) as total FROM analyses WHERE user_id = $1`,
      [userId]
    );
    const totalAnalyses = parseInt(totalAnalysesResult.rows[0]?.total as string, 10) || 0;

    // 4. 오늘의 활동
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayLogsResult = await query(
      `SELECT COUNT(*) as count FROM auth_logs 
       WHERE user_id = $1 AND action = 'login' AND ${successCondition} AND created_at >= $2`,
      [userId, todayStart.toISOString()]
    );
    const todayLogs = parseInt(todayLogsResult.rows[0]?.count as string, 10) || 0;

    const todayAnalysesResult = await query(
      `SELECT COUNT(*) as count FROM analyses 
       WHERE user_id = $1 AND created_at >= $2`,
      [userId, todayStart.toISOString()]
    );
    const todayAnalyses = parseInt(todayAnalysesResult.rows[0]?.count as string, 10) || 0;

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
        role: user.role || 'user',
        isActive: user.is_active === 1 || user.is_active === true,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
      statistics: {
        totalLogins: parseInt(logStats.total as string, 10) || 0,
        successLogins: parseInt(logStats.success_count as string, 10) || 0,
        failureLogins: parseInt(logStats.failure_count as string, 10) || 0,
        totalAnalyses,
        todayLogins: todayLogs,
        todayAnalyses,
      },
      authLogs: authLogs.slice(0, 20),
      analyses: analyses.slice(0, 20),
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    console.error('❌ [GET /api/admin/users/search] 오류:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '사용자 정보를 조회할 수 없습니다.',
      },
      { status: 500 }
    );
  }
}
