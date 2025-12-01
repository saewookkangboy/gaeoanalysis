import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { createUser, getUser } from '@/lib/db-helpers';

// NEXTAUTH_SECRET 확인
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ NEXTAUTH_SECRET이 설정되지 않았습니다.');
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Vercel 환경에서는 NEXTAUTH_URL이 자동으로 설정되지만, 명시적으로 설정하는 것이 좋음
  // 로컬 개발 환경에서는 http://localhost:3000으로 설정
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
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
            console.log('새 사용자 생성:', { id: user.id, email: user.email });
          }
        } catch (error) {
          console.error('사용자 저장 오류:', error);
          // 에러가 발생해도 로그인은 허용
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
};

