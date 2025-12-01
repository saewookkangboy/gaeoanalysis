import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUser, updateUserBlogUrl } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const user = getUser(session.user.id);

    return NextResponse.json({
      blogUrl: user?.blogUrl || null,
    });
  } catch (error) {
    console.error('Blog URL fetch error:', error);
    return NextResponse.json(
      { error: '블로그 URL 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { blogUrl } = await request.json();

    updateUserBlogUrl(session.user.id, blogUrl || null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Blog URL update error:', error);
    return NextResponse.json(
      { error: '블로그 URL 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

