/**
 * 프롬프트 빌더 테스트
 * 원문 구조 추출 및 텍스트 중심 프롬프트 생성 확인
 */

import { buildRevisionPrompt } from '../prompt-builder';
import { AnalysisResult } from '@/lib/analyzer';

describe('buildRevisionPrompt', () => {
  const mockAnalysisResult: AnalysisResult = {
    seoScore: 25,
    aeoScore: 0,
    geoScore: 35,
    overallScore: 20,
    insights: [
      { severity: 'High', category: 'SEO', message: 'H1 태그가 없습니다' },
      { severity: 'High', category: 'AEO', message: 'FAQ 섹션이 없습니다' },
      { severity: 'High', category: 'GEO', message: '콘텐츠가 너무 짧습니다' },
    ],
    improvementPriorities: [
      {
        category: 'SEO',
        priority: 1,
        reason: '검색 엔진 최적화 필요',
        actionableTips: [
          {
            title: 'H1 태그 추가',
            steps: ['제목에 H1 태그 추가'],
            expectedImpact: 'SEO 점수 +10',
          },
        ],
      },
    ],
  };

  it('네이버 블로그 URL인 경우 텍스트 중심 프롬프트 생성', () => {
    const html = `
      <html>
        <head><title>테스트</title></head>
        <body>
          <h1>제목</h1>
          <p>본문 내용입니다.</p>
          <iframe src="..."></iframe>
        </body>
      </html>
    `;

    const prompt = buildRevisionPrompt({
      originalContent: html,
      analysisResult: mockAnalysisResult,
      url: 'https://blog.naver.com/test/123',
    });

    // 텍스트 중심 지시 확인
    expect(prompt).toContain('순수 텍스트');
    expect(prompt).toContain('HTML 코드나 마크다운 문법을 사용하지 마세요');
    expect(prompt).toContain('원문 구조를 그대로 유지하세요');
    expect(prompt).toContain('블로그 에디터에 바로 붙여넣을 수 있는 형태');
  });

  it('원문 구조 정보가 프롬프트에 포함되는지 확인', () => {
    const html = `
      <html>
        <body>
          <h1>메인 제목</h1>
          <h2>소제목 1</h2>
          <p>문단 내용</p>
          <h2>소제목 2</h2>
          <ul>
            <li>항목 1</li>
            <li>항목 2</li>
          </ul>
        </body>
      </html>
    `;

    const prompt = buildRevisionPrompt({
      originalContent: html,
      analysisResult: mockAnalysisResult,
      url: 'https://blog.naver.com/test/123',
    });

    // 구조 정보 포함 확인
    expect(prompt).toContain('문서 구조');
    expect(prompt).toContain('H1');
    expect(prompt).toContain('메인 제목');
  });

  it('일반 웹사이트도 텍스트 중심 프롬프트 생성', () => {
    const html = `
      <html>
        <body>
          <h1>제목</h1>
          <p>내용</p>
        </body>
      </html>
    `;

    const prompt = buildRevisionPrompt({
      originalContent: html,
      analysisResult: mockAnalysisResult,
      url: 'https://example.com',
    });

    // 텍스트 중심 지시 확인
    expect(prompt).toContain('순수 텍스트');
    expect(prompt).toContain('플랫폼에 바로 붙여넣을 수 있는 형태');
  });

  it('분석 결과 기반 개선 포인트가 포함되는지 확인', () => {
    const html = '<html><body><p>테스트</p></body></html>';

    const prompt = buildRevisionPrompt({
      originalContent: html,
      analysisResult: mockAnalysisResult,
      url: 'https://blog.naver.com/test/123',
    });

    // 개선 포인트 포함 확인
    expect(prompt).toContain('SEO');
    expect(prompt).toContain('AEO');
    expect(prompt).toContain('GEO');
    expect(prompt).toContain('H1 태그가 없습니다');
  });
});
