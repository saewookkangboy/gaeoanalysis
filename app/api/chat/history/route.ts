import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getChatConversations, getUserByEmail, getUser } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 안정성을 위해 이메일 기반으로 실제 사용자 ID 확인
    let actualUserId = session.user.id;
    const userEmail = session.user.email;
    
    if (userEmail) {
      const userByEmail = await getUserByEmail(userEmail);
      if (userByEmail) {
        actualUserId = userByEmail.id;
        console.log('✅ 채팅 이력 조회: 이메일로 실제 사용자 ID 확인:', {
          sessionId: session.user.id,
          actualUserId: actualUserId,
          email: userEmail
        });
      } else {
        // 세션 ID로 확인
        const user = await getUser(session.user.id);
        if (user) {
          actualUserId = user.id;
        }
      }
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    const conversations = getChatConversations(actualUserId, analysisId || null);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: '대화 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

