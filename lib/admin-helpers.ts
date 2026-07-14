/**
 * 관리자 헬퍼 함수들
 * 
 * 이 모듈은 관리자 대시보드에서 사용하는 데이터 조회 및 통계 계산 함수들을 제공합니다.
 */

import { query, prepare, isPostgreSQL } from './db-adapter';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';
import { generateText } from './llm/gemini';
import { modelForTask } from './llm/models';
import { Subscription, PlanType } from './subscription-helpers';

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
 * 날짜 범위 정규화
 */
export function normalizeDateRange(params: DateRangeParams): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (params.startDate) {
    start = new Date(params.startDate);
  } else {
    // 기본값: 30일 전
    start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }

  if (params.endDate) {
    end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    end = now;
  }

  // 날짜 유효성 검사
  if (isNaN(start.getTime())) {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }
  if (isNaN(end.getTime())) {
    end = now;
  }

  return { startDate: start, endDate: end };
}

/**
 * 로그인 이력 타입
 */
export interface AuthLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  provider: 'google' | 'github';
  action: 'login' | 'logout' | 'register';
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
 */
export async function getAuthLogs(
  params: AuthLogFilterParams = {}
): Promise<{
  logs: AuthLog[];
  pagination: PaginationResult;
}> {
  try {
    // PostgreSQL 스키마 초기화 보장
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

    // 날짜 범위 필터 (auth_logs 테이블의 created_at 사용)
    conditions.push(`al.created_at >= $${paramIndex++}`);
    values.push(start.toISOString());
    conditions.push(`al.created_at <= $${paramIndex++}`);
    values.push(end.toISOString());

    // Provider 필터
    if (provider !== 'all') {
      conditions.push(`al.provider = $${paramIndex++}`);
      values.push(provider);
    }

    // 사용자 필터
    if (userId) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      values.push(userId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 총 개수 조회 (별칭 사용하여 WHERE 절과 일치)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM auth_logs al
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
      success: row.success,
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

    // 날짜 범위 필터 (auth_logs 테이블의 created_at 사용)
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

    // WHERE 조건 빌드
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Provider 필터
    if (provider !== 'all') {
      conditions.push(`u.provider = $${paramIndex++}`);
      values.push(provider);
    }

    // Role 필터
    if (role !== 'all') {
      conditions.push(`u.role = $${paramIndex++}`);
      values.push(role);
    }

    // 이메일 검색
    if (search) {
      conditions.push(`LOWER(u.email) LIKE $${paramIndex++}`);
      values.push(`%${search.toLowerCase()}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total as string, 10) || 0;

    // 페이지네이션 계산
    const pagination = calculatePagination(params, total);

    // 사용자 목록 조회 (통계 포함)
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
      LEFT JOIN auth_logs al ON u.id = al.user_id AND al.action = 'login' AND al.success = true
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
      role: row.role,
      isActive: row.is_active,
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
  grokScore: number | null;
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
    // PostgreSQL 스키마 초기화 보장
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [getAnalyses] 스키마 초기화 스킵:', schemaError);
      }
    }

    const { userId, search, startDate, endDate } = params;

    // 날짜 범위 정규화 (기본값: 2025-12-04 06:00 이후)
    let start: Date;
    if (startDate) {
      start = new Date(startDate);
    } else {
      // 기본값: 2025-12-04 06:00 (KST 기준)
      start = new Date('2025-12-04T06:00:00.000+09:00');
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

    // 날짜 범위 필터 (analyses 테이블의 created_at 사용)
    conditions.push(`a.created_at >= $${paramIndex++}`);
    values.push(start.toISOString());
    conditions.push(`a.created_at <= $${paramIndex++}`);
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
        a.grok_score,
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

    console.log('🔍 [getAnalyses] 조회 결과:', {
      total: total,
      fetched: analysesResult.rows.length,
      params,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    const analyses: AnalysisInfo[] = analysesResult.rows.map((row: any) => {
      // insights 파싱 (JSON 문자열인 경우)
      let insights: any[] = [];
      try {
        if (typeof row.insights === 'string') {
          insights = JSON.parse(row.insights);
        } else if (Array.isArray(row.insights)) {
          insights = row.insights;
        } else if (row.insights) {
          // 객체인 경우 배열로 변환 시도
          insights = [row.insights];
        }
      } catch (error) {
        console.warn('⚠️ [getAnalyses] insights 파싱 오류:', error);
      }

      return {
        id: row.id,
        userId: row.user_id || null,
        userEmail: row.user_email || null,
        url: row.url || '',
        aeoScore: Number(row.aeo_score) || 0,
        geoScore: Number(row.geo_score) || 0,
        seoScore: Number(row.seo_score) || 0,
        overallScore: Number(row.overall_score) || 0,
        chatgptScore: row.chatgpt_score !== null && row.chatgpt_score !== undefined ? Number(row.chatgpt_score) : null,
        perplexityScore: row.perplexity_score !== null && row.perplexity_score !== undefined ? Number(row.perplexity_score) : null,
        grokScore: row.grok_score !== null && row.grok_score !== undefined ? Number(row.grok_score) : null,
        geminiScore: row.gemini_score !== null && row.gemini_score !== undefined ? Number(row.gemini_score) : null,
        claudeScore: row.claude_score !== null && row.claude_score !== undefined ? Number(row.claude_score) : null,
        insights,
        createdAt: row.created_at || new Date().toISOString(),
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
      stack: error.stack,
    });

    // 테이블이 없는 경우 명시적으로 알림
    if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('no such table')) {
      console.error('❌ [getAnalyses] analyses 테이블이 존재하지 않습니다. 스키마를 초기화해주세요.');
    }

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

/**
 * 통계 정보 타입
 */
export interface StatisticsData {
  overview: {
    totalUsers: number;
    totalAnalyses: number;
    totalLogins: number;
    totalChats: number;
  };
  today: {
    newUsers: number;
    analyses: number;
    logins: number;
    chats: number;
  };
  averages: {
    aeoScore: number;
    geoScore: number;
    seoScore: number;
    overallScore: number;
  };
  trends: {
    dailyUsers: Array<{ date: string; count: number }>;
    dailyAnalyses: Array<{ date: string; count: number }>;
    dailyLogins: Array<{ date: string; count: number }>;
  };
}

/**
 * 통계 데이터 조회
 * 
 * @param startDate 시작 날짜 (선택)
 * @param endDate 종료 날짜 (선택)
 * @returns 통계 데이터
 */
export async function getStatistics(
  startDate?: string,
  endDate?: string
): Promise<StatisticsData> {
  try {
    // PostgreSQL 스키마 초기화 보장
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [getStatistics] 스키마 초기화 스킵:', schemaError);
      }
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 날짜 범위 설정
    let start: Date;
    let end: Date;

    if (startDate) {
      start = new Date(startDate);
    } else {
      // 기본값: 30일 전
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      end = now;
    }

    // 1. 전체 통계
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users', []);
    const totalAnalysesResult = await query('SELECT COUNT(*) as count FROM analyses', []);
    
    const successCondition = isPostgreSQL() ? "success = true" : "success = 1";
    const totalLoginsResult = await query(
      `SELECT COUNT(*) as count FROM auth_logs WHERE action = 'login' AND ${successCondition}`,
      []
    );
    const totalChatsResult = await query('SELECT COUNT(*) as count FROM chat_conversations', []);

    // 2. 오늘 통계
    const todayUsersResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
      [todayStart.toISOString()]
    );
    const todayAnalysesResult = await query(
      'SELECT COUNT(*) as count FROM analyses WHERE created_at >= $1',
      [todayStart.toISOString()]
    );
    const todayLoginsResult = await query(
      `SELECT COUNT(*) as count FROM auth_logs WHERE action = 'login' AND ${successCondition} AND created_at >= $1`,
      [todayStart.toISOString()]
    );
    const todayChatsResult = await query(
      'SELECT COUNT(*) as count FROM chat_conversations WHERE created_at >= $1',
      [todayStart.toISOString()]
    );

    // 3. 평균 점수
    const averagesResult = await query(
      `SELECT 
        AVG(aeo_score) as avg_aeo,
        AVG(geo_score) as avg_geo,
        AVG(seo_score) as avg_seo,
        AVG(overall_score) as avg_overall
      FROM analyses
      WHERE created_at >= $1`,
      [start.toISOString()]
    );

    // 4. 일별 트렌드 (날짜별 그룹화)
    const dateFormat = isPostgreSQL()
      ? "TO_CHAR(created_at, 'YYYY-MM-DD')"
      : "DATE(created_at)";

    const dailyUsersResult = await query(
      `SELECT ${dateFormat} as date, COUNT(*) as count
       FROM users
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY ${dateFormat}
       ORDER BY date ASC`,
      [start.toISOString(), end.toISOString()]
    );

    const dailyAnalysesResult = await query(
      `SELECT ${dateFormat} as date, COUNT(*) as count
       FROM analyses
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY ${dateFormat}
       ORDER BY date ASC`,
      [start.toISOString(), end.toISOString()]
    );

    const dailyLoginsResult = await query(
      `SELECT ${dateFormat} as date, COUNT(*) as count
       FROM auth_logs
       WHERE action = 'login' AND ${successCondition}
         AND created_at >= $1 AND created_at <= $2
       GROUP BY ${dateFormat}
       ORDER BY date ASC`,
      [start.toISOString(), end.toISOString()]
    );

    const overview = {
      totalUsers: parseInt(totalUsersResult.rows[0]?.count as string, 10) || 0,
      totalAnalyses: parseInt(totalAnalysesResult.rows[0]?.count as string, 10) || 0,
      totalLogins: parseInt(totalLoginsResult.rows[0]?.count as string, 10) || 0,
      totalChats: parseInt(totalChatsResult.rows[0]?.count as string, 10) || 0,
    };

    const today = {
      newUsers: parseInt(todayUsersResult.rows[0]?.count as string, 10) || 0,
      analyses: parseInt(todayAnalysesResult.rows[0]?.count as string, 10) || 0,
      logins: parseInt(todayLoginsResult.rows[0]?.count as string, 10) || 0,
      chats: parseInt(todayChatsResult.rows[0]?.count as string, 10) || 0,
    };

    const avgRow = averagesResult.rows[0];
    const averages = {
      aeoScore: parseFloat(avgRow?.avg_aeo as string) || 0,
      geoScore: parseFloat(avgRow?.avg_geo as string) || 0,
      seoScore: parseFloat(avgRow?.avg_seo as string) || 0,
      overallScore: parseFloat(avgRow?.avg_overall as string) || 0,
    };

    const trends = {
      dailyUsers: dailyUsersResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count as string, 10) || 0,
      })),
      dailyAnalyses: dailyAnalysesResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count as string, 10) || 0,
      })),
      dailyLogins: dailyLoginsResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count as string, 10) || 0,
      })),
    };

    return {
      overview,
      today,
      averages,
      trends,
    };
  } catch (error: any) {
    console.error('❌ [getStatistics] 통계 조회 오류:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
    });

    // 기본값 반환
    return {
      overview: {
        totalUsers: 0,
        totalAnalyses: 0,
        totalLogins: 0,
        totalChats: 0,
      },
      today: {
        newUsers: 0,
        analyses: 0,
        logins: 0,
        chats: 0,
      },
      averages: {
        aeoScore: 0,
        geoScore: 0,
        seoScore: 0,
        overallScore: 0,
      },
      trends: {
        dailyUsers: [],
        dailyAnalyses: [],
        dailyLogins: [],
      },
    };
  }
}

// ============================================
// AI 리포트 관련 함수
// ============================================

/**
 * 리포트 데이터 타입
 */
export interface ReportData {
  overview: {
    totalUsers: number;
    totalAnalyses: number;
    totalLogins: number;
    totalChats: number;
  };
  averages: {
    aeoScore: number;
    geoScore: number;
    seoScore: number;
    overallScore: number;
  };
  trends: {
    dailyUsers: Array<{ date: string; count: number }>;
    dailyAnalyses: Array<{ date: string; count: number }>;
    dailyLogins: Array<{ date: string; count: number }>;
  };
  userStats?: {
    userId: string;
    userEmail: string;
    provider: string | null;
    totalAnalyses: number;
    avgOverallScore: number;
    avgAeoScore: number;
    avgGeoScore: number;
    avgSeoScore: number;
  };
  insights?: {
    userRetentionRate: number; // 사용자 유지율 (%)
    activeUserRate: number; // 활성 사용자 비율 (%)
    chatEngagementRate: number; // 채팅 참여율 (%)
    scoreImprovementTrend: 'improving' | 'stable' | 'declining'; // 점수 개선 추세
    peakAnalysisDay?: string; // 분석 급증일
    peakAnalysisCount?: number; // 분석 급증일 건수
    lowScoreCategory: 'aeo' | 'geo' | 'seo' | 'none'; // 가장 낮은 점수 카테고리
  };
}

/**
 * 리포트 데이터 수집
 * 
 * @param userId 특정 사용자 ID (선택적, 없으면 전체 데이터)
 * @param startDate 시작 날짜 (선택적)
 * @param endDate 종료 날짜 (선택적)
 * @returns 리포트 데이터
 */
export async function collectReportData(
  userId?: string,
  startDate?: string,
  endDate?: string
): Promise<ReportData> {
  try {
    // PostgreSQL 스키마 초기화 보장
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [collectReportData] 스키마 초기화 스킵:', schemaError);
      }
    }

    // 전체 통계 조회
    const statistics = await getStatistics(startDate, endDate);

    // 날짜 범위 설정
    const now = new Date();
    let start: Date;
    let end: Date;

    if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      end = now;
    }

    // 인사이트 계산
    const insights = await calculateInsights(start, end, statistics);

    // 사용자별 통계 (특정 사용자가 지정된 경우)
    let userStats = undefined;
    if (userId) {
      // 사용자 정보 조회
      const userResult = await query(
        'SELECT id, email, provider FROM users WHERE id = $1',
        [userId]
      );
      const user = userResult.rows[0];

      if (user) {
        // 사용자별 분석 통계
        const userAnalysesResult = await query(
          `SELECT 
            COUNT(*) as total_analyses,
            AVG(overall_score) as avg_overall,
            AVG(aeo_score) as avg_aeo,
            AVG(geo_score) as avg_geo,
            AVG(seo_score) as avg_seo
          FROM analyses
          WHERE user_id = $1
            ${startDate ? 'AND created_at >= $2' : ''}
            ${endDate ? `AND created_at <= $${startDate ? '3' : '2'}` : ''}`,
          startDate && endDate
            ? [userId, startDate, endDate]
            : startDate
            ? [userId, startDate]
            : endDate
            ? [userId, endDate]
            : [userId]
        );

        const analysisRow = userAnalysesResult.rows[0];
        userStats = {
          userId: user.id,
          userEmail: user.email,
          provider: user.provider,
          totalAnalyses: parseInt(analysisRow?.total_analyses as string, 10) || 0,
          avgOverallScore: parseFloat(analysisRow?.avg_overall as string) || 0,
          avgAeoScore: parseFloat(analysisRow?.avg_aeo as string) || 0,
          avgGeoScore: parseFloat(analysisRow?.avg_geo as string) || 0,
          avgSeoScore: parseFloat(analysisRow?.avg_seo as string) || 0,
        };
      }
    }

    return {
      overview: statistics.overview,
      averages: statistics.averages,
      trends: statistics.trends,
      userStats,
      insights,
    };
  } catch (error: any) {
    console.error('❌ [collectReportData] 리포트 데이터 수집 오류:', {
      error: error.message,
      code: error.code,
    });

    // 기본값 반환
    return {
      overview: {
        totalUsers: 0,
        totalAnalyses: 0,
        totalLogins: 0,
        totalChats: 0,
      },
      averages: {
        aeoScore: 0,
        geoScore: 0,
        seoScore: 0,
        overallScore: 0,
      },
      trends: {
        dailyUsers: [],
        dailyAnalyses: [],
        dailyLogins: [],
      },
      userStats: userId ? undefined : undefined,
      insights: {
        userRetentionRate: 0,
        activeUserRate: 0,
        chatEngagementRate: 0,
        scoreImprovementTrend: 'stable',
        lowScoreCategory: 'none',
      },
    };
  }
}

/**
 * 리포트 인사이트 계산
 */
async function calculateInsights(
  startDate: Date,
  endDate: Date,
  statistics: StatisticsData
): Promise<ReportData['insights']> {
  try {
    const successCondition = isPostgreSQL() ? "success = true" : "success = 1";
    
    // 1. 사용자 유지율 계산 (최근 7일 내 재방문한 사용자 비율)
    const sevenDaysAgo = new Date(endDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 전체 사용자 중 최근 7일 내 로그인한 사용자
    const activeUsersResult = await query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM auth_logs
       WHERE action = 'login' AND ${successCondition}
         AND created_at >= $1 AND created_at <= $2`,
      [sevenDaysAgo.toISOString(), endDate.toISOString()]
    );
    const activeUsers = parseInt(activeUsersResult.rows[0]?.count as string, 10) || 0;
    
    // 전체 사용자 수
    const totalUsers = statistics.overview.totalUsers;
    const activeUserRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    
    // 2. 사용자 유지율 (최근 30일 내 2회 이상 로그인한 사용자 비율)
    const thirtyDaysAgo = new Date(endDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const retainedUsersResult = await query(
      `SELECT user_id, COUNT(*) as login_count
       FROM auth_logs
       WHERE action = 'login' AND ${successCondition}
         AND created_at >= $1 AND created_at <= $2
       GROUP BY user_id
       HAVING COUNT(*) >= 2`,
      [thirtyDaysAgo.toISOString(), endDate.toISOString()]
    );
    const retainedUsers = retainedUsersResult.rows.length;
    const userRetentionRate = totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;
    
    // 3. 채팅 참여율 (채팅을 사용한 사용자 비율)
    const chatUsersResult = await query(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM chat_conversations
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate.toISOString(), endDate.toISOString()]
    );
    const chatUsers = parseInt(chatUsersResult.rows[0]?.count as string, 10) || 0;
    const chatEngagementRate = totalUsers > 0 ? (chatUsers / totalUsers) * 100 : 0;
    
    // 4. 점수 개선 추세 계산 (최근 7일 vs 그 이전 7일)
    const fourteenDaysAgo = new Date(endDate);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgoForTrend = new Date(endDate);
    sevenDaysAgoForTrend.setDate(sevenDaysAgoForTrend.getDate() - 7);
    
    // 최근 7일 평균 점수
    const recentScoresResult = await query(
      `SELECT AVG(overall_score) as avg_score
       FROM analyses
       WHERE created_at >= $1 AND created_at <= $2`,
      [sevenDaysAgoForTrend.toISOString(), endDate.toISOString()]
    );
    const recentAvg = parseFloat(recentScoresResult.rows[0]?.avg_score as string) || 0;
    
    // 그 이전 7일 평균 점수
    const previousScoresResult = await query(
      `SELECT AVG(overall_score) as avg_score
       FROM analyses
       WHERE created_at >= $1 AND created_at < $2`,
      [fourteenDaysAgo.toISOString(), sevenDaysAgoForTrend.toISOString()]
    );
    const previousAvg = parseFloat(previousScoresResult.rows[0]?.avg_score as string) || 0;
    
    let scoreImprovementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > previousAvg + 2) {
      scoreImprovementTrend = 'improving';
    } else if (recentAvg < previousAvg - 2) {
      scoreImprovementTrend = 'declining';
    }
    
    // 5. 분석 급증일 찾기
    let peakAnalysisDay: string | undefined;
    let peakAnalysisCount: number | undefined;
    if (statistics.trends.dailyAnalyses.length > 0) {
      const peakDay = statistics.trends.dailyAnalyses.reduce((max, day) => 
        day.count > (max.count || 0) ? day : max
      );
      if (peakDay.count > 5) { // 5건 이상일 때만 급증으로 간주
        peakAnalysisDay = peakDay.date;
        peakAnalysisCount = peakDay.count;
      }
    }
    
    // 6. 가장 낮은 점수 카테고리
    const { aeoScore, geoScore, seoScore } = statistics.averages;
    let lowScoreCategory: 'aeo' | 'geo' | 'seo' | 'none' = 'none';
    if (aeoScore < geoScore && aeoScore < seoScore) {
      lowScoreCategory = 'aeo';
    } else if (geoScore < aeoScore && geoScore < seoScore) {
      lowScoreCategory = 'geo';
    } else if (seoScore < aeoScore && seoScore < geoScore) {
      lowScoreCategory = 'seo';
    }
    
    return {
      userRetentionRate: Math.round(userRetentionRate * 10) / 10,
      activeUserRate: Math.round(activeUserRate * 10) / 10,
      chatEngagementRate: Math.round(chatEngagementRate * 10) / 10,
      scoreImprovementTrend,
      peakAnalysisDay,
      peakAnalysisCount,
      lowScoreCategory,
    };
  } catch (error: any) {
    console.error('❌ [calculateInsights] 인사이트 계산 오류:', error);
    return {
      userRetentionRate: 0,
      activeUserRate: 0,
      chatEngagementRate: 0,
      scoreImprovementTrend: 'stable',
      lowScoreCategory: 'none',
    };
  }
}

/**
 * 리포트 프롬프트 생성
 * 
 * @param reportData 리포트 데이터
 * @param reportType 리포트 타입 ('summary' | 'detailed' | 'trend')
 * @returns 리포트 프롬프트
 */
export function buildReportPrompt(
  reportData: ReportData,
  reportType: 'summary' | 'detailed' | 'trend'
): string {
  const { overview, averages, trends, userStats, insights } = reportData;

  let prompt = `GAEO 분석 서비스의 관리자 리포트를 생성해주세요.

**리포트 타입**: ${reportType === 'summary' ? '요약 리포트' : reportType === 'detailed' ? '상세 리포트' : '트렌드 리포트'}

**서비스 통계**:
- 총 사용자 수: ${overview.totalUsers}명
- 총 분석 수: ${overview.totalAnalyses}건
- 총 로그인 수: ${overview.totalLogins}회
- 총 채팅 수: ${overview.totalChats}회

**평균 점수**:
- AEO 점수: ${averages.aeoScore.toFixed(1)}/100
- GEO 점수: ${averages.geoScore.toFixed(1)}/100
- SEO 점수: ${averages.seoScore.toFixed(1)}/100
- 종합 점수: ${averages.overallScore.toFixed(1)}/100

`;

  if (insights) {
    prompt += `**핵심 인사이트**:
- 사용자 유지율: ${insights.userRetentionRate.toFixed(1)}% (최근 30일 내 2회 이상 로그인한 사용자 비율)
- 활성 사용자 비율: ${insights.activeUserRate.toFixed(1)}% (최근 7일 내 로그인한 사용자 비율)
- 채팅 참여율: ${insights.chatEngagementRate.toFixed(1)}% (채팅을 사용한 사용자 비율)
- 점수 개선 추세: ${insights.scoreImprovementTrend === 'improving' ? '개선 중' : insights.scoreImprovementTrend === 'declining' ? '하락 중' : '안정적'}
${insights.peakAnalysisDay ? `- 분석 급증일: ${insights.peakAnalysisDay} (${insights.peakAnalysisCount}건)` : ''}
- 가장 낮은 점수 카테고리: ${insights.lowScoreCategory === 'aeo' ? 'AEO' : insights.lowScoreCategory === 'geo' ? 'GEO' : insights.lowScoreCategory === 'seo' ? 'SEO' : '없음'}

`;
  }

  if (userStats) {
    prompt += `**사용자별 통계** (${userStats.userEmail}):
- 총 분석 수: ${userStats.totalAnalyses}건
- 평균 종합 점수: ${userStats.avgOverallScore.toFixed(1)}/100
- 평균 AEO 점수: ${userStats.avgAeoScore.toFixed(1)}/100
- 평균 GEO 점수: ${userStats.avgGeoScore.toFixed(1)}/100
- 평균 SEO 점수: ${userStats.avgSeoScore.toFixed(1)}/100

`;
  }

  if (trends.dailyUsers.length > 0) {
    // Create a map of all dates to combine data correctly
    const dateMap = new Map<string, { users: number; analyses: number; logins: number }>();
    
    trends.dailyUsers.forEach(d => {
      dateMap.set(d.date, { users: d.count, analyses: 0, logins: 0 });
    });
    trends.dailyAnalyses.forEach(d => {
      const existing = dateMap.get(d.date) || { users: 0, analyses: 0, logins: 0 };
      existing.analyses = d.count;
      dateMap.set(d.date, existing);
    });
    trends.dailyLogins.forEach(d => {
      const existing = dateMap.get(d.date) || { users: 0, analyses: 0, logins: 0 };
      existing.logins = d.count;
      dateMap.set(d.date, existing);
    });
    
    const allDailyData = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    prompt += `**일별 트렌드** (최근 ${allDailyData.length}일):
${allDailyData.slice(-16).map(d => `- ${d.date}: 신규 사용자 ${d.users}명, 분석 ${d.analyses}건, 로그인 ${d.logins}회`).join('\n')}

`;
  }

  prompt += `**요구사항**:
- 마크다운 형식으로 작성
- ${reportType === 'summary' ? '핵심 요약과 주요 인사이트를 간결하게 제공' : reportType === 'detailed' ? '상세한 분석과 개선 제안을 포함' : '트렌드 분석과 예측을 포함'}
- 한국어로 작성
- 데이터 기반의 객관적인 분석
- 구체적이고 실행 가능한 개선 제안 포함
${insights && insights.peakAnalysisDay ? `- ${insights.peakAnalysisDay} 분석 급증 원인 분석 및 재현 방안 제시` : ''}
${insights && insights.chatEngagementRate === 0 ? '- 채팅 기능이 전혀 사용되지 않는 원인 분석 및 활성화 방안 제시' : ''}
${insights && insights.userRetentionRate < 30 ? '- 사용자 유지율이 낮은 원인 분석 및 재방문 유도 전략 제시' : ''}
${insights && insights.lowScoreCategory !== 'none' ? `- ${insights.lowScoreCategory.toUpperCase()} 점수 개선을 위한 구체적인 가이드라인 및 기능 개선 제안` : ''}
- 서비스 퍼포먼스, 사용자 유입, 사용량 증대를 위한 실질적인 방안 제시
- 각 개선 제안에 대해 예상 효과 및 우선순위 명시

**리포트 작성**:`;

  return prompt;
}

/**
 * AI 리포트 생성
 * 
 * @param reportData 리포트 데이터
 * @param reportType 리포트 타입
 * @returns 생성된 리포트 (마크다운 형식)
 */
export async function generateAIReport(
  reportData: ReportData,
  reportType: 'summary' | 'detailed' | 'trend'
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    const prompt = buildReportPrompt(reportData, reportType);

    console.log('🔄 [generateAIReport] 리포트 생성 시작...', {
      reportType,
      hasUserStats: !!reportData.userStats,
    });

    const { text } = await generateText({
      model: modelForTask('report'),
      prompt,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192, // 리포트는 더 긴 응답 필요
    });

    console.log('✅ [generateAIReport] 리포트 생성 완료');

    return text;
  } catch (error: any) {
    console.error('❌ [generateAIReport] 리포트 생성 오류:', {
      error: error.message,
      reportType,
    });
    throw error;
  }
}

