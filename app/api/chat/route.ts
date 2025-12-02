import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAIAgentPrompt } from '@/lib/ai-agent-prompt';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/rate-limiter';
import { auth } from '@/auth';
import { z } from 'zod';
import { agentLightning } from '@/lib/agent-lightning';

// Next.js API 라우트 응답 크기 제한 해제 (긴 AI 응답을 위해)
export const maxDuration = 60; // 60초 타임아웃
export const dynamic = 'force-dynamic';

// 입력 스키마 정의
const chatSchema = z.object({
  message: z.string().min(1, '메시지가 필요합니다.').max(2000, '메시지는 2000자 이하여야 합니다.'),
  analysisData: z.any().optional(),
  aioAnalysis: z.any().optional(),
  conversationHistory: z.array(z.any()).optional(),
});

// 레이트 리미트 키 생성
const getChatRateLimitKey = (request: NextRequest, userId?: string): string => {
  if (userId) {
    return `chat:user:${userId}`;
  }
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `chat:ip:${ip}`;
};

async function handleChat(request: NextRequest) {
  const body = await request.json();
  const { message, analysisData, aioAnalysis, conversationHistory } = chatSchema.parse(body);

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

    const genAI = new GoogleGenerativeAI(apiKey);
    // 최신 Gemini 모델 사용 (gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // 최신 Flash 모델
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // 적절한 토큰 제한 (빠른 처리 + 충분한 응답)
      },
    });

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

    // 스트리밍으로 전체 응답 수집
    let fullText = '';
    const startTime = Date.now();
    
    try {
      const result = await model.generateContentStream(prompt);
      
      // 스트림에서 모든 청크 수집
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
        }
      }
    } catch (streamError) {
      console.warn('스트리밍 실패, 일반 모드로 전환:', streamError);
      // 스트리밍이 실패하면 일반 generateContent 사용
      const fallbackResult = await model.generateContent(prompt);
      const fallbackResponse = await fallbackResult.response;
      
      // 전체 응답 수집 - 여러 후보(candidates)가 있을 경우 모두 수집
      if (fallbackResponse.candidates && fallbackResponse.candidates.length > 0) {
        for (const candidate of fallbackResponse.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                fullText += part.text;
              }
            }
          }
        }
      }
      
      // 후보가 없거나 텍스트가 없으면 기본 text() 메서드 사용
      if (!fullText) {
        fullText = fallbackResponse.text();
      }
    }

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

  return createSuccessResponse({ message: fullText });
}

// 레이트 리미트 키 생성 함수
const getChatRateLimitKeyAsync = async (request: NextRequest): Promise<string> => {
  const session = await auth();
  return getChatRateLimitKey(request, session?.user?.id);
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

