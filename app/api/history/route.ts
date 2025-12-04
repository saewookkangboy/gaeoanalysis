import { NextRequest, NextResponse } from 'next/server';
import { auth, generateUserIdFromEmail } from '@/auth';
import { getUserAnalyses, getUserByEmail, getUser, getAnalysesByEmail } from '@/lib/db-helpers';
import { addSecurityHeaders, handleCorsPreflight } from '@/lib/headers';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  // CORS preflight 처리
  const corsResponse = handleCorsPreflight(request);
  if (corsResponse) {
    return corsResponse;
  }

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
    
    // 프로세스 2: Provider별 독립적인 사용자 ID 확인 (auth.ts와 동일한 로직)
    let actualUserId = sessionUserId;
    let user = null;
    const provider = session?.user?.provider || null;
    
    if (normalizedEmail && provider) {
      // 2-1. Provider + 이메일 기반 ID 생성 (auth.ts와 동일)
      const providerBasedUserId = generateUserIdFromEmail(normalizedEmail, provider);
      
      // 2-2. Provider별 사용자 찾기 (기존 사용자 확인)
      const existingUser = getUser(providerBasedUserId);
      if (existingUser) {
        // 기존 사용자가 있으면 그 ID 사용 (분석 이력 유지)
        actualUserId = existingUser.id;
        user = existingUser;
        console.log('✅ [History API] Provider별 기존 사용자 확인:', {
          sessionUserId: sessionUserId,
          providerBasedId: providerBasedUserId,
          actualUserId: actualUserId,
          email: normalizedEmail,
          provider: provider
        });
      } else {
        console.warn('⚠️ [History API] Provider별 사용자를 찾을 수 없음:', {
          email: normalizedEmail,
          provider: provider,
          providerBasedId: providerBasedUserId
        });
      }
    }
    
    // 2-4. 이메일로 찾지 못한 경우, 세션 ID로 확인
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
    
    // 프로세스 3: Provider별 독립적인 분석 이력 조회
    let analyses: any[] = [];
    
    // 3-1. Provider별 사용자 ID로 분석 이력 조회 (계정별 독립 관리)
    if (actualUserId) {
      analyses = getUserAnalyses(actualUserId, { limit: 50 });
      console.log('✅ [History API] Provider별 분석 이력 조회:', {
        userId: actualUserId,
        email: normalizedEmail,
        provider: provider,
        count: analyses.length
      });
    }
    
    // 3-2. 세션 ID와 실제 ID가 다르면 세션 ID로도 조회 (하위 호환성)
    if (analyses.length === 0 && actualUserId !== sessionUserId) {
      const sessionAnalyses = getUserAnalyses(sessionUserId, { limit: 50 });
      if (sessionAnalyses.length > 0) {
        console.log('🔍 [History API] 세션 ID로 조회 결과 (하위 호환성):', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          count: sessionAnalyses.length
        });
        analyses = sessionAnalyses;
      }
    }
    
    // 3-3. Provider별 분석 이력이 없으면 디버깅 정보 출력
    if (analyses.length === 0 && normalizedEmail && provider) {
      try {
        // Provider별 사용자 확인
        const providerBasedUserId = generateUserIdFromEmail(normalizedEmail, provider);
        const providerUser = getUser(providerBasedUserId);
        
        console.log('🔍 [History API] Provider별 분석 이력 확인:', {
          email: normalizedEmail,
          provider: provider,
          providerBasedUserId: providerBasedUserId,
          userExists: !!providerUser,
          message: '각 Provider 계정은 독립적인 사용자로 취급되며, 분석 이력은 Provider별로 분리됩니다.'
        });
        
        // 같은 이메일의 다른 Provider 사용자 확인 (디버깅용)
        const allProviderUsersStmt = db.prepare('SELECT id, email, provider FROM users WHERE LOWER(TRIM(email)) = ?');
        const allProviderUsers = allProviderUsersStmt.all(normalizedEmail) as Array<{ id: string; email: string; provider: string }>;
        
        if (allProviderUsers.length > 0) {
          console.log('📊 [History API] 같은 이메일의 Provider별 사용자:', {
            email: normalizedEmail,
            providers: allProviderUsers.map(u => ({ id: u.id, provider: u.provider })),
            message: '같은 이메일로 여러 Provider에 로그인한 경우 각각 독립적으로 관리됩니다.'
          });
        }
      } catch (error) {
        console.error('❌ [History API] 디버깅 정보 조회 오류:', error);
      }
    }
    
    // 3-4. Vercel 환경에서 결과가 없고, Blob Storage 동기화가 필요한 경우에만 1회 재시도
    if (analyses.length === 0 && process.env.VERCEL) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Provider별 사용자 ID로 다시 조회
      if (actualUserId) {
        analyses = getUserAnalyses(actualUserId, { limit: 50 });
        console.log('🔄 [History API] 재시도: Provider별 사용자 ID로 조회 결과:', {
          userId: actualUserId,
          provider: provider,
          count: analyses.length
        });
      }
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
            requestedEmail: normalizedEmail,
            allUserCounts: allUserCounts
          });
          
          // 이메일로 등록된 다른 사용자 ID가 있는지 확인
          if (normalizedEmail) {
            const emailUsersStmt = db.prepare('SELECT id, email FROM users WHERE LOWER(TRIM(email)) = ?');
            const emailUsers = emailUsersStmt.all(normalizedEmail) as Array<{ id: string; email: string }>;
            console.warn('🔍 [History API] 이메일로 등록된 모든 사용자:', {
              email: normalizedEmail,
              users: emailUsers,
              analysisCounts: allUserCounts.filter(uc => emailUsers.some(u => u.id === uc.user_id))
            });
          }
        }
      } catch (error) {
        console.error('❌ [History API] 디버깅 쿼리 오류:', error);
      }
    }
    
    
    console.log('✅ [History API] 분석 이력 조회 완료:', { 
      sessionUserId: sessionUserId,
      actualUserId: actualUserId, 
      userEmail: normalizedEmail,
      count: analyses.length,
      analyses: analyses.map(a => ({ id: a.id, url: a.url, createdAt: a.createdAt }))
    });

    // 응답 생성 및 보안 헤더 추가
    const response = NextResponse.json(
      { analyses },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
    
    return addSecurityHeaders(request, response);
  } catch (error) {
    console.error('❌ 분석 이력 조회 오류:', error);
    const errorResponse = NextResponse.json(
      { error: '분석 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
    return addSecurityHeaders(request, errorResponse);
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCorsPreflight(request);
  if (corsResponse) {
    return corsResponse;
  }
  return new NextResponse(null, { status: 200 });
}

