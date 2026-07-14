import { NextRequest } from 'next/server';
import { generateText } from '@/lib/llm/gemini';
import { modelForTask } from '@/lib/llm/models';
import { buildAIAgentPrompt } from '@/lib/ai-agent-prompt';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/rate-limiter';
import { auth } from '@/auth';
import { saveAIAgentUsage } from '@/lib/db-helpers';
import { z } from 'zod';
import { agentLightning } from '@/lib/agent-lightning';
import { v4 as uuidv4 } from 'uuid';

// Next.js API 라우트 응답 크기 제한 해제 (긴 AI 응답을 위해)
export const maxDuration = 60; // 60초 타임아웃
export const dynamic = 'force-dynamic';

// 입력 스키마 정의
const chatSchema = z.object({
  message: z.string().min(1, '메시지가 필요합니다.').max(2000, '메시지는 2000자 이하여야 합니다.'),
  analysisData: z.any().optional(),
  aioAnalysis: z.any().optional(),
  conversationHistory: z.array(z.any()).optional(),
  analysisId: z.string().uuid().optional().nullable(),
  conversationId: z.string().uuid().optional().nullable(),
  isQuickQuestion: z.boolean().optional(), // 추천 질문 사용 여부
});

// 레이트 리미트 키 생성
const getChatRateLimitKey = async (request: NextRequest, userId?: string): Promise<string> => {
  if (userId) {
    return `chat:user:${userId}`;
  }
  const { normalizeIpAddress } = await import('@/lib/security-utils');
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `chat:ip:${normalizeIpAddress(ip)}`;
};

async function handleChat(request: NextRequest) {
  const body = await request.json();
  const { message, analysisData, aioAnalysis, conversationHistory, analysisId, conversationId, isQuickQuestion } = chatSchema.parse(body);

  // 메시지 길이 제한 (XSS 방지를 위한 기본 검증)
  if (message.length > 2000) {
    return createErrorResponse(
      'VALIDATION_ERROR',
      '메시지는 2000자 이하여야 합니다.',
      400
    );
  }

  // 세션 확인
  const session = await auth();
  const userId = session?.user?.id;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return createErrorResponse(
      'CONFIG_ERROR',
      'Gemini API 키가 설정되지 않았습니다.',
      500
    );
  }

    // 고도화된 프롬프트 생성
    const context = {
      messages: conversationHistory || [],
      analysisData: analysisData || null,
      aioAnalysis: aioAnalysis || null,
    };

  // Agent Lightning: 프롬프트 생성 전 Span 발생
  agentLightning.emitSpan({
    type: 'prompt',
    agentType: 'chat',
    data: {
      userMessage: message,
      analysisData: analysisData ? {
        overallScore: analysisData.overallScore,
        aeoScore: analysisData.aeoScore,
        geoScore: analysisData.geoScore,
        seoScore: analysisData.seoScore,
      } : null,
    },
    metadata: {
      userId,
      conversationLength: conversationHistory?.length || 0,
    },
  });

  // Agent Lightning: 최적화된 프롬프트 사용 (선택적)
  const useOptimizedPrompt = process.env.ENABLE_AGENT_LIGHTNING === 'true';
  const prompt = useOptimizedPrompt
    ? agentLightning.getOptimizedPrompt('chat', analysisData, aioAnalysis, context)
    : buildAIAgentPrompt(message, context);

    // 응답은 JSON으로 버퍼링되어 반환되므로 단일 호출로 전체 텍스트를 수집합니다.
    const startTime = Date.now();
    const generation = await generateText({
      model: modelForTask('chat'),
      prompt,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    });
    const fullText = generation.text;

    const responseTime = Date.now() - startTime;

    // Agent Lightning: 응답 Span 발생
    agentLightning.emitSpan({
      type: 'response',
      agentType: 'chat',
      data: {
        response: fullText,
        responseLength: fullText.length,
        responseTime,
      },
      metadata: {
        userId,
      },
    });

    // Agent Lightning: 응답 품질 평가 및 Reward 발생
    const reward = agentLightning.evaluateResponse('chat', fullText, {
      userMessage: message,
      analysisData,
      aioAnalysis,
    });
    agentLightning.emitReward(reward);

    // AI Agent 사용 기록 저장 (비동기로 처리하여 응답 속도에 영향 없도록)
    if (userId) {
      Promise.resolve().then(async () => {
        try {
          // 실제 usageMetadata 토큰 수 사용 (없으면 길이 기반으로 폴백)
          const estimatedInputTokens =
            generation.inputTokens || Math.ceil((prompt.length + message.length) / 4);
          const estimatedOutputTokens =
            generation.outputTokens || Math.ceil(fullText.length / 4);

          // 비용 추정 (Gemini Flash 기준)
          // Input: $0.075 per 1M tokens, Output: $0.30 per 1M tokens
          const estimatedCost = (estimatedInputTokens / 1000000) * 0.075 + (estimatedOutputTokens / 1000000) * 0.30;
          
          await saveAIAgentUsage({
            id: uuidv4(),
            userId: userId,
            analysisId: analysisId || null,
            conversationId: conversationId || null,
            agentType: 'gemini',
            action: isQuickQuestion ? 'quick_question' : 'user_query',
            inputTokens: estimatedInputTokens,
            outputTokens: estimatedOutputTokens,
            cost: estimatedCost,
            responseTimeMs: responseTime,
            success: true,
            errorMessage: null,
          });
          
          console.log('✅ [Chat API] AI Agent 사용 기록 저장 완료:', {
            userId,
            agentType: 'gemini',
            action: isQuickQuestion ? 'quick_question' : 'user_query',
            responseTime
          });
        } catch (error: any) {
          // 사용 기록 저장 실패는 조용히 무시 (응답은 성공)
          console.warn('⚠️ [Chat API] AI Agent 사용 기록 저장 실패:', error.message);
        }
      });
    }

  return createSuccessResponse({ message: fullText });
}

// 레이트 리미트 키 생성 함수
const getChatRateLimitKeyAsync = async (request: NextRequest): Promise<string> => {
  const session = await auth();
  return await getChatRateLimitKey(request, session?.user?.id);
};

// 레이트 리미트 적용된 핸들러 (사용자당 1분에 20회)
const rateLimitedHandler = withRateLimit(
  20, // 1분에 20회
  60 * 1000, // 1분
  getChatRateLimitKeyAsync
)(withErrorHandling(handleChat, '챗봇 응답 생성 중 오류가 발생했습니다.'));

export async function POST(request: NextRequest) {
  return await rateLimitedHandler(request);
}

