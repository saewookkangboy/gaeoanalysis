'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            GAEO Analysis by allrounder
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            AI 검색 시대에 최적화된 콘텐츠 분석 및 개선 가이드를 제공하는 전문 도구입니다.
          </p>
        </div>

        {/* 서비스 소개 */}
        <section className="mb-12">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">서비스 소개</h2>
            <div className="prose prose-lg max-w-none">
              <p className="mb-4 text-gray-700">
                <strong>GAEO Analysis by allrounder</strong>는 생성형 AI 검색 환경(GEO/AEO)에 최적화된 콘텐츠 분석 및 개선 가이드를 제공하는 웹 애플리케이션입니다.
              </p>
              <p className="mb-4 text-gray-700">
                ChatGPT, Perplexity, Gemini, Claude 등 다양한 AI 모델에서 콘텐츠가 인용될 확률을 분석하고, 
                각 모델의 특성에 맞는 최적화 전략을 제안합니다.
              </p>
              <p className="mb-4 text-gray-700">
                AI 검색 시대의 콘텐츠 마케팅 전문가를 위한 필수 도구로, 사용자가 AI 시대의 검색 알고리즘 변화에 
                선제적으로 대응할 수 있도록 실시간 인사이트를 제공합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 주요 기능 */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">주요 기능</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 통합 점수 분석 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">통합 점수 분석</h3>
              <p className="text-sm text-gray-600">
                AEO(Answer Engine Optimization), GEO(Generative Engine Optimization), SEO 점수를 종합적으로 분석하여 
                콘텐츠의 AI 검색 엔진 최적화 수준을 평가합니다.
              </p>
            </div>

            {/* AI 모델별 인용 확률 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">🤖</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">AI 모델별 인용 확률</h3>
              <p className="text-sm text-gray-600">
                ChatGPT, Perplexity, Gemini, Claude 각 AI 모델의 특성을 반영하여 콘텐츠가 각 모델에서 인용될 확률을 
                시뮬레이션하고 시각화합니다.
              </p>
            </div>

            {/* AI Agent */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">💬</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">AI Agent</h3>
              <p className="text-sm text-gray-600">
                분석 결과에 대한 상세 진단 및 개선 방안을 AI Agent를 통해 대화형으로 제공합니다. 
                맞춤형 조언과 단계별 가이드를 받을 수 있습니다.
              </p>
            </div>

            {/* 개선 가이드 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">📝</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">개선 가이드</h3>
              <p className="text-sm text-gray-600">
                AI SEO, AEO, GEO, AIO 가이드라인을 기반으로 구체적인 개선 포인트와 콘텐츠 작성 시 유의사항을 제공합니다.
              </p>
            </div>

            {/* 분석 이력 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">📚</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">분석 이력</h3>
              <p className="text-sm text-gray-600">
                회원가입/로그인 기반으로 분석 기록을 저장하고 관리할 수 있습니다. 
                최근 분석 기록을 최대 10개까지 조회할 수 있습니다.
              </p>
            </div>

            {/* 원클릭 복사 */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl">📋</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">원클릭 복사</h3>
              <p className="text-sm text-gray-600">
                분석 결과를 Markdown 형식으로 클립보드에 복사하여 문서화하거나 공유할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 사용 방법 */}
        <section className="mb-12">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">사용 방법</h2>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">URL 입력</h4>
                  <p className="text-sm text-gray-600">분석하고 싶은 웹페이지의 URL을 입력합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">자동 분석</h4>
                  <p className="text-sm text-gray-600">시스템이 자동으로 콘텐츠를 분석하여 AEO, GEO, SEO 점수를 계산합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                  3
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">결과 확인</h4>
                  <p className="text-sm text-gray-600">점수, AI 인용 확률, 개선 가이드 등을 확인합니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                  4
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">AI Agent 상담</h4>
                  <p className="text-sm text-gray-600">AI Agent를 통해 상세한 개선 방안을 대화형으로 받을 수 있습니다.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                  5
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">개선 적용</h4>
                  <p className="text-sm text-gray-600">제안된 개선 사항을 콘텐츠에 적용하여 점수를 향상시킵니다.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* 핵심 가치 */}
        <section className="mb-12">
          <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">핵심 가치</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 text-4xl">🎯</div>
                <h3 className="mb-2 font-semibold text-gray-900">정확한 분석</h3>
                <p className="text-sm text-gray-600">AI 검색 엔진의 특성을 반영한 정확한 분석</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl">⚡</div>
                <h3 className="mb-2 font-semibold text-gray-900">빠른 피드백</h3>
                <p className="text-sm text-gray-600">실시간 분석 및 즉시 개선 가이드 제공</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl">🚀</div>
                <h3 className="mb-2 font-semibold text-gray-900">지속적 개선</h3>
                <p className="text-sm text-gray-600">분석 이력 관리 및 지속적인 최적화 지원</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">지금 시작하세요</h2>
            <p className="mb-6 text-gray-600">
              AI 검색 시대에 최적화된 콘텐츠를 만들기 위한 첫 걸음을 내딛어보세요.
            </p>
            <Link
              href="/"
              className="inline-block rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg"
            >
              분석 시작하기
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

