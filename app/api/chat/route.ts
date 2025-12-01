import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildAIAgentPrompt } from '@/lib/ai-agent-prompt';

// Next.js API 라우트 응답 크기 제한 해제 (긴 AI 응답을 위해)
export const maxDuration = 60; // 60초 타임아웃
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { message, analysisData, aioAnalysis, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
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

    const prompt = buildAIAgentPrompt(message, context);

    // 스트리밍으로 전체 응답 수집
    let fullText = '';
    
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

    return NextResponse.json({ message: fullText });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '챗봇 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

