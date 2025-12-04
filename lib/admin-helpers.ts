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
    // PostgreSQL 스키마 초기화 보장
    const { isPostgreSQL } = await import('./db-adapter');
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [getAuthLogs] 스키마 초기화 스킵:', schemaError);
      }
    }

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
    console.error('❌ [getAuthLogs] 로그인 이력 조회 오류:', {
      error: error.message,
      code: error.code,
      params,
    });
    
    // 테이블이 없는 경우 명시적으로 알림
    if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('no such table')) {
      console.error('❌ [getAuthLogs] auth_logs 테이블이 존재하지 않습니다. 스키마를 초기화해주세요.');
    }
    
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
    // PostgreSQL 스키마 초기화 보장
    const { isPostgreSQL } = await import('./db-adapter');
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [getAuthLogsSummary] 스키마 초기화 스킵:', schemaError);
      }
    }

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

    // PostgreSQL과 SQLite 모두 지원하기 위해 boolean 비교 처리
    // (위에서 이미 isPostgreSQL을 import했으므로 재사용)
    const successTrueCondition = isPostgreSQL() ? 'success = true' : 'success = 1';
    const successFalseCondition = isPostgreSQL() ? 'success = false' : 'success = 0';

    // 전체 통계 조회
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN ${successTrueCondition} THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN ${successFalseCondition} THEN 1 ELSE 0 END) as failure_count,
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
    console.error('❌ [getAuthLogsSummary] 통계 계산 오류:', {
      error: error.message,
      code: error.code,
      params,
    });
    
    // 테이블이 없는 경우 명시적으로 알림
    if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('no such table')) {
      console.error('❌ [getAuthLogsSummary] auth_logs 테이블이 존재하지 않습니다. 스키마를 초기화해주세요.');
    }
    
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

/**
 * 사용자 정보 타입
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  provider: 'google' | 'github' | null;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  totalAnalyses: number;
  totalChats: number;
  totalLogins: number;
}

/**
 * 사용자 목록 조회 필터 파라미터
 */
export interface UserFilterParams extends PaginationParams {
  provider?: 'google' | 'github' | 'all';
  role?: 'user' | 'admin' | 'all';
  search?: string; // 이메일 검색
}

/**
 * 사용자 목록 조회
 */
