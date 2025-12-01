import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const authOptions: NextAuthOptions = {
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
            throw new Error('Firebase가 초기화되지 않았습니다. 환경 변수를 확인해주세요.');
          }
          
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          return {
            id: userCredential.user.uid,
            email: userCredential.user.email || '',
          };
        } catch (error: any) {
          console.error('Auth error:', error);
          
          // Firebase 에러 메시지 처리
          if (error.code === 'auth/user-not-found') {
            throw new Error('등록되지 않은 이메일입니다.');
          } else if (error.code === 'auth/wrong-password') {
            throw new Error('비밀번호가 올바르지 않습니다.');
          } else if (error.code === 'auth/invalid-email') {
            throw new Error('유효하지 않은 이메일 형식입니다.');
          } else if (error.code === 'auth/user-disabled') {
            throw new Error('비활성화된 계정입니다.');
          } else if (error.code === 'auth/too-many-requests') {
            throw new Error('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.');
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
};

