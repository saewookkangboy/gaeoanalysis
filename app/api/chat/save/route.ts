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
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.warn('⚠️ [Chat Save] 인증되지 않은 요청');
      return createErrorResponse(
        'UNAUTHORIZED',
        '인증이 필요합니다.',
        401
      );
    }

    // 안정성을 위해 이메일 기반으로 실제 사용자 ID 확인
    let actualUserId = session.user.id;
    const userEmail = session.user.email;
    
    console.log('📝 [Chat Save] 요청 시작:', {
      sessionId: session.user.id,
      userEmail: userEmail
    });
    
    if (userEmail) {
      const userByEmail = await getUserByEmail(userEmail);
      if (userByEmail) {
        actualUserId = userByEmail.id;
        console.log('✅ [Chat Save] 이메일로 실제 사용자 ID 확인:', {
          sessionId: session.user.id,
          actualUserId: actualUserId,
          email: userEmail
        });
      } else {
        // 세션 ID로 확인
        const user = await getUser(session.user.id);
        if (user) {
          actualUserId = user.id;
          console.log('✅ [Chat Save] 세션 ID로 사용자 확인:', {
            sessionId: session.user.id,
            actualUserId: actualUserId
          });
        } else {
          console.error('❌ [Chat Save] 사용자를 찾을 수 없음:', {
            sessionId: session.user.id,
            email: userEmail
          });
          return createErrorResponse(
            'USER_NOT_FOUND',
            '사용자를 찾을 수 없습니다. 다시 로그인해주세요.',
            404
          );
        }
      }
    }

    // chat_conversations 테이블 존재 여부 확인
    try {
      const db = require('@/lib/db').default;
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_conversations'").get() as { name: string } | undefined;
      if (!tableInfo) {
        console.error('❌ [Chat Save] chat_conversations 테이블이 존재하지 않음');
        return createErrorResponse(
          'DATABASE_ERROR',
          '데이터베이스 테이블이 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.',
          500
        );
      }
    } catch (tableCheckError: any) {
      console.error('❌ [Chat Save] 테이블 확인 오류:', tableCheckError);
      return createErrorResponse(
        'DATABASE_ERROR',
        '데이터베이스 연결 오류가 발생했습니다.',
        500
      );
    }

    const body = await request.json();
    const { analysisId, messages, conversationId } = chatSaveSchema.parse(body);
    
    console.log('📝 [Chat Save] 요청 본문 파싱 완료:', {
      hasAnalysisId: !!analysisId,
      hasConversationId: !!conversationId,
      messagesCount: messages?.length || 0
    });

    console.log('💾 [Chat Save] 대화 저장 시작:', {
      conversationId: conversationId || 'new',
      userId: actualUserId,
      analysisId: analysisId || null,
      messagesCount: messages.length
    });

    const savedConversationId = await saveOrUpdateChatConversation({
      conversationId: conversationId || undefined,
      userId: actualUserId, // 실제 사용자 ID 사용
      analysisId: analysisId || null,
      messages,
    });

    console.log('✅ [Chat Save] 대화 저장 완료:', {
      conversationId: savedConversationId
    });

    return createSuccessResponse({ 
      success: true, 
      conversationId: savedConversationId 
    });
  } catch (error: any) {
    console.error('❌ [Chat Save] 처리 중 오류:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error; // withErrorHandling에서 처리
  }
}

export async function POST(request: NextRequest) {
  return await withErrorHandling(handleChatSave, '대화 저장 중 오류가 발생했습니다.')(request);
}

