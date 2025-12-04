import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getUsers, extractRequestInfo, logAdminAction } from '@/lib/admin-helpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * 사용자 목록 조회 API
 * GET /api/admin/users
 * 
 * 쿼리 파라미터:
 * - provider?: 'google' | 'github' | 'all'
 * - role?: 'user' | 'admin' | 'all'
 * - search?: string (이메일 검색)
 * - page?: number
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { userId, userEmail } = await requireAdmin(request);

    // 요청 정보 추출 (로그용)
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const provider = (searchParams.get('provider') as 'google' | 'github' | 'all') || 'all';
    const role = (searchParams.get('role') as 'user' | 'admin' | 'all') || 'all';
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 사용자 목록 조회
    const { users, pagination } = await getUsers({
      provider,
      role,
      search,
      page,
      limit,
    });

    // 관리자 활동 로그 저장 (비동기)
    logAdminAction({
      id: uuidv4(),
      adminUserId: userId,
      action: 'users_list_view',
      targetType: 'users',
      details: {
        provider,
        role,
        search,
        page,
        limit,
      },
      ipAddress,
      userAgent,
    }).catch(() => {
      // 로그 저장 실패는 조용히 무시
    });

    return NextResponse.json({
      users,
      pagination,
    });
  } catch (error: any) {
    // requireAdmin에서 403 에러를 throw하므로 그대로 전달
    if (error instanceof NextResponse) {
      throw error;
    }

    console.error('❌ [GET /api/admin/users] 오류:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '사용자 목록을 조회할 수 없습니다.',
      },
      { status: 500 }
    );
  }
}

