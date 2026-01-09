import { Headers } from 'next/dist/compiled/@edge-runtime/primitives/headers';
import { v4 as uuidv4 } from 'uuid';
import db from './db';
import { isPostgreSQL, query } from './db-adapter';

type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ServerErrorLogOptions {
  errorType: string;
  error: Error;
  url: string;
  method?: string;
  userId?: string | null;
  severity?: Severity;
  metadata?: any;
  headers?: Headers | HeadersInit | null;
}

/**
 * 서버 사이드 에러를 error_logs 테이블에 기록
 * - 실패해도 절대 에러를 throw 하지 않고 조용히 무시 (서비스 안정성 우선)
 * - SQLite / PostgreSQL 모두 지원
 */
export async function logServerError(options: ServerErrorLogOptions): Promise<void> {
  const {
    errorType,
    error,
    url,
    method,
    userId = null,
    severity = 'medium',
    metadata,
    headers,
  } = options;

  try {
    // 헤더에서 IP / User-Agent 추출
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      if (headers instanceof Headers) {
        ipAddress =
          headers.get('x-forwarded-for')?.split(',')[0].trim() ||
          headers.get('x-real-ip') ||
          null;
        userAgent = headers.get('user-agent');
      } else if (headers && typeof (headers as any).get === 'function') {
        const h = headers as any;
        const xf = h.get('x-forwarded-for') as string | null;
        ipAddress =
          (xf && xf.split(',')[0].trim()) ||
          (h.get('x-real-ip') as string | null) ||
          null;
        userAgent = h.get('user-agent') as string | null;
      }
    } catch {
      // 헤더 파싱 실패는 무시
    }

    const errorLogId = uuidv4();
    const errorMessage = error.message || 'Unknown error';
    const errorStack = error.stack || null;

    const serializedMetadata = metadata
      ? JSON.stringify({
          ...metadata,
          method,
        })
      : method
      ? JSON.stringify({ method })
      : null;

    if (isPostgreSQL()) {
      // PostgreSQL
      await query(
        `
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          errorLogId,
          userId,
          errorType,
          errorMessage,
          errorStack,
          null, // component_stack (프론트엔드 전용)
          url,
          userAgent,
          ipAddress,
          serializedMetadata,
          severity,
        ]
      );
    } else {
      // SQLite
      db.prepare(
        `
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
      `
      ).run(
        errorLogId,
        userId,
        errorType,
        errorMessage,
        errorStack,
        null,
        url,
        userAgent,
        ipAddress,
        serializedMetadata,
        severity
      );
    }
  } catch (logError) {
    // 로깅 실패는 서비스 흐름에 영향을 주지 않음
    console.warn('⚠️ [ErrorLogger] 서버 에러 로깅 실패 (무시):', logError);
  }
}

