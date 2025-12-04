import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db-postgres';
import { ensureAnnouncementsTable } from '@/lib/ensure-announcements-table';

/**
 * GET /api/admin/announcements
 * 모든 공지사항 조회 (관리자만)
 */
export async function GET(request: NextRequest) {
  try {
    // 테이블이 없으면 생성
    await ensureAnnouncementsTable();
    
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    const result = await query(
      `SELECT id, message, is_active, created_at, updated_at 
       FROM announcements 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ announcements: result.rows });
  } catch (error: any) {
    console.error('❌ [Admin Announcements API] 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '공지사항 조회 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

