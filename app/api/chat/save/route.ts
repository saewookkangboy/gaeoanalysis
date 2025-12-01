import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { saveOrUpdateChatConversation } from '@/lib/db-helpers';
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

  const body = await request.json();
  const { analysisId, messages, conversationId } = chatSaveSchema.parse(body);

  const savedConversationId = saveOrUpdateChatConversation({
    conversationId: conversationId || undefined,
    userId: session.user.id,
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

