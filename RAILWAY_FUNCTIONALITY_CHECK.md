# Railway 배포 기능 점검 체크리스트

Railway 배포 후 주요 기능들이 정상적으로 작동하는지 확인하는 체크리스트입니다.

## ✅ 필수 기능 점검

### 1. 헬스 체크 API
**엔드포인트**: `GET /api/health`

**확인 사항**:
- [ ] API가 정상적으로 응답하는지
- [ ] 데이터베이스 연결 상태가 `connected: true`인지
- [ ] Gemini API 키가 설정되어 있는지
- [ ] 메모리 사용량이 정상 범위인지

**테스트 방법**:
```bash
curl https://your-app.railway.app/api/health
```

**예상 응답**:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "connected": true,
      "stats": {
        "users": { "count": 0 },
        "analyses": { "count": 0 },
        "conversations": { "count": 0 }
      }
    },
    "gemini": {
      "available": true
    }
  }
}
```

### 2. 인증 기능 (Google/GitHub 로그인)
**엔드포인트**: `/api/auth/signin/google`, `/api/auth/signin/github`

**확인 사항**:
- [ ] Google 로그인이 정상적으로 작동하는지
- [ ] GitHub 로그인이 정상적으로 작동하는지
- [ ] 로그인 후 세션이 유지되는지
- [ ] 사용자 정보가 DB에 저장되는지

**테스트 방법**:
1. 브라우저에서 `https://your-app.railway.app/login` 접속
2. Google 또는 GitHub 로그인 버튼 클릭
3. 로그인 완료 후 메인 페이지로 리디렉션되는지 확인
4. Railway 로그에서 사용자 생성 로그 확인:
   - `✅ [Session] 사용자 생성 완료`
   - `✅ [signIn] 새 사용자 생성` 또는 `✅ [signIn] 기존 사용자 로그인`

### 3. 분석 기능 (URL 분석 및 저장)
**엔드포인트**: `POST /api/analyze`

**확인 사항**:
- [ ] URL 분석이 정상적으로 수행되는지
- [ ] 분석 결과가 DB에 저장되는지
- [ ] 저장 후 즉시 조회가 가능한지
- [ ] Railway 환경에서 DB 파일이 영구 저장되는지

**테스트 방법**:
1. 로그인 후 메인 페이지에서 URL 입력
2. 분석 실행
3. Railway 로그에서 다음 로그 확인:
   - `🚀 [Analyze API] 분석 요청 시작`
   - `💾 [Analyze API] 분석 결과 저장 시도`
   - `✅ [Analyze API] 분석 결과 저장 및 확인 성공`
   - `📊 [saveAnalysis] 저장 후 DB 상태: { totalAnalyses: 1, userAnalyses: 1 }`

**예상 로그**:
```
🚀 [Analyze API] 분석 요청 시작
🔐 [Analyze API] 세션 확인: { hasSession: true, userId: '...', userEmail: '...' }
✅ [Analyze API] 이메일로 사용자 확인: { sessionId: '...', actualUserId: '...', email: '...' }
💾 [Analyze API] 분석 결과 저장 시도: { analysisId: '...', userId: '...', url: '...' }
✅ [saveAnalysis] 분석 저장 성공: { analysisId: '...', userId: '...', url: '...' }
✅ [Analyze API] 분석 결과 저장 및 확인 성공: { totalAnalyses: 1, ... }
```

### 4. 분석 이력 조회
**엔드포인트**: `GET /api/history`

**확인 사항**:
- [ ] 저장된 분석 이력이 정상적으로 조회되는지
- [ ] 사용자별로 올바른 이력만 조회되는지
- [ ] Railway 환경에서 DB 파일이 영구 저장되어 이력이 유지되는지

**테스트 방법**:
1. 분석을 1개 이상 실행
2. 페이지 새로고침 또는 이력 페이지 접속
3. Railway 로그에서 다음 로그 확인:
   - `📋 [History API] 분석 이력 조회 요청`
   - `✅ [History API] 이메일로 실제 사용자 ID 확인`
   - `🔍 [History API] 실제 사용자 ID로 조회 결과: { userId: '...', count: 1 }`
   - `✅ [History API] 분석 이력 조회 완료: { count: 1, analyses: [...] }`

**예상 로그**:
```
📋 [History API] 분석 이력 조회 요청: { sessionUserId: '...', userEmail: '...' }
✅ [History API] 이메일로 실제 사용자 ID 확인: { sessionUserId: '...', actualUserId: '...' }
🔍 [History API] 실제 사용자 ID로 조회 결과: { userId: '...', count: 1 }
✅ [History API] 분석 이력 조회 완료: { count: 1, analyses: [...] }
```

### 5. 이메일 변경 시 분석 이력 유지
**확인 사항**:
- [ ] 다른 이메일로 로그인해도 같은 사용자로 인식되는지
- [ ] 이전 이메일의 분석 이력이 새 이메일로 마이그레이션되는지
- [ ] 이메일 변경 감지 로그가 출력되는지

**테스트 방법**:
1. 첫 번째 이메일로 로그인 (예: `user@example.com`)
2. 분석 1개 이상 실행
3. 두 번째 이메일로 로그인 (예: `user@gmail.com`) - 같은 OAuth 계정
4. Railway 로그에서 다음 로그 확인:
   - `🔄 [signIn] 이메일 변경 감지`
   - `✅ [signIn] 이메일 변경으로 인한 분석 이력 마이그레이션 완료`
