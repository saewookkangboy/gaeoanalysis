/**
 * 관리자 헬퍼 함수들
 * 
 * 이 모듈은 관리자 대시보드에서 사용하는 데이터 조회 및 통계 계산 함수들을 제공합니다.
 */

import { query, prepare } from './db-adapter';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

/**
 * 관리자 활동 로그 타입
 */
export interface AdminLogData {
  id: string;
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 관리자 활동 로그 저장
 * 
 * @param data 관리자 활동 로그 데이터
 */
export async function logAdminAction(data: AdminLogData): Promise<void> {
  try {
    const {
      id,
      adminUserId,
      action,
      targetType = null,
      targetId = null,
      details = null,
      ipAddress = null,
      userAgent = null,
    } = data;

    const detailsJson = details ? JSON.stringify(details) : null;

    await query(
      `INSERT INTO admin_logs 
       (id, admin_user_id, action, target_type, target_id, details, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [id, adminUserId, action, targetType, targetId, detailsJson, ipAddress, userAgent]
    );

    console.log('✅ [logAdminAction] 관리자 활동 로그 저장:', {
      id,
      adminUserId,
      action,
      targetType,
      targetId,
    });
  } catch (error: any) {
    console.error('❌ [logAdminAction] 관리자 활동 로그 저장 실패:', {
      error: error.message,
      data,
    });
    // 로그 저장 실패는 조용히 무시 (관리자 작업 자체는 성공)
  }
}

/**
 * 요청에서 IP 주소와 User Agent 추출
 * 
 * @param request NextRequest 객체
 * @returns IP 주소와 User Agent
 */
export function extractRequestInfo(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;

  const userAgent = request.headers.get('user-agent') || null;

  return { ipAddress, userAgent };
}

/**
 * 페이지네이션 파라미터 타입
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * 페이지네이션 결과 타입
 */
export interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
}

/**
 * 페이지네이션 계산
 * 
 * @param params 페이지네이션 파라미터
 * @param total 총 레코드 수
 * @returns 페이지네이션 결과
 */
export function calculatePagination(
  params: PaginationParams,
  total: number
): PaginationResult {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 50));
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    offset,
    total,
    totalPages,
  };
}

/**
 * 날짜 범위 파라미터 타입
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * 날짜 범위 유효성 검사 및 정규화
 * 
 * @param params 날짜 범위 파라미터
 * @returns 정규화된 날짜 범위
 */
export function normalizeDateRange(params: DateRangeParams): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = params.endDate ? new Date(params.endDate) : now;
  
  // startDate가 없으면 30일 전을 기본값으로 설정
  let startDate = params.startDate
    ? new Date(params.startDate)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 날짜 유효성 검사
  if (isNaN(startDate.getTime())) {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (isNaN(endDate.getTime())) {
    return {
      startDate,
      endDate: now,
    };
  }

  // startDate가 endDate보다 늦으면 교정
  if (startDate > endDate) {
    startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
}

/**
 * 로그인 이력 타입
 */
export interface AuthLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  provider: 'google' | 'github';
  action: 'login' | 'logout' | 'signup';
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

/**
 * 로그인 이력 조회 필터 파라미터
 */
export interface AuthLogFilterParams extends PaginationParams, DateRangeParams {
  provider?: 'google' | 'github' | 'all';
  userId?: string;
}

/**
 * 로그인 이력 조회
 * 
 * @param params 필터 파라미터
 * @returns 로그인 이력 목록과 페이지네이션 정보
 */
export async function getAuthLogs(
  params: AuthLogFilterParams = {}
): Promise<{
  logs: AuthLog[];
  pagination: PaginationResult;
}> {
  try {
    const { provider = 'all', userId, startDate, endDate } = params;

    // 날짜 범위 정규화
    const { startDate: start, endDate: end } = normalizeDateRange({
      startDate,
      endDate,
    });

    // WHERE 조건 빌드
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 날짜 범위 필터
    conditions.push(`created_at >= $${paramIndex++}`);
    values.push(start.toISOString());
    conditions.push(`created_at <= $${paramIndex++}`);
    values.push(end.toISOString());

    // Provider 필터
    if (provider !== 'all') {
      conditions.push(`provider = $${paramIndex++}`);
      values.push(provider);
    }

    // 사용자 필터
    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      values.push(userId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM auth_logs
      ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total as string, 10) || 0;

    // 페이지네이션 계산
    const pagination = calculatePagination(params, total);

    // 로그인 이력 조회 (사용자 이메일 포함)
    const logsQuery = `
      SELECT 
        al.id,
        al.user_id,
        u.email as user_email,
        al.provider,
        al.action,
        al.ip_address,
        al.user_agent,
        al.success,
        al.error_message,
        al.created_at
      FROM auth_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const logsResult = await query(logsQuery, [
      ...values,
      pagination.limit,
      pagination.offset,
    ]);

    const logs: AuthLog[] = logsResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      provider: row.provider,
      action: row.action,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      success: row.success === 1 || row.success === true,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    }));

    return {
      logs,
      pagination,
    };
  } catch (error: any) {
    console.error('❌ [getAuthLogs] 로그인 이력 조회 오류:', error);
    return {
      logs: [],
      pagination: {
        page: 1,
        limit: 50,
        offset: 0,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

/**
 * 로그인 이력 통계
 */
export interface AuthLogSummary {
  totalLogs: number;
  successCount: number;
  failureCount: number;
  byProvider: {
    google: number;
    github: number;
  };
}

/**
 * 로그인 이력 통계 계산
 * 
 * @param params 필터 파라미터
 * @returns 로그인 이력 통계
 */
export async function getAuthLogsSummary(
  params: Omit<AuthLogFilterParams, 'page' | 'limit'> = {}
): Promise<AuthLogSummary> {
  try {
    const { provider = 'all', userId, startDate, endDate } = params;

    // 날짜 범위 정규화
    const { startDate: start, endDate: end } = normalizeDateRange({
      startDate,
      endDate,
    });

    // WHERE 조건 빌드
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 날짜 범위 필터
    conditions.push(`created_at >= $${paramIndex++}`);
    values.push(start.toISOString());
    conditions.push(`created_at <= $${paramIndex++}`);
    values.push(end.toISOString());

    // Provider 필터 (통계에서는 all로 통합)
    // 사용자 필터
    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      values.push(userId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 전체 통계 조회
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failure_count,
        SUM(CASE WHEN provider = 'google' THEN 1 ELSE 0 END) as google_count,
        SUM(CASE WHEN provider = 'github' THEN 1 ELSE 0 END) as github_count
      FROM auth_logs
      ${whereClause}
    `;

    const summaryResult = await query(summaryQuery, values);
    const row = summaryResult.rows[0];

    return {
      totalLogs: parseInt(row?.total_logs as string, 10) || 0,
      successCount: parseInt(row?.success_count as string, 10) || 0,
      failureCount: parseInt(row?.failure_count as string, 10) || 0,
      byProvider: {
        google: parseInt(row?.google_count as string, 10) || 0,
        github: parseInt(row?.github_count as string, 10) || 0,
      },
    };
  } catch (error: any) {
    console.error('❌ [getAuthLogsSummary] 통계 계산 오류:', error);
    return {
      totalLogs: 0,
      successCount: 0,
      failureCount: 0,
      byProvider: {
        google: 0,
        github: 0,
      },
    };
  }
}

