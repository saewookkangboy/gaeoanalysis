# Railway 포트 설정 문제 해결

## 문제

Railway 로그에서 다음과 같은 오류가 발생했습니다:
```
npm error signal SIGTERM
npm error command sh -c next start
```

## 원인

Railway는 동적으로 포트를 할당하지만, Next.js는 기본적으로 포트 3000을 사용합니다. Railway가 할당한 포트와 Next.js가 사용하는 포트가 불일치하여 컨테이너가 종료됩니다.

## 해결

`package.json`의 start 스크립트를 수정하여 `PORT` 환경 변수를 사용하도록 변경했습니다:

```json
"start": "next start -p ${PORT:-3000}"
```

이제 Railway가 설정한 `PORT` 환경 변수를 사용하며, 없으면 기본값 3000을 사용합니다.

## 확인

Railway가 자동으로 `PORT` 환경 변수를 설정하므로 추가 설정이 필요 없습니다.

배포 후 Railway 로그에서 다음을 확인하세요:
- 컨테이너가 정상적으로 시작됨
- `Ready in XXXms` 메시지 확인
- SIGTERM 오류가 발생하지 않음

## 추가 참고

Railway는 다음 환경 변수를 자동으로 설정합니다:
- `PORT`: 동적으로 할당된 포트 번호
- `RAILWAY_ENVIRONMENT`: Railway 환경 감지용
- `RAILWAY`: Railway 환경 감지용

