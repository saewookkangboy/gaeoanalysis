/**
 * Firebase 사용자 삭제 스크립트
 * 
 * 사용법:
 * npx tsx scripts/delete-firebase-user.ts <email>
 * 
 * 예시:
 * npx tsx scripts/delete-firebase-user.ts chunghyo@troe.kr
 * 
 * 주의: Firebase Admin SDK가 필요합니다.
 * 설치: npm install firebase-admin
 * 
 * 환경 변수 설정 (선택):
 * - FIREBASE_SERVICE_ACCOUNT_KEY: JSON 문자열로 된 서비스 계정 키
 * - FIREBASE_SERVICE_ACCOUNT_PATH: 서비스 계정 키 파일 경로 (기본: ./firebase-service-account.json)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Firebase Admin SDK 동적 로드
let firebaseAdmin: any;
let app: any;

async function initializeFirebaseAdmin() {
  try {
    firebaseAdmin = await import('firebase-admin');
  } catch (error) {
    console.error('❌ Firebase Admin SDK가 설치되지 않았습니다.');
    console.error('설치 방법: npm install firebase-admin');
    console.error('\n또는 Firebase Console에서 직접 삭제하세요:');
    console.error('1. https://console.firebase.google.com/ 접속');
    console.error('2. 프로젝트 선택 → Authentication → Users');
    console.error('3. 삭제할 사용자 선택 → 삭제');
    process.exit(1);
  }

  // 이미 초기화되어 있으면 재사용
  if (firebaseAdmin.getApps().length > 0) {
    app = firebaseAdmin.getApps()[0];
    return;
  }

  // 방법 1: 환경 변수에서 서비스 계정 키 사용
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin SDK 초기화 완료 (환경 변수 사용)');
      return;
    } catch (error) {
      console.error('환경 변수에서 서비스 계정 키 파싱 실패:', error);
    }
  }

  // 방법 2: 서비스 계정 키 파일 사용
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    join(process.cwd(), 'firebase-service-account.json');
  
  try {
    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      app = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin SDK 초기화 완료 (파일 사용)');
      return;
    }
  } catch (error) {
    console.error('서비스 계정 키 파일 읽기 실패:', error);
  }

  // 서비스 계정 키가 없으면 안내
  console.error('❌ Firebase 서비스 계정 키가 필요합니다.');
  console.error('\n설정 방법:');
  console.error('1. Firebase Console → 프로젝트 설정 → 서비스 계정');
  console.error('2. "새 비공개 키 생성" 클릭하여 JSON 파일 다운로드');
  console.error('3. 다음 중 하나를 선택:');
  console.error('   - 환경 변수: FIREBASE_SERVICE_ACCOUNT_KEY="<JSON 내용>"');
  console.error('   - 파일: firebase-service-account.json 파일을 프로젝트 루트에 저장');
  console.error('\n또는 Firebase Console에서 직접 삭제하세요.');
  process.exit(1);
}

async function deleteUserByEmail(email: string) {
  if (!app) {
    console.error('Firebase Admin SDK가 초기화되지 않았습니다.');
    process.exit(1);
  }

  const auth = firebaseAdmin.getAuth(app);
  
  // 이메일 정규화 (try 블록 밖에서 선언)
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    console.log(`\n🔍 사용자 검색 중: ${normalizedEmail}`);
    
    const user = await auth.getUserByEmail(normalizedEmail);
    console.log(`✅ 사용자 찾음: ${user.uid} (${user.email})`);
    
    // 사용자 삭제
    await auth.deleteUser(user.uid);
    console.log(`✅ Firebase에서 사용자 삭제 완료: ${normalizedEmail}`);
    
    // 로컬 DB에서도 사용자 삭제
    try {
      const { deleteUser } = await import('../lib/db-helpers');
      const deleted = deleteUser(user.uid);
      if (deleted) {
        console.log(`✅ 로컬 DB에서도 사용자 삭제 완료: ${user.uid}`);
      } else {
        console.log(`ℹ️  로컬 DB에 해당 사용자가 없었습니다 (무시 가능)`);
      }
    } catch (dbError: any) {
      console.warn('⚠️  로컬 DB 삭제 실패 (무시 가능):', dbError.message);
    }
    
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ 사용자를 찾을 수 없습니다: ${normalizedEmail}`);
      console.error('Firebase Console에서 사용자가 이미 삭제되었는지 확인하세요.');
    } else {
      console.error('❌ 사용자 삭제 실패:', error.message || error);
    }
    process.exit(1);
  }
}

// 메인 실행
async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('사용법: npx tsx scripts/delete-firebase-user.ts <email>');
    console.error('예시: npx tsx scripts/delete-firebase-user.ts chunghyo@troe.kr');
    console.error('\n또는 Firebase Console에서 직접 삭제:');
    console.error('https://console.firebase.google.com/ → 프로젝트 → Authentication → Users');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Firebase 사용자 삭제 스크립트');
  console.log('='.repeat(60));
  
  await initializeFirebaseAdmin();
  await deleteUserByEmail(email);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 완료!');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('스크립트 실행 실패:', error);
  process.exit(1);
});

