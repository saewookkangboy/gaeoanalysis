import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-adapter';
import { getUserByEmail } from '@/lib/db-helpers';

/**
 * Admin 권한 설정 API
 * 웹에서 쉽게 admin 권한을 설정할 수 있는 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 사용자 찾기
    let user = await getUserByEmail(normalizedEmail);

    // Provider별 검색 시도 (Google, GitHub)
    if (!user) {
      const googleUserResult = await query(
        'SELECT id, email, role, provider FROM users WHERE LOWER(TRIM(email)) = $1 AND provider = $2 LIMIT 1',
        [normalizedEmail, 'google']
      );

      if (googleUserResult.rows.length > 0) {
        user = googleUserResult.rows[0] as any;
      } else {
        const githubUserResult = await query(
          'SELECT id, email, role, provider FROM users WHERE LOWER(TRIM(email)) = $1 AND provider = $2 LIMIT 1',
          [normalizedEmail, 'github']
        );

        if (githubUserResult.rows.length > 0) {
          user = githubUserResult.rows[0] as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: `사용자를 찾을 수 없습니다: ${normalizedEmail}. 먼저 로그인을 통해 사용자를 생성해주세요.` 
        },
        { status: 404 }
      );
    }

    // 이미 admin인지 확인
    if (user.role === 'admin') {
      return NextResponse.json({
        success: true,
        message: '이미 admin 권한을 가지고 있습니다.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Admin 권한 부여
    const updateQuery = 'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await query(updateQuery, ['admin', user.id]);

    // 업데이트 확인
    const updatedUser = await getUserByEmail(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: 'Admin 권한이 성공적으로 설정되었습니다.',
      user: {
        id: updatedUser?.id || user.id,
        email: updatedUser?.email || user.email,
        role: updatedUser?.role || 'admin',
      },
    });
  } catch (error: any) {
    console.error('❌ [Admin Setup API] 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Admin 권한 설정 중 오류가 발생했습니다: ${error.message || error}` 
      },
      { status: 500 }
    );
  }
}

