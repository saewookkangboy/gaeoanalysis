import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

// NextAuth v4.24+ App Router 지원
// NextAuth v4는 내부적으로 req.query를 기대하므로, 
// 요청을 올바른 형식으로 변환하여 전달해야 함

const handler = NextAuth(authOptions);

// NextAuth v4.24+에서는 handler를 직접 export하는 방식 사용
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