export async function getUsers(
  params: UserFilterParams = {}
): Promise<{
  users: UserInfo[];
  pagination: PaginationResult;
}> {
  try {
    const { provider = 'all', role = 'all', search } = params;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (provider !== 'all') {
      conditions.push(`u.provider = $${paramIndex++}`);
      values.push(provider);
    }

    if (role !== 'all') {
      conditions.push(`u.role = $${paramIndex++}`);
      values.push(role);
    }

    if (search) {
      const searchNormalized = search.toLowerCase().trim();
      conditions.push(`LOWER(TRIM(u.email)) LIKE $${paramIndex++}`);
      values.push(`%${searchNormalized}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total as string, 10) || 0;

    const pagination = calculatePagination(params, total);

    // PostgreSQL과 SQLite 모두 지원하기 위해 boolean 비교 처리
    const { isPostgreSQL } = await import('./db-adapter');
    const successCondition = isPostgreSQL() ? 'al.success = true' : 'al.success = 1';

    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.provider,
        u.role,
        u.is_active,
        u.last_login_at,
        u.created_at,
        COUNT(DISTINCT a.id) as total_analyses,
        COUNT(DISTINCT c.id) as total_chats,
        COUNT(DISTINCT al.id) as total_logins
      FROM users u
      LEFT JOIN analyses a ON u.id = a.user_id
      LEFT JOIN chat_conversations c ON u.id = c.user_id
      LEFT JOIN auth_logs al ON u.id = al.user_id AND al.action = 'login' AND ${successCondition}
      ${whereClause}
      GROUP BY u.id, u.email, u.name, u.provider, u.role, u.is_active, u.last_login_at, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const usersResult = await query(usersQuery, [
      ...values,
      pagination.limit,
      pagination.offset,
    ]);

    const users: UserInfo[] = usersResult.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      provider: row.provider,
      role: row.role || 'user',
      isActive: row.is_active === 1 || row.is_active === true,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      totalAnalyses: parseInt(row.total_analyses as string, 10) || 0,
      totalChats: parseInt(row.total_chats as string, 10) || 0,
      totalLogins: parseInt(row.total_logins as string, 10) || 0,
    }));

    return {
      users,
      pagination,
    };
  } catch (error: any) {
    console.error('❌ [getUsers] 사용자 목록 조회 오류:', error);
    return {
      users: [],
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
 * 분석 결과 정보 타입
 */
export interface AnalysisInfo {
  id: string;
  userId: string | null;
  userEmail: string | null;
  url: string;
  aeoScore: number;
  geoScore: number;
  seoScore: number;
  overallScore: number;
  chatgptScore: number | null;
  perplexityScore: number | null;
  geminiScore: number | null;
  claudeScore: number | null;
  insights: any[];
  createdAt: string;
}

/**
 * 분석 결과 조회 필터 파라미터
 */
export interface AnalysisFilterParams extends PaginationParams, DateRangeParams {
  userId?: string;
  search?: string; // URL 검색
}

/**
 * 분석 결과 조회
 * 
 * @param params 필터 파라미터
 * @returns 분석 결과 목록과 페이지네이션 정보
 */
export async function getAnalyses(
  params: AnalysisFilterParams = {}
): Promise<{
  analyses: AnalysisInfo[];
  pagination: PaginationResult;
}> {
  try {
    const { userId, search, startDate, endDate } = params;

    // 날짜 범위 정규화 (기본값: 2025-12-04 06:00 이후, 또는 오늘 00:00)
    let start: Date;
    if (startDate) {
      start = new Date(startDate);
    } else {
      // 기본값: 2025-12-04 06:00 (UTC) = 2025-12-04 15:00 (KST)
      // 또는 오늘 00:00 중 더 최근 것으로 설정
      const defaultDate = new Date('2025-12-04T06:00:00.000Z');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      // 더 최근 날짜 사용
      start = defaultDate > todayStart ? defaultDate : todayStart;
    }

    const now = new Date();
    const end = endDate ? new Date(endDate) : now;

    // 날짜 유효성 검사
    if (isNaN(start.getTime())) {
      start = new Date('2025-12-04T06:00:00.000Z');
    }
    if (isNaN(end.getTime())) {
      return {
        analyses: [],
        pagination: {
          page: 1,
          limit: 50,
          offset: 0,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // WHERE 조건 빌드
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 날짜 범위 필터 (2025-12-04 06:00 이후)
    conditions.push(`created_at >= $${paramIndex++}`);
    values.push(start.toISOString());
    conditions.push(`created_at <= $${paramIndex++}`);
    values.push(end.toISOString());

    // 사용자 필터
    if (userId) {
      conditions.push(`a.user_id = $${paramIndex++}`);
      values.push(userId);
    }

    // URL 검색
    if (search) {
      conditions.push(`LOWER(a.url) LIKE $${paramIndex++}`);
      values.push(`%${search.toLowerCase()}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM analyses a
      ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total as string, 10) || 0;

    // 페이지네이션 계산
    const pagination = calculatePagination(params, total);

    // 분석 결과 조회 (사용자 이메일 포함)
    const analysesQuery = `
      SELECT 
        a.id,
        a.user_id,
        u.email as user_email,
        a.url,
        a.aeo_score,
        a.geo_score,
        a.seo_score,
        a.overall_score,
        a.chatgpt_score,
        a.perplexity_score,
        a.gemini_score,
        a.claude_score,
        a.insights,
        a.created_at
      FROM analyses a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const analysesResult = await query(analysesQuery, [
      ...values,
      pagination.limit,
      pagination.offset,
    ]);

    const analyses: AnalysisInfo[] = analysesResult.rows.map((row: any) => {
      // insights 파싱 (JSON 문자열인 경우)
      let insights: any[] = [];
      try {
        if (typeof row.insights === 'string') {
          insights = JSON.parse(row.insights);
        } else if (Array.isArray(row.insights)) {
          insights = row.insights;
        }
      } catch (error) {
        console.warn('⚠️ [getAnalyses] insights 파싱 오류:', error);
      }

      return {
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email,
        url: row.url,
        aeoScore: row.aeo_score || 0,
        geoScore: row.geo_score || 0,
        seoScore: row.seo_score || 0,
        overallScore: row.overall_score || 0,
        chatgptScore: row.chatgpt_score,
        perplexityScore: row.perplexity_score,
        geminiScore: row.gemini_score,
        claudeScore: row.claude_score,
        insights,
        createdAt: row.created_at,
      };
    });

    return {
      analyses,
      pagination,
    };
  } catch (error: any) {
    console.error('❌ [getAnalyses] 분석 결과 조회 오류:', {
      error: error.message,
      code: error.code,
      params,
    });

    return {
      analyses: [],
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
