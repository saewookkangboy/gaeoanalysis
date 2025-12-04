# Railway PostgreSQL 문제 해결 가이드

## 오류: `ERROR (catatonit:2): failed to exec pid1: No such file or directory`

이 오류는 Railway PostgreSQL 서비스 컨테이너가 제대로 시작되지 않을 때 발생합니다.

### 원인

1. **Railway PostgreSQL 서비스 이미지 문제**
   - 컨테이너 이미지가 손상되었거나 호환되지 않음
   - Railway 인프라 문제

2. **볼륨 마운트 문제**
   - 데이터 볼륨 마운트 실패
   - 권한 문제

3. **서비스 설정 문제**
   - 잘못된 서비스 설정
   - 리소스 부족

### 해결 방법

#### 1. Railway PostgreSQL 서비스 재시작

1. **Railway 대시보드 접속**
   - https://railway.app 접속
   - 프로젝트 선택

2. **PostgreSQL 서비스 선택**
   - 서비스 목록에서 PostgreSQL 서비스 선택
   - Settings 탭 클릭

3. **서비스 재시작**
   - **Restart** 버튼 클릭
   - 또는 **Deployments** 탭에서 최신 배포 선택 후 **Redeploy**

#### 2. PostgreSQL 서비스 재생성 (데이터 백업 필수)

**⚠️ 주의: 이 방법은 기존 데이터를 삭제합니다. 먼저 데이터를 백업하세요.**

1. **데이터 백업**
   ```bash
   # Railway CLI 사용
   railway connect postgres
   pg_dump -U postgres -d railway > backup.sql
   ```

2. **새 PostgreSQL 서비스 생성**
   - Railway 대시보드에서 기존 PostgreSQL 서비스 삭제
   - **New** → **Database** → **PostgreSQL** 선택
   - 새 서비스 생성

3. **환경 변수 업데이트**
   - 새 서비스의 `DATABASE_URL` 및 `DATABASE_PUBLIC_URL` 복사
   - 애플리케이션 서비스의 환경 변수 업데이트

4. **데이터 복원** (백업이 있는 경우)
   ```bash
   railway connect postgres
   psql -U postgres -d railway < backup.sql
   ```

#### 3. Railway 지원팀 문의

위 방법으로 해결되지 않으면:
1. Railway 대시보드 → **Support** 또는 **Help**
2. 오류 로그와 함께 문의
3. 서비스 ID 및 프로젝트 ID 포함

### 예방 조치

#### 1. 정기적인 데이터 백업

```bash
# Railway CLI를 사용한 자동 백업 스크립트
#!/bin/bash
railway connect postgres
pg_dump -U postgres -d railway > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. 연결 상태 모니터링

애플리케이션에서 PostgreSQL 연결 상태를 모니터링하고, 연결 실패 시 알림을 받도록 설정하세요.

#### 3. Health Check 설정

Railway에서 Health Check를 설정하여 서비스 상태를 자동으로 모니터링하세요.

### 연결 오류 대응

애플리케이션에서 다음과 같은 오류가 발생할 수 있습니다:

- `ETIMEDOUT`: 연결 타임아웃
- `ENOTFOUND`: DNS 해석 실패
- `Connection terminated`: 연결 종료

이러한 오류는 자동으로 재시도되지만, Railway PostgreSQL 서비스가 완전히 다운된 경우 수동 개입이 필요합니다.

### 확인 사항

1. **Railway 대시보드에서 확인**
   - PostgreSQL 서비스 상태가 "Running"인지 확인
   - 로그에서 추가 오류 메시지 확인
   - 리소스 사용량 확인 (CPU, Memory)

2. **연결 문자열 확인**
   - `DATABASE_URL` (Private URL)
   - `DATABASE_PUBLIC_URL` (Public URL)
   - 두 URL이 모두 올바르게 설정되어 있는지 확인

3. **네트워크 연결 확인**
   - Railway 내부 네트워크 연결 확인
   - 방화벽 또는 보안 그룹 설정 확인

### 추가 리소스

- [Railway 문서](https://docs.railway.app/)
- [Railway Discord 커뮤니티](https://discord.gg/railway)
- [Railway Status 페이지](https://status.railway.app/)

