# Railway Egress Fees 방지 가이드

Railway PostgreSQL에서 egress fees(데이터 전송 비용)를 방지하는 방법을 안내합니다.

## 💰 Egress Fees란?

Railway에서 Public URL을 통해 데이터베이스에 연결하면 **egress fees**가 발생합니다.
- **Public URL**: `containers-xxx.railway.app` 형식 → 외부 네트워크를 통한 접근 → **비용 발생**
- **Private URL**: `postgres.railway.internal` 형식 → Railway 내부 네트워크 → **비용 없음**

## ✅ 해결 방법

### Railway 환경에서는 Private URL 사용

Railway에서 실행되는 애플리케이션은 **Private URL**을 사용해야 합니다.

#### 1. Railway 환경 변수 확인

Railway 대시보드에서 PostgreSQL 서비스의 Variables 탭을 확인하세요:

- `DATABASE_URL`: Private URL (Railway 내부 네트워크) ✅ **사용 권장**
- `DATABASE_PUBLIC_URL`: Public URL (외부 접근 가능) ⚠️ **egress fees 발생**

#### 2. 메인 서비스에 DATABASE_URL 설정

1. Railway 대시보드 → **메인 서비스** (Next.js 앱) 선택
2. **Variables** 탭 클릭
3. **New Variable** 클릭
4. Name: `DATABASE_URL`
5. Value: PostgreSQL 서비스의 `DATABASE_URL` 값 복사 (Private URL)
6. **Add** 클릭

**중요**: `DATABASE_PUBLIC_URL`이 아닌 `DATABASE_URL`을 사용하세요!

#### 3. 자동 URL 선택

애플리케이션은 자동으로 다음 순서로 URL을 선택합니다:

1. `DATABASE_URL` (Private URL) - Railway 환경에서 우선 사용
2. `DATABASE_PUBLIC_URL` (Public URL) - Private URL이 없을 때만 사용

Railway 환경에서는 자동으로 Private URL을 사용하므로 egress fees가 발생하지 않습니다.

## 📋 환경별 URL 사용 가이드

### Railway 환경 (프로덕션)

```bash
# Railway 메인 서비스의 Variables에 설정
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
```

**결과**: ✅ Egress fees 없음

### 로컬 환경 (마이그레이션)

```bash
# 로컬에서 마이그레이션할 때만 Public URL 사용
export DATABASE_URL="postgresql://postgres:password@containers-xxx.railway.app:5432/railway"
# 또는
export DATABASE_PUBLIC_URL="postgresql://postgres:password@containers-xxx.railway.app:5432/railway"
```

**결과**: ⚠️ 마이그레이션 시에만 Public URL 필요 (일시적)

## 🔍 현재 사용 중인 URL 확인

애플리케이션 로그에서 확인할 수 있습니다:

```
✅ [PostgreSQL] Private URL 사용 중 (egress fees 없음)
```

또는:

```
⚠️ [PostgreSQL] Public URL 사용 중 (egress fees 발생 가능)
💡 Railway 환경에서는 Private URL(DATABASE_URL) 사용을 권장합니다.
```

## 🚨 문제 해결

### 문제 1: "DATABASE_URL 환경 변수가 설정되지 않았습니다"

**해결 방법**:
1. Railway 대시보드 → 메인 서비스 → Variables 탭
2. `DATABASE_URL` 변수가 있는지 확인
3. 없으면 PostgreSQL 서비스의 `DATABASE_URL` 복사하여 추가

### 문제 2: 여전히 Public URL을 사용하고 있음

**해결 방법**:
1. Railway 메인 서비스의 Variables 확인
2. `DATABASE_URL`이 Private URL인지 확인 (`railway.internal` 포함)
3. `DATABASE_PUBLIC_URL`이 설정되어 있다면 제거하거나 `DATABASE_URL`보다 우선순위가 낮은지 확인

### 문제 3: 로컬에서 마이그레이션할 때 Private URL 사용 불가

**해결 방법**:
- 로컬 환경에서는 Public URL이 필요합니다
- 마이그레이션 시에만 Public URL 사용 (일시적)
- 마이그레이션 완료 후 Public URL 제거 가능

## 📊 비용 비교

| 환경 | URL 타입 | Egress Fees |
|------|----------|-------------|
| Railway (프로덕션) | Private URL | ✅ 없음 |
| Railway (프로덕션) | Public URL | ❌ 발생 |
| 로컬 (마이그레이션) | Public URL | ⚠️ 일시적 (필수) |

## ✅ 체크리스트

Railway 환경에서 egress fees를 방지하려면:

- [ ] Railway 메인 서비스에 `DATABASE_URL` 설정 (Private URL)
- [ ] `DATABASE_PUBLIC_URL`은 설정하지 않거나, `DATABASE_URL`보다 우선순위 낮음
- [ ] 애플리케이션 로그에서 "Private URL 사용 중" 메시지 확인
- [ ] Railway 대시보드에서 egress fees 경고 메시지 사라짐 확인

## 🎯 권장 설정

### Railway 메인 서비스 Variables

```bash
# ✅ 필수: Private URL (egress fees 없음)
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway

# ❌ 선택사항: Public URL (로컬 마이그레이션용, Railway에서는 불필요)
# DATABASE_PUBLIC_URL=postgresql://postgres:password@containers-xxx.railway.app:5432/railway
```

**참고**: Railway 환경에서는 `DATABASE_URL`만 설정하면 됩니다. `DATABASE_PUBLIC_URL`은 로컬 마이그레이션 시에만 필요합니다.

---

## 📝 요약

1. **Railway 환경**: `DATABASE_URL` (Private URL) 사용 → ✅ Egress fees 없음
2. **로컬 환경**: `DATABASE_PUBLIC_URL` 사용 → ⚠️ 마이그레이션 시에만 필요
3. **자동 선택**: 애플리케이션이 환경에 따라 자동으로 적절한 URL 선택

Railway 환경에서는 Private URL을 사용하면 egress fees 없이 데이터베이스를 사용할 수 있습니다!

