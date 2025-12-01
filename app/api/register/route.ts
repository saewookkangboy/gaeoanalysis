import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser } from '@/lib/db-helpers';
import { createErrorResponse, createSuccessResponse, withErrorHandling, sanitizeUrl } from '@/lib/api-utils';
import { addSecurityHeaders, handleCorsPreflight } from '@/lib/headers';
import { z } from 'zod';

// 입력 스키마 정의
const registerSchema = z.object({
  email: z.string().email('유효하지 않은 이메일입니다.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  blogUrl: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      { message: '유효하지 않은 URL입니다.' }
    ),
});

async function handleRegister(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error('회원가입 요청 파싱 오류:', error);
    return createErrorResponse(
      'INVALID_REQUEST',
      '요청 본문을 파싱할 수 없습니다. JSON 형식을 확인해주세요.',
      400
    );
  }
  
  console.log('회원가입 요청 받음:', { email: body?.email, hasPassword: !!body?.password });
  
  // 스키마 검증
  let validatedData;
  try {
    validatedData = registerSchema.parse(body);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('회원가입 검증 오류:', error.issues);
      const firstError = error.issues[0];
      return createErrorResponse(
        'VALIDATION_ERROR',
        firstError.message || '입력값 검증에 실패했습니다.',
        400,
        { issues: error.issues }
      );
    }
    throw error;
  }

  let { email, password, blogUrl } = validatedData;

  // 이메일 정규화 (소문자 변환 및 공백 제거)
  email = email.toLowerCase().trim();

  if (!auth) {
    console.error('Firebase auth가 초기화되지 않았습니다.');
    console.error('환경 변수 확인:', {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    return createErrorResponse(
      'CONFIG_ERROR',
      'Firebase가 초기화되지 않았습니다. 환경 변수를 확인해주세요.',
      500
    );
  }

  // blogUrl sanitization
  let sanitizedBlogUrl: string | null = null;
  if (blogUrl && blogUrl.trim() !== '') {
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

  try {
    console.log('회원가입 시도:', { email });
    // Firebase에 사용자 생성
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
  } catch (error: any) {
    // Firebase 에러 처리
    console.error('회원가입 Firebase 에러:', {
      code: error.code,
      message: error.message,
      email,
    });
    
    let errorMessage = '회원가입 중 오류가 발생했습니다.';
    let errorCode = 'REGISTRATION_ERROR';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '이미 사용 중인 이메일입니다.';
      errorCode = 'EMAIL_EXISTS';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '유효하지 않은 이메일 형식입니다.';
      errorCode = 'INVALID_EMAIL';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
      errorCode = 'WEAK_PASSWORD';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = '이메일/비밀번호 로그인이 활성화되지 않았습니다.';
      errorCode = 'OPERATION_NOT_ALLOWED';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.code === 'auth/internal-error') {
      errorMessage = 'Firebase 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      errorCode = 'FIREBASE_INTERNAL_ERROR';
    }

    return createErrorResponse(errorCode, errorMessage, 400, {
      firebaseErrorCode: error.code,
    });
  }
}

async function handleRegisterWithSecurity(request: NextRequest) {
  const response = await withErrorHandling(handleRegister, '회원가입 중 오류가 발생했습니다.')(request);
  return addSecurityHeaders(request, response);
}

export async function POST(request: NextRequest) {
  return await handleRegisterWithSecurity(request);
}

export async function OPTIONS(request: NextRequest) {
  const preflightResponse = handleCorsPreflight(request);
  return preflightResponse || addSecurityHeaders(request, new NextResponse(null, { status: 200 }));
}

