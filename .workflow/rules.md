# Workflow Rules

## 목적
- 이 문서는 `web/` 작업에서 어떤 원문 문서를 읽고, 어떤 규칙을 감사해야 하는지 한 곳에서 관리합니다.
- 원문 문서는 분야별로 유지하고, 이 문서는 실제 작업 흐름 기준으로 적용 규칙을 묶어 제공합니다.

## 적용 방식
- 항상 `web/.workflow/pipeline.md`, `web/.workflow/rules.md`를 먼저 읽습니다.
- 이번 작업에 대해 아래 두 축을 각각 고릅니다.
  - `파일 표면 세트`: 어떤 파일/레이어를 바꾸는가
  - `작업 단계 세트`: 이번 구현이 화면 뼈대, 데이터 연결, JSX, 핸들러, effect, 스타일, 테스트 중 무엇인가
- 최종 적용 규칙은 두 세트의 합집합입니다.
- 같은 규칙이 여러 세트에 반복되면 한 번만 읽고 한 번만 감사하면 됩니다.
- 원문은 `rules.md`가 지목한 섹션만 읽고, 전체 문서를 매번 처음부터 끝까지 읽지 않습니다.

## 1. 파일 표면 세트
- 항상 읽습니다.
  - `web/.workflow/pipeline.md`
  - `web/.workflow/rules.md`
- 변경 표면별로 추가합니다.
  - `src/routes/**/*.tsx`
    - `web/.workflow/source/react.md`
    - `web/.workflow/source/route.md`
    - `className`, `clsx`, CSS import를 건드리면 `web/.workflow/source/css.md`
  - `src/routes/**/*.ts`
    - `web/.workflow/source/react.md`
    - `web/.workflow/source/route.md`
  - `src/components/**/*.tsx`, `src/components/**/*.ts`
    - `web/.workflow/source/react.md`
    - `className`, `clsx`, CSS import를 건드리면 `web/.workflow/source/css.md`
  - `src/stores/**/*.ts`, `src/utils/**/*.ts`, `src/config/**/*.ts`, `src/entry/**/*.ts`
    - `web/.workflow/source/react.md`
  - `*.css`
    - `web/.workflow/source/css.md`
    - route 전용 CSS면 `web/.workflow/source/route.md`
  - `tests/**`, `playwright.config.ts`, 테스트 스크립트
    - `web/.workflow/source/test.md`
  - CRUD list/detail/form/table 흐름
    - `web/.workflow/source/crud.md`
  - workflow 문서 자체 수정
    - `web/.workflow/pipeline.md`
    - `web/.workflow/rules.md`
    - 영향받는 `web/.workflow/source/*.md`

## 2. 작업 단계 세트

### 2.1 화면 뼈대 / route 진입점
- 적용 시점
  - 새 route 추가
  - `*.index.tsx`, `*.layout.tsx`, route 폴더 구조 수정
- 적용 규칙
  - `route-4.1`
  - `route-5.1`
  - `route-6.1`
  - `route-6.2`
  - `route-7.1`
  - `react-5.5.1`
  - `react-5.9.1`
  - `react-5.9.2`

### 2.2 데이터 호출 / query / mutation 연결
- 적용 시점
  - API 훅 추가
  - query/mutation select 작성
  - 응답 shape 재명명
- 적용 규칙
  - `react-3.3`
  - `react-4.6`
  - `react-7.3`
  - `react-7.4`
  - `react-7.7`
  - `react-8.2`
  - `react-8.3`

### 2.3 화면 JSX 작성
- 적용 시점
  - 화면 section 조립
  - 조건부 렌더링 작성
  - 화면 상단 표시용 파생값 추가
- 적용 규칙
  - `react-5.4.1`
  - `react-5.4.2`
  - `react-7.5.1`
  - `react-7.7`
  - `react-7.8`
  - `css-4.1`
  - `css-4.5`

### 2.4 이벤트 핸들러 작성
- 적용 시점
  - `onClick`, `onChange`, `onSubmit` 계열 처리
  - navigation, mutation, form submit 흐름 추가
- 적용 규칙
  - `react-4.1`
  - `react-4.3`
  - `react-6`
  - `react-6.1`
  - `react-8.2`
  - `react-8.4`

### 2.5 데이터와 화면 연결
- 적용 시점
  - query 응답을 JSX에 연결
  - 파생값/조건값/empty state 구성
  - helper 분리 여부 판단
- 적용 규칙
  - `react-5.5.2`
  - `react-5.7`
  - `react-5.7.1`
  - `react-5.9.2`
  - `react-7.3`
  - `react-7.4`
  - `react-7.5.1`
  - `react-7.7`
  - `react-7.8`

