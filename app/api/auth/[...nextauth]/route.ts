import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { handleCorsPreflight } from '@/lib/headers';

const handler = NextAuth(authOptions);

// NextAuth는 자체적으로 CORS를 처리하지만, 명시적으로 OPTIONS 핸들러 추가
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

export async function OPTIONS(request: NextRequest) {
  // NextAuth의 OPTIONS 핸들러를 먼저 시도
  const corsResponse = handleCorsPreflight(request);
  if (corsResponse) {
    return corsResponse;
  }
  // NextAuth가 자체적으로 처리하도록 전달
  return handler(request);
}

