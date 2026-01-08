# NextAuth v5 업그레이드 가이드

## 문제 상황

NextAuth v4.24.13을 사용 중이며, App Router에서 다음 에러가 발생합니다:

```
TypeError: Cannot destructure property 'nextauth' of 'e.query' as it is undefined.
```

이것은 NextAuth v4가 내부적으로 `req.query.nextauth`를 기대하는데, App Router에서는 이것이 제공되지 않기 때문입니다.

## 해결 방법: NextAuth v5로 업그레이드

NextAuth v5 (Auth.js)는 App Router를 완전히 지원하며, 이 문제를 해결합니다.

### 1. NextAuth v5 설치

```bash
npm install next-auth@beta
```

### 2. 환경 변수 변경

NextAuth v5에서는 `NEXTAUTH_SECRET` 대신 `AUTH_SECRET`을 사용합니다.

**기존 (v4):**
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

**새로운 (v5):**
```env
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000  # 선택 사항
```

### 3. 설정 파일 변경

**기존 (v4) - `lib/auth.ts`:**
```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // ...
  ],
};
```

**새로운 (v5) - `auth.ts` (루트에 생성):**
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // 사용자 저장 로직
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
});
```

### 4. API 라우트 변경

**기존 (v4) - `app/api/auth/[...nextauth]/route.ts`:**
```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**새로운 (v5) - `app/api/auth/[...nextauth]/route.ts`:**
```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### 5. 클라이언트 컴포넌트 변경

**기존 (v4):**
```typescript
import { useSession, signIn, signOut } from 'next-auth/react';
```

**새로운 (v5):**
```typescript
import { useSession } from "next-auth/react";
import { signIn, signOut } from "@/auth";
```

또는 서버 컴포넌트에서:
```typescript
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();
  // ...
}
```

### 6. 타입 정의 변경

**기존 (v4) - `types/next-auth.d.ts`:**
```typescript
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
  }
  // ...
}
```

**새로운 (v5) - `types/next-auth.d.ts`:**
```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      provider?: string;
    } & DefaultSession["user"];
  }
}
```

## 마이그레이션 체크리스트

- [ ] NextAuth v5 설치
- [ ] 환경 변수 변경 (`NEXTAUTH_SECRET` → `AUTH_SECRET`)
- [ ] `auth.ts` 파일 생성 (루트에)
- [ ] `lib/auth.ts` 제거 또는 마이그레이션
- [ ] API 라우트 업데이트
- [ ] 클라이언트 컴포넌트 업데이트
- [ ] 서버 컴포넌트 업데이트 (필요한 경우)
- [ ] 타입 정의 업데이트
- [ ] 테스트

## 참고 자료

- [NextAuth v5 공식 문서](https://authjs.dev/)
- [NextAuth v5 마이그레이션 가이드](https://authjs.dev/getting-started/migrating-to-v5)
- [NextAuth v5 GitHub](https://github.com/nextauthjs/next-auth)

