# Railway 배포 설정 가이드

Railway에서 이 프로젝트를 배포하기 위한 설정 가이드입니다.

## 1. Railway 프로젝트 생성

1. [Railway](https://railway.app/)에 로그인
2. "New Project" 클릭
3. "Deploy from GitHub repo" 선택
4. 이 저장소 선택

## 2. 환경 변수 설정

Railway 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 필수 환경 변수

```env
# NextAuth
AUTH_SECRET=your-secret-key-here
AUTH_URL=https://your-app.railway.app
# 또는 NEXTAUTH_URL 사용 가능

# Firebase (Firebase Console에서 가져온 값)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### OAuth 환경 변수 (선택 사항)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 3. AUTH_SECRET 생성

터미널에서 다음 명령어로 시크릿 키를 생성하세요:

```bash
openssl rand -base64 32
```

생성된 키를 `AUTH_SECRET` 환경 변수에 설정하세요.

## 4. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Authentication 활성화
3. 웹 앱 등록 후 설정 정보 복사
4. Railway 환경 변수에 설정

자세한 내용은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)를 참조하세요.

## 5. OAuth 설정

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 2.0 클라이언트 ID 생성
2. 승인된 리디렉션 URI 추가: `https://your-app.railway.app/api/auth/callback/google`
3. Client ID와 Client Secret을 Railway 환경 변수에 설정

### GitHub OAuth

1. GitHub → Settings → Developer settings → OAuth Apps
2. 새 OAuth App 생성
3. Authorization callback URL: `https://your-app.railway.app/api/auth/callback/github`
4. Client ID와 Client Secret을 Railway 환경 변수에 설정

## 6. Railway 특성

### 영구 파일 시스템

Railway는 영구 파일 시스템을 제공하므로:
- ✅ SQLite DB 파일이 자동으로 유지됩니다
- ✅ Blob Storage 설정이 필요 없습니다
- ✅ WAL 모드를 사용하여 최적의 성능을 제공합니다

### 환경 변수

Railway는 자동으로 다음 환경 변수를 설정합니다:
- `RAILWAY_ENVIRONMENT` 또는 `RAILWAY`: Railway 환경 감지용

## 7. 배포 확인

배포 후 다음을 확인하세요:

1. **헬스 체크**: `https://your-app.railway.app/api/health`
2. **로그 확인**: Railway 대시보드에서 로그 확인
3. **환경 변수 확인**: 모든 필수 환경 변수가 설정되었는지 확인

## 8. 문제 해결

### 빌드 실패

- 모든 필수 환경 변수가 설정되었는지 확인
- Railway 대시보드에서 환경 변수 확인
- 로그에서 구체적인 에러 메시지 확인

### 인증 오류

- `AUTH_SECRET`이 올바르게 설정되었는지 확인
- OAuth 리디렉션 URI가 정확한지 확인
- Firebase 설정이 올바른지 확인

### 데이터베이스 문제

- Railway는 영구 파일 시스템을 제공하므로 DB 파일이 자동으로 유지됩니다
- 로그에서 DB 관련 에러 확인

## 9. 추가 리소스

- [Railway 문서](https://docs.railway.app/)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [NextAuth.js 문서](https://next-auth.js.org/)