5. 분석 이력이 유지되는지 확인

### 6. 데이터베이스 영구 저장 (Railway)
**확인 사항**:
- [ ] Railway 환경이 정상적으로 감지되는지
- [ ] DB 파일이 `data` 디렉토리에 저장되는지
- [ ] WAL 모드가 사용되는지
- [ ] Blob Storage 다운로드가 스킵되는지

**테스트 방법**:
Railway 로그에서 다음 로그 확인:
```
🚂 [DB] Railway 환경 감지: 영구 파일 시스템 사용 (Blob Storage 불필요)
📁 [DB] 데이터베이스 경로: { dbPath: '/app/data/gaeo.db', isRailway: true, exists: true }
```

**중요**: Railway 환경에서는:
- ✅ Blob Storage 다운로드/업로드가 실행되지 않음
- ✅ WAL 모드 사용 (성능 최적화)
- ✅ DB 파일이 영구 저장됨

### 7. AI 챗봇 기능
**엔드포인트**: `POST /api/chat`

**확인 사항**:
- [ ] 챗봇이 정상적으로 응답하는지
- [ ] 대화 이력이 저장되는지
- [ ] 대화 이력 조회가 정상인지

**테스트 방법**:
1. 분석 결과 페이지에서 챗봇 사용
2. 질문 입력 및 응답 확인
3. 대화 이력이 저장되는지 확인

## 🔍 Railway 로그 확인 포인트

### 정상 작동 시 예상 로그

**서버 시작 시**:
```
🚂 [DB] Railway 환경 감지: 영구 파일 시스템 사용 (Blob Storage 불필요)
📁 [DB] 데이터베이스 경로: { dbPath: '/app/data/gaeo.db', isRailway: true }
🚀 마이그레이션 시작...
✅ 마이그레이션 완료: 10개 적용됨
```

**로그인 시**:
```
🔐 [signIn] OAuth 로그인 시도: { provider: 'google', userEmail: '...' }
✅ [signIn] 새 사용자 생성: { id: '...', email: '...' }
✅ [Session] 사용자 생성 완료: { userId: '...', email: '...' }
```

**분석 저장 시**:
```
🚀 [Analyze API] 분석 요청 시작
💾 [Analyze API] 분석 결과 저장 시도: { analysisId: '...', userId: '...' }
📊 [saveAnalysis] 저장 전 DB 상태: { totalAnalyses: 0, userAnalyses: 0 }
✅ [saveAnalysis] 사용자 확인 완료: { userId: '...', userEmail: '...' }
📊 [saveAnalysis] 저장 후 DB 상태: { totalAnalyses: 1, userAnalyses: 1 }
✅ [saveAnalysis] 분석 저장 성공: { analysisId: '...', userId: '...' }
✅ [Analyze API] 분석 결과 저장 및 확인 성공: { totalAnalyses: 1 }
```

**이력 조회 시**:
```
📋 [History API] 분석 이력 조회 요청: { sessionUserId: '...', userEmail: '...' }
✅ [History API] 이메일로 실제 사용자 ID 확인: { actualUserId: '...' }
🔍 [History API] 실제 사용자 ID로 조회 결과: { userId: '...', count: 1 }
✅ [History API] 분석 이력 조회 완료: { count: 1, analyses: [...] }
```

## ⚠️ 문제 발생 시 확인 사항

### 분석 이력이 0개로 나오는 경우

1. **DB 파일 경로 확인**:
   - 로그에서 `📁 [DB] 데이터베이스 경로` 확인
   - `isRailway: true`인지 확인
   - `exists: true`인지 확인

2. **사용자 ID 일치 확인**:
   - 로그에서 `✅ [History API] 이메일로 실제 사용자 ID 확인` 확인
   - `sessionUserId`와 `actualUserId`가 일치하는지 확인

3. **분석 저장 확인**:
   - 로그에서 `✅ [saveAnalysis] 분석 저장 성공` 확인
   - `📊 [saveAnalysis] 저장 후 DB 상태: { totalAnalyses: 1 }` 확인

### 인증 오류가 발생하는 경우

1. **환경 변수 확인**:
   - Railway 대시보드에서 `AUTH_SECRET` 설정 확인
   - OAuth Client ID/Secret 설정 확인

2. **리디렉션 URI 확인**:
   - Google OAuth: `https://your-app.railway.app/api/auth/callback/google`
   - GitHub OAuth: `https://your-app.railway.app/api/auth/callback/github`

## 📊 성능 확인

### Railway 환경 최적화 확인

- ✅ WAL 모드 사용 (로그에서 `journal_mode = wal` 확인)
- ✅ 영구 파일 시스템 사용 (Blob Storage 불필요)
- ✅ 동기화 설정: `synchronous = FULL`

## 🎯 최종 확인 체크리스트

- [ ] 헬스 체크 API 정상 응답
- [ ] Google 로그인 정상 작동
- [ ] GitHub 로그인 정상 작동
- [ ] URL 분석 정상 작동
- [ ] 분석 결과 DB 저장 확인
- [ ] 분석 이력 조회 정상 작동
- [ ] Railway 환경 감지 정상
- [ ] DB 파일 영구 저장 확인
- [ ] 이메일 변경 시 이력 유지 확인
- [ ] AI 챗봇 정상 작동

모든 항목이 체크되면 Railway 배포가 성공적으로 완료된 것입니다! 🎉

