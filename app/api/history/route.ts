import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserAnalyses, getUserByEmail, getUser } from '@/lib/db-helpers';
import db from '@/lib/db';

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
    
    // 실제 사용자 ID로 분석 이력 조회 (최적화: 즉시 조회, 실패 시 1회만 재시도)
    let analyses: any[] = [];
    
    // 첫 번째 시도: 즉시 조회
    analyses = getUserAnalyses(actualUserId, { limit: 50 });
    console.log('🔍 [History API] 실제 사용자 ID로 조회 결과:', {
      userId: actualUserId,
      count: analyses.length
    });
    
    // Vercel 환경에서 결과가 없고, Blob Storage 동기화가 필요한 경우에만 1회 재시도
    if (analyses.length === 0 && process.env.VERCEL) {
      // 최소 대기 시간만 적용 (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      analyses = getUserAnalyses(actualUserId, { limit: 50 });
      console.log('🔄 [History API] 재시도 조회 결과:', {
        userId: actualUserId,
        count: analyses.length
      });
    }
    
    // 디버깅: 조회 결과가 0개인 경우 추가 확인
    if (analyses.length === 0) {
      // 사용자 존재 확인
      const userCheck = getUser(actualUserId);
      console.warn('⚠️ [History API] 분석 이력이 0개, 사용자 확인:', {
        userId: actualUserId,
        userExists: !!userCheck,
        userEmail: userCheck?.email || 'N/A'
      });
      
      // 전체 분석 이력 개수 확인 (디버깅용)
      try {
        const totalStmt = db.prepare('SELECT COUNT(*) as count FROM analyses');
        const totalCount = (totalStmt.get() as { count: number })?.count || 0;
        const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM analyses WHERE user_id = ?');
        const userCount = (userCountStmt.get(actualUserId) as { count: number })?.count || 0;
        
        console.warn('🔍 [History API] 디버깅 정보:', {
          totalAnalysesInDB: totalCount,
          analysesForThisUser: userCount,
          userId: actualUserId
        });
        
        // user_id가 NULL인 분석 이력 확인
        const nullUserIdStmt = db.prepare('SELECT COUNT(*) as count FROM analyses WHERE user_id IS NULL');
        const nullCount = (nullUserIdStmt.get() as { count: number })?.count || 0;
        if (nullCount > 0) {
          console.warn('⚠️ [History API] user_id가 NULL인 분석 이력 발견:', { count: nullCount });
        }
        
        // 다른 사용자 ID로 저장된 분석 이력 확인
        const allUserStmt = db.prepare('SELECT user_id, COUNT(*) as count FROM analyses GROUP BY user_id LIMIT 10');
        const allUserCounts = allUserStmt.all() as Array<{ user_id: string; count: number }>;
        if (allUserCounts.length > 0) {
          console.warn('🔍 [History API] 모든 사용자별 분석 이력:', {
            requestedUserId: actualUserId,
            allUserCounts: allUserCounts
          });
        }
      } catch (error) {
        console.error('❌ [History API] 디버깅 쿼리 오류:', error);
      }
    }
    
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

    // 캐싱 헤더 추가 (클라이언트 사이드 캐싱 최적화)
    return NextResponse.json(
      { analyses },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('❌ 분석 이력 조회 오류:', error);
    return NextResponse.json(
      { error: '분석 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

