import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { createUser, getUser } from "@/lib/db-helpers";

// AUTH_SECRET 확인
if (!process.env.AUTH_SECRET && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ AUTH_SECRET이 설정되지 않았습니다.');
  // v4 호환성을 위해 NEXTAUTH_SECRET도 확인
  if (process.env.NEXTAUTH_SECRET) {
    console.warn('⚠️ NEXTAUTH_SECRET을 사용 중입니다. AUTH_SECRET으로 변경해주세요.');
  }
}

// AUTH_URL 설정 (NextAuth.js v5)
// 환경 변수에서 우선순위: AUTH_URL > NEXTAUTH_URL
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

if (process.env.NODE_ENV === 'development' && authUrl) {
  console.log('🔐 NextAuth URL:', authUrl);
  console.log('🔐 GitHub 콜백 URL:', `${authUrl}/api/auth/callback/github`);
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
  ],
  // 쿠키 설정 (PKCE 코드 검증을 위해 중요)
  cookies: {
    pkceCodeVerifier: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15분
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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET, // v4 호환성
});

