# Admin 권한 설정 - 간단 실행 가이드

Railway 대시보드에서 SQL을 직접 실행할 수 없는 경우, 로컬 스크립트를 사용하세요.

## 🚀 가장 간단한 방법

### 방법 1: 쉘 스크립트 실행 (권장)

```bash
./set-admin-local.sh
```

이 스크립트가 자동으로:
1. DATABASE_URL 환경 변수 설정
2. Admin 권한 설정 스크립트 실행

### 방법 2: 직접 실행

터미널에서 다음 명령어를 실행:

```bash
export DATABASE_URL="postgresql://postgres:KAPaIaUhyQdOEpcmVPjqlYhHWnEtdPUP@yamanote.proxy.rlwy.net:12487/railway"
npx tsx scripts/set-admin-role.ts chunghyo@troe.kr
```

## 📋 실행 단계

1. **터미널에서 프로젝트 디렉토리로 이동**
   ```bash
   cd /Users/chunghyo/gaeo-analysis
   ```

2. **스크립트 실행**
   ```bash
   ./set-admin-local.sh
   ```

3. **결과 확인**
   - 성공 시: "✅ 사용자 role이 'admin'으로 업데이트되었습니다." 메시지 확인
   - 실패 시: 오류 메시지 확인

## ✅ 완료 후 확인

1. **브라우저에서 다시 로그인**
   - Google 로그인으로 다시 로그인

2. **Admin 페이지 접근**
   - 브라우저에서 `/admin` 경로로 직접 접근
   - 예: `https://gaeo.allrounder.im/admin`

3. **권한 확인**
   - Admin 대시보드가 표시되면 성공!

## 🔧 문제 해결

### 스크립트 실행 권한 오류

```bash
chmod +x set-admin-local.sh
./set-admin-local.sh
```

### DATABASE_URL 연결 오류

DATABASE_URL이 올바른지 확인:
- Railway 대시보드 → PostgreSQL 서비스 → Variables 탭
- `DATABASE_URL` 또는 `DATABASE_PUBLIC_URL` 확인

### 사용자를 찾을 수 없는 경우

스크립트가 자동으로:
- 데이터베이스에 있는 사용자 목록 표시
- 유사한 이메일 제안

