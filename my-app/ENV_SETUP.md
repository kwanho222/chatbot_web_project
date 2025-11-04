# 환경 변수 설정 가이드

## Google Gemini API 키 설정 방법

### 1. `.env.local` 파일 생성

`my-app` 폴더에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
GOOGLE_GEMINI_API_KEY=여기에_API_키_입력
```

### 2. Google Gemini API 키 발급

1. **Google AI Studio** 접속: https://makersuite.google.com/app/apikey
2. Google 계정으로 로그인
3. **"Create API Key"** 또는 **"Get API Key"** 버튼 클릭
4. 프로젝트 선택 (기존 프로젝트 또는 새 프로젝트)
5. 생성된 API 키 복사
6. `.env.local` 파일의 `GOOGLE_GEMINI_API_KEY=` 뒤에 붙여넣기

### 3. 예시

`.env.local` 파일 내용 예시:

```env
GOOGLE_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. 주의사항

- ✅ `.env.local` 파일은 `my-app` 폴더 바로 아래에 위치해야 합니다
- ✅ 등호(`=`) 앞뒤로 공백이 없어야 합니다
- ✅ 따옴표를 사용하지 않습니다
- ✅ API 키는 절대 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함되어 있습니다)
- ✅ 파일을 수정한 후에는 **반드시 개발 서버를 재시작**해야 합니다

### 5. 개발 서버 재시작

```bash
# 터미널에서
cd my-app
npm run dev
```

### 문제 해결

- **에러가 계속 발생하는 경우:**
  1. `.env.local` 파일의 위치 확인 (`my-app/.env.local`)
  2. 파일 이름이 정확한지 확인 (`.env.local` - 점으로 시작)
  3. API 키에 공백이나 특수문자가 포함되지 않았는지 확인
  4. 개발 서버를 완전히 종료하고 다시 시작
  5. 브라우저 캐시 삭제 후 새로고침

### API 키 관리

- API 키는 Google AI Studio에서 언제든지 확인/삭제/재생성할 수 있습니다
- 무료 티어에는 사용량 제한이 있으니 확인하세요: https://ai.google.dev/pricing



