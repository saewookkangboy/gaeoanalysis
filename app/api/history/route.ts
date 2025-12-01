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

    const userId = session.user.id;
    console.log('📋 분석 이력 조회 요청:', { userId });
    
    const analyses = getUserAnalyses(userId, { limit: 50 }); // 제한을 50개로 증가
    
    console.log('✅ 분석 이력 조회 성공:', { 
      userId, 
      count: analyses.length,
      analyses: analyses.map(a => ({ id: a.id, url: a.url, createdAt: a.createdAt }))
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('❌ 분석 이력 조회 오류:', error);
    return NextResponse.json(
      { error: '분석 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

