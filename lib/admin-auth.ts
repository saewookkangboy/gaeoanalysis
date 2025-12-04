/**
 * 관리자 인증 및 권한 관리
 * 
 * 이 모듈은 관리자 권한 확인 및 보호된 라우트/API 접근 제어를 담당합니다.
 */

import { auth } from '@/auth';
import { getUser } from './db-helpers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 관리자 권한 확인 결과 타입
 */
export interface AdminCheckResult {
  isAdmin: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  error?: string;
}

/**
 * 현재 세션의 사용자가 관리자인지 확인
 * 
 * @returns 관리자 권한 확인 결과
 */
export async function isAdmin(): Promise<AdminCheckResult> {
  try {
    // 세션 확인
    const session = await auth();
    
    if (!session?.user?.id) {
      return {
        isAdmin: false,
        user: null,
        error: '인증되지 않은 사용자입니다.',
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email || '';

    // 데이터베이스에서 사용자 정보 조회 (role 확인)
    const user = await getUser(userId);
    
    if (!user) {
      return {
        isAdmin: false,
        user: {
          id: userId,
          email: userEmail,
          role: 'user',
        },
        error: '사용자 정보를 찾을 수 없습니다.',
      };
    }

    // role이 'admin'인지 확인
    const isAdminUser = user.role === 'admin';

    return {
      isAdmin: isAdminUser,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      },
      error: isAdminUser ? undefined : '관리자 권한이 필요합니다.',
    };
  } catch (error: any) {
    console.error('❌ [isAdmin] 관리자 권한 확인 오류:', error);
    return {
      isAdmin: false,
      user: null,
      error: '권한 확인 중 오류가 발생했습니다.',
    };
  }
}

/**
 * API 라우트용 관리자 권한 확인 미들웨어
 * 권한이 없으면 403 에러를 반환합니다.
 * 
 * @param request NextRequest 객체
 * @returns 관리자 정보 또는 null (권한 없음)
 * @throws 권한이 없으면 NextResponse를 throw합니다.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ userId: string; userEmail: string }> {
  const checkResult = await isAdmin();

  if (!checkResult.isAdmin || !checkResult.user) {
    console.warn('⚠️ [requireAdmin] 관리자 권한 없음:', {
      userId: checkResult.user?.id,
      email: checkResult.user?.email,
      error: checkResult.error,
    });

    throw NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: checkResult.error || '관리자 권한이 필요합니다.',
      },
      { status: 403 }
    );
  }

  return {
    userId: checkResult.user.id,
    userEmail: checkResult.user.email,
  };
}

/**
 * 페이지 레벨 권한 확인 헬퍼
 * 
 * ⚠️ 주의: 이 함수는 서버 전용입니다.
 * 클라이언트 컴포넌트에서는 `/api/admin/check` API 라우트를 사용하세요.
 * 
 * @returns 관리자 권한 확인 결과
 * @deprecated 클라이언트 컴포넌트에서는 사용하지 마세요. `/api/admin/check` API를 사용하세요.
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
  return await isAdmin();
}

