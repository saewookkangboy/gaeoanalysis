'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AboutPage() {
  // 구조화된 데이터 추가 (클라이언트 컴포넌트에서)
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "GAEO Analysis는 무엇인가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "GAEO Analysis는 ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는 실전 최적화 도구입니다. AEO, GEO, SEO 점수를 30초 안에 종합 진단하고, AI 모델별 인용 확률과 개선 가이드를 제공합니다."
          }
        },
        {
          "@type": "Question",
          "name": "어떻게 사용하나요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "분석하고 싶은 콘텐츠의 URL을 입력하고 분석 시작 버튼을 클릭하면 됩니다. 30초 안에 종합 진단이 완료되며, 개선 사항을 체크리스트로 확인할 수 있습니다."
          }
        },
        {
          "@type": "Question",
          "name": "무료로 사용할 수 있나요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "네, 기본 분석 기능은 무료로 사용할 수 있습니다. 회원가입은 선택사항이며, 무료 플랜에서도 핵심 기능을 모두 사용할 수 있습니다."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);
  return (
    <div className="flex-1 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl sm:text-5xl font-bold text-gray-900">
            AI 검색 시대, 콘텐츠가 AI에게 선택받으려면?
          </h1>
          <p className="mx-auto max-w-3xl text-xl sm:text-2xl text-gray-600 leading-relaxed mb-6">
            ChatGPT, Perplexity, Gemini, Claude가 당신의 콘텐츠를 인용하도록 만드는<br />
            <span className="font-semibold text-sky-600">실전 최적화 도구</span>
          </p>
          
          {/* 마케터가 직접 만든 도구 강조 */}
          <div className="mx-auto max-w-2xl rounded-lg border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 sm:p-8">
            <p className="text-lg sm:text-xl font-semibold text-gray-900 leading-relaxed">
              💡 <span className="text-amber-700">마케터 스스로가 불편한 것을 극복하기 위해,<br className="hidden sm:block" /> 직접 필요한 것을 개발한 도구입니다</span>
            </p>
            <p className="mt-4 text-sm sm:text-base text-gray-700 leading-relaxed">
              SEO, AEO, GEO를 각각 분석하고, AI 모델별 최적화 전략을 연구하는 데 수 시간이 걸리는 현실적인 문제를 해결하기 위해 탄생했습니다.
            </p>
          </div>
        </div>

        {/* 문제 정의 */}
        <section className="mb-16">
          <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-8 sm:p-10">
            <h2 className="mb-6 text-2xl sm:text-3xl font-bold text-gray-900">
              왜 지금 AI 검색 최적화가 필요한가요?
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📉</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">검색 트래픽이 급감하고 있습니다</h3>
                  <p className="text-sm sm:text-base">
                    사용자들이 Google 대신 ChatGPT, Perplexity 같은 AI 검색 엔진을 사용하면서, 
                    기존 SEO 최적화만으로는 충분하지 않습니다. AI가 답변에 인용하는 콘텐츠만이 트래픽을 얻을 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">수동 분석은 시간이 너무 오래 걸립니다</h3>
                  <p className="text-sm sm:text-base">
                    콘텐츠를 작성한 후 SEO, AEO, GEO를 각각 분석하고, 각 AI 모델별로 어떻게 최적화할지 연구하는 데 
                    수 시간이 걸립니다. 마감이 촉박한 현업에서는 실용적이지 않습니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">❓</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">어디서부터 개선해야 할지 모르겠습니다</h3>
                  <p className="text-sm sm:text-base">
                    "콘텐츠를 AI 친화적으로 만들어야 한다"는 것은 알지만, 구체적으로 무엇을 어떻게 바꿔야 하는지 
                    막막합니다. 우선순위가 불명확해 개선 작업이 지연됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 간소화된 CTA */}
        <section className="mb-16">
          <div className="rounded-lg border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white p-6 sm:p-8 text-center">
            <h2 className="mb-3 text-xl sm:text-2xl font-bold text-gray-900">지금 바로 시작하세요</h2>
            <p className="mb-6 text-sm sm:text-base text-gray-700">
              첫 분석은 30초면 충분합니다
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-block rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-black hover:text-white transition-all"
              >
                무료로 분석 시작하기
              </Link>
              <Link
                href="/register"
                className="inline-block rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-black hover:text-white transition-all"
              >
                회원가입하고 시작하기
              </Link>
            </div>
          </div>
        </section>

        {/* Top 3 커뮤니케이션 강조 */}
        <section className="mb-16">
          <div className="rounded-lg border-2 border-sky-400 bg-gradient-to-br from-sky-50 via-blue-50 to-white p-8 sm:p-10 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="mb-3 text-3xl sm:text-4xl font-bold text-gray-900">
                핵심 커뮤니케이션 기능
              </h2>
              <p className="text-lg text-gray-600">
                분석 결과를 효과적으로 전달하고 활용하는 3가지 핵심 기능
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border-2 border-sky-300 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 text-4xl text-center">📊</div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 text-center">시각적 점수 분석</h3>
                <p className="text-sm text-gray-700 leading-relaxed text-center">
                  AEO, GEO, SEO 점수를 한눈에 확인하고, 종합 점수를 클릭하면 모든 개선 사항을 체크리스트로 볼 수 있습니다. 
                  각 점수는 색상과 이모지로 직관적으로 표시되어 즉시 이해할 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg border-2 border-sky-300 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 text-4xl text-center">🤖</div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 text-center">AI Agent 상담</h3>
                <p className="text-sm text-gray-700 leading-relaxed text-center">
                  분석 결과를 바탕으로 "어떻게 개선할 수 있나요?" 같은 질문에 대해 구체적이고 실행 가능한 답변을 대화형으로 받을 수 있습니다. 
                  마크다운 형식으로 정리되어 바로 문서화하거나 팀과 공유할 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg border-2 border-sky-300 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 text-4xl text-center">✅</div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 text-center">우선순위별 개선 가이드</h3>
                <p className="text-sm text-gray-700 leading-relaxed text-center">
                  "긴급 개선 사항"부터 "추가 개선 사항"까지 우선순위별로 정리된 체크리스트를 제공합니다. 
                  각 개선 항목마다 예상 효과와 단계별 실행 방법까지 포함되어 있어, 바로 적용할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 해결책 */}
        <section className="mb-16">
          <div className="rounded-lg border border-gray-300 bg-white p-8 sm:p-10 shadow-sm">
            <h2 className="mb-6 text-2xl sm:text-3xl font-bold text-gray-900">
              GAEO Analysis가 해결하는 방법
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-6">
                <div className="mb-3 text-3xl">⚡</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">30초 안에 종합 진단</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  URL만 입력하면 AEO, GEO, SEO 점수를 자동으로 분석하고, 
                  ChatGPT, Perplexity, Gemini, Claude 각 모델에서 인용될 확률까지 즉시 확인할 수 있습니다. 
                  수 시간 걸리던 분석을 몇 초로 단축합니다.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-6">
                <div className="mb-3 text-3xl">🎯</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">우선순위가 명확한 개선 가이드</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  "긴급 개선 사항"부터 "추가 개선 사항"까지 우선순위별로 정리된 체크리스트를 제공합니다. 
                  각 개선 항목마다 예상 효과와 단계별 실행 방법까지 포함되어 있어, 
                  바로 적용할 수 있습니다.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-6">
                <div className="mb-3 text-3xl">🤖</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">AI 모델별 맞춤 전략</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  ChatGPT는 구조화된 데이터를, Perplexity는 최신 정보를 선호합니다. 
                  각 AI 모델의 특성을 반영한 맞춤형 최적화 전략을 제공하여, 
                  모든 AI 검색 엔진에서 인용될 수 있도록 돕습니다.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-6">
                <div className="mb-3 text-3xl">💬</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">고도화된 AI Agent 상담</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  분석 결과를 바탕으로 구체적이고 실행 가능한 답변을 제공합니다. 
                  마크다운 형식 렌더링, 답변 복사 기능, 동적 추천 질문 생성 등 
                  실무에 바로 활용할 수 있는 기능을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 실질적 가치 */}
        <section className="mb-16">
          <div className="rounded-lg border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white p-8 sm:p-10">
            <h2 className="mb-8 text-center text-2xl sm:text-3xl font-bold text-gray-900">
              마케터와 콘텐츠 작성자가 얻는 실질적 가치
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-4 text-5xl">⏱️</div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">작업 시간 90% 절감</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  수동 분석에 2-3시간 걸리던 작업을 30초로 단축. 
                  더 많은 콘텐츠를 최적화하고, 마감에 여유를 가질 수 있습니다.
                </p>
              </div>
              <div className="text-center">
                <div className="mb-4 text-5xl">📈</div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">AI 검색 트래픽 증가</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  ChatGPT, Perplexity 등 AI 검색 엔진에서 콘텐츠가 인용되면 
                  새로운 트래픽 경로를 확보할 수 있습니다.
                </p>
              </div>
              <div className="text-center">
                <div className="mb-4 text-5xl">💡</div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">데이터 기반 의사결정</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  추측이 아닌 정확한 점수와 우선순위로 개선 작업을 진행하여, 
                  투자 대비 효과를 극대화합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 사용 사례 */}
        <section className="mb-16">
          <div className="rounded-lg border border-gray-300 bg-white p-8 sm:p-10 shadow-sm">
            <h2 className="mb-8 text-2xl sm:text-3xl font-bold text-gray-900">
              이런 분들께 특히 유용합니다
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <div className="text-3xl">✍️</div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">콘텐츠 마케터</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    블로그, 뉴스레터, 기업 콘텐츠를 작성하는 마케터분들. 
                    매 콘텐츠마다 AI 검색 최적화를 적용하여 트래픽과 전환율을 높이고 싶으신 분들께 최적입니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <div className="text-3xl">📝</div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">콘텐츠 작성자</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    기업 블로그, 매거진, 온라인 매체에서 콘텐츠를 작성하는 분들. 
                    작성한 콘텐츠가 AI 검색 엔진에서도 발견되도록 최적화하고 싶으신 분들께 도움이 됩니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <div className="text-3xl">🚀</div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">SEO 전문가</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    기존 SEO에 AI 검색 최적화를 추가하고 싶은 분들. 
                    클라이언트에게 종합적인 최적화 솔루션을 제공하고 싶으신 분들께 적합합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 핵심 기능 */}
        <section className="mb-16">
          <h2 className="mb-8 text-center text-2xl sm:text-3xl font-bold text-gray-900">
            모든 기능
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">종합 점수 분석</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                AEO, GEO, SEO 점수를 한눈에 확인하고, 종합 점수를 클릭하면 모든 개선 사항을 체크리스트로 볼 수 있습니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">🤖</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">AI 모델별 인용 확률</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ChatGPT, Perplexity, Gemini, Claude 각 모델에서 콘텐츠가 인용될 확률을 시각화하고, 
                모델별 맞춤 개선 제안을 제공합니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">💬</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">고도화된 AI Agent</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                마크다운 형식 답변 렌더링, 답변 복사 기능, 동적 추천 질문 생성, 대화 이력 저장 등 
                실무에 바로 활용할 수 있는 고급 기능을 제공합니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">✅</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">실행 가능한 개선 팁</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                우선순위별로 정리된 개선 항목과 각 항목의 예상 효과, 단계별 실행 방법을 제공합니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">📚</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">가이드라인 라이브러리</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI SEO, AEO, GEO, AIO 가이드라인을 클릭하여 상세 내용을 확인하고, 
                콘텐츠 작성 시 바로 참고할 수 있습니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">📋</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">분석 이력 관리</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                최근 분석 기록을 저장하고 관리하여, 콘텐츠 개선 전후를 비교하거나 
                팀과 공유할 수 있습니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">⚡</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">빠른 분석 속도</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                캐싱 시스템과 최적화된 알고리즘으로 동일 URL 재분석 시 즉시 결과를 제공합니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">🔄</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">알고리즘 자동 학습</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                분석 결과 기반 자동 가중치 학습으로 지속적으로 정확도가 향상됩니다.
              </p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 text-3xl">📱</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">반응형 디자인</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                모바일, 태블릿, 데스크톱 모든 기기에서 완벽하게 작동합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 사용 방법 */}
        <section className="mb-16">
          <div className="rounded-lg border border-gray-300 bg-white p-8 sm:p-10 shadow-sm">
            <h2 className="mb-8 text-2xl sm:text-3xl font-bold text-gray-900">
              시작하는 방법 (3단계)
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-bold text-lg">
                  1
                </span>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">URL 입력</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    분석하고 싶은 콘텐츠의 URL을 입력하세요. 회원가입 후 블로그 URL을 등록하면 
                    로그인 시 자동으로 분석됩니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-bold text-lg">
                  2
                </span>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">30초 자동 분석</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    시스템이 자동으로 AEO, GEO, SEO 점수를 계산하고, 
                    각 AI 모델별 인용 확률을 분석합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-bold text-lg">
                  3
                </span>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">개선 사항 적용</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    종합 점수를 클릭하여 체크리스트를 확인하고, 우선순위에 따라 개선 사항을 적용하세요. 
                    AI Agent에게 구체적인 질문을 하면 더 상세한 가이드를 받을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 차별화 포인트 */}
        <section className="mb-16">
          <div className="rounded-lg border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-8 sm:p-10">
            <h2 className="mb-8 text-center text-2xl sm:text-3xl font-bold text-gray-900">
              다른 도구와 차별화되는 점
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-sky-200 bg-white p-6 hover:shadow-md transition-shadow">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">🎯 AI 모델별 맞춤 분석</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  단순 SEO 점수가 아닌, ChatGPT, Perplexity, Gemini, Claude 각 모델의 특성을 반영한 
                  인용 확률 분석을 제공합니다. 각 모델별로 다른 최적화 전략이 필요하다는 것을 
                  구체적인 점수로 보여줍니다.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-6 hover:shadow-md transition-shadow">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">💡 실행 가능한 개선 팁</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  추상적인 조언이 아닌, "이렇게 하면 이만큼 효과가 있다"는 예상 효과와 
                  단계별 실행 방법을 제공합니다. 바로 적용할 수 있는 실전 가이드입니다.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-6 hover:shadow-md transition-shadow">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">🤖 고도화된 AI Agent</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  분석 결과를 바탕으로 구체적이고 실행 가능한 답변을 제공합니다. 
                  마크다운 형식 렌더링, 답변 복사, 동적 추천 질문 생성 등 실무에 바로 활용할 수 있는 기능을 제공합니다.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-6 hover:shadow-md transition-shadow">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">⚡ 즉시 사용 가능</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  복잡한 설정이나 학습 없이, URL만 입력하면 바로 분석을 시작할 수 있습니다. 
                  회원가입도 선택사항이며, 무료로 사용할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-lg border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white p-10 sm:p-12">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold text-gray-900">
              지금 바로 시작하세요
            </h2>
            <p className="mb-8 mx-auto max-w-2xl text-base sm:text-lg text-gray-700 leading-relaxed">
              AI 검색 시대에 뒤처지지 않으려면 지금 시작하세요.<br />
              첫 분석은 30초면 충분합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-block rounded-md border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-black hover:bg-black hover:text-white transition-all"
              >
                무료로 분석 시작하기
              </Link>
              <Link
                href="/register"
                className="inline-block rounded-md border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-black hover:bg-black hover:text-white transition-all"
              >
                회원가입하고 시작하기
              </Link>
            </div>
          </div>
        </section>

        {/* 공지 사항 */}
        <section className="mt-16 mb-8">
          <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center">
            <div className="mb-2 text-amber-600 text-lg font-semibold">
              📢 공지
            </div>
            <p className="text-sm sm:text-base text-gray-700">
              특정 블로그는 진단이 어려울 수 있습니다 (네이버, 브런치 등)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
