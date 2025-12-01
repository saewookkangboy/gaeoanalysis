import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeContent } from '@/lib/analyzer';
import { saveAnalysis, checkDuplicateAnalysis } from '@/lib/db-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 URL입니다.' },
        { status: 400 }
      );
    }

    // 분석 수행
    const result = await analyzeContent(url);

    // 세션 확인 (선택적)
    const session = await getServerSession(authOptions);
    let analysisId = null;

    // 로그인된 사용자인 경우 분석 결과 저장
    if (session?.user?.id) {
      // 중복 분석 확인 (24시간 내)
      const duplicateId = checkDuplicateAnalysis(session.user.id, url, 24);
      
      if (duplicateId) {
        // 중복이면 기존 ID 반환
        analysisId = duplicateId;
      } else {
        // 새 분석 저장 (트랜잭션 사용)
        analysisId = uuidv4();
        saveAnalysis({
          id: analysisId,
          userId: session.user.id,
          url,
          aeoScore: result.aeoScore,
          geoScore: result.geoScore,
          seoScore: result.seoScore,
          overallScore: result.overallScore,
          insights: result.insights,
          aioScores: result.aioAnalysis?.scores,
        });
      }
    }

    return NextResponse.json({
      ...result,
      id: analysisId,
      url,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