### 2.6 effect / 동기화
- 적용 시점
  - `useEffect`, `useLayoutEffect`
  - store sync, search sync, 권한/세션 동기화
- 적용 규칙
  - `react-7.2.1`
  - `react-7.2.2`
  - `react-7.4`
  - `react-7.8`
  - `react-8.2`
  - `react-8.4`

### 2.7 route param / search / redirect
- 적용 시점
  - `beforeLoad`, redirect
  - `validateSearch`
  - `Route.useParams()`, `Route.useSearch()`
- 적용 규칙
  - `route-5.3`
  - `route-5.4`
  - `route-5.5`
  - `route-5.6`
  - `react-6`

### 2.8 스타일 작업
- 적용 시점
  - 새 CSS scope 추가
  - `Ui*` wrapper 스타일 조정
  - `.ant-*`, `.rc-*` selector 타겟팅
- 적용 규칙
  - `css-3.5`
  - `css-3.7`
  - `css-4.1`
  - `css-4.4`
  - `css-4.5`
  - `css-5.1`
  - `css-5.2.1`
  - `css-5.3.1`
  - `css-5.5`
  - `route-7.1`

### 2.9 테스트 작성
- 적용 시점
  - 새 spec 추가
  - mocking / waiting / helper 구조 변경
- 적용 규칙
  - `test-4.1`
  - `test-4.2`
  - `test-5.3`
  - `test-6.5`
  - `test-7.2-order`
  - `test-7.2-scope`
  - `test-7.4`
  - `test-9.1`
  - `test-9.2`
  - `test-9.3`

### 2.10 CRUD 목록 화면
- 적용 시점
  - 관리형 list/table 화면 신규 작성
  - 목록 컬럼/행 액션/삭제 액션 설계
- 적용 규칙
  - `crud-list-columns`
  - `crud-list-layout`
  - `crud-list-row-action`
  - `crud-list-delete-action`

## 3. 핵심 규칙 카탈로그

### React / TypeScript

| ID | 점검 포인트 | 원문 섹션 |
| --- | --- | --- |
| `react-3.2` | `index.ts`, `export *` 없이 직접 export/import 구조를 유지하는가 | `web/.workflow/source/react.md` `3.2 export/import` |
| `react-3.3` | query는 `response*`, mutation은 `mutation*` 접두사를 쓰는가 | `web/.workflow/source/react.md` `3.3 쿼리/뮤테이션 네이밍` |
| `react-4.1` | 이벤트 핸들러 타입을 함수 변수 선언에 붙였는가 | `web/.workflow/source/react.md` `4.1 최우선 원칙: 함수 변수 타입 선언 우선` |
| `react-4.3` | Props callback 시그니처를 재사용했는가 | `web/.workflow/source/react.md` `4.3 Props 타입 재사용 우선` |
| `react-4.6` | API에서 온 타입을 재사용하고 임의 커스텀 타입을 늘리지 않았는가 | `web/.workflow/source/react.md` `4.6 API 타입 재사용 원칙` |
| `react-5.4.1` | JSX 인라인 함수가 단순 위임 수준에만 머무는가 | `web/.workflow/source/react.md` `5.4.1 JSX 인라인 핸들러` |
| `react-5.4.2` | JSX 렌더링 분기를 `Activity` 기준으로 작성했는가 | `web/.workflow/source/react.md` `5.4.2 JSX 조건부 렌더링` |
| `react-5.5.1` | route 엔트리 파일이 API, state, handler, effect, 렌더링 조립 중심인가 | `web/.workflow/source/react.md` `5.5.1 화면 흐름 유지` |
| `react-5.5.2` | 반복 코드만 보고 성급한 공용화를 하지 않았는가 | `web/.workflow/source/react.md` `5.5.2 조기 공용화 금지` |
| `react-5.7` | helper 분리가 실제 계약과 복잡도를 근거로 이뤄졌는가 | `web/.workflow/source/react.md` `5.7 유틸 함수 분리 기준 (엄격)` |
| `react-5.7.1` | 화면 상단에서 명령형 조립이나 Hook 파라미터용 임시값을 만들지 않았는가 | `web/.workflow/source/react.md` `5.7.1 화면 상단 명령형 조립 금지` |
| `react-5.9.1` | 화면 파일 상단에 `state`, `api`, `handler`, `useEffect`만 남겼는가 | `web/.workflow/source/react.md` `5.9.1 화면 파일 상단에 둘 수 있는 것` |
| `react-5.9.2` | 순수 헬퍼, 설정, 타입, 검증/변환 로직을 화면 파일 상단 밖으로 옮겼는가 | `web/.workflow/source/react.md` `5.9.2 화면 파일 상단에서 밖으로 뺄 것` |
| `react-6` | 핸들러가 `handle + Target + Event` 패턴과 readable flow를 따르는가 | `web/.workflow/source/react.md` `6. 이벤트 핸들러 규칙` |
| `react-6.1` | 분기/비동기/부수효과가 있는 JSX 인라인 핸들러를 피했는가 | `web/.workflow/source/react.md` `6.1 Bad/Good: 핸들러 바인딩` |
| `react-7.2.1` | 공용 역할/권한/세션 판별 결과를 store sync로 처리했는가 | `web/.workflow/source/react.md` `7.2.1 공용 판별 결과 저장 위치` |
| `react-7.2.2` | store 접근에서 구조분해 없이 오리진을 유지했는가 | `web/.workflow/source/react.md` `7.2.2 스토어 접근 패턴` |
| `react-7.3` | 패칭 데이터 가공을 `query.select` 또는 좁은 스코프에 뒀는가 | `web/.workflow/source/react.md` `7.3 React Query 데이터 가공` |
| `react-7.4` | 넓은 스코프 구조분해 없이 응답/스토어 오리진을 유지했는가 | `web/.workflow/source/react.md` `7.4 응답/스토어 오리진 보존` |
| `react-7.5.1` | 표시용 값은 JSX 또는 가까운 좁은 스코프에서만 계산했는가 | `web/.workflow/source/react.md` `7.5.1 JSX 표시값 지역 스코프` |
| `react-7.7` | `??`, `||` 폴백으로 결측값을 숨기지 않았는가 | `web/.workflow/source/react.md` `7.7 옵셔널 값/폴백 처리 규칙` |
| `react-7.8` | 로딩/펜딩 상태를 직접 렌더링하지 않고 필요한 경우만 주석과 함께 썼는가 | `web/.workflow/source/react.md` `7.8 로딩/펜딩 렌더링 규칙` |
| `react-8.2` | API, handler, effect, 주요 함수/type/interface에 JSDoc을 붙였는가 | `web/.workflow/source/react.md` `8.2 선언 헤더 JSDoc 필수 지점` |
| `react-8.3` | API 선언에 `@description`을 사용했는가 | `web/.workflow/source/react.md` `8.3 API 주석 규칙` |
| `react-8.4` | API 이외 함수 선언에 `@summary`를 사용했는가 | `web/.workflow/source/react.md` `8.4 비-API 함수 주석 규칙` |

