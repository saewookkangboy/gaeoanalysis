# Admin 페이지 간단 접근 가이드

## 🚀 가장 간단한 방법

### 1. Admin 페이지 접근

**방법 1: HTML 파일로 접근 (가장 간단)**
```
https://gaeo.allrounder.im/admin.html
```

**방법 2: 직접 URL 입력**
```
https://gaeo.allrounder.im/admin
```

두 방법 모두 동일하게 `/admin` 페이지로 자동 이동합니다.

### 2. Admin 권한 설정 (웹에서 간단하게)

**방법 1: 웹 페이지에서 설정 (권장)**
```
https://gaeo.allrounder.im/admin-setup
```

이 페이지에서:
1. 이메일 주소 입력 (예: `chunghyo@troe.kr`)
2. "Admin 권한 설정" 버튼 클릭
3. 완료!

**방법 2: 터미널에서 설정**
```bash
./set-admin-local.sh
```

## 📝 단계별 가이드

### Step 1: 로그인
1. 먼저 Google 또는 GitHub로 로그인
   - https://gaeo.allrounder.im/login

### Step 2: Admin 권한 설정
1. 웹 브라우저에서 접근:
   - https://gaeo.allrounder.im/admin-setup
2. 이메일 주소 입력 (로그인한 이메일)
3. "Admin 권한 설정" 버튼 클릭
4. 성공 메시지 확인

### Step 3: Admin 페이지 접근
1. Admin 페이지로 이동:
   - https://gaeo.allrounder.im/admin.html
   - 또는 https://gaeo.allrounder.im/admin
2. Admin 대시보드 확인

## ⚠️ 주의사항

- Admin 권한 설정을 위해서는 **먼저 로그인**해야 합니다
- 로그인한 이메일 주소와 동일한 이메일을 입력해야 합니다
- Admin 권한이 없으면 `/admin` 페이지 접근 시 메인 페이지로 리다이렉트됩니다

## 🔧 문제 해결

### "사용자를 찾을 수 없습니다" 오류
- 먼저 로그인을 완료했는지 확인하세요
- 로그인한 이메일 주소를 정확히 입력했는지 확인하세요
- Google 로그인과 GitHub 로그인은 같은 이메일이라도 다른 사용자로 인식될 수 있습니다

### "접근 권한 없음" 오류
- Admin 권한이 설정되지 않았을 수 있습니다
- `/admin-setup` 페이지에서 다시 권한 설정을 시도하세요

## 📞 빠른 참조

- **Admin 페이지**: `/admin.html` 또는 `/admin`
- **Admin 권한 설정**: `/admin-setup`
- **로그인 페이지**: `/login`

