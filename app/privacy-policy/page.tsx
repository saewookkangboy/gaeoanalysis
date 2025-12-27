'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            개인정보 보호 정책
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            최종 업데이트: {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>

        <div className="prose prose-lg max-w-none dark:prose-invert">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              1. 개인정보의 처리 목적
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
              <li>콘텐츠 분석 서비스 제공: 사용자가 입력한 URL을 분석하여 AEO/GEO/SEO 점수 및 개선 가이드 제공</li>
              <li>사용자 인증 및 계정 관리: 로그인, 회원가입, 계정 관리</li>
              <li>서비스 개선: 분석 결과를 기반으로 한 서비스 품질 향상</li>
              <li>고객 지원: 문의사항 및 기술 지원 제공</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              2. 개인정보의 처리 및 보유기간
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
              <li><strong>회원 정보</strong>: 회원 탈퇴 시까지 (단, 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관)</li>
              <li><strong>분석 이력</strong>: 계정 삭제 시까지 또는 사용자가 직접 삭제할 때까지</li>
              <li><strong>로그 데이터</strong>: 최대 1년간 보관</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              3. 처리하는 개인정보의 항목
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis는 다음의 개인정보 항목을 처리하고 있습니다.
            </p>
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                3.1 필수 항목
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                <li>이메일 주소 (로그인용)</li>
                <li>사용자 ID (시스템 내부 식별자)</li>
                <li>분석 대상 URL (콘텐츠 분석을 위해 필요)</li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                3.2 선택 항목
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                <li>블로그 URL (자동 분석을 위해 등록 시)</li>
                <li>프로필 정보 (소셜 로그인 시 제공되는 정보)</li>
              </ul>
            </div>
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                3.3 자동 수집 항목
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                <li>IP 주소 (보안 및 부정 사용 방지)</li>
                <li>접속 로그 (서비스 개선 및 문제 해결)</li>
                <li>브라우저 정보 (호환성 확인)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              4. 개인정보의 제3자 제공
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
              <li>정보주체가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              5. 개인정보처리의 위탁
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
            </p>
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">5.1 Vercel (호스팅 서비스)</h3>
              <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700 dark:text-gray-300">
                <li>위탁 업무 내용: 웹 서비스 호스팅 및 데이터 저장</li>
                <li>위탁 기간: 서비스 제공 기간</li>
              </ul>
            </div>
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">5.2 Firebase (인증 서비스)</h3>
              <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700 dark:text-gray-300">
                <li>위탁 업무 내용: 사용자 인증 및 계정 관리</li>
                <li>위탁 기간: 서비스 제공 기간</li>
              </ul>
            </div>
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">5.3 Google Gemini API (AI 서비스)</h3>
              <ul className="list-disc space-y-1 pl-6 text-sm text-gray-700 dark:text-gray-300">
                <li>위탁 업무 내용: AI 기반 개선 가이드 및 수정안 생성</li>
                <li>위탁 기간: 서비스 제공 기간</li>
                <li>전송 정보: 분석 결과 데이터 (개인 식별 정보 제외)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              6. 정보주체의 권리·의무 및 그 행사방법
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              정보주체는 GAEO Analysis에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
              <li>개인정보 처리정지 요구권</li>
              <li>개인정보 열람요구권</li>
              <li>개인정보 정정·삭제요구권</li>
              <li>개인정보 처리정지 요구권</li>
            </ul>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              권리 행사는 GAEO Analysis에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, GAEO Analysis는 이에 대해 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              7. 개인정보의 파기
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </p>
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                파기 방법
              </h3>
              <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                <li><strong>전자적 파일 형태</strong>: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
                <li><strong>기록물, 인쇄물, 서면 등</strong>: 분쇄하거나 소각하여 파기</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              8. 개인정보 보호책임자
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 text-gray-700 dark:text-gray-300">
                <strong>개인정보 보호책임자</strong>
              </p>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>이메일: chunghyo@troe.kr</li>
                <li>문의: 웹사이트 내 문의 기능을 통해 연락 가능</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              9. Chrome Extension 관련 개인정보 처리
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              GAEO Analysis Chrome Extension은 다음의 개인정보를 처리합니다:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
              <li><strong>로컬 저장 데이터</strong>: Extension은 브라우저의 로컬 스토리지에 다음 정보를 저장합니다:
                <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
                  <li>점수 히스토리 (최근 10개)</li>
                  <li>체크리스트 상태</li>
                  <li>대화 이력</li>
                  <li>수정안 내역</li>
                </ul>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  이 데이터는 사용자의 브라우저에만 저장되며, 서버로 전송되지 않습니다.
                </p>
              </li>
              <li><strong>세션 쿠키</strong>: 웹 서비스 인증을 위해 세션 쿠키를 읽습니다. 이는 로그인 상태 확인을 위해서만 사용됩니다.</li>
              <li><strong>현재 페이지 URL</strong>: 분석을 위해 현재 브라우저 탭의 URL을 읽습니다. 이 정보는 분석 서비스 제공을 위해 서버로 전송됩니다.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              10. 개인정보 처리방침 변경
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              이 개인정보 처리방침은 2024년 12월 27일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              11. 문의
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              개인정보 보호와 관련하여 궁금한 사항이 있으시면 언제든지 문의해 주시기 바랍니다.
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>이메일</strong>: chunghyo@troe.kr
              </p>
            </div>
          </section>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
          <Link
            href="/"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

