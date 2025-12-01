import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser } from '@/lib/db-helpers';
import { createErrorResponse, createSuccessResponse, withErrorHandling, sanitizeUrl } from '@/lib/api-utils';
import { z } from 'zod';

// 입력 스키마 정의
const registerSchema = z.object({
  email: z.string().email('유효하지 않은 이메일입니다.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  blogUrl: z.string().url('유효하지 않은 URL입니다.').optional().nullable(),
});

async function handleRegister(request: NextRequest) {
  const body = await request.json();
  const { email, password, blogUrl } = registerSchema.parse(body);

  if (!auth) {
    return createErrorResponse(
      'CONFIG_ERROR',
      'Firebase가 초기화되지 않았습니다.',
      500
    );
  }

  // blogUrl sanitization
  let sanitizedBlogUrl: string | null = null;
  if (blogUrl) {
    try {
      sanitizedBlogUrl = sanitizeUrl(blogUrl);
    } catch (error) {
      return createErrorResponse(
        'INVALID_URL',
        '유효하지 않은 블로그 URL입니다.',
        400
      );
    }
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const userId = userCredential.user.uid;

  // 사용자 정보를 DB에 저장 (트랜잭션 사용)
  createUser({
    id: userId,
    email,
    blogUrl: sanitizedBlogUrl,
  });

  return createSuccessResponse({
    success: true,
    userId,
    email,
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(handleRegister, '회원가입 중 오류가 발생했습니다.')(request);
}

