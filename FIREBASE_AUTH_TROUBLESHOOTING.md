# Firebase 인증 문제 해결 가이드

## auth/invalid-credential 에러 해결 방법

### 1. 사용자 등록 확인

**가장 먼저 확인해야 할 사항:**

1. **회원가입 완료 여부 확인**
   - `chunghyo@troe.kr` 이메일로 회원가입을 완료했는지 확인
   - 회원가입이 안 되어 있다면 먼저 회원가입 페이지에서 계정 생성

2. **비밀번호 확인**
   - 회원가입 시 사용한 비밀번호와 로그인 시 입력한 비밀번호가 일치하는지 확인
   - 비밀번호는 대소문자를 구분합니다

### 2. Firebase 콘솔 설정 확인

#### 2.1 이메일/비밀번호 인증 활성화 확인

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **Authentication** → **Sign-in method** 탭
4. **이메일/비밀번호** (Email/Password) 확인
5. **사용 설정** (Enable) 토글이 활성화되어 있는지 확인

#### 2.2 이메일 열거 보호 설정 확인

Firebase의 **이메일 열거 보호** 기능이 활성화되어 있으면, 존재하지 않는 이메일이나 잘못된 비밀번호로 로그인 시도 시 구체적인 오류 메시지 대신 일반적인 `auth/invalid-credential` 오류가 반환됩니다.

**확인 방법:**
1. Firebase Console → **Authentication** → **Settings** (설정)
2. **이메일 열거 보호** (Email enumeration protection) 섹션 확인
3. 활성화되어 있다면, 테스트를 위해 일시적으로 비활성화할 수 있습니다

**참고:** 프로덕션 환경에서는 보안을 위해 이메일 열거 보호를 활성화하는 것을 권장합니다.

#### 2.3 승인된 도메인 확인

1. Firebase Console → **Authentication** → **Settings** (설정)
2. **승인된 도메인** (Authorized domains) 섹션 확인
3. 사용 중인 도메인이 목록에 포함되어 있는지 확인
   - 로컬 개발: `localhost`가 포함되어 있어야 함
   - 프로덕션: 배포 도메인이 포함되어 있어야 함

### 3. 환경 변수 확인

`.env.local` 파일에 Firebase 설정이 올바르게 되어 있는지 확인:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**확인 사항:**
- 모든 값이 올바르게 입력되어 있는지
- 따옴표나 공백이 없는지
- Firebase Console에서 복사한 값과 일치하는지

### 4. 사용자 계정 확인

Firebase Console에서 사용자가 실제로 등록되어 있는지 확인:

1. Firebase Console → **Authentication** → **Users** 탭
2. `chunghyo@troe.kr` 이메일로 등록된 사용자가 있는지 확인
3. 사용자가 없다면 회원가입을 먼저 진행해야 합니다

### 5. 테스트 방법

#### 5.1 새 계정으로 테스트

1. 회원가입 페이지에서 새로운 이메일로 계정 생성
2. 생성한 이메일/비밀번호로 로그인 시도
3. 로그인이 성공하면, 기존 계정의 비밀번호가 틀렸을 가능성이 높습니다

#### 5.2 비밀번호 재설정

비밀번호를 잊은 경우:
1. Firebase Console → **Authentication** → **Users**
2. 해당 사용자 선택
3. **비밀번호 재설정** (Reset password) 클릭
4. 이메일로 전송된 링크를 통해 새 비밀번호 설정

### 6. 서버 로그 확인

개발 서버의 콘솔에서 다음 로그를 확인:

```
로그인 시도: { email: 'chunghyo@troe.kr' }
Auth error: ...
Error code: auth/invalid-credential
```

이 로그가 보이면:
- Firebase 초기화는 정상적으로 되었습니다
- 문제는 이메일/비밀번호가 일치하지 않거나 사용자가 등록되지 않은 것입니다

### 7. 일반적인 해결 순서

1. ✅ **회원가입 완료 확인** - 가장 먼저 확인
2. ✅ **비밀번호 확인** - 대소문자, 특수문자 포함
3. ✅ **Firebase Console에서 사용자 확인** - 실제로 등록되어 있는지
4. ✅ **이메일/비밀번호 인증 활성화 확인** - Firebase Console 설정
5. ✅ **환경 변수 확인** - `.env.local` 파일
6. ✅ **새 계정으로 테스트** - 문제 격리

### 8. 추가 디버깅

문제가 계속되면 다음 정보를 확인하세요:

1. **브라우저 콘솔 로그**
   - 개발자 도구 (F12) → Console 탭
   - 에러 메시지 확인

2. **네트워크 탭**
   - 개발자 도구 → Network 탭
   - `/api/auth/callback/credentials` 요청 확인
   - Response 탭에서 실제 에러 메시지 확인

3. **서버 로그**
   - 터미널에서 개발 서버 로그 확인
   - Firebase 초기화 및 인증 시도 로그 확인

---

**참고:** `auth/invalid-credential` 에러는 보안상의 이유로 구체적인 원인(이메일이 없음 vs 비밀번호가 틀림)을 구분하지 않습니다. 따라서 사용자가 등록되어 있고 비밀번호가 맞는지 확인하는 것이 중요합니다.

