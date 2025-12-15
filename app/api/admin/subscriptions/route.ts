import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAllSubscriptions } from '@/lib/admin-helpers';
import { getAllUsage } from '@/lib/usage-helpers';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * GET /api/admin/subscriptions
 * 모든 구독 정보 조회 (관리자용)
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const session = await auth();
    if (!session?.user?.id) {
      return createErrorResponse('UNAUTHORIZED', '인증이 필요합니다.', 401);
    }

    // 관리자 권한 확인 (role이 'admin'인지 확인)
    // TODO: 실제 관리자 권한 확인 로직 추가
    // const isAdmin = session.user.role === 'admin';
    // if (!isAdmin) {
    //   return createErrorResponse('FORBIDDEN', '관리자 권한이 필요합니다.', 403);
    // }

    const searchParams = request.nextUrl.searchParams;
    const planTypeParam = searchParams.get('planType');
    const planType = planTypeParam && planTypeParam !== 'all' 
      ? (planTypeParam as 'free' | 'pro' | 'business')
      : null;
    const statusParam = searchParams.get('status');
    const status = statusParam && statusParam !== 'all'
      ? (statusParam as 'active' | 'cancelled' | 'expired')
      : null;
    const search = searchParams.get('search');

    // 모든 구독 조회
    const subscriptions = await getAllSubscriptions();

    // 필터링
    let filtered = subscriptions;

    if (planType) {
      filtered = filtered.filter(s => s.planType === planType);
    }

    if (status) {
      filtered = filtered.filter(s => {
        const now = new Date();
        const periodEnd = new Date(s.currentPeriodEnd);
        
        if (status === 'active') {
          return !s.cancelAtPeriodEnd && periodEnd > now;
        } else if (status === 'cancelled') {
          return s.cancelAtPeriodEnd && periodEnd > now;
        } else if (status === 'expired') {
          return periodEnd <= now;
        }
        return true;
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.userEmail?.toLowerCase().includes(searchLower) ||
        s.userId?.toLowerCase().includes(searchLower)
      );
    }

    // 사용량 정보 추가
    const subscriptionsWithUsage = filtered.map(subscription => {
      const usage = getAllUsage(subscription.userId);
      // getAllUsage는 객체를 반환하므로 직접 접근
      return {
        ...subscription,
        status: (() => {
          const now = new Date();
          const periodEnd = new Date(subscription.currentPeriodEnd);
          
          if (periodEnd <= now) {
            return 'expired';
          } else if (subscription.cancelAtPeriodEnd) {
            return 'cancelled';
          } else {
            return 'active';
          }
        })(),
        usage: {
          analysis: {
            used: usage.analysis?.used || 0,
            limit: usage.analysis?.limit || 0,
          },
          chat: {
            used: usage.chat?.used || 0,
            limit: usage.chat?.limit || 0,
          },
          export: {
            used: usage.export?.used || 0,
            limit: usage.export?.limit || 0,
          },
        },
      };
    });

    return createSuccessResponse({
      subscriptions: subscriptionsWithUsage,
      total: subscriptionsWithUsage.length,
    });
  } catch (error: any) {
    console.error('구독 목록 조회 오류:', error);
    return createErrorResponse('INTERNAL_ERROR', '구독 목록을 조회할 수 없습니다.', 500);
  }
}

