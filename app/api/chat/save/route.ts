import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { saveOrUpdateChatConversation, getUserByEmail, getUser } from '@/lib/db-helpers';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { z } from 'zod';

// 입력 스키마 정의
const chatSaveSchema = z.object({
  analysisId: z.string().uuid().optional().nullable(),
  conversationId: z.string().uuid().optional().nullable(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string().optional(),
  })).min(1, '메시지가 필요합니다.'),
});

async function handleChatSave(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return createErrorResponse(
      'UNAUTHORIZED',
      '인증이 필요합니다.',
      401
    );
  }

  // 안정성을 위해 이메일 기반으로 실제 사용자 ID 확인
  let actualUserId = session.user.id;
  const userEmail = session.user.email;
  
  if (userEmail) {
    const userByEmail = getUserByEmail(userEmail);
    if (userByEmail) {
      actualUserId = userByEmail.id;
      console.log('✅ 채팅 저장: 이메일로 실제 사용자 ID 확인:', {
        sessionId: session.user.id,
        actualUserId: actualUserId,
        email: userEmail
      });
    } else {
      // 세션 ID로 확인
      const user = getUser(session.user.id);
      if (user) {
        actualUserId = user.id;
      }
    }
  }

  const body = await request.json();
  const { analysisId, messages, conversationId } = chatSaveSchema.parse(body);

  const savedConversationId = saveOrUpdateChatConversation({
    conversationId: conversationId || undefined,
    userId: actualUserId, // 실제 사용자 ID 사용
    analysisId: analysisId || null,
    messages,
  });

  return createSuccessResponse({ 
    success: true, 
    conversationId: savedConversationId 
  });
}

export async function POST(request: NextRequest) {
  return await withErrorHandling(handleChatSave, '대화 저장 중 오류가 발생했습니다.')(request);
}

