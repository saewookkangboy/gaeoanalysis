/**
 * 알고리즘 초기화 API
 * 
 * 초기 알고리즘 버전 생성 및 리서치 데이터 삽입
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';
import { initializeAlgorithms, initializeAlgorithmVersions, initializeResearchFindings } from '@/lib/algorithm-initializer';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    // 관리자 권한 확인 (선택적 - 필요시 추가)
    // if (session.user.email !== 'admin@example.com') {
    //   return createErrorResponse('FORBIDDEN', '관리자 권한이 필요합니다.', 403);
    // }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'initialize-all':
        // 전체 초기화
        initializeAlgorithms();
        return createSuccessResponse({
          message: '알고리즘 초기화가 완료되었습니다.',
        });

      case 'initialize-versions':
        // 알고리즘 버전만 초기화
        initializeAlgorithmVersions();
        return createSuccessResponse({
          message: '알고리즘 버전 초기화가 완료되었습니다.',
        });

      case 'initialize-research':
        // 리서치 데이터만 초기화
        initializeResearchFindings();
        return createSuccessResponse({
          message: '리서치 데이터 초기화가 완료되었습니다.',
        });

      default:
        return createErrorResponse(
          'VALIDATION_ERROR',
          '지원하지 않는 action입니다. (initialize-all, initialize-versions, initialize-research)',
          400
        );
    }
  } catch (error) {
    console.error('❌ [Algorithm Initialize API] 오류:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      '알고리즘 초기화 중 오류가 발생했습니다.',
      500
    );
  }
}

