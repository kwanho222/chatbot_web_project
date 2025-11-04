# ChatGPT 클론 프로젝트

## 프로젝트 목표 
 Chat GPT와 유사한 채팅 AI Application 구현하는 것입니다.
 
## 요구사항

### 기술적 요구사항
- **프레임워크**: Next.js 14 App Router를 사용한 서버 사이드 렌더링 웹 애플리케이션
- **언어**: TypeScript를 사용한 타입 안정성 확보
- **스타일링**: TailwindCSS를 활용한 유틸리티 기반 스타일링
- **API 통신**: OpenAI API (GPT 모델)를 활용한 AI 채팅 기능
- **배포**: Vercel 플랫폼을 통한 무료 호스팅

### 기능적 요구사항

#### 1. 채팅 인터페이스
- 사용자 메시지 입력을 위한 텍스트 입력 필드
- 전송 버튼을 통한 메시지 제출 기능
- Enter 키를 통한 메시지 전송 기능 (Shift+Enter는 줄바꿈)
- 메시지 입력 중 자동 스크롤

#### 2. 메시지 표시
- 사용자 메시지와 AI 응답을 구분하여 표시하는 UI
- 사용자 메시지는 오른쪽 정렬, AI 응답은 왼쪽 정렬
- 각 메시지에 타임스탬프 표시 (선택사항)
- 메시지 버블 디자인으로 대화형 인터페이스 구현

#### 3. 스트리밍 응답
- OpenAI API의 스트리밍 응답(Server-Sent Events) 방식 구현
- AI 응답이 실시간으로 타이핑되는 것처럼 표시
- 스트리밍 중 중단 버튼 제공

#### 4. 메시지 이력 관리
- 대화 세션 동안 모든 메시지 이력 유지
- 새 대화 시작 기능 (이력 초기화)
- 페이지 새로고침 시에도 이력 유지 (localStorage 또는 세션 스토리지 활용)
- 스크롤을 통한 과거 메시지 확인 가능

#### 5. 상태 관리
- 로딩 상태 표시 (AI 응답 대기 중 스피너 또는 스켈레톤 UI)
- 에러 상태 처리 및 사용자 친화적 에러 메시지 표시
- 네트워크 오류, API 오류 등 다양한 에러 케이스 처리
- 재시도 기능 제공

#### 6. 반응형 디자인
- 모바일(320px 이상), 태블릿(768px 이상), 데스크톱(1024px 이상) 화면 크기 지원
- 터치 친화적인 버튼 크기 및 간격
- 모바일에서 키보드 입력 시 레이아웃 조정
- 반응형 타이포그래피 및 간격 조정

#### 7. 사용자 경험 (UX)
- 깔끔하고 현대적인 UI 디자인
- 다크 모드 지원 (선택사항)
- 접근성 고려 (키보드 네비게이션, ARIA 레이블 등)
- 부드러운 애니메이션 및 전환 효과

#### 8. 보안 및 성능
- API 키를 환경 변수로 관리 (클라이언트 측 노출 방지)
- API 호출 최적화 (불필요한 요청 방지)
- 입력 검증 및 XSS 공격 방지

## 기술 스택
- Next.js 14
- TypeScript
- TailwindCSS
- OpenAI API
- Vercel 배포

## 구현 단계

### Step 1. 프로젝트 초기 설치 및 필요한 라이브러리 셋팅

#### 1.1 Next.js 프로젝트 생성
```bash
npx create-next-app@latest my-app --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```
- `--typescript`: TypeScript 사용
- `--tailwind`: TailwindCSS 포함
- `--app`: App Router 사용
- `--no-src-dir`: src 디렉토리 없이 루트에 app 디렉토리 생성

#### 1.2 필요한 패키지 설치
```bash
npm install openai
# 또는
yarn add openai
```

