import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser } from '@/lib/db-helpers';

export async function POST(request: NextRequest) {
  try {
    const { email, password, blogUrl } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // 사용자 정보를 DB에 저장 (트랜잭션 사용)
    createUser({
      id: userId,
      email,
      blogUrl: blogUrl || null,
    });

    return NextResponse.json({
      success: true,
      userId,
      email,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