### Route

| ID | 점검 포인트 | 원문 섹션 |
| --- | --- | --- |
| `route-4.1` | route 파일명이 `feature.index.tsx`, `feature.layout.tsx` 형태를 유지하는가 | `web/.workflow/source/route.md` `4.1 파일명 기본 규칙` |
| `route-4.5` | route 전용 유틸을 같은 계층 `*.ts`에 두고 JSX를 넣지 않았는가 | `web/.workflow/source/route.md` `4.5 같은 계층 *.ts 유틸/헬퍼 파일 규칙` |
| `route-5.1` | 라우트 파일 상단에 `export const Route` 정의를 고정했는가 | `web/.workflow/source/route.md` `5.1 Route export` |
| `route-5.3` | 기본 진입 redirect를 `beforeLoad`에서 처리했는가 | `web/.workflow/source/route.md` `5.3 기본 진입 리다이렉트` |
| `route-5.4` | 인증/권한 가드를 컴포넌트 본문이 아니라 `beforeLoad`에서 처리했는가 | `web/.workflow/source/route.md` `5.4 인증/권한 가드` |
| `route-5.5` | search를 읽기 전에 `validateSearch`를 선언했는가 | `web/.workflow/source/route.md` `5.5 validateSearch 우선` |
| `route-5.6` | param/search 접근을 `Route.useParams()`, `Route.useSearch()`로 통일했는가 | `web/.workflow/source/route.md` `5.6 Route.useParams() / Route.useSearch() 사용` |
| `route-6.1` | `*.layout.tsx`가 공통 셸과 가드까지만 담당하는가 | `web/.workflow/source/route.md` `6.1 layout 파일 책임` |
| `route-6.2` | `*.index.tsx`가 실제 화면 조립 책임을 가지는가 | `web/.workflow/source/route.md` `6.2 index 파일 책임` |
| `route-7.1` | route 공용 CSS와 `-local` CSS가 섞이지 않았는가 | `web/.workflow/source/route.md` `7.1 라우트 CSS 배치` |

### CSS

