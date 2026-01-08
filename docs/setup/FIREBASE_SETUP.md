# Firebase 프로젝트 설정 가이드

이 문서는 GAEO Analysis by allrounder 프로젝트를 위한 Firebase 설정 방법을 안내합니다.

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. 웹 브라우저에서 [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. Google 계정으로 로그인합니다.

### 1.2 새 프로젝트 추가
1. Firebase Console 메인 페이지에서 **"프로젝트 추가"** 또는 **"Add project"** 버튼을 클릭합니다.
2. 프로젝트 이름을 입력합니다 (예: `gaeo-analysis`).
3. Google Analytics 사용 여부를 선택합니다 (선택 사항).
4. **"프로젝트 만들기"** 또는 **"Create project"** 버튼을 클릭합니다.
5. 프로젝트 생성이 완료될 때까지 기다립니다 (약 1-2분 소요).

## 2. Authentication 활성화

### 2.1 Authentication 메뉴 접속
1. Firebase Console에서 생성한 프로젝트를 선택합니다.
2. 왼쪽 메뉴에서 **"Authentication"** (인증)을 클릭합니다.
3. **"시작하기"** 또는 **"Get started"** 버튼을 클릭합니다.

### 2.2 OAuth 제공업체 활성화

**참고:** 이 프로젝트는 NextAuth.js를 사용하여 OAuth 로그인을 처리하므로, Firebase Authentication의 OAuth 설정은 선택 사항입니다. NextAuth.js가 OAuth 인증을 처리합니다.

필요한 경우 Firebase에서도 OAuth를 활성화할 수 있습니다:

#### Google 로그인 활성화 (선택 사항)
1. Authentication 페이지에서 **"Sign-in method"** (로그인 방법) 탭을 클릭합니다.
2. 제공업체 목록에서 **"Google"**을 찾습니다.
3. **"Google"**을 클릭합니다.
4. **"사용 설정"** 또는 **"Enable"** 토글을 활성화합니다.
5. 프로젝트 지원 이메일 선택
6. **"저장"** 또는 **"Save"** 버튼을 클릭합니다.

#### GitHub 로그인 활성화 (선택 사항)
1. 제공업체 목록에서 **"GitHub"**를 찾습니다.
2. **"GitHub"**를 클릭합니다.
3. **"사용 설정"** 또는 **"Enable"** 토글을 활성화합니다.
4. GitHub OAuth App의 Client ID와 Client Secret 입력
5. **"저장"** 또는 **"Save"** 버튼을 클릭합니다.

**중요:** NextAuth.js를 사용하는 경우, Firebase Authentication의 OAuth 설정은 필요하지 않습니다. NextAuth.js가 직접 OAuth 인증을 처리합니다.

## 3. 웹 앱 등록

### 3.1 웹 앱 추가
1. Firebase Console 프로젝트 개요 페이지에서 **웹 아이콘** (`</>`)을 클릭합니다.
2. 앱 닉네임을 입력합니다 (예: `GAEO Analysis Web`).
3. **"앱 등록"** 또는 **"Register app"** 버튼을 클릭합니다.

### 3.2 Firebase 설정 정보 복사
앱 등록 후 다음 정보가 표시됩니다. 이 정보를 복사해두세요:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## 4. 환경 변수 설정

### 4.1 .env.local 파일 생성
프로젝트 루트 디렉토리에 `.env.local` 파일을 생성합니다.

### 4.2 환경 변수 입력
`.env.local` 파일에 다음 내용을 입력합니다:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Firebase (Firebase Console에서 복사한 실제 값을 입력하세요)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Firebase Analytics (선택 사항)
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

**⚠️ 보안 주의사항:**
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함되어 있습니다).
- 실제 Firebase API 키와 시크릿 키를 문서나 코드에 하드코딩하지 마세요.
- 프로덕션 환경에서는 Vercel 등의 플랫폼 환경 변수 설정을 사용하세요.

