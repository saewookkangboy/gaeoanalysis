# Railway npm ci 오류 해결 가이드

## 문제

Railway 빌드 시 다음 오류 발생:
```
npm error Missing: @tailwindcss/oxide-linux-x64-gnu@4.1.17 from lock file
npm error Missing: @tailwindcss/oxide-linux-x64-musl@4.1.17 from lock file
```

## 원인

`npm ci`는 기본적으로 optional dependencies를 포함하지 않을 수 있습니다. Railway에서 `npm ci`를 실행할 때 optional dependencies가 포함되지 않아 발생한 문제입니다.

## 해결 방법

### 1. .npmrc 파일 확인

`.npmrc` 파일에 다음 설정이 있는지 확인:
```
include=optional
```

### 2. package.json 확인

`package.json`의 `optionalDependencies`에 다음이 포함되어 있는지 확인:
```json
{
  "optionalDependencies": {
    "@tailwindcss/oxide-linux-x64-gnu": "^4.1.17",
    "@tailwindcss/oxide-linux-x64-musl": "^4.1.17",
    "lightningcss-linux-x64-gnu": "^1.30.2"
  }
}
```

### 3. package-lock.json 확인

`package-lock.json`에 해당 패키지들이 포함되어 있는지 확인:
- `@tailwindcss/oxide-linux-x64-gnu@4.1.17`
- `@tailwindcss/oxide-linux-x64-musl@4.1.17`

### 4. Railway 빌드 설정

Railway에서 `npm ci` 대신 `npm install`을 사용하도록 설정할 수 있습니다:
- Railway 대시보드 > 프로젝트 설정 > Build Command
- `npm ci` → `npm install --include=optional`

또는 Railway의 환경 변수에 다음을 추가:
```
NPM_CONFIG_INCLUDE=optional
```

## 확인 사항

1. **로컬 테스트**: `npm ci --include=optional` 실행하여 성공 확인
2. **package-lock.json**: 최신 상태인지 확인
3. **Railway 빌드**: 재배포 후 빌드 성공 확인

## 참고

- `npm ci`는 `package-lock.json`과 `package.json`이 정확히 일치해야 합니다
- Optional dependencies는 플랫폼별로 다르게 설치됩니다
- Railway는 Linux 환경이므로 Linux 전용 바이너리가 필요합니다

