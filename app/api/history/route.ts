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

    const sessionUserId = session.user.id;
    const userEmail = session.user.email;
    
    console.log('📋 분석 이력 조회 요청:', { 
      sessionUserId, 
      userEmail,
      sessionUser: session.user 
    });
    
    // 안정성을 위해 이메일 기반으로 실제 사용자 ID 확인
    let actualUserId = sessionUserId;
    let user = null;
    
    // 1. 이메일로 사용자 찾기 (가장 안정적인 방법)
    if (userEmail) {
      const userByEmail = getUserByEmail(userEmail);
      if (userByEmail) {
        actualUserId = userByEmail.id;
        user = userByEmail;
        console.log('✅ 이메일로 실제 사용자 ID 확인:', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          email: userEmail
        });
      }
    }
    
    // 2. 이메일로 찾지 못한 경우, 세션 ID로 확인
    if (!user) {
      user = getUser(sessionUserId);
      if (user) {
        actualUserId = user.id;
        console.log('✅ 세션 ID로 사용자 확인:', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId
        });
      }
    }
    
    // 3. 사용자가 없고 이메일이 있는 경우, 이메일로 다시 시도
    if (!user && userEmail) {
      const retryUser = getUserByEmail(userEmail);
      if (retryUser) {
        actualUserId = retryUser.id;
        user = retryUser;
        console.log('🔄 재시도: 이메일로 사용자 발견:', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          email: userEmail
        });
      }
    }
    
    // 실제 사용자 ID로 분석 이력 조회
    let analyses = getUserAnalyses(actualUserId, { limit: 50 });
    
    // 분석 이력이 없고 세션 ID와 실제 ID가 다른 경우, 세션 ID로도 확인
    if (analyses.length === 0 && actualUserId !== sessionUserId) {
      const sessionAnalyses = getUserAnalyses(sessionUserId, { limit: 50 });
      if (sessionAnalyses.length > 0) {
        console.log('⚠️ 세션 ID로 분석 이력 발견:', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          count: sessionAnalyses.length
        });
        analyses = sessionAnalyses;
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

