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

### 2.2 이메일/비밀번호 인증 활성화
1. Authentication 페이지에서 **"Sign-in method"** (로그인 방법) 탭을 클릭합니다.
2. 제공업체 목록에서 **"이메일/비밀번호"** 또는 **"Email/Password"**를 찾습니다.
3. **"이메일/비밀번호"**를 클릭합니다.
4. **"사용 설정"** 또는 **"Enable"** 토글을 활성화합니다.
5. **"저장"** 또는 **"Save"** 버튼을 클릭합니다.

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

# Firebase (위에서 복사한 정보를 입력)
# 예시: gaeo-analysis 프로젝트
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDwzXXYi6fo3yYRcWEjaszVfoakgWdh9IY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gaeo-analysis.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gaeo-analysis
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gaeo-analysis.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=724180779028
NEXT_PUBLIC_FIREBASE_APP_ID=1:724180779028:web:9896de5ffff4a19227a701

# Firebase Analytics (선택 사항)
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-RG7VRRSKTX

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

**참고:** 위의 Firebase 설정 값은 예시입니다. Firebase Console에서 복사한 실제 값을 사용하세요.

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

## 6. 설정 확인

### 6.1 파일 확인
`.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인합니다 (이미 설정되어 있습니다).

### 6.2 개발 서버 실행
터미널에서 다음 명령어를 실행합니다:

```bash
npm run dev
```

### 6.3 테스트
1. 브라우저에서 `http://localhost:3000`에 접속합니다.
2. **"회원가입"** 페이지로 이동합니다.
3. 이메일과 비밀번호를 입력하여 계정을 생성합니다.
4. 로그인이 정상적으로 작동하는지 확인합니다.

## 문제 해결

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