| ID | 점검 포인트 | 원문 섹션 |
| --- | --- | --- |
| `css-3.5` | 새 scope slug가 프로젝트 전역에서 고유한가 | `web/.workflow/source/css.md` `3.5 클래스 네임스페이스 고유성(필수)` |
| `css-3.7` | `-local` 스타일이 같은 `-local/*.css`에만 있는가 | `web/.workflow/source/css.md` `3.7 -local 스타일 스코프 규칙` |
| `css-4.1` | TSX에서 클래스 조합을 `clsx()`로 처리했는가 | `web/.workflow/source/css.md` `4.1 TSX에서의 클래스 조합` |
| `css-4.4` | 구조 차이를 modifier로 조립하지 않았는가 | `web/.workflow/source/css.md` `4.4 조립식 element 클래스 금지` |
| `css-4.5` | `Ui*` 컴포넌트에 직접 `className`을 주입하지 않았는가 | `web/.workflow/source/css.md` `4.5 Ui 컴포넌트 className 사용 금지` |
| `css-5.1` | 플랫 구조를 유지하고 과도한 nested를 피했는가 | `web/.workflow/source/css.md` `5.1 플랫 구조` |
| `css-5.2.1` | `.ant-*`, `.rc-*` 타겟팅이 소유 래퍼 범위 안에 있는가 | `web/.workflow/source/css.md` `5.2.1 Bad/Good: 선택자 범위` |
| `css-5.3.1` | 모든 `var(--*)`에 폴백 값을 넣었는가 | `web/.workflow/source/css.md` `5.3.1 CSS 변수 폴백 값 필수 적용` |
| `css-5.5` | 상태는 modifier, DOM 상태는 pseudo-class로 분리했는가 | `web/.workflow/source/css.md` `5.5 상태/인터랙션 원칙` |

### Test

| ID | 점검 포인트 | 원문 섹션 |
| --- | --- | --- |
| `test-4.1` | Integration spec를 `web/tests/**/*.spec.ts`에 뒀는가 | `web/.workflow/source/test.md` `4.1 Integration` |
| `test-4.2` | E2E spec를 `web/tests/**/*.e2e.spec.ts`에 뒀는가 | `web/.workflow/source/test.md` `4.2 E2E` |
| `test-5.3` | 공용 helper를 `support.ts`와 feature 근처 helper로 적절히 나눴는가 | `web/.workflow/source/test.md` `5.3 공용 코드 배치` |
| `test-6.5` | 신규 테스트 작성 순서를 지켰는가 | `web/.workflow/source/test.md` `6.5 신규 테스트 작성 순서` |
| `test-7.2-order` | `page.route()`를 `page.goto()` 전에 등록했는가 | `web/.workflow/source/test.md` `7.2 mocking 규칙` |
| `test-7.2-scope` | mock이 테스트 목적 범위 안에만 선언되었는가 | `web/.workflow/source/test.md` `7.2 mocking 규칙` |
| `test-7.4` | `waitForTimeout()` 대신 상태 기반 대기를 썼는가 | `web/.workflow/source/test.md` `7.4 대기 규칙` |
| `test-9.1` | locator를 role/label 중심으로 선택했는가 | `web/.workflow/source/test.md` `9.1 locator 우선순위` |
| `test-9.2` | 구현 디테일 대신 web-first assertion을 썼는가 | `web/.workflow/source/test.md` `9.2 assertion 원칙` |
| `test-9.3` | 명시적 wait가 허용 범위 안에만 있는가 | `web/.workflow/source/test.md` `9.3 명시적 wait 허용 범위` |

### CRUD

| ID | 점검 포인트 | 원문 섹션 |
| --- | --- | --- |
| `crud-list-columns` | 목록이 단일 이름 필드가 아니라 스키마 기반 5~8개 의미 있는 컬럼을 가지는가 | `web/.workflow/source/crud.md` `2.1 컬럼 선택` |
| `crud-list-layout` | 목록 첫 컬럼이 체크박스이고 운영자 스캔이 쉬운 표 구조인가 | `web/.workflow/source/crud.md` `2.2 레이아웃` |
| `crud-list-row-action` | 행 액션이 edit 한 종류로 제한되고 체크박스 오른쪽에 배치되는가 | `web/.workflow/source/crud.md` `2.3 행 액션` |
| `crud-list-delete-action` | delete가 행 단위가 아니라 상단 bulk action으로만 제공되는가 | `web/.workflow/source/crud.md` `2.4 삭제 액션` |

## 4. workflow 문서 변경 규칙
- 새 규칙을 넣을 때는 이 문서의 카탈로그와 관련 원문 문서를 같이 갱신합니다.
- 반복되는 작업 단계가 새로 보이면 `작업 단계 세트`에 먼저 추가합니다.
- 규칙 의미가 바뀌면 `source/*.md`를 먼저 수정하고, 그다음 이 문서의 ID 설명을 맞춥니다.
