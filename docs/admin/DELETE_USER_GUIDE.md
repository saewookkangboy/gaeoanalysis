# Firebase 사용자 삭제 가이드

`chunghyo@troe.kr` 이메일로 등록된 사용자를 삭제하는 방법입니다.

## 방법 1: Firebase Console에서 직접 삭제 (권장, 가장 간단)

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. **Authentication** → **Users** 탭 클릭
4. `chunghyo@troe.kr` 이메일로 검색
5. 사용자 선택 → **삭제** 버튼 클릭
6. 확인 대화상자에서 **삭제** 확인

**장점:**
- 서비스 계정 키 불필요
- 즉시 삭제 가능
- 가장 간단한 방법

## 방법 2: 스크립트를 통한 삭제

### 2.1 Firebase 서비스 계정 키 준비

1. Firebase Console → 프로젝트 설정 → **서비스 계정** 탭
2. **새 비공개 키 생성** 클릭
3. JSON 파일 다운로드

### 2.2 서비스 계정 키 설정

다음 중 하나를 선택:

**옵션 A: 환경 변수로 설정**
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

**옵션 B: 파일로 저장**
- 다운로드한 JSON 파일을 프로젝트 루트에 `firebase-service-account.json`으로 저장
- `.gitignore`에 추가되어 있어 Git에 커밋되지 않습니다

### 2.3 사용자 삭제 실행

```bash
npm run firebase:delete-user chunghyo@troe.kr
```

또는

```bash
npx tsx scripts/delete-firebase-user.ts chunghyo@troe.kr
```

**스크립트 동작:**
1. Firebase에서 사용자 검색
2. Firebase에서 사용자 삭제
3. 로컬 DB에서도 사용자 삭제 (관련 데이터 포함)

## 주의사항

- 사용자 삭제 시 관련 데이터도 함께 삭제됩니다:
  - 분석 이력 (analyses)
  - 채팅 대화 이력 (chat_conversations)
- 삭제된 데이터는 복구할 수 없습니다.
- 로컬 DB의 외래 키 제약 조건으로 인해 관련 데이터가 자동으로 삭제됩니다.

## 문제 해결

### 스크립트 실행 시 "Firebase Admin SDK가 설치되지 않았습니다" 에러

```bash
npm install firebase-admin --save-dev
```

### 서비스 계정 키 관련 에러

- 서비스 계정 키가 올바르게 설정되었는지 확인
- JSON 형식이 올바른지 확인
- 환경 변수나 파일 경로가 올바른지 확인

### 사용자를 찾을 수 없다는 에러

- Firebase Console에서 사용자가 이미 삭제되었는지 확인
- 이메일 주소가 정확한지 확인 (대소문자 구분 없음)

