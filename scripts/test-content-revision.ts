/**
 * 콘텐츠 수정안 미리보기 테스트 스크립트
 * 네이버 블로그 URL로 분석 후 콘텐츠 수정안 미리보기 테스트
 */

const TEST_URL = 'https://blog.naver.com/mercyblu/224144269771';
const API_BASE = 'http://localhost:3000';

async function testContentRevision() {
  console.log('🧪 콘텐츠 수정안 미리보기 테스트 시작\n');
  console.log(`📝 테스트 URL: ${TEST_URL}\n`);
  console.log('⚠️  참고: 이 테스트는 로그인이 필요합니다.\n');
  console.log('💡 브라우저에서 직접 테스트하는 방법:');
  console.log(`   1. ${API_BASE} 접속`);
  console.log(`   2. 로그인 (Google/GitHub)`);
  console.log(`   3. URL 입력: ${TEST_URL}`);
  console.log(`   4. "분석 시작" 클릭`);
  console.log(`   5. 분석 완료 후 "콘텐츠 수정안 미리 보기 (개발 모드)" 버튼 클릭\n`);
  console.log('='.repeat(80) + '\n');

  // 브라우저에서 직접 테스트하도록 안내
  console.log('✅ 테스트 가이드 제공 완료\n');
  console.log('📋 테스트 체크리스트:');
  console.log('   [ ] 로그인 완료');
  console.log('   [ ] URL 입력 및 분석 완료');
  console.log('   [ ] 콘텐츠 수정안 미리보기 버튼 표시 확인');
  console.log('   [ ] 미리보기 생성 성공');
  console.log('   [ ] 텍스트 중심으로 표시되는지 확인');
  console.log('   [ ] 원문 구조가 유지되는지 확인');
  console.log('   [ ] 복사 기능 작동 확인\n');
  
  return;

  try {
    // 1단계: 분석 진행 (로그인 필요로 인해 주석 처리)
    console.log('1️⃣ 분석 진행 중...');
    const analyzeResponse = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: TEST_URL,
      }),
    });

    if (!analyzeResponse.ok) {
      const error = await analyzeResponse.json().catch(() => ({ error: analyzeResponse.statusText }));
      console.error('❌ 분석 에러 상세:', JSON.stringify(error, null, 2));
      throw new Error(`분석 실패: ${error.error?.message || error.error || analyzeResponse.statusText}`);
    }

    const analysisResult = await analyzeResponse.json();
    console.log('✅ 분석 완료');
    console.log(`   - SEO: ${analysisResult.seoScore}/100`);
    console.log(`   - AEO: ${analysisResult.aeoScore}/100`);
    console.log(`   - GEO: ${analysisResult.geoScore}/100`);
    console.log(`   - 종합: ${analysisResult.overallScore}/100\n`);

    // 2단계: 콘텐츠 수정안 미리보기 생성
    console.log('2️⃣ 콘텐츠 수정안 미리보기 생성 중...');
    
    // 로그인이 필요한 경우를 대비해 세션 확인
    // 실제로는 로그인이 필요하지만, 테스트를 위해 분석 결과만 사용
    
    const previewResponse = await fetch(`${API_BASE}/api/content/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 실제로는 세션 쿠키가 필요하지만 테스트를 위해 시도
      },
      body: JSON.stringify({
        url: TEST_URL,
        analysisResult: analysisResult,
      }),
    });

    if (!previewResponse.ok) {
      const error = await previewResponse.json();
      if (previewResponse.status === 401) {
        console.log('⚠️  로그인이 필요합니다. 브라우저에서 직접 테스트해주세요.');
        console.log(`   브라우저에서 ${API_BASE} 접속 후 로그인하고 테스트하세요.\n`);
        return;
      }
      throw new Error(`미리보기 생성 실패: ${error.error || previewResponse.statusText}`);
    }

    const previewData = await previewResponse.json();
    console.log('✅ 미리보기 생성 완료');
    
    if (previewData.cached) {
      console.log('   (캐시에서 반환됨)');
    }
    
    if (previewData.processingTime) {
      console.log(`   처리 시간: ${previewData.processingTime}ms`);
    }

    // 3단계: 결과 확인
    console.log('\n3️⃣ 수정안 미리보기 결과:\n');
    console.log('='.repeat(80));
    
    if (previewData.preview.predictedScores) {
      console.log('\n📈 예상 점수 변화:');
      console.log(`   SEO: ${analysisResult.seoScore} → ${previewData.preview.predictedScores.seo} (${previewData.preview.predictedScores.seo - analysisResult.seoScore >= 0 ? '+' : ''}${previewData.preview.predictedScores.seo - analysisResult.seoScore})`);
      console.log(`   AEO: ${analysisResult.aeoScore} → ${previewData.preview.predictedScores.aeo} (${previewData.preview.predictedScores.aeo - analysisResult.aeoScore >= 0 ? '+' : ''}${previewData.preview.predictedScores.aeo - analysisResult.aeoScore})`);
      console.log(`   GEO: ${analysisResult.geoScore} → ${previewData.preview.predictedScores.geo} (${previewData.preview.predictedScores.geo - analysisResult.geoScore >= 0 ? '+' : ''}${previewData.preview.predictedScores.geo - analysisResult.geoScore})`);
      console.log(`   종합: ${analysisResult.overallScore} → ${previewData.preview.predictedScores.overall} (${previewData.preview.predictedScores.overall - analysisResult.overallScore >= 0 ? '+' : ''}${previewData.preview.predictedScores.overall - analysisResult.overallScore})`);
    }

    if (previewData.preview.improvements && previewData.preview.improvements.length > 0) {
      console.log('\n✨ 주요 개선 사항:');
      previewData.preview.improvements.forEach((improvement: string, idx: number) => {
        console.log(`   ${idx + 1}. ${improvement}`);
      });
    }

    console.log('\n📄 수정된 콘텐츠 (텍스트 중심):');
    console.log('-'.repeat(80));
    
    // 텍스트만 추출하여 표시
    const revisedText = previewData.preview.revisedMarkdown
      .replace(/<[^>]+>/g, ' ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // 처음 1000자만 표시
    const displayText = revisedText.length > 1000 
      ? revisedText.substring(0, 1000) + '\n\n... (이하 생략)'
      : revisedText;
    
    console.log(displayText);
    console.log('\n' + '='.repeat(80));
    
    // 텍스트 길이 확인
    console.log(`\n📊 통계:`);
    console.log(`   - 원본 텍스트 길이: ${revisedText.length}자`);
    console.log(`   - HTML 태그 포함 여부: ${previewData.preview.revisedMarkdown.includes('<') ? '예' : '아니오'}`);
    console.log(`   - 마크다운 문법 포함 여부: ${previewData.preview.revisedMarkdown.match(/^#{1,6}|\[.*\]\(.*\)|\*\*.*\*\*/) ? '예' : '아니오'}`);
    
    console.log('\n✅ 테스트 완료!');
    console.log('\n💡 브라우저에서 확인하려면:');
    console.log(`   1. ${API_BASE} 접속`);
    console.log(`   2. 로그인`);
    console.log(`   3. URL 입력: ${TEST_URL}`);
    console.log(`   4. 분석 시작 후 "콘텐츠 수정안 미리 보기 (개발 모드)" 버튼 클릭\n`);

  } catch (error: any) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 실행
testContentRevision();
