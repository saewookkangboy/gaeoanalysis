# 보안 설정 가이드

## 개요

이 문서는 서비스의 보안 설정 및 소스 코드 보호 방법을 설명합니다.

## 구현된 보안 기능

### 1. 소스맵 비활성화

**설정 위치**: `next.config.ts`

```typescript
productionBrowserSourceMaps: false
```

- 프로덕션 빌드에서 소스맵 파일(.map) 생성 비활성화
- 브라우저에서 원본 소스 코드 확인 불가

### 2. 콘솔 로그 제거

**설정 위치**: `next.config.ts`

```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'], // 에러와 경고는 유지
  } : false,
}
```

- 프로덕션 빌드에서 `console.log`, `console.debug`, `console.info` 자동 제거
- `console.error`와 `console.warn`은 유지 (디버깅 필요 시)

### 3. 미들웨어 보안 헤더

**파일**: `middleware.ts`

- 소스맵 파일 접근 차단 (404 반환)
- 개발자 도구 접근 방지 헤더
- 보안 헤더 추가 (X-Content-Type-Options, X-Frame-Options 등)

### 4. 클라이언트 사이드 보호

**컴포넌트**: `components/SecurityProtection.tsx`

#### 구현된 보호 기능:

1. **개발자 도구 감지**
   - 창 크기 변화를 통한 개발자 도구 감지
   - React DevTools 감지

2. **콘솔 로그 난독화**
   - 프로덕션 환경에서 콘솔 메서드 오버라이드
   - 민감한 정보 로깅 방지

3. **디버거 방지**
   - `eval()` 사용 경고
   - 디버거 키워드 사용 방지

4. **키보드 단축키 차단**
   - F12 (개발자 도구)
   - Ctrl+Shift+I (Chrome DevTools)
   - Ctrl+Shift+J (Chrome Console)
   - Ctrl+U (소스 보기)
   - Ctrl+S (저장)

### 5. 콘텐츠 보호

**컴포넌트**: `components/ContentProtection.tsx`

- 마우스 오른쪽 클릭 방지
- 텍스트 선택 방지
- 드래그 방지
- 복사/붙여넣기 방지
- 키보드 단축키 방지

### 6. 안전한 로깅

**유틸리티**: `lib/secure-logger.ts`

- 민감한 정보 자동 제거
- 프로덕션 환경에서 최소한의 로그만 표시
- 스택 트레이스 제한

## 보안 설정 확인

### 빌드 시 확인

```bash
npm run build
```

빌드 후 `.next` 폴더에서:
- `*.map` 파일이 생성되지 않았는지 확인
- `console.log`가 제거되었는지 확인

### 프로덕션 환경 확인

1. **소스맵 확인**
   - 브라우저 개발자 도구 → Sources 탭
   - 원본 파일이 보이지 않아야 함

2. **콘솔 로그 확인**
   - 브라우저 콘솔에서 `console.log` 출력이 없어야 함
   - `console.error`와 `console.warn`만 표시되어야 함

3. **개발자 도구 단축키 확인**
   - F12, Ctrl+Shift+I 등이 차단되는지 확인

## 주의사항

### 1. 사용자 경험

- 일부 보안 기능은 사용자 경험에 영향을 줄 수 있습니다
- 필요에 따라 보안 기능을 조정하세요

### 2. 개발 환경

- 개발 환경에서는 보안 기능이 비활성화됩니다
- `NODE_ENV !== 'production'` 조건으로 제어됩니다

### 3. 완벽한 보호는 불가능

- 클라이언트 사이드 코드는 완전히 숨길 수 없습니다
- 보안 기능은 복제를 어렵게 만들 뿐 완전히 방지할 수는 없습니다
- 중요한 비즈니스 로직은 서버 사이드에서 처리해야 합니다

## 추가 보안 권장사항

### 1. 서버 사이드 보안

- API 엔드포인트 인증 강화
- Rate limiting 구현
- 입력 검증 및 sanitization

### 2. 환경 변수 보호

- 민감한 정보는 환경 변수로 관리
- `.env.local` 파일은 절대 커밋하지 않음
- Vercel 환경 변수 사용

### 3. 코드 난독화 (선택적)

필요한 경우 추가 도구 사용:
- `javascript-obfuscator` (코드 난독화)
- `terser` (코드 압축 및 난독화)

### 4. CSP (Content Security Policy)

- `next.config.ts`에서 CSP 헤더 설정
- 인라인 스크립트 제한
- 외부 리소스 제한

## 문제 해결

### 보안 기능이 작동하지 않는 경우

1. **프로덕션 빌드 확인**
   ```bash
   npm run build
   npm start
   ```

2. **환경 변수 확인**
   ```bash
   echo $NODE_ENV
   # production이어야 함
   ```

3. **브라우저 캐시 삭제**
   - 개발자 도구 → Application → Clear storage

## 참고 자료

- [Next.js Security Best Practices](https://nextjs.org/docs/going-to-production#security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

