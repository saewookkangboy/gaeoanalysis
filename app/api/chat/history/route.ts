import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChatConversations } from '@/lib/db-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    const conversations = getChatConversations(session.user.id, analysisId || null);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: '대화 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

