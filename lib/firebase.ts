import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Firebase 초기화 (서버/클라이언트 모두 지원)
// 서버 측에서는 동적으로 초기화하도록 변경 (Vercel 환경 대응)
function initializeFirebase() {
  // 이미 초기화되어 있으면 재사용
  if (app && auth) {
    return { app, auth };
  }

  if (!firebaseConfig.apiKey) {
    const isServer = typeof window === 'undefined';
    if (isServer) {
      console.error('❌ Firebase API Key가 설정되지 않았습니다.');
      console.error('환경 변수 확인:', {
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      console.warn('Firebase API Key가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
    }
    return { app: undefined, auth: undefined };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    return { app, auth };
  } catch (error: any) {
    console.error('Firebase 초기화 오류:', error);
    console.error('Firebase 설정 확인:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId,
      errorMessage: error.message,
    });
    return { app: undefined, auth: undefined };
  }
}

// 초기화 실행
const { app: initializedApp, auth: initializedAuth } = initializeFirebase();
if (!app) app = initializedApp;
if (!auth) auth = initializedAuth;

export { app, auth };