#### 1.3 환경 변수 설정
프로젝트 루트에 `.env.local` 파일 생성:
```env
OPENAI_API_KEY=your_openai_api_key_here
```
- OpenAI API 키는 [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.
- `.env.local` 파일은 Git에 커밋하지 않도록 `.gitignore`에 추가되어 있는지 확인

#### 1.4 프로젝트 구조 설정
```
my-app/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API Route 핸들러
│   ├── layout.tsx                 # 루트 레이아웃
│   ├── page.tsx                   # 메인 페이지
│   └── globals.css                # 전역 스타일
├── components/                    # 재사용 가능한 컴포넌트
│   ├── ChatInterface.tsx          # 채팅 인터페이스 메인 컴포넌트
│   ├── MessageList.tsx            # 메시지 리스트 컴포넌트
│   ├── MessageItem.tsx            # 개별 메시지 컴포넌트
│   └── ChatInput.tsx              # 메시지 입력 컴포넌트
├── types/
│   └── chat.ts                    # TypeScript 타입 정의
├── lib/
│   └── openai.ts                  # OpenAI 클라이언트 설정 (선택사항)
├── .env.local                     # 환경 변수 (Git에 커밋 금지)
└── package.json
```

### Step 2. App Router의 API Route 핸들러 구현

#### 2.1 API Route 파일 생성
`app/api/chat/route.ts` 파일 생성

#### 2.2 필요한 타입 정의
```typescript
// types/chat.ts
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: Message[];
}
```

#### 2.3 API Route 핸들러 구현
- **HTTP 메서드**: POST만 처리
- **요청 처리**: 클라이언트에서 전송한 메시지 배열을 받음
- **OpenAI API 호출**: `openai.chat.completions.create()` 사용
  - 모델: `gpt-3.5-turbo` 또는 `gpt-4`
  - `stream: true` 옵션으로 스트리밍 활성화
  - `temperature`, `max_tokens` 등 파라미터 설정
- **스트리밍 응답**: Server-Sent Events (SSE) 형식으로 응답 스트리밍
- **에러 처리**: try-catch로 에러 캡처, 적절한 HTTP 상태 코드 반환 (400, 401, 500 등)
- **CORS 설정**: 필요시 CORS 헤더 추가

#### 2.4 구현 포인트
- `ReadableStream`을 사용하여 스트리밍 데이터 처리
- OpenAI API의 `createReadableStream()` 메서드 활용
- 각 청크를 적절한 형식으로 변환하여 클라이언트에 전송
- 에러 발생 시 클라이언트에 에러 메시지 전송

### Step 3. 프론트엔드와 API 연동

#### 3.1 클라이언트 컴포넌트 생성
- `app/page.tsx`를 클라이언트 컴포넌트로 변경 (`'use client'` 추가)
- 또는 별도의 클라이언트 컴포넌트 생성 (`components/ChatInterface.tsx`)

#### 3.2 상태 관리
- `useState`를 사용하여 메시지 배열 관리
- 로딩 상태 관리 (`isLoading`)
- 에러 상태 관리 (`error`)
- 입력 필드 상태 관리

#### 3.3 API 호출 함수 구현
- `fetch()` API를 사용하여 `/api/chat` 엔드포인트 호출
- 요청 헤더 설정:
  ```typescript
  headers: {
    'Content-Type': 'application/json',
  }
  ```
- 요청 본문에 메시지 배열 전송
- `body: JSON.stringify({ messages: messageHistory })`

#### 3.4 스트리밍 응답 처리
- `ReadableStream` 또는 `Response.body`를 사용하여 스트리밍 데이터 읽기
- `TextDecoder`를 사용하여 청크를 텍스트로 변환
- 각 청크를 파싱하여 메시지 내용 추출
- 실시간으로 UI에 메시지 내용 업데이트
- 스트리밍이 완료되면 메시지 배열에 최종 메시지 추가

#### 3.5 에러 처리
- 네트워크 에러 처리
- API 에러 응답 처리
- 사용자에게 친화적인 에러 메시지 표시
- 재시도 기능 구현 (선택사항)

### Step 4. UI 컴포넌트 구현

#### 4.1 메인 페이지 컴포넌트 (`app/page.tsx`)
- ChatInterface 컴포넌트를 렌더링
- 전체 레이아웃 구조 설정

#### 4.2 ChatInterface 컴포넌트 (`components/ChatInterface.tsx`)
- 전체 채팅 인터페이스의 컨테이너 역할
- MessageList와 ChatInput 컴포넌트를 포함
- 상태 관리 로직 포함
- API 호출 로직 포함

#### 4.3 MessageList 컴포넌트 (`components/MessageList.tsx`)
- 메시지 배열을 받아서 렌더링
- 각 메시지를 MessageItem 컴포넌트로 매핑
- 자동 스크롤 기능 구현 (`useEffect`, `scrollIntoView`)
- 빈 상태 처리 (대화가 없을 때 환영 메시지 등)

#### 4.4 MessageItem 컴포넌트 (`components/MessageItem.tsx`)
- 개별 메시지를 표시
- 사용자 메시지와 AI 메시지를 구분하여 스타일링
  - 사용자: 오른쪽 정렬, 배경색 구분
  - AI: 왼쪽 정렬, 배경색 구분
- 메시지 버블 디자인 적용
- 마크다운 렌더링 지원 (선택사항, `react-markdown` 사용)

#### 4.5 ChatInput 컴포넌트 (`components/ChatInput.tsx`)
- 텍스트 입력 필드 (`textarea` 권장)
- 전송 버튼
- Enter 키로 전송, Shift+Enter로 줄바꿈
- 입력 중일 때 전송 버튼 비활성화
- 입력 필드 포커스 관리

#### 4.6 스타일링 (TailwindCSS)
- 모바일 우선 반응형 디자인
- 다크 모드 지원 (선택사항)
- 애니메이션 효과 (fade-in, slide-up 등)
- 로딩 스피너 또는 스켈레톤 UI
- 접근성 고려 (ARIA 레이블, 키보드 네비게이션)

#### 4.7 로컬 스토리지 연동 (선택사항)
- `useEffect`를 사용하여 메시지 배열을 localStorage에 저장
- 컴포넌트 마운트 시 localStorage에서 메시지 복원
- "새 대화" 버튼으로 localStorage 초기화

### Step 5. Vercel 배포

#### 5.1 프로젝트 준비
- 모든 코드가 정상 작동하는지 확인
- 빌드 테스트: `npm run build`
- 로컬에서 프로덕션 빌드 테스트: `npm start`

#### 5.2 Git 저장소 설정
```bash
git init
git add .
git commit -m "Initial commit"
```

#### 5.3 GitHub에 저장소 푸시
- GitHub에 새 저장소 생성
- 로컬 저장소를 GitHub에 연결
```bash
git remote add origin <https://github.com/kwanho222/EC_project.git>
git branch -M main
git push -u origin main
```

#### 5.4 Vercel 배포
1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - Framework Preset: Next.js
   - Root Directory: `./` (기본값)
5. 환경 변수 설정:
   - `OPENAI_API_KEY`: OpenAI API 키 값 입력
6. "Deploy" 클릭

#### 5.5 배포 후 확인
- 배포된 URL에서 애플리케이션 동작 확인
- 환경 변수가 제대로 설정되었는지 확인
- API 호출이 정상적으로 작동하는지 확인
- 모바일 반응형 디자인 확인

#### 5.6 추가 설정 (선택사항)
- 커스텀 도메인 연결
- Vercel Analytics 설정
- 성능 모니터링 설정