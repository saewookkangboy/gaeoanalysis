import { NextRequest, NextResponse } from 'next/server';
import { auth, generateUserIdFromEmail } from '@/auth';
import { getUserAnalyses, getUserByEmail, getUser, getAnalysesByEmail } from '@/lib/db-helpers';
import { addSecurityHeaders, handleCorsPreflight } from '@/lib/headers';
import { query, isPostgreSQL, isSQLite } from '@/lib/db-adapter';
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
      const existingUser = await getUser(providerBasedUserId);
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
        // Provider 기반 ID로 사용자를 찾지 못한 경우
        // 같은 Provider로 등록된 사용자가 있는지 확인 (기존 사용자 ID 마이그레이션 대비)
        if (provider) {
          let providerUser: { id: string; email: string; provider: string } | null = null;
          
          if (isPostgreSQL()) {
            const providerUserResult = await query(
              'SELECT id, email, provider FROM users WHERE LOWER(TRIM(email)) = $1 AND provider = $2',
              [normalizedEmail, provider]
            );
            providerUser = providerUserResult.rows[0] as { id: string; email: string; provider: string } | null;
          } else {
            const providerUserStmt = db.prepare('SELECT id, email, provider FROM users WHERE LOWER(TRIM(email)) = ? AND provider = ?');
            providerUser = providerUserStmt.get(normalizedEmail, provider) as { id: string; email: string; provider: string } | undefined || null;
          }
          
          if (providerUser) {
            // 같은 Provider로 등록된 사용자가 있지만 ID가 다른 경우
            // 기존 사용자 ID를 사용 (마이그레이션 전 상태)
            actualUserId = providerUser.id;
            user = await getUser(providerUser.id);
            console.log('✅ [History API] 같은 Provider로 등록된 사용자 확인 (기존 ID):', {
              sessionUserId: sessionUserId,
              providerBasedId: providerBasedUserId,
              actualUserId: actualUserId,
              email: normalizedEmail,
              provider: provider,
              note: '기존 사용자 ID를 사용 중입니다. 다음 로그인 시 Provider 기반 ID로 마이그레이션됩니다.'
            });
          } else {
            console.warn('⚠️ [History API] Provider별 사용자를 찾을 수 없음:', {
              email: normalizedEmail,
              provider: provider,
              providerBasedId: providerBasedUserId
            });
          }
        }
      }
    }
    
    // 2-4. 이메일로 찾지 못한 경우, 세션 ID로 확인
    if (!user) {
      user = await getUser(sessionUserId);
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
      analyses = await getUserAnalyses(actualUserId, { limit: 50 });
      console.log('✅ [History API] Provider별 분석 이력 조회:', {
        userId: actualUserId,
        email: normalizedEmail,
        provider: provider,
        count: analyses.length
      });
    }
    
    // 3-2. 세션 ID와 실제 ID가 다르면 세션 ID로도 조회 (하위 호환성)
    if (analyses.length === 0 && actualUserId !== sessionUserId) {
      const sessionAnalyses = await getUserAnalyses(sessionUserId, { limit: 50 });
      if (sessionAnalyses.length > 0) {
        console.log('🔍 [History API] 세션 ID로 조회 결과 (하위 호환성):', {
          sessionUserId: sessionUserId,
          actualUserId: actualUserId,
          count: sessionAnalyses.length
        });
        analyses = sessionAnalyses;
      }
    }
    
    // 3-3. 결과가 없으면 간단히 로그만 출력 (성능 개선: 불필요한 디버깅 쿼리 제거)
    if (analyses.length === 0 && normalizedEmail && provider) {
      console.log('ℹ️ [History API] 분석 이력이 없습니다:', {
        email: normalizedEmail,
        provider: provider,
        userId: actualUserId
      });
    }
    
    // 디버깅: 조회 결과가 0개인 경우 최소한의 확인만 수행 (성능 개선)
    if (analyses.length === 0) {
      // 성능 개선: 불필요한 디버깅 쿼리 제거, 최소한의 확인만 수행
      try {
        const userCheck = await getUser(actualUserId);
        if (!userCheck) {
          console.warn('⚠️ [History API] 사용자를 찾을 수 없습니다:', {
            userId: actualUserId,
            email: normalizedEmail
          });
        }
      } catch (error) {
        // 조용히 무시 (성능 우선)
      }
    }
    
    // 성능 개선: 프로덕션에서는 상세 로그 제거
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [History API] 분석 이력 조회 완료:', { 
        sessionUserId: sessionUserId,
        actualUserId: actualUserId, 
        userEmail: normalizedEmail,
        count: analyses.length
      });
    }

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

