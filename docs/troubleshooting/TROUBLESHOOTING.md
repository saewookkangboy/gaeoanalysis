# 문제 해결 가이드

## 개발 서버 관련 문제

### 1. "Unable to acquire lock" 오류

**증상:**
```
⨯ Unable to acquire lock at /Users/.../.next/dev/lock, is another instance of next dev running?
```

**원인:**
- 이전 Next.js 개발 서버 인스턴스가 제대로 종료되지 않음
- Lock 파일이 남아있음

**해결 방법:**

```bash
# 방법 1: 정리 스크립트 사용 (권장)
npm run cleanup
npm run dev

# 방법 2: 자동 정리와 함께 시작
npm run dev:clean

# 방법 3: 수동 정리
# 1. 실행 중인 프로세스 확인
lsof -ti:3000,3001

# 2. 프로세스 종료
kill -9 $(lsof -ti:3000,3001)

# 3. Lock 파일 삭제
rm -f .next/dev/lock

# 4. 개발 서버 재시작
npm run dev
```

### 2. 포트가 이미 사용 중입니다

**증상:**
```
⚠ Port 3000 is in use by process 39616, using available port 3001 instead.
```

**원인:**
- 포트 3000에 다른 프로세스가 실행 중

**해결 방법:**

```bash
# 방법 1: 정리 스크립트 사용
npm run cleanup

# 방법 2: 수동으로 포트 사용 프로세스 종료
kill -9 $(lsof -ti:3000)
```

### 3. 빌드 캐시 문제

**증상:**
- 변경사항이 반영되지 않음
- 빌드 오류가 계속 발생

**해결 방법:**

```bash
# .next 폴더 완전 삭제 후 재시작
npm run cleanup:all
npm run dev
```

## 데이터베이스 관련 문제

### SQLite Lock 오류

**증상:**
```
SQLITE_BUSY: database is locked
```

**원인:**
- 여러 프로세스가 동시에 데이터베이스에 접근
- 이전 연결이 제대로 닫히지 않음

**해결 방법:**

```bash
# 1. 모든 Node.js 프로세스 종료
pkill -f node

# 2. 데이터베이스 파일 확인
ls -la data/gaeo.db*

# 3. 필요시 데이터베이스 파일 삭제 (주의: 데이터 손실)
rm -f data/gaeo.db*

# 4. 서버 재시작
npm run dev
```

## 환경 변수 문제

### 환경 변수가 로드되지 않음

**증상:**
- API 키 오류
- Firebase 초기화 실패

**해결 방법:**

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (대소문자 구분)
3. 서버 재시작:
   ```bash
   npm run cleanup
   npm run dev
   ```

## 의존성 문제

### 모듈을 찾을 수 없음

**증상:**
```
Error: Cannot find module '...'
```

**해결 방법:**

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

## 일반적인 문제 해결 순서

1. **정리 및 재시작:**
   ```bash
   npm run cleanup:all
   npm install
   npm run dev
   ```

2. **캐시 완전 삭제:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

3. **포트 강제 해제:**
   ```bash
   lsof -ti:3000,3001 | xargs kill -9
   npm run dev
   ```

## 추가 도움말

문제가 계속되면 다음을 확인하세요:

1. Node.js 버전: `node --version` (권장: 18.x 이상)
2. npm 버전: `npm --version`
3. 프로젝트 의존성: `npm list --depth=0`
4. 로그 확인: 터미널의 전체 에러 메시지

