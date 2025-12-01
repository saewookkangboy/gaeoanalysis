import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserAnalyses } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const analyses = getUserAnalyses(session.user.id, { limit: 10 });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: '분석 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

