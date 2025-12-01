import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

// NextAuth v4 App Router 지원
// NextAuth v4.24+는 App Router를 지원하지만, 내부적으로 query 파라미터를 기대할 수 있음
// 핸들러를 직접 export하는 방식으로 변경 (NextAuth 공식 권장 방식)

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export async function OPTIONS(request: NextRequest) {
  try {
    const corsResponse = handleCorsPreflight(request);
    if (corsResponse) {
      return corsResponse;
    }
    return handler(request);
  } catch (error: any) {
    console.error('[NextAuth OPTIONS] 에러:', error);
    return new Response(null, { status: 200 });
  }
}

