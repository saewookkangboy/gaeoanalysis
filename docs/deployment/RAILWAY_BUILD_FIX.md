# Railway 빌드 오류 해결 가이드

## 문제

Railway에서 빌드 시 다음 오류 발생:
```
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
```

## 원인

Tailwind CSS v4는 `lightningcss` 네이티브 모듈을 사용합니다. Railway의 Linux 환경에서 Linux 전용 네이티브 바이너리가 설치되지 않아 발생한 문제입니다.

## 해결 방법

### 1. optionalDependencies 추가

`package.json`에 `lightningcss-linux-x64-gnu`를 `optionalDependencies`로 추가:

```json
{
  "optionalDependencies": {
    "lightningcss-linux-x64-gnu": "^1.30.2"
  }
}
```

### 2. .npmrc 파일 설정

`.npmrc` 파일에 optional dependencies 설치 설정:

```
optional=true
```

### 3. 동작 방식

- **로컬 환경 (macOS)**: Linux 전용 패키지 설치 실패해도 무시 (optional)
- **Railway 환경 (Linux)**: Linux 전용 패키지 자동 설치

## PostgreSQL 로그 확인

PostgreSQL 로그는 정상입니다:
- `database system is ready to accept connections` - 정상 시작
- 자동 복구 완료 메시지도 정상

## 확인 사항

Railway 빌드 후 다음을 확인하세요:

1. **빌드 성공**: `npm run build` 성공
2. **애플리케이션 시작**: 서비스 정상 시작
3. **PostgreSQL 연결**: 데이터베이스 연결 성공

## 추가 문제 해결

### 문제 1: 여전히 lightningcss 오류 발생

**해결 방법**:
1. Railway에서 서비스 재배포
2. `package-lock.json`이 최신인지 확인
3. Railway 빌드 로그에서 `lightningcss-linux-x64-gnu` 설치 확인

### 문제 2: 다른 네이티브 모듈 오류

**해결 방법**:
해당 모듈의 Linux 전용 패키지를 `optionalDependencies`에 추가

예시:
```json
{
  "optionalDependencies": {
    "lightningcss-linux-x64-gnu": "^1.30.2",
    "other-module-linux-x64-gnu": "^version"
  }
}
```

## 참고

- `optionalDependencies`: 설치 실패해도 빌드 계속 진행
- Railway는 Linux x64 환경이므로 `linux-x64-gnu` 패키지 필요
- 로컬 개발 환경에서는 설치되지 않아도 문제 없음

