import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveOrUpdateChatConversation } from '@/lib/db-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { analysisId, messages, conversationId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const savedConversationId = saveOrUpdateChatConversation({
      conversationId,
      userId: session.user.id,
      analysisId: analysisId || null,
      messages,
    });

    return NextResponse.json({ success: true, conversationId: savedConversationId });
  } catch (error) {
    console.error('Chat save error:', error);
    return NextResponse.json(
      { error: '대화 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