### 4.3 NEXTAUTH_SECRET 생성
터미널에서 다음 명령어를 실행하여 시크릿 키를 생성합니다:

```bash
openssl rand -base64 32
```

생성된 키를 `NEXTAUTH_SECRET`에 입력합니다.

## 5. Gemini API 키 발급 (선택 사항)

AI 챗봇 기능을 사용하려면 Google Gemini API 키가 필요합니다.

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속합니다.
2. Google 계정으로 로그인합니다.
3. **"Create API Key"** 버튼을 클릭합니다.
4. 생성된 API 키를 복사하여 `.env.local`의 `GEMINI_API_KEY`에 입력합니다.

## 6. Vercel 배포 환경 설정

### 6.1 Vercel 환경 변수 설정
프로덕션 배포 시 Vercel Dashboard에서 환경 변수를 설정해야 합니다:

1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속합니다.
2. 프로젝트 선택 → **Settings** → **Environment Variables**로 이동합니다.
3. 다음 환경 변수들을 추가합니다:
   - `NEXTAUTH_URL`: 배포된 도메인 (예: `https://gaeoanalysis.vercel.app`)
   - `NEXTAUTH_SECRET`: 로컬에서 생성한 시크릿 키
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API 키
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth 도메인
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase Storage 버킷
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase App ID
   - `GEMINI_API_KEY`: Gemini API 키

**⚠️ 중요:** 환경 변수 설정 후 배포를 다시 실행해야 변경사항이 적용됩니다.

## 7. 설정 확인

### 7.1 파일 확인
`.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인합니다 (이미 설정되어 있습니다).

### 7.2 개발 서버 실행
터미널에서 다음 명령어를 실행합니다:

```bash
npm run dev
```

### 7.3 테스트
1. 브라우저에서 `http://localhost:3000`에 접속합니다.
2. **"회원가입"** 페이지로 이동합니다.
3. 이메일과 비밀번호를 입력하여 계정을 생성합니다.
4. 로그인이 정상적으로 작동하는지 확인합니다.

## 8. 보안 모범 사례

### 8.1 환경 변수 관리
- ✅ `.env.local` 파일은 로컬 개발용으로만 사용
- ✅ 프로덕션 환경에서는 플랫폼 환경 변수 사용 (Vercel, AWS 등)
- ✅ API 키와 시크릿은 절대 Git에 커밋하지 않음
- ✅ 코드 리뷰 시 환경 변수 값이 노출되지 않도록 주의

### 8.2 Firebase 보안 규칙
- Firebase Console → **Authentication** → **Settings**에서 승인된 도메인 확인
- Firebase Console → **Firestore Database** → **Rules**에서 데이터베이스 보안 규칙 설정
- Firebase Console → **Storage** → **Rules**에서 스토리지 보안 규칙 설정

### 8.3 API 키 제한
- Firebase Console → **프로젝트 설정** → **일반** → **API 키**에서 키 제한 설정
- HTTP 리퍼러(웹사이트) 제한을 설정하여 특정 도메인에서만 사용 가능하도록 제한

## 9. 문제 해결

### Firebase 초기화 오류
- `.env.local` 파일이 프로젝트 루트에 있는지 확인합니다.
- 환경 변수 이름이 정확한지 확인합니다 (`NEXT_PUBLIC_` 접두사 필수).
- 개발 서버를 재시작합니다.

### 인증 오류
- Firebase Console에서 Authentication이 활성화되어 있는지 확인합니다.
- 이메일/비밀번호 제공업체가 활성화되어 있는지 확인합니다.

### API 키 오류
- Firebase Console에서 웹 앱이 등록되어 있는지 확인합니다.
- API 키가 올바르게 복사되었는지 확인합니다 (공백이나 줄바꿈 없이).

## 추가 리소스

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [NextAuth.js 문서](https://next-auth.js.org/)
- [Google Gemini API 문서](https://ai.google.dev/docs)

