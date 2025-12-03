import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { createUser, getUser, getUserByEmail, saveAuthLog, migrateUserEmail } from "@/lib/db-helpers";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";

/**
 * 이메일 기반으로 일관된 사용자 ID 생성
 * 같은 이메일은 항상 같은 ID를 반환
 */
function generateUserIdFromEmail(email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  // SHA-256 해시를 사용하여 일관된 ID 생성
  const hash = createHash('sha256').update(normalizedEmail).digest('hex');
  // UUID 형식으로 변환 (8-4-4-4-12)
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

// AUTH_SECRET 확인 (필수)
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

// 빌드 타임 체크 (Next.js 빌드 중에는 에러를 던지지 않음)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-development-build';

if (!authSecret) {
  const errorMsg = '❌ AUTH_SECRET 또는 NEXTAUTH_SECRET이 설정되지 않았습니다. PKCE 코드 검증이 실패할 수 있습니다.';
  console.error(errorMsg);
  console.error('💡 해결 방법: 환경 변수에 다음을 추가하세요:');
  console.error('   AUTH_SECRET=$(openssl rand -base64 32)');
  console.error('   또는 Railway/Vercel 대시보드에서 환경 변수 설정');
  
  // 빌드 타임이 아니고 프로덕션 런타임에서만 에러 던지기
  if (!isBuildTime && process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
} else {
  if (!isBuildTime) {
    console.log('✅ AUTH_SECRET 설정 확인됨');
    // AUTH_SECRET 길이 확인 (최소 32자 권장)
    if (authSecret.length < 32) {
      console.warn('⚠️ AUTH_SECRET이 너무 짧습니다. 최소 32자 이상 권장합니다.');
    }
  }
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
  
  // PKCE 검증 강화 (도메인 변경 시 쿠키 문제 해결)
  useSecureCookies: process.env.NODE_ENV === 'production',
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
  // Vercel 환경에서는 도메인을 명시적으로 설정하지 않는 것이 안전합니다
  cookies: {
    pkceCodeVerifier: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // PKCE 코드 검증자를 충분히 오래 유지 (OAuth 콜백까지)
        maxAge: 60 * 15, // 15분
        // Vercel 환경에서는 도메인을 설정하지 않음 (자동 처리)
        // 서브도메인을 사용하는 경우에만 도메인 설정
        ...(process.env.NODE_ENV === 'production' && 
            authUrl && 
            !authUrl.includes('vercel.app') && 
            (() => {
              try {
                const url = new URL(authUrl);
                const hostname = url.hostname;
                // 서브도메인이 있는 경우에만 도메인 설정 (예: gaeo.allrounder.im -> .allrounder.im)
                if (hostname.split('.').length > 2) {
                  const rootDomain = hostname.replace(/^[^.]+\./, '.');
                  // 로컬호스트나 IP 주소가 아닌 경우에만 도메인 설정
                  if (!rootDomain.includes('localhost') && !rootDomain.match(/^\d+\./)) {
                    return { domain: rootDomain };
                  }
                }
              } catch {
                // URL 파싱 실패 시 도메인 설정하지 않음
              }
              return {};
            })()),
      },
    },
    state: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15분
        ...(process.env.NODE_ENV === 'production' && 
            authUrl && 
            !authUrl.includes('vercel.app') && 
            (() => {
              try {
                const url = new URL(authUrl);
                const hostname = url.hostname;
                if (hostname.split('.').length > 2) {
                  const rootDomain = hostname.replace(/^[^.]+\./, '.');
                  if (!rootDomain.includes('localhost') && !rootDomain.match(/^\d+\./)) {
                    return { domain: rootDomain };
                  }
                }
              } catch {
                // URL 파싱 실패 시 도메인 설정하지 않음
              }
              return {};
            })()),
      },
    },
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        ...(process.env.NODE_ENV === 'production' && 
            authUrl && 
            !authUrl.includes('vercel.app') && 
            (() => {
              try {
                const url = new URL(authUrl);
                const hostname = url.hostname;
                if (hostname.split('.').length > 2) {
                  const rootDomain = hostname.replace(/^[^.]+\./, '.');
                  if (!rootDomain.includes('localhost') && !rootDomain.match(/^\d+\./)) {
                    return { domain: rootDomain };
                  }
                }
              } catch {
                // URL 파싱 실패 시 도메인 설정하지 않음
              }
              return {};
            })()),
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // OAuth 로그인 시 디버깅 정보 출력 (프로덕션에서도 출력)
      if (account) {
        const callbackUrl = `${authUrl || 'http://localhost:3000'}/api/auth/callback/${account.provider}`;
        console.log('🔐 [signIn] OAuth 로그인 시도:', {
          provider: account.provider,
          expectedCallbackUrl: callbackUrl,
          accountId: account.providerAccountId,
          userId: user?.id,
          userEmail: user?.email,
        });
      }

      // OAuth 로그인 시 사용자 정보를 DB에 저장
      if (user?.email && user?.id && account?.provider) {
        try {
          // 이메일 정규화 (소문자, 트림) - 일관된 사용자 식별을 위해 중요
          const normalizedEmail = user.email.toLowerCase().trim();
          
          // 이메일 기반으로 일관된 사용자 ID 생성 (핵심 개선)
          // 같은 이메일은 항상 같은 ID를 사용하여 분석 이력 유지
          const emailBasedUserId = generateUserIdFromEmail(normalizedEmail);
          
          // 이메일로 기존 사용자 확인 (중요: 이메일 기반으로 일관된 사용자 ID 유지)
          const existingUserByEmail = getUserByEmail(normalizedEmail);
          let actualUserId = emailBasedUserId; // 이메일 기반 ID 사용
          let isNewUser = false;
          let emailChanged = false;
          let oldEmail: string | null = null;
          
          if (existingUserByEmail) {
            // 기존 사용자가 있는 경우, 기존 ID 사용 (분석 이력 유지)
            actualUserId = existingUserByEmail.id;
            isNewUser = false;
            console.log('📧 [signIn] 이메일로 기존 사용자 발견:', { 
              nextAuthId: user.id,
              emailBasedId: emailBasedUserId,
              actualUserId: actualUserId, 
              email: normalizedEmail,
              provider: account.provider 
            });
          } else {
            // 새 사용자인지 확인 (이메일 기반 ID로 확인)
            const existingUser = getUser(emailBasedUserId);
            isNewUser = !existingUser;
            
            // 이메일 기반 ID로 사용자가 있지만 이메일이 다른 경우 (이메일 변경 감지)
            if (existingUser && existingUser.email !== normalizedEmail) {
              oldEmail = existingUser.email;
              emailChanged = true;
              actualUserId = existingUser.id;
              isNewUser = false;
              console.log('🔄 [signIn] 이메일 변경 감지:', {
                userId: existingUser.id,
                oldEmail: oldEmail,
                newEmail: normalizedEmail,
                provider: account.provider
              });
            }
          }
          
          // 사용자 생성 또는 업데이트 (이메일 기반 ID 사용)
          // createUser는 이메일로 기존 사용자를 찾으면 기존 ID 반환
          const createdUserId = createUser({
            id: emailBasedUserId, // 이메일 기반 ID 사용
            email: normalizedEmail,
            blogUrl: null,
            name: user.name || undefined,
            image: user.image || undefined,
            provider: account.provider,
          });
          
          // createUser가 반환한 실제 사용자 ID 사용 (이메일로 기존 사용자를 찾은 경우 기존 ID 반환)
          actualUserId = createdUserId || emailBasedUserId;
          
          // 이메일 변경이 감지된 경우, 기존 이메일의 분석 이력을 새 이메일로 마이그레이션
          if (emailChanged && oldEmail) {
            try {
              const migratedUserId = migrateUserEmail(oldEmail, normalizedEmail);
              if (migratedUserId && migratedUserId !== actualUserId) {
                console.log('✅ [signIn] 이메일 변경으로 인한 분석 이력 마이그레이션 완료:', {
                  oldEmail: oldEmail,
                  newEmail: normalizedEmail,
                  oldUserId: actualUserId,
                  newUserId: migratedUserId
                });
                actualUserId = migratedUserId;
              } else if (migratedUserId) {
                console.log('✅ [signIn] 이메일 업데이트 완료:', {
                  userId: actualUserId,
                  oldEmail: oldEmail,
                  newEmail: normalizedEmail
                });
              }
            } catch (migrateError: any) {
              console.error('❌ [signIn] 이메일 마이그레이션 오류:', migrateError);
              // 마이그레이션 실패해도 로그인은 계속 진행
            }
          }
          
          if (isNewUser) {
            console.log('✅ [signIn] 새 사용자 생성:', { 
              id: actualUserId, 
              email: normalizedEmail, 
              provider: account.provider 
            });
          } else {
            console.log('✅ [signIn] 기존 사용자 로그인:', { 
              id: actualUserId, 
              email: normalizedEmail, 
              provider: account.provider 
            });
          }
          
          // 실제 사용자 ID를 user 객체에 저장 (jwt 콜백에서 사용)
          // NextAuth v5에서는 이 변경이 제대로 반영되지 않을 수 있으므로,
          // JWT 콜백에서도 재확인 필요
          user.id = actualUserId;
          user.email = normalizedEmail; // 정규화된 이메일 사용
          
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
        // 이메일 정규화
        const normalizedEmail = user.email ? user.email.toLowerCase().trim() : null;
        
        // 이메일 기반으로 일관된 사용자 ID 생성 (핵심 개선)
        let emailBasedUserId = normalizedEmail ? generateUserIdFromEmail(normalizedEmail) : user.id;
        
        // 이메일로 기존 사용자 확인
        if (normalizedEmail) {
          try {
            const userByEmail = getUserByEmail(normalizedEmail);
            if (userByEmail) {
              // 기존 사용자가 있으면 그 ID 사용
              emailBasedUserId = userByEmail.id;
              console.log('✅ [JWT] 이메일로 기존 사용자 ID 확인:', {
                nextAuthId: user.id,
                emailBasedId: generateUserIdFromEmail(normalizedEmail),
                actualUserId: emailBasedUserId,
                email: normalizedEmail
              });
            } else {
              console.log('📝 [JWT] 새 사용자, 이메일 기반 ID 사용:', {
                nextAuthId: user.id,
                emailBasedId: emailBasedUserId,
                email: normalizedEmail
              });
            }
          } catch (error) {
            console.error('❌ [JWT] 사용자 확인 오류:', error);
          }
        }
        
        // 이메일 기반 사용자 ID를 토큰에 저장
        token.id = emailBasedUserId;
        token.email = normalizedEmail || user.email;
        token.provider = account?.provider;
      } else if (token.email) {
        // 사용자 정보가 없지만 토큰에 이메일이 있는 경우 (기존 세션)
        // 이메일 기반으로 사용자 ID 재확인
        const normalizedEmail = (token.email as string).toLowerCase().trim();
        const emailBasedUserId = generateUserIdFromEmail(normalizedEmail);
        
        try {
          const userByEmail = getUserByEmail(normalizedEmail);
          if (userByEmail) {
            // 기존 사용자가 있으면 그 ID 사용
            token.id = userByEmail.id;
            console.log('🔄 [JWT] 기존 토큰: 이메일로 실제 사용자 ID 확인:', {
              originalTokenId: token.id,
              emailBasedId: emailBasedUserId,
              actualUserId: userByEmail.id,
              email: normalizedEmail
            });
          } else {
            // 기존 사용자가 없으면 이메일 기반 ID 사용
            token.id = emailBasedUserId;
            console.log('📝 [JWT] 기존 토큰: 이메일 기반 ID 사용:', {
              originalTokenId: token.id,
              emailBasedId: emailBasedUserId,
              email: normalizedEmail
            });
          }
        } catch (error) {
          console.error('❌ [JWT] 기존 토큰 사용자 확인 오류:', error);
          // 오류 발생 시 이메일 기반 ID 사용
          token.id = emailBasedUserId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // 이메일 기반으로 일관된 사용자 ID 확인
        let actualUserId = token.id as string;
        
        if (token.email) {
          try {
            const normalizedEmail = (token.email as string).toLowerCase().trim();
            // 이메일 기반으로 일관된 사용자 ID 생성
            const emailBasedUserId = generateUserIdFromEmail(normalizedEmail);
            
            // 이메일로 기존 사용자 확인
            const userByEmail = getUserByEmail(normalizedEmail);
            
            if (userByEmail) {
              // 기존 사용자가 있으면 그 ID 사용
              actualUserId = userByEmail.id;
              if (userByEmail.id !== emailBasedUserId) {
                console.log('🔄 [Session] 이메일로 기존 사용자 ID 확인:', {
                  tokenId: token.id,
                  emailBasedId: emailBasedUserId,
                  actualUserId: userByEmail.id,
                  email: normalizedEmail
                });
              } else {
                console.log('✅ [Session] 사용자 ID 일치:', {
                  userId: actualUserId,
                  email: normalizedEmail
                });
              }
            } else {
              // 기존 사용자가 없으면 이메일 기반 ID 사용
              actualUserId = emailBasedUserId;
              console.log('📝 [Session] 새 사용자, 이메일 기반 ID 사용:', {
                tokenId: token.id,
                emailBasedId: emailBasedUserId,
                email: normalizedEmail
              });
              
              // 사용자가 DB에 없으면 생성 시도 (signIn 콜백이 실행되지 않은 경우 대비)
              try {
                const createdUserId = createUser({
                  id: emailBasedUserId,
                  email: normalizedEmail,
                  blogUrl: null,
                  name: session.user.name || undefined,
                  image: session.user.image || undefined,
                  provider: token.provider as string || undefined,
                });
                
                // createUser가 반환한 실제 사용자 ID 사용
                actualUserId = createdUserId || emailBasedUserId;
                
                console.log('✅ [Session] 사용자 생성 완료:', {
                  userId: actualUserId,
                  email: normalizedEmail
                });
              } catch (error: any) {
                console.error('❌ [Session] 사용자 생성 오류:', error);
                // 사용자 생성 실패해도 세션은 유지 (이메일 기반 ID 사용)
              }
            }
          } catch (error) {
            console.error('❌ [Session] 사용자 확인 오류:', error);
          }
        }
        
        session.user.id = actualUserId;
        session.user.email = (token.email as string)?.toLowerCase().trim() || token.email as string;
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
    // PKCE 검증을 위한 세션 설정
    updateAge: 24 * 60 * 60, // 24시간마다 세션 업데이트
  },
});