/**
 * 리포트 저장
 * 
 * @param data 리포트 데이터
 * @returns 저장된 리포트 ID
 */
export async function saveReport(data: {
  id: string;
  adminUserId: string;
  userId?: string;
  reportType: 'summary' | 'detailed' | 'trend';
  reportContent: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    // PostgreSQL 스키마 초기화 보장
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [saveReport] 스키마 초기화 스킵:', schemaError);
      }
    }

    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

    await query(
      `INSERT INTO ai_reports 
       (id, admin_user_id, user_id, report_type, report_content, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        data.id,
        data.adminUserId,
        data.userId || null,
        data.reportType,
        data.reportContent,
        metadataJson,
      ]
    );

    console.log('✅ [saveReport] 리포트 저장 완료:', {
      id: data.id,
      reportType: data.reportType,
    });

    return data.id;
  } catch (error: any) {
    console.error('❌ [saveReport] 리포트 저장 오류:', {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

/**
 * 리포트 조회
 * 
 * @param reportId 리포트 ID
 * @returns 리포트 정보
 */
export async function getReport(reportId: string): Promise<{
  id: string;
  adminUserId: string;
  userId: string | null;
  reportType: 'summary' | 'detailed' | 'trend';
  reportContent: string;
  metadata: Record<string, any> | null;
  createdAt: string;
} | null> {
  try {
    // PostgreSQL 스키마 초기화 보장
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [getReport] 스키마 초기화 스킵:', schemaError);
      }
    }

    const result = await query(
      `SELECT 
        id, admin_user_id, user_id, report_type, report_content, metadata, created_at
      FROM ai_reports
      WHERE id = $1`,
      [reportId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      adminUserId: row.admin_user_id,
      userId: row.user_id,
      reportType: row.report_type as 'summary' | 'detailed' | 'trend',
      reportContent: row.report_content,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
    };
  } catch (error: any) {
    console.error('❌ [getReport] 리포트 조회 오류:', {
      error: error.message,
      code: error.code,
    });
    return null;
  }
}

/**
 * 리포트 목록 조회
 * 
 * @param params 조회 파라미터
 * @returns 리포트 목록 및 페이지네이션
 */
export async function getReports(params: {
  adminUserId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  reports: Array<{
    id: string;
    adminUserId: string;
    userId: string | null;
    reportType: 'summary' | 'detailed' | 'trend';
    createdAt: string;
  }>;
  pagination: PaginationResult;
}> {
  try {
    // PostgreSQL 스키마 초기화 보장
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [getReports] 스키마 초기화 스킵:', schemaError);
      }
    }

    const { adminUserId, userId, page = 1, limit = 50 } = params;

    // WHERE 조건 빌드
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (adminUserId) {
      conditions.push(`admin_user_id = $${paramIndex++}`);
      values.push(adminUserId);
    }

    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      values.push(userId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ai_reports
      ${whereClause}
    `;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total as string, 10) || 0;

    // 페이지네이션 계산
    const pagination = calculatePagination({ page, limit }, total);

    // 리포트 목록 조회
    const reportsQuery = `
      SELECT 
        id, admin_user_id, user_id, report_type, created_at
      FROM ai_reports
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const reportsResult = await query(reportsQuery, [
      ...values,
      pagination.limit,
      pagination.offset,
    ]);

    const reports = reportsResult.rows.map((row: any) => ({
      id: row.id,
      adminUserId: row.admin_user_id,
      userId: row.user_id,
      reportType: row.report_type as 'summary' | 'detailed' | 'trend',
      createdAt: row.created_at,
    }));

    return {
      reports,
      pagination,
    };
  } catch (error: any) {
    console.error('❌ [getReports] 리포트 목록 조회 오류:', {
      error: error.message,
      code: error.code,
    });

    return {
      reports: [],
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

// ============================================
// 학습 데이터 추출 및 AI 학습 연동
// ============================================

/**
 * 학습 데이터 추출 결과 타입
 */
export interface LearningData {
  analysisId: string;
  url: string;
  features: {
    aeo: Record<string, number>;
    geo: Record<string, number>;
    seo: Record<string, number>;
  };
  scores: {
    aeo: number;
    geo: number;
    seo: number;
    overall: number;
  };
  aiScores?: {
    chatgpt: number | null;
    perplexity: number | null;
    grok: number | null;
    gemini: number | null;
    claude: number | null;
  };
}

/**
 * 분석 결과에서 학습 데이터 추출
 * 
 * @param analysisId 분석 ID
 * @returns 학습 데이터
 */
export async function extractLearningData(analysisId: string): Promise<LearningData | null> {
  try {
    // PostgreSQL 스키마 초기화 보장
    if (isPostgreSQL()) {
      try {
        const { ensurePostgresSchema } = await import('./db-postgres-schema');
        await ensurePostgresSchema();
      } catch (schemaError) {
        console.warn('⚠️ [extractLearningData] 스키마 초기화 스킵:', schemaError);
      }
    }

    // 분석 결과 조회
    const analysisResult = await query(
      `SELECT 
        id, url, aeo_score, geo_score, seo_score, overall_score,
        chatgpt_score, perplexity_score, grok_score, gemini_score, claude_score
      FROM analyses
      WHERE id = $1`,
      [analysisId]
    );

    if (analysisResult.rows.length === 0) {
      return null;
    }

    const analysis = analysisResult.rows[0];

    // HTML 가져오기 (특징 추출을 위해)
    // 실제로는 분석 시점의 HTML이 필요하지만, 여기서는 URL로 다시 가져올 수 없으므로
    // 특징 추출은 별도로 수행해야 함
    // 현재는 점수만 반환 (향후 HTML 저장 시 확장 가능)

    return {
      analysisId: analysis.id,
      url: analysis.url,
      features: {
        aeo: {}, // HTML이 없으면 빈 객체 (향후 확장)
        geo: {},
        seo: {},
      },
      scores: {
        aeo: analysis.aeo_score,
        geo: analysis.geo_score,
        seo: analysis.seo_score,
        overall: analysis.overall_score,
      },
      aiScores: {
        chatgpt: analysis.chatgpt_score,
        perplexity: analysis.perplexity_score,
        grok: analysis.grok_score,
        gemini: analysis.gemini_score,
        claude: analysis.claude_score,
      },
    };
  } catch (error: any) {
    console.error('❌ [extractLearningData] 학습 데이터 추출 오류:', {
      error: error.message,
      code: error.code,
    });
    return null;
  }
}

/**
 * 알고리즘 학습 트리거
 * 
 * @param analysisId 분석 ID (선택적, 없으면 최근 분석들에 대해 학습)
 * @param algorithmType 알고리즘 타입 (선택적, 없으면 모든 타입)
 * @returns 학습 결과
 */
export async function triggerAlgorithmLearning(
  analysisId?: string,
  algorithmType?: 'aeo' | 'geo' | 'seo' | 'aio'
): Promise<{
  success: boolean;
  message: string;
  results: Array<{
    algorithmType: string;
    learned: boolean;
    error?: string;
  }>;
}> {
  try {
    const results: Array<{
      algorithmType: string;
      learned: boolean;
      error?: string;
    }> = [];

    if (analysisId) {
      // 특정 분석에 대해 학습
      const learningData = await extractLearningData(analysisId);
      
      if (!learningData) {
        return {
          success: false,
          message: '분석 결과를 찾을 수 없습니다.',
          results: [],
        };
      }

      // 알고리즘 학습 시스템 연동
      const { getActiveAlgorithmVersion, updateAlgorithmPerformance } = await import('./algorithm-learning');

      const types: Array<'aeo' | 'geo' | 'seo' | 'aio'> = algorithmType ? [algorithmType] : ['aeo', 'geo', 'seo'];
      
      for (const type of types) {
        try {
          const version = getActiveAlgorithmVersion(type);
          if (!version) {
            results.push({
              algorithmType: type,
              learned: false,
              error: '활성 알고리즘 버전이 없습니다.',
            });
            continue;
          }

          // 실제 점수와 예상 점수 비교 (현재는 예상 점수 = 실제 점수로 가정)
          // 향후 HTML 저장 시 실제 특징 추출 및 학습 수행
          const typeKey = type as 'aeo' | 'geo' | 'seo';
          const actualScore = learningData.scores[typeKey];
          const predictedScore = actualScore; // 현재는 동일하게 가정

          // 성능 업데이트만 수행 (가중치 학습은 HTML이 필요)
          updateAlgorithmPerformance(version.id, actualScore, predictedScore);

          results.push({
            algorithmType: type,
            learned: true,
          });
        } catch (error: any) {
          console.error(`❌ [triggerAlgorithmLearning] ${type} 학습 오류:`, error);
          results.push({
            algorithmType: type,
            learned: false,
            error: error.message,
          });
        }
      }
    } else {
      // 최근 분석들에 대해 학습 (최근 100개)
      const recentAnalyses = await query(
        `SELECT id FROM analyses ORDER BY created_at DESC LIMIT 100`,
        []
      );

      for (const row of recentAnalyses.rows) {
        const learningData = await extractLearningData(row.id);
        if (learningData) {
          // 각 분석에 대해 학습 수행 (간단한 성능 업데이트만)
          const { getActiveAlgorithmVersion, updateAlgorithmPerformance } = await import('./algorithm-learning');
          
          const types: Array<'aeo' | 'geo' | 'seo' | 'aio'> = algorithmType ? [algorithmType] : ['aeo', 'geo', 'seo'];
          
          for (const type of types) {
            try {
              const version = getActiveAlgorithmVersion(type);
              if (version) {
                const typeKey = type as 'aeo' | 'geo' | 'seo';
                const actualScore = learningData.scores[typeKey];
                const predictedScore = actualScore;
                updateAlgorithmPerformance(version.id, actualScore, predictedScore);
              }
            } catch (error) {
              // 개별 학습 실패는 조용히 무시
            }
          }
        }
      }

      results.push({
        algorithmType: algorithmType || 'all',
        learned: true,
      });
    }

    return {
      success: results.some(r => r.learned),
      message: results.some(r => r.learned)
        ? '학습이 완료되었습니다.'
        : '학습에 실패했습니다.',
      results,
    };
  } catch (error: any) {
    console.error('❌ [triggerAlgorithmLearning] 학습 트리거 오류:', {
      error: error.message,
      analysisId,
      algorithmType,
    });

    return {
      success: false,
      message: `학습 중 오류가 발생했습니다: ${error.message}`,
      results: [],
    };
  }
}

/**
 * 모든 구독 정보 조회 (관리자용)
 */
export interface SubscriptionWithUser extends Subscription {
  userEmail: string | null;
}

export async function getAllSubscriptions(): Promise<SubscriptionWithUser[]> {
  try {
    if (isPostgreSQL()) {
      // PostgreSQL
      const result = await query(
        `SELECT 
          s.id, s.user_id, s.plan_type, s.status,
          s.current_period_start, s.current_period_end,
          s.cancel_at_period_end, s.created_at, s.updated_at,
          u.email as user_email
        FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC`,
        []
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        planType: row.plan_type,
        status: row.status,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end === true || row.cancel_at_period_end === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userEmail: row.user_email,
      }));
    } else {
      // SQLite
      const stmt = prepare(`
        SELECT 
          s.id, s.user_id, s.plan_type, s.status,
          s.current_period_start, s.current_period_end,
          s.cancel_at_period_end, s.created_at, s.updated_at,
          u.email as user_email
        FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
      `);
      
      const rows = stmt.all() as any[];
      
      return rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        planType: row.plan_type,
        status: row.status,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userEmail: row.user_email,
      }));
    }
  } catch (error: any) {
    console.error('❌ [getAllSubscriptions] 구독 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 구독 정보 업데이트 (관리자용)
 */
export async function updateSubscription(
  subscriptionId: string,
  data: {
    planType?: PlanType;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<SubscriptionWithUser | null> {
  try {
    if (isPostgreSQL()) {
      // PostgreSQL
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.planType) {
        updates.push(`plan_type = $${paramIndex}`);
        values.push(data.planType);
        paramIndex++;
      }

      if (data.cancelAtPeriodEnd !== undefined) {
        updates.push(`cancel_at_period_end = $${paramIndex}`);
        values.push(data.cancelAtPeriodEnd);
        paramIndex++;
      }

      if (updates.length === 0) {
        // 업데이트할 내용이 없으면 조회만
        const result = await query(
          `SELECT 
            s.id, s.user_id, s.plan_type, s.status,
            s.current_period_start, s.current_period_end,
            s.cancel_at_period_end, s.created_at, s.updated_at,
            u.email as user_email
          FROM subscriptions s
          LEFT JOIN users u ON s.user_id = u.id
          WHERE s.id = $1`,
          [subscriptionId]
        );
        
        if (result.rows.length === 0) return null;
        
        const row = result.rows[0] as any;
        return {
          id: row.id,
          userId: row.user_id,
          planType: row.plan_type,
          status: row.status,
          currentPeriodStart: row.current_period_start,
          currentPeriodEnd: row.current_period_end,
          cancelAtPeriodEnd: row.cancel_at_period_end === true || row.cancel_at_period_end === 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          userEmail: row.user_email,
        };
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(subscriptionId);

      const updateQuery = `
        UPDATE subscriptions
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id, user_id, plan_type, status,
          current_period_start, current_period_end,
          cancel_at_period_end, created_at, updated_at
      `;

      const result = await query(updateQuery, values);
      
      if (result.rows.length === 0) return null;

      // 사용자 이메일 조회
      const row = result.rows[0] as any;
      const userResult = await query('SELECT email FROM users WHERE id = $1', [row.user_id]);
      const userEmail = userResult.rows[0]?.email || null;

      return {
        id: row.id,
        userId: row.user_id,
        planType: row.plan_type,
        status: row.status,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end === true || row.cancel_at_period_end === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userEmail,
      };
    } else {
      // SQLite
      const updates: string[] = [];
      const values: any[] = [];

      if (data.planType) {
        updates.push('plan_type = ?');
        values.push(data.planType);
      }

      if (data.cancelAtPeriodEnd !== undefined) {
        updates.push('cancel_at_period_end = ?');
        values.push(data.cancelAtPeriodEnd ? 1 : 0);
      }

      if (updates.length === 0) {
        // 업데이트할 내용이 없으면 조회만
        const stmt = prepare(`
          SELECT 
            s.id, s.user_id, s.plan_type, s.status,
            s.current_period_start, s.current_period_end,
            s.cancel_at_period_end, s.created_at, s.updated_at,
            u.email as user_email
          FROM subscriptions s
          LEFT JOIN users u ON s.user_id = u.id
          WHERE s.id = ?
        `);
        
        const row = stmt.get([subscriptionId]) as any;
        if (!row) return null;
        
        return {
          id: row.id,
          userId: row.user_id,
          planType: row.plan_type,
          status: row.status,
          currentPeriodStart: row.current_period_start,
          currentPeriodEnd: row.current_period_end,
          cancelAtPeriodEnd: row.cancel_at_period_end === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userEmail: row.user_email,
      };
    }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(subscriptionId);

      const updateStmt = prepare(`
        UPDATE subscriptions
        SET ${updates.join(', ')}
        WHERE id = ?
      `);

      updateStmt.run(...values);

      // 업데이트된 구독 조회
      const selectStmt = prepare(`
        SELECT 
          s.id, s.user_id, s.plan_type, s.status,
          s.current_period_start, s.current_period_end,
          s.cancel_at_period_end, s.created_at, s.updated_at,
          u.email as user_email
        FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `);
      
      const row = selectStmt.get([subscriptionId]) as any;
      if (!row) return null;

      return {
        id: row.id,
        userId: row.user_id,
        planType: row.plan_type,
        status: row.status,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userEmail: row.user_email,
      };
    }
  } catch (error: any) {
    console.error('❌ [updateSubscription] 구독 업데이트 실패:', error);
    return null;
  }
}
