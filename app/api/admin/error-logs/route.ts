import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * 에러 로그 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return createErrorResponse(
        'UNAUTHORIZED',
        '관리자 권한이 필요합니다.',
        403
      );
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const errorType = searchParams.get('error_type');
    const userId = searchParams.get('user_id');

    // WHERE 조건 구성
    const conditions: string[] = [];
    const params: any[] = [];

    if (severity) {
      conditions.push('severity = ?');
      params.push(severity);
    }

    if (resolved !== null) {
      conditions.push('resolved = ?');
      params.push(resolved === 'true' ? 1 : 0);
    }

    if (errorType) {
      conditions.push('error_type = ?');
      params.push(errorType);
    }

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 전체 개수 조회
    const countResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM error_logs
      ${whereClause}
    `).get(...params) as { total: number };

    // 에러 로그 조회
    const logs = db.prepare(`
      SELECT 
        id,
        user_id,
        error_type,
        error_message,
        error_stack,
        component_stack,
        url,
        user_agent,
        ip_address,
        metadata,
        severity,
        resolved,
        resolved_at,
        resolved_by,
        created_at
      FROM error_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Array<{
      id: string;
      user_id: string | null;
      error_type: string;
      error_message: string;
      error_stack: string | null;
      component_stack: string | null;
      url: string | null;
      user_agent: string | null;
      ip_address: string | null;
      metadata: string | null;
      severity: string;
      resolved: number;
      resolved_at: string | null;
      resolved_by: string | null;
      created_at: string;
    }>;

    // 사용자 정보 조회 (user_id가 있는 경우)
    const logsWithUserInfo = await Promise.all(
      logs.map(async (log) => {
        let userEmail = null;
        if (log.user_id) {
          try {
            const user = db.prepare('SELECT email FROM users WHERE id = ?').get(log.user_id) as { email: string } | undefined;
            userEmail = user?.email || null;
          } catch (error) {
            console.warn('사용자 정보 조회 실패:', error);
          }
        }
        return {
          ...log,
          user_email: userEmail,
          metadata: log.metadata ? JSON.parse(log.metadata) : null,
        };
      })
    );

    return createSuccessResponse({
      logs: logsWithUserInfo,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error: any) {
    console.error('에러 로그 조회 실패:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '에러 로그를 조회할 수 없습니다.',
      500
    );
  }
}

/**
 * 에러 로그 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      error_type,
      error_message,
      error_stack,
      component_stack,
      url,
      user_agent,
      ip_address,
      metadata,
      severity = 'medium',
      user_id,
    } = body;

    // 필수 필드 검증
    if (!error_type || !error_message) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'error_type와 error_message는 필수입니다.',
        400
      );
    }

    // IP 주소 추출
    const clientIp = ip_address || 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // User-Agent 추출
    const clientUserAgent = user_agent || 
      request.headers.get('user-agent') ||
      'unknown';

    // 에러 로그 저장
    const errorLogId = uuidv4();
    db.prepare(`
      INSERT INTO error_logs (
        id,
        user_id,
        error_type,
        error_message,
        error_stack,
        component_stack,
        url,
        user_agent,
        ip_address,
        metadata,
        severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      errorLogId,
      user_id || null,
      error_type,
      error_message,
      error_stack || null,
      component_stack || null,
      url || null,
      clientUserAgent,
      clientIp,
      metadata ? JSON.stringify(metadata) : null,
      severity
    );

    return createSuccessResponse({
      id: errorLogId,
      message: '에러 로그가 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('에러 로그 저장 실패:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '에러 로그를 저장할 수 없습니다.',
      500
    );
  }
}
