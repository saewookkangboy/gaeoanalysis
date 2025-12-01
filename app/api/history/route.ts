import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserAnalyses, getUserByEmail } from '@/lib/db-helpers';

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
    const userEmail = session.user.email;
    
    console.log('📋 분석 이력 조회 요청:', { 
      userId, 
      userEmail,
      sessionUser: session.user 
    });
    
    // 사용자 ID로 분석 이력 조회
    let analyses = getUserAnalyses(userId, { limit: 50 });
    
    // 분석 이력이 없고 이메일이 있는 경우, 이메일로 사용자 찾기 시도
    if (analyses.length === 0 && userEmail) {
      const userByEmail = getUserByEmail(userEmail);
      
      if (userByEmail && userByEmail.id !== userId) {
        console.log('⚠️ 세션 user.id와 DB user.id가 다릅니다. 이메일로 사용자 찾기:', {
          sessionUserId: userId,
          dbUserId: userByEmail.id,
          email: userEmail
        });
        
        // DB의 실제 사용자 ID로 분석 이력 조회
        analyses = getUserAnalyses(userByEmail.id, { limit: 50 });
      }
    }
    
    console.log('✅ 분석 이력 조회 성공:', { 
      userId, 
      userEmail,
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

