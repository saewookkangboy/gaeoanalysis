import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import db from '@/lib/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * 에러 로그 해결 처리 (관리자 전용)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { resolved = true } = body;

    // 에러 로그 업데이트
    const result = db.prepare(`
      UPDATE error_logs
      SET 
        resolved = ?,
        resolved_at = ?,
        resolved_by = ?
      WHERE id = ?
    `).run(
      resolved ? 1 : 0,
      resolved ? new Date().toISOString() : null,
      resolved ? session.user.id : null,
      params.id
    );

    if (result.changes === 0) {
      return createErrorResponse(
        'NOT_FOUND',
        '에러 로그를 찾을 수 없습니다.',
        404
      );
    }

    return createSuccessResponse({
      message: resolved ? '에러 로그가 해결 처리되었습니다.' : '에러 로그 해결 처리가 취소되었습니다.',
    });
  } catch (error: any) {
    console.error('에러 로그 업데이트 실패:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '에러 로그를 업데이트할 수 없습니다.',
      500
    );
  }
}

/**
 * 에러 로그 삭제 (관리자 전용)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 에러 로그 삭제
    const result = db.prepare('DELETE FROM error_logs WHERE id = ?').run(params.id);

    if (result.changes === 0) {
      return createErrorResponse(
        'NOT_FOUND',
        '에러 로그를 찾을 수 없습니다.',
        404
      );
    }

    return createSuccessResponse({
      message: '에러 로그가 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('에러 로그 삭제 실패:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '에러 로그를 삭제할 수 없습니다.',
      500
    );
  }
}
