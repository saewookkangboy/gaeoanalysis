import { handlers } from "@/auth";
import { NextRequest, NextResponse } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

// NextAuth v5 App Router 지원
// handlers에서 직접 GET, POST를 export

export const { GET, POST } = handlers;

export async function OPTIONS(request: NextRequest) {
  try {
    const corsResponse = handleCorsPreflight(request);
    if (corsResponse) {
      return corsResponse;
    }
    // OPTIONS는 handlers에 포함되지 않을 수 있으므로 직접 처리
    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error('[NextAuth OPTIONS] 에러:', error);
    return new NextResponse(null, { status: 200 });
  }
}

