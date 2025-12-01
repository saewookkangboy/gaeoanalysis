import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        try {
          if (!auth) {
            console.error('Firebase auth가 초기화되지 않았습니다.');
            console.error('환경 변수 확인:', {
              hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
              hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
              hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
            throw new Error('Firebase가 초기화되지 않았습니다. 환경 변수를 확인해주세요.');
          }
          
          // 이메일 정규화 (소문자 변환)
          const normalizedEmail = credentials.email.toLowerCase().trim();
          
          console.log('로그인 시도:', { email: normalizedEmail });
          
          const userCredential = await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            credentials.password
          );

          return {
            id: userCredential.user.uid,
            email: userCredential.user.email || '',
          };
        } catch (error: any) {
          console.error('Auth error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          // Firebase 에러 메시지 처리 - 구체적인 메시지를 throw하여 클라이언트에 전달
          if (error.code === 'auth/invalid-credential') {
            // auth/invalid-credential은 이메일이 없거나 비밀번호가 잘못된 경우 모두 포함
            // Firebase의 이메일 열거 보호 기능이 활성화되어 있으면 구체적인 에러 대신 이 에러가 반환됨
            console.error('인증 실패 - 가능한 원인:');
            console.error('1. 이메일이 등록되지 않았거나');
            console.error('2. 비밀번호가 틀렸거나');
            console.error('3. Firebase 이메일 열거 보호 기능이 활성화되어 있음');
            throw new Error('이메일 또는 비밀번호가 올바르지 않습니다. 회원가입을 먼저 진행하시거나 비밀번호를 확인해주세요.');
          } else if (error.code === 'auth/user-not-found') {
            throw new Error('등록되지 않은 이메일입니다.');
          } else if (error.code === 'auth/wrong-password') {
            throw new Error('비밀번호가 올바르지 않습니다.');
          } else if (error.code === 'auth/invalid-email') {
            throw new Error('유효하지 않은 이메일 형식입니다.');
          } else if (error.code === 'auth/user-disabled') {
            throw new Error('비활성화된 계정입니다.');
          } else if (error.code === 'auth/too-many-requests') {
            throw new Error('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
          } else if (error.code === 'auth/network-request-failed') {
            throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
          } else if (error.code === 'auth/internal-error') {
            throw new Error('Firebase 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          } else if (error.message) {
            throw new Error(error.message);
          }
          
          throw new Error('로그인 중 오류가 발생했습니다.');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

