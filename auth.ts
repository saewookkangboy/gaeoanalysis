import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { createUser, getUser, getUserByEmail, saveAuthLog } from "@/lib/db-helpers";
import { v4 as uuidv4 } from "uuid";

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
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NextAuth.js v5는 AUTH_URL을 자동으로 감지하지만, 명시적으로 설정 권장
  // 로컬: http://localhost:3000 (또는 실제 사용 중인 포트)
  // 프로덕션: https://your-domain.com
  trustHost: true, // Vercel 등 호스팅 환경에서 자동으로 URL 감지
  // basePath는 기본값 '/api/auth' 사용 (명시적으로 설정하지 않음)
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
      if (user?.email && user?.id && account?.provider) {
        try {
          // 이메일로 기존 사용자 확인 (중요: 이메일 기반으로 일관된 사용자 ID 유지)
          const existingUserByEmail = getUserByEmail(user.email);
          let actualUserId = user.id;
          let isNewUser = false;
          
          if (existingUserByEmail) {
            // 기존 사용자가 있는 경우, 기존 ID 사용 (분석 이력 유지)
            actualUserId = existingUserByEmail.id;
            isNewUser = false;
            console.log('📧 이메일로 기존 사용자 발견:', { 
              sessionId: user.id, 
              actualUserId: actualUserId, 
              email: user.email,
              provider: account.provider 
            });
          } else {
            // 새 사용자인지 확인
            const existingUser = getUser(user.id);
            isNewUser = !existingUser;
          }
          
          // 사용자 생성 또는 업데이트 (createUser는 이메일로 기존 사용자를 찾으면 기존 ID 반환)
          const createdUserId = createUser({
            id: user.id,
            email: user.email,
            blogUrl: null,
            name: user.name || undefined,
            image: user.image || undefined,
            provider: account.provider,
          });
          
          // createUser가 반환한 실제 사용자 ID 사용 (이메일로 기존 사용자를 찾은 경우 기존 ID 반환)
          actualUserId = createdUserId || actualUserId;
          
          if (isNewUser) {
            console.log('✅ 새 사용자 생성:', { 
              id: actualUserId, 
              email: user.email, 
              provider: account.provider 
            });
          } else {
            console.log('✅ 기존 사용자 로그인:', { 
              id: actualUserId, 
              email: user.email, 
              provider: account.provider 
            });
          }
          
          // 실제 사용자 ID를 user 객체에 저장 (jwt 콜백에서 사용)
          user.id = actualUserId;
          
          // 로그인 이력 저장 (비동기로 처리하여 로그인 속도에 영향 없도록)
          setImmediate(() => {
            try {
              saveAuthLog({
                id: uuidv4(),
                userId: actualUserId,
                provider: account.provider,
                action: isNewUser ? 'signup' : 'login',
                success: true,
              });
            } catch (error) {
              console.error('로그인 이력 저장 오류:', error);
            }
          });
        } catch (error: any) {
          console.error('사용자 저장 오류:', error);
          console.error('에러 상세:', error.message);
          
          // 로그인 실패 이력 저장
          setImmediate(() => {
            try {
              saveAuthLog({
                id: uuidv4(),
                userId: user.id,
                provider: account.provider,
                action: 'login',
                success: false,
                errorMessage: error.message,
              });
            } catch (logError) {
              console.error('로그인 실패 이력 저장 오류:', logError);
            }
          });
          // 에러가 발생해도 로그인은 허용 (사용자 경험을 위해)
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // 사용자 정보가 있으면 토큰에 저장
        token.id = user.id;
        token.email = user.email;
        token.provider = account?.provider;
        
        // 이메일로 실제 사용자 ID 확인 (세션 ID와 DB ID 불일치 방지)
        if (user.email) {
          try {
            const userByEmail = getUserByEmail(user.email);
            if (userByEmail && userByEmail.id !== user.id) {
              console.log('🔄 JWT: 이메일로 실제 사용자 ID 확인:', {
                sessionId: user.id,
                actualUserId: userByEmail.id,
                email: user.email
              });
              token.id = userByEmail.id; // 실제 사용자 ID 사용
            }
          } catch (error) {
            console.error('JWT 콜백에서 사용자 확인 오류:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // 토큰에서 실제 사용자 ID 가져오기
        let actualUserId = token.id as string;
        
        // 이메일로 실제 사용자 ID 재확인 (안정성 향상)
        if (token.email) {
          try {
            const userByEmail = getUserByEmail(token.email as string);
            if (userByEmail && userByEmail.id !== actualUserId) {
              console.log('🔄 Session: 이메일로 실제 사용자 ID 확인:', {
                tokenId: actualUserId,
                actualUserId: userByEmail.id,
                email: token.email
              });
              actualUserId = userByEmail.id; // 실제 사용자 ID 사용
            }
          } catch (error) {
            console.error('Session 콜백에서 사용자 확인 오류:', error);
          }
        }
        
        session.user.id = actualUserId;
        session.user.email = token.email as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: authSecret, // AUTH_SECRET 또는 NEXTAUTH_SECRET (위에서 확인됨)
  // JWT 세션 에러 무시 (개발 환경에서 이전 쿠키로 인한 에러 방지)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
});

