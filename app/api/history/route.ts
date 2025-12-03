import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserAnalyses, getUserByEmail, getUser } from '@/lib/db-helpers';

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
    
    // 이메일 정규화
    const normalizedEmail = userEmail ? userEmail.toLowerCase().trim() : null;
    
    console.log('📋 [History API] 분석 이력 조회 요청:', { 
      sessionUserId, 
      userEmail: normalizedEmail,
      rawEmail: userEmail,
      sessionUser: session.user 
    });
    
    // 안정성을 위해 이메일 기반으로 실제 사용자 ID 확인
    let actualUserId = sessionUserId;
    let user = null;
    const userIdsToCheck: string[] = [sessionUserId]; // 확인할 사용자 ID 목록
    
    // 1. 이메일로 사용자 찾기 (가장 안정적인 방법)
    if (normalizedEmail) {
      const userByEmail = getUserByEmail(normalizedEmail);
      if (userByEmail) {
        actualUserId = userByEmail.id;
        user = userByEmail;
        if (!userIdsToCheck.includes(actualUserId)) {
          userIdsToCheck.push(actualUserId);
        }
        console.log('✅ [History API] 이메일로 실제 사용자 ID 확인:', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          email: normalizedEmail
        });
      } else {
        console.warn('⚠️ [History API] 이메일로 사용자를 찾을 수 없음:', {
          email: normalizedEmail
        });
      }
    }
    
    // 2. 이메일로 찾지 못한 경우, 세션 ID로 확인
    if (!user) {
      user = getUser(sessionUserId);
      if (user) {
        actualUserId = user.id;
        console.log('✅ [History API] 세션 ID로 사용자 확인:', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId
        });
      } else {
        console.warn('⚠️ [History API] 세션 ID로 사용자를 찾을 수 없음:', {
          sessionUserId: sessionUserId
        });
      }
    }
    
    // 3. 사용자가 없고 이메일이 있는 경우, 이메일로 다시 시도
    if (!user && normalizedEmail) {
      const retryUser = getUserByEmail(normalizedEmail);
      if (retryUser) {
        actualUserId = retryUser.id;
        user = retryUser;
        if (!userIdsToCheck.includes(actualUserId)) {
          userIdsToCheck.push(actualUserId);
        }
        console.log('🔄 [History API] 재시도: 이메일로 사용자 발견:', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          email: normalizedEmail
        });
      }
    }
    
    // 실제 사용자 ID로 분석 이력 조회
    let analyses = getUserAnalyses(actualUserId, { limit: 50 });
    console.log('🔍 [History API] 실제 사용자 ID로 조회 결과:', {
      userId: actualUserId,
      count: analyses.length
    });
    
    // 분석 이력이 없고 세션 ID와 실제 ID가 다른 경우, 세션 ID로도 확인
    if (analyses.length === 0 && actualUserId !== sessionUserId) {
      const sessionAnalyses = getUserAnalyses(sessionUserId, { limit: 50 });
      console.log('🔍 [History API] 세션 ID로 조회 결과:', {
        userId: sessionUserId,
        count: sessionAnalyses.length
      });
      if (sessionAnalyses.length > 0) {
        console.log('⚠️ [History API] 세션 ID로 분석 이력 발견 (ID 불일치):', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          count: sessionAnalyses.length
        });
        analyses = sessionAnalyses;
        actualUserId = sessionUserId; // 세션 ID로 이력이 있으면 세션 ID 사용
      }
    }
    
    // 모든 확인할 ID로 조회 시도 (디버깅용)
    if (analyses.length === 0 && userIdsToCheck.length > 1) {
      console.log('🔍 [History API] 모든 가능한 사용자 ID로 조회 시도:', userIdsToCheck);
      for (const checkUserId of userIdsToCheck) {
        const checkAnalyses = getUserAnalyses(checkUserId, { limit: 50 });
        if (checkAnalyses.length > 0) {
          console.log('✅ [History API] 다른 사용자 ID로 분석 이력 발견:', {
            userId: checkUserId,
            count: checkAnalyses.length
          });
          analyses = checkAnalyses;
          actualUserId = checkUserId;
          break;
        }
      }
    }
    
    console.log('✅ [History API] 분석 이력 조회 완료:', { 
      sessionUserId: sessionUserId,
      actualUserId: actualUserId, 
      userEmail: normalizedEmail,
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

