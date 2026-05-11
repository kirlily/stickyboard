@AGENTS.md

# StickyBoard — Claude 행동 지침

FigJam 스타일 실시간 협업 화이트보드. 5인 이내 팀 협업 대상.
기준 스택: Next.js 16 + React 19 + TypeScript strict + tldraw v5 + Supabase + Tailwind v4.

---

## 프로젝트 명령어

```bash
npm run dev            # 개발 서버 (localhost:3000)
npm run type-check     # TypeScript 오류 검사 (빌드 없이)
npm run lint           # ESLint 전체 검사
npm run lint:fix       # ESLint 자동 수정
npm run format         # Prettier 포매팅
npm run test           # Vitest 단위 테스트
npm run generate:types # Supabase DB → src/types/database.types.ts 자동 생성
```

코드 수정 후에는 반드시 `npm run type-check`와 `npm run test`를 실행하고 통과를 확인한 뒤 완료를 보고한다.

---

## 핵심 아키텍처 결정

**실시간 동기화:** tldraw `store.listen()` → Supabase Realtime Broadcast (channel: `board-{id}`) → 수신측 `editor.store.mergeRemoteChanges()`. 별도 WebSocket 서버 없음.

**보드 영속성:** 30초마다 tldraw 전체 스냅샷을 `boards.snapshot` JSONB에 저장. 접속 시 스냅샷 로드 → tldraw 스토어 초기화.

**커서/Presence:** Supabase Realtime Presence. `{ userId, name, color, cursor: { x, y } }` 형태.

**인증:** Supabase Auth (이메일/패스워드). `src/lib/supabase/client.ts` (브라우저), `server.ts` (서버 컴포넌트), `middleware.ts` (세션 갱신) 세 파일로 분리.

---

## 코드 컨벤션

- **Named export만 사용.** `export default` 금지 (ESLint로 강제되지 않으나 컨벤션으로 지킨다).
- **`any` 타입 금지.** `@typescript-eslint/no-explicit-any: error`로 강제됨.
- **`console.log` 금지.** `console.warn`, `console.error`만 허용.
- **`src/types/database.types.ts` 수동 편집 금지.** `npm run generate:types`로만 갱신.
- **Zod v4 스키마** — API 요청/응답 런타임 검증에 사용. `src/lib/validations/`에 위치.
- **API 응답 형태** — 모든 Route Handler는 `ApiResponse<T>` 타입을 따른다:
  ```typescript
  type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }
  ```

---

## 커밋 메시지 형식

`commitlint`로 강제됨. 허용 타입: `feat` `fix` `refactor` `test` `docs` `chore` `style` `perf`.

```
feat: 커스텀 스티키 노트 ShapeUtil 추가
fix: Presence 커서가 보드 이탈 시 사라지지 않는 버그 수정
```

---

## 행동 지침

