import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { createUser, getUser } from "@/lib/db-helpers";

// 카카오 OAuth 제공자 타입 정의
type KakaoProviderOptions = {
  clientId: string;
  clientSecret: string;
};

// AUTH_SECRET 확인 (필수)
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  const errorMsg = '❌ AUTH_SECRET 또는 NEXTAUTH_SECRET이 설정되지 않았습니다. PKCE 코드 검증이 실패할 수 있습니다.';
  console.error(errorMsg);
  console.error('💡 해결 방법: .env.local 파일에 다음을 추가하세요:');
  console.error('   AUTH_SECRET=$(openssl rand -base64 32)');
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
} else {
  console.log('✅ AUTH_SECRET 설정 확인됨');
  if (process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
    console.warn('⚠️ NEXTAUTH_SECRET을 사용 중입니다. AUTH_SECRET으로 변경하는 것을 권장합니다.');
  }
}

// AUTH_URL 설정 (NextAuth.js v5)
// 환경 변수에서 우선순위: AUTH_URL > NEXTAUTH_URL
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

if (process.env.NODE_ENV === 'development' && authUrl) {
  console.log('🔐 NextAuth URL:', authUrl);
  console.log('🔐 GitHub 콜백 URL:', `${authUrl}/api/auth/callback/github`);
  console.log('🔐 카카오 콜백 URL:', `${authUrl}/api/auth/callback/kakao`);
}

// 카카오 OAuth 제공자 설정
// 카카오 개발자 문서: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#request-code
function Kakao(options: KakaoProviderOptions) {
  return {
    id: "kakao",
    name: "Kakao",
    type: "oauth" as const,
    // 카카오 인가 코드 요청 URL
    // 필수 파라미터: client_id, redirect_uri, response_type
    // 선택 파라미터: scope
    authorization: {
      url: "https://kauth.kakao.com/oauth/authorize",
      params: {
        // response_type은 항상 "code" (OAuth 2.0 Authorization Code Flow)
        response_type: "code",
        // scope는 공백으로 구분된 문자열
        // 카카오는 동의 항목에 따라 scope를 자동으로 처리하므로 명시적으로 지정하지 않아도 됨
        // 하지만 필요한 정보를 명시적으로 요청하기 위해 scope를 지정
        scope: "profile_nickname profile_image account_email",
      },
    },
    // 카카오 토큰 요청 URL
    // NextAuth.js가 자동으로 grant_type=authorization_code를 추가합니다
    token: "https://kauth.kakao.com/oauth/token",
    // 카카오 사용자 정보 조회 URL
    userinfo: "https://kapi.kakao.com/v2/user/me",
    // 사용자 프로필 매핑
    profile(profile: any) {
      return {
        id: profile.id.toString(),
        name: profile.kakao_account?.profile?.nickname || profile.kakao_account?.email || "카카오 사용자",
        email: profile.kakao_account?.email || null,
        image: profile.kakao_account?.profile?.profile_image_url || null,
      };
    },
    style: {
      logo: "https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_bi_medium.png",
      logoDark: "https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_bi_medium.png",
      bg: "#FEE500",
      text: "#000000",
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    // 카카오는 PKCE를 지원하지 않으므로 state만 사용
    checks: ["state"] as const,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NextAuth.js v5는 AUTH_URL을 자동으로 감지하지만, 명시적으로 설정 권장
  // 로컬: http://localhost:3000 (또는 실제 사용 중인 포트)
  // 프로덕션: https://your-domain.com
  trustHost: true, // Vercel 등 호스팅 환경에서 자동으로 URL 감지
  // AUTH_URL이 설정되어 있으면 명시적으로 사용
  ...(authUrl && { basePath: undefined }), // basePath는 자동 감지 사용
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHub({
      // 환경에 따라 다른 OAuth App 사용
      // 개발 환경: GITHUB_CLIENT_ID_DEV, GITHUB_CLIENT_SECRET_DEV 사용
      // 프로덕션 환경: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET 사용
      clientId: process.env.NODE_ENV === 'development' 
        ? (process.env.GITHUB_CLIENT_ID_DEV || process.env.GITHUB_CLIENT_ID || '')
        : (process.env.GITHUB_CLIENT_ID || ''),
      clientSecret: process.env.NODE_ENV === 'development'
        ? (process.env.GITHUB_CLIENT_SECRET_DEV || process.env.GITHUB_CLIENT_SECRET || '')
        : (process.env.GITHUB_CLIENT_SECRET || ''),
      // GitHub OAuth App의 Authorization callback URL이 정확히 일치해야 함
      // 개발: http://localhost:3000/api/auth/callback/github
      // 프로덕션: https://gaeoanalysis.vercel.app/api/auth/callback/github
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      // 카카오 OAuth App의 Redirect URI가 정확히 일치해야 함
      // 개발: http://localhost:3000/api/auth/callback/kakao
      // 프로덕션: https://gaeoanalysis.vercel.app/api/auth/callback/kakao
    }),
  ],
  // 쿠키 설정 (PKCE 코드 검증을 위해 중요)
  // AUTH_SECRET이 없으면 쿠키 암호화/복호화가 실패합니다
  cookies: {
    pkceCodeVerifier: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // 개발 환경에서도 쿠키가 제대로 설정되도록 maxAge 추가
        maxAge: 60 * 15, // 15분
      },
    },
    state: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15분
      },
    },
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // OAuth 로그인 시 디버깅 정보 출력
      if (process.env.NODE_ENV === 'development' && account) {
        const callbackUrl = `${authUrl || 'http://localhost:3000'}/api/auth/callback/${account.provider}`;
        console.log('🔐 OAuth 로그인 시도:', {
          provider: account.provider,
          expectedCallbackUrl: callbackUrl,
          accountId: account.providerAccountId,
        });
      }

      // OAuth 로그인 시 사용자 정보를 DB에 저장
      if (user?.email && user?.id) {
        try {
          // 기존 사용자 확인
          const existingUser = getUser(user.id);
          
          // 새 사용자인 경우 DB에 저장
          if (!existingUser) {
            createUser({
              id: user.id,
              email: user.email,
              blogUrl: null,
            });
            console.log('새 사용자 생성:', { id: user.id, email: user.email, provider: account?.provider });
          } else {
            console.log('기존 사용자 로그인:', { id: user.id, email: user.email, provider: account?.provider });
          }
        } catch (error: any) {
          console.error('사용자 저장 오류:', error);
          console.error('에러 상세:', error.message);
          // 에러가 발생해도 로그인은 허용 (사용자 경험을 위해)
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: authSecret, // AUTH_SECRET 또는 NEXTAUTH_SECRET (위에서 확인됨)
});

