import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';

/**
 * 관리자 권한 확인 API
 * 클라이언트 컴포넌트에서 호출하여 관리자 권한을 확인합니다.
 */
export async function GET() {
  try {
    const checkResult = await isAdmin();
    
    return NextResponse.json(checkResult);
  } catch (error: any) {
    console.error('❌ [API /admin/check] 권한 확인 오류:', error);
    return NextResponse.json(
      {
        isAdmin: false,
        user: null,
        error: '권한 확인 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