_출처: [datajuny/andrej-karpathy-skills CLAUDE.md](https://github.com/datajuny/andrej-karpathy-skills/blob/main/CLAUDE.md). 이 프로젝트에 맞게 조정._

**트레이드오프:** 이 지침들은 속도보다 신중함을 우선시한다. 단순 작업은 판단하여 적용.

### 1. 코딩 전 먼저 생각한다

구현 전에:

- 가정을 명시적으로 말한다. 불확실하면 질문한다.
- 해석이 여러 가지라면 제시한다. 조용히 하나를 선택하지 않는다.
- 더 단순한 접근이 있으면 말한다. 필요하면 반론을 제기한다.
- 명확하지 않으면 멈춘다. 무엇이 불분명한지 말하고 질문한다.

### 2. 단순함을 우선한다

- 요청 범위를 벗어난 기능 추가 금지.
- 단일 사용 코드에 추상화 금지.
- 요청하지 않은 "유연성"이나 "확장성" 추가 금지.
- 불가능한 시나리오에 대한 에러 핸들링 금지.
- 200줄로 쓴 코드가 50줄로 가능하다면 다시 쓴다.

스스로 묻는 질문: "시니어 엔지니어가 이걸 보면 과도하다고 할까?" 그렇다면 단순화한다.

### 3. 외과적으로 변경한다

기존 코드를 수정할 때:

- 요청과 무관한 인접 코드, 주석, 포매팅을 "개선"하지 않는다.
- 문제가 없는 코드는 리팩토링하지 않는다.
- 스타일이 마음에 들지 않아도 기존 스타일을 맞춘다.
- 관련 없는 죽은 코드를 발견하면 언급만 한다. 삭제하지 않는다.

내 변경으로 고아가 된 import/변수/함수는 직접 정리한다. 기존 죽은 코드는 요청이 없으면 건드리지 않는다.

기준: 변경된 모든 줄이 사용자의 요청으로 직접 추적될 수 있어야 한다.

### 4. 목표 중심으로 실행한다

작업을 검증 가능한 목표로 변환한다:

- "유효성 검사 추가" → "잘못된 입력에 대한 테스트 작성 후 통과시킨다"
- "버그 수정" → "버그를 재현하는 테스트 작성 후 통과시킨다"

여러 단계 작업에서는 간략한 계획을 먼저 말한다:

```
1. [단계] → 확인: [검증 방법]
2. [단계] → 확인: [검증 방법]
```

### 5. 한국어 출력에서 콜론으로 문장을 끝내지 않는다

사용자가 한국어로 쓰면 출력도 한국어로 한다.

- 다음 줄이 목록이나 예시여도 문장을 `:`로 끝내지 않는다.
- 한국어 문장 종결어는 `.` `?` `!` 이어야 한다. `:` 가 아니다.
- 코드 내부, 키-값 쌍, 레이블 안에서의 콜론은 허용.

### 6. 새 소스 파일 첫 줄에 한국어 역할 주석을 쓴다

새 파일을 만들 때 첫 줄에 한 줄 한국어 주석으로 파일의 역할을 명시한다.

```typescript
// tldraw 스토어와 Supabase Realtime을 연결하는 동기화 어댑터
'use client'
```

```typescript
// 보드 CRUD를 TanStack Query로 관리하는 훅
```

- `'use client'`, `'use server'` 같은 디렉티브 바로 위에 배치.
- `*.config.ts`, `package.json` 등 설정 파일은 제외.

이유: 에이전트는 파일 전체가 아닌 선택적으로 읽는다. 한 줄 헤더가 있으면 다음 세션(사람이든 에이전트든)이 파일 전체를 다시 읽지 않고도 맥락을 파악할 수 있다.

### 7. 비자명한 작업은 계획 + 체크리스트를 먼저 만든다

비자명한 작업 전에:

- **계획** — 무엇을 만들고 왜 만드는지.
- **체크리스트** — 구체적인 작업을 체크박스로. 완료하면 바로 체크.

사용자가 계획만 주고 코딩을 요청하면 멈추고 묻는다. "체크리스트를 먼저 만들까요?" 다음 세션이 맥락 없이 이어받아야 할 수 있기 때문이다.

### 8. 완료 전 테스트를 실행한다

코드를 건드렸다면 "완료"라고 말하기 전에 반드시 테스트를 실행한다.

```bash
npm run type-check   # TypeScript 오류 없음 확인
npm run test         # Vitest 테스트 통과 확인
```

테스트가 없어도 최소한 프로젝트가 컴파일되는지 확인한다. 사용자가 "끝", "완료", "다 됐어"라고 신호를 보내기 전에 선제적으로 실행한다.

LLM이 가장 자주 건너뛰는 단계다. 필수로 취급한다.

### 9. 의미 있는 단위로 커밋한다

하나의 논리적 변경이 완성되면 커밋한다. 사용자가 요청하기를 기다리지 않는다.

- 테스트: "이 커밋을 한 문장으로 설명할 수 있는가?" 그렇다면 커밋. 아니라면 변경을 분리한다.
- 좋음: `"feat: 커스텀 스티키 노트 ShapeUtil 추가"`
- 나쁨: `"스티키 추가하고 UI도 고치고 버그도 수정"` → 3개로 분리

### 10. 에러를 읽는다. 추측하지 않는다.

무언가 실패했을 때:

- 전체 에러 메시지와 스택 트레이스를 읽는다.
- "흔한 수정"을 원인 확인 전에 적용하지 않는다.
- 불분명하면 로그를 추가해 상태를 확인한다. 그다음 수정한다.

이것도 LLM이 자주 건너뛰는 단계다. 에러 키워드에서 패턴 매칭으로 추측하고 가장 최근에 본 수정을 적용한다. 그것이 한 줄 버그를 세 파일 리팩토링으로 만드는 방식이다.
