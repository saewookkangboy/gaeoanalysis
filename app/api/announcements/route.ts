import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db-postgres';
import { ensureAnnouncementsTable } from '@/lib/ensure-announcements-table';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/announcements
 * 활성화된 공지사항 조회 (인증 불필요)
 */
export async function GET() {
  try {
    // 테이블이 없으면 생성
    await ensureAnnouncementsTable();
    
    const result = await query(
      `SELECT id, message, created_at, updated_at 
       FROM announcements 
       WHERE is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ announcement: null });
    }

    return NextResponse.json({ announcement: result.rows[0] });
  } catch (error: any) {
    console.error('❌ [Announcements API] 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '공지사항 조회 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements
 * 공지사항 생성 (관리자만)
 */
export async function POST(request: NextRequest) {
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

    const { message, is_active = true } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '공지사항 내용이 필요합니다' },
        { status: 400 }
      );
    }

    // 기존 활성 공지사항 비활성화
    if (is_active) {
      await query(
        'UPDATE announcements SET is_active = FALSE WHERE is_active = TRUE'
      );
    }

    const id = uuidv4();
    await query(
      `INSERT INTO announcements (id, message, is_active, created_by) 
       VALUES ($1, $2, $3, $4)`,
      [id, message.trim(), is_active, session.user.id]
    );

    return NextResponse.json({ 
      success: true, 
      announcement: { id, message: message.trim(), is_active } 
    });
  } catch (error: any) {
    console.error('❌ [Announcements API] 생성 오류:', error);
    return NextResponse.json(
      { 
        error: '공지사항 생성 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/announcements
 * 공지사항 수정 (관리자만)
 */
export async function PUT(request: NextRequest) {
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

    const { id, message, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다' },
        { status: 400 }
      );
    }

    if (message !== undefined) {
      if (typeof message !== 'string' || message.trim().length === 0) {
        return NextResponse.json(
          { error: '공지사항 내용이 필요합니다' },
          { status: 400 }
        );
      }
    }

    // 기존 공지사항 확인
    const existingResult = await query(
      'SELECT id FROM announcements WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 활성화 시 다른 공지사항 비활성화
    if (is_active === true) {
      await query(
        'UPDATE announcements SET is_active = FALSE WHERE id != $1 AND is_active = TRUE',
        [id]
      );
    }

    // 업데이트
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (message !== undefined) {
      updateFields.push(`message = $${paramIndex++}`);
      updateValues.push(message.trim());
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다' },
        { status: 400 }
      );
    }

    updateValues.push(id);
    await query(
      `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [Announcements API] 수정 오류:', error);
    return NextResponse.json(
      { 
        error: '공지사항 수정 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/announcements
 * 공지사항 삭제 (관리자만)
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다' },
        { status: 400 }
      );
    }

    await query('DELETE FROM announcements WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [Announcements API] 삭제 오류:', error);
    return NextResponse.json(
      { 
        error: '공지사항 삭제 실패',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

