/**
 * 관리자 인증 및 권한 관리
 * 
 * 이 모듈은 관리자 권한 확인 및 보호된 라우트/API 접근 제어를 담당합니다.
 */

import { auth } from '@/auth';
import { getUser, getUserByEmail } from './db-helpers';
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
    
    console.log('🔍 [isAdmin] 세션 확인:', {
      hasSession: !!session,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id,
      email: session?.user?.email,
    });
    
    if (!session?.user?.id) {
      console.warn('⚠️ [isAdmin] 세션이 없거나 사용자 ID가 없음');
      return {
        isAdmin: false,
        user: null,
        error: '인증되지 않은 사용자입니다.',
      };
    }

    const userId = session.user.id;
    const userEmail = session.user.email || '';

    // 데이터베이스에서 사용자 정보 조회 (role 확인)
    // 1. 먼저 user.id로 조회 시도
    let user = await getUser(userId);
    
    // 2. user.id로 찾지 못하고 이메일이 있으면, 이메일로도 조회 시도
    if (!user && userEmail) {
      console.log('🔍 [isAdmin] user.id로 사용자를 찾지 못함, 이메일로 재시도:', {
        userId,
        userEmail,
      });
      user = await getUserByEmail(userEmail);
      
      // 이메일로 찾은 사용자가 있지만 ID가 다른 경우, 세션의 ID와 일치하는지 확인
      if (user && user.id !== userId) {
        console.warn('⚠️ [isAdmin] 이메일로 찾은 사용자의 ID가 세션 ID와 다름:', {
          sessionUserId: userId,
          foundUserId: user.id,
          email: userEmail,
        });
        // 이메일로 찾은 사용자의 권한을 확인 (여러 provider로 로그인한 경우 대응)
      }
    }
    
    console.log('🔍 [isAdmin] 사용자 정보 조회:', {
      userId,
      userEmail,
      userFound: !!user,
      foundUserId: user?.id,
      userRole: user?.role,
    });
    
    if (!user) {
      console.warn('⚠️ [isAdmin] 사용자 정보를 찾을 수 없음:', { userId, userEmail });
      return {
        isAdmin: false,
        user: {
          id: userId,
          email: userEmail,
          role: 'user',
        },
        error: '사용자 정보를 찾을 수 없습니다. 먼저 로그인을 완료해주세요.',
      };
    }

    // role이 'admin'인지 확인
    const isAdminUser = user.role === 'admin';

    console.log('🔍 [isAdmin] 권한 확인 결과:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: isAdminUser,
    });

    return {
      isAdmin: isAdminUser,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      },
      error: isAdminUser ? undefined : `관리자 권한이 필요합니다. (현재 role: ${user.role || 'user'})`,
    };
  } catch (error: any) {
    console.error('❌ [isAdmin] 관리자 권한 확인 오류:', error);
    return {
      isAdmin: false,
      user: null,
      error: `권한 확인 중 오류가 발생했습니다: ${error.message || error}`,
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

