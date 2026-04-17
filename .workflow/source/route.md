# Route 가이드라인

## 목차
1. 문서 목적
2. 핵심 원칙
3. 라우트 구조 원칙
    1. 루트 라우트
    2. 최상위 라우트 그룹 분리 기준
    3. 폴더 전용 / 플랫 전용을 모두 지양
    4. 일반 폴더와 괄호 폴더의 역할
    5. 같은 레이아웃이면 같은 부모 아래에 유지
4. 파일 및 네이밍 규칙
    1. 파일명 기본 규칙
    2. `index.tsx`만 쓰지 않는 이유
    3. 괄호 그룹 폴더 규칙
    4. 동적 세그먼트 표기
    5. 같은 계층 `*.ts` 유틸/헬퍼 파일 규칙
    6. 최상위 그룹 이름 규칙
5. 라우트 선언 규칙
    1. `Route` export
    2. 경로 문자열 작성
    3. 기본 진입 리다이렉트
    4. 인증/권한 가드
    5. `validateSearch` 우선
    6. `Route.useParams()` / `Route.useSearch()` 사용
6. 라우트 파일 책임 규칙
    1. `layout` 파일 책임
    2. `index` 파일 책임
    3. `-local` 폴더 책임
7. 스타일 및 생성물 규칙
    1. 라우트 CSS 배치
    2. 생성 파일 수동 수정 금지
8. 신규 라우트 추가 순서
9. 체크리스트

## 1. 문서 목적

이 문서는 TanStack Router 파일 기반 라우팅을 사용하는 프로젝트의 라우트 작성 기준을 정의한다.
라우트 트리 구조, 파일/폴더 네이밍, 레이아웃 분리, 검색 가능한 엔트리 파일명 규칙은 본 문서를 기준으로 작성한다.

## 2. 핵심 원칙

- 구조적 일관성: 같은 깊이의 라우트는 같은 폴더/파일 패턴으로 배치한다.
- 혼합 전략: 폴더만으로 구조를 잡지도 않고, 플랫 파일명만으로 구조를 잡지도 않는다.
- 탐색 가능성: 에디터와 파일 검색에서 라우트 파일을 이름으로 바로 찾을 수 있어야 한다.
- 레이아웃 우선 분리: 최상위 라우트 분리는 기능명이 아니라 레이아웃 셸 차이를 기준으로 판단한다.
- 책임 분리: `layout`, `index`, `-local`의 책임을 섞지 않는다.
- 생성물 보호: 라우트 변경 결과로 갱신되는 `src/routeTree.gen.ts`는 수동 수정하지 않는다.

## 3. 라우트 구조 원칙

### 3.1 루트 라우트

- 전역 라우트 컨텍스트와 앱 전체 공통 책임은 `src/routes/__root.tsx`에서만 관리한다.
- 루트는 `head`, 전역 `Outlet`, 전역 로딩/모달 정리처럼 “모든 화면에 공통인 책임”만 가진다.

### 3.2 최상위 라우트 그룹 분리 기준

- 최상위 라우트 그룹은 기능명 기준이 아니라 레이아웃 셸 기준으로 나눈다.
- 헤더, 사이드바, 접근가드, 브레드크럼, 전역 래퍼가 다르면 별도 최상위 라우트 그룹으로 분리한다.
- 반대로 모든 화면이 같은 레이아웃 셸을 공유하면 최상위 라우트를 여러 개로 나누지 않는다.

```txt
Bad: 같은 레이아웃인데 기능별로 최상위 라우트를 분리
src/routes/(orders)/orders.index.tsx
src/routes/(members)/members.index.tsx
src/routes/(settings)/settings.index.tsx
```

```txt
Good: 같은 레이아웃이면 하나의 상위 layout 아래에 배치
src/routes/app.layout.tsx
src/routes/app.index.tsx
src/routes/app/(orders)/orders.index.tsx
src/routes/app/(members)/members.index.tsx
src/routes/app/(settings)/settings.index.tsx
```

```txt
Good: 레이아웃 셸이 다르면 최상위 그룹을 분리
src/routes/(public)/home.index.tsx
src/routes/(workspace)/workspace.layout.tsx
src/routes/(workspace)/workspace.index.tsx
src/routes/(workspace)/workspace/(settings)/settings.index.tsx
```

### 3.3 폴더 전용 / 플랫 전용을 모두 지양

- 폴더만으로 라우트를 표현하면 중첩이 깊어지고 `index.tsx`가 과도하게 반복된다.
- 플랫 파일명만으로 라우트를 표현하면 파일명이 지나치게 길어지고 rename 비용이 커진다.
- 따라서 이 문서는 “일반 폴더 + `()` 그룹 폴더 + 플랫 파일명”을 섞는 방식을 기본 구조로 삼는다.

```txt
Bad: 폴더만으로 표현
src/routes/app/settings/permissions/members/index.tsx
```

```txt
Bad: 플랫 파일명만으로 표현
src/routes/app.settings.permissions.members.index.tsx
```

```txt
Good: 일반 폴더와 그룹 폴더, 플랫 파일명을 혼합
src/routes/app/
  app.layout.tsx
  app.index.tsx
  (settings)/
    settings.layout.tsx
    settings.index.tsx
    (permissions)/
      permissions.layout.tsx
      permissions.index.tsx
      (members)/
        members.index.tsx
```

### 3.4 일반 폴더와 괄호 폴더의 역할

- 일반 폴더는 실제 URL 세그먼트를 반영하는 상위 계층이다.
- 괄호 폴더(`()`)는 하위 라우트를 그룹화하기 위한 pathless 계층이다.
- 즉, URL에 보여야 하는 상위 계층은 일반 폴더로 두고, 하위 라우트 묶음은 괄호 폴더로 분리한다.

```txt
Good
src/routes/app/
  app.layout.tsx
  app.index.tsx
  (settings)/
    settings.index.tsx
```

### 3.5 같은 레이아웃이면 같은 부모 아래에 유지

- 여러 화면이 같은 레이아웃 셸을 쓰면, 같은 부모 `layout` 아래에 두고 하위 그룹만 늘린다.
- “기능이 다르다”는 이유만으로 최상위 레이아웃을 새로 만들지 않는다.
- 모든 화면이 같은 레이아웃이라면 `index.tsx` 옆에 `layout.tsx`를 두고 그 아래 하위 라우트를 중첩하는 구조를 사용한다.

## 4. 파일 및 네이밍 규칙

### 4.1 파일명 기본 규칙

- 파일명은 TanStack Router 파일 규칙을 따르되, 식별 가능한 `kebab-case`를 기본으로 한다.
- 라우트 엔트리 파일은 `feature.index.tsx`, 부모 outlet 파일은 `feature.layout.tsx`를 사용한다.
- 하위 라우트가 생기면 해당 라우트는 기본적으로 `*.css`, `*.layout.tsx`, `*.index.tsx`, 같은 계층 `*.ts` 유틸/헬퍼 파일 세트를 함께 준비한다.
- `*.ts` 파일은 화면 내부에서 반복될 정규화, 파싱, 매핑, 가드 보조 로직을 모아두는 기본 위치로 본다.

```txt
Good
(settings)/
  settings.css
  settings.ts
  settings.layout.tsx
  settings.index.tsx
```

### 4.2 `index.tsx`만 쓰지 않는 이유

- 그룹 폴더 아래 파일명을 모두 `index.tsx`로 두면 탐색과 검색이 매우 불편하다.
- 따라서 그룹 폴더를 쓰더라도 엔트리 파일명은 `feature.index.tsx`, `feature.layout.tsx`처럼 feature 이름을 유지한다.
- 파일 검색에서 `settings.index.tsx`, `members.index.tsx`처럼 바로 찾을 수 있어야 한다.

```txt
Bad
(settings)/
  index.tsx
  layout.tsx
```

```txt
Good
(settings)/
  settings.index.tsx
  settings.layout.tsx
```

### 4.3 괄호 그룹 폴더 규칙

- 하위 라우트를 묶는 그룹 계층은 `(feature)` 폴더를 사용한다.
- 괄호 폴더는 URL 세그먼트를 늘리지 않고, 하위 route 파일을 묶는 역할만 한다.
- 하위 라우트가 생기면 기본적으로 먼저 `()` 그룹을 만들고, 그 안에 해당 feature 파일을 둔다.

```txt
Bad
src/routes/app/settings.index.tsx
src/routes/app/settings.profile.index.tsx
src/routes/app/settings.security.index.tsx
```

```txt
Good
src/routes/app/(settings)/settings.index.tsx
src/routes/app/(settings)/(profile)/profile.index.tsx
src/routes/app/(settings)/(security)/security.index.tsx
```

### 4.4 동적 세그먼트 표기

- 필수 path param은 `{$param}` 문법을 사용한다.
- 선택 path param은 `{-$param}` 문법을 사용한다.
- param 이름은 도메인 의미가 드러나는 명사를 사용한다.

```txt
Good
users.{$userId}.index.tsx
posts.{$postId}.edit.index.tsx
filters.{-$tab}.tsx
```

```txt
Bad
users.{$id}.index.tsx
posts.{-$x}.tsx
```

### 4.5 같은 계층 `*.ts` 유틸/헬퍼 파일 규칙

- 라우트 전용 유틸, 헬퍼, 변환 함수는 가능하면 시작 시점부터 같은 계층 `*.ts` 파일에 모은다.
- 이 파일은 라우트 엔트리와 한 세트로 관리하며, JSX 없이 순수 TypeScript 로직만 둔다.
- 화면이 커진 뒤 나중에 분리하는 것이 아니라, 초기에 자리부터 확보하는 것을 기본값으로 본다.

```txt
Good
(settings)/
  settings.css
  settings.ts
  settings.layout.tsx
  settings.index.tsx
```

```ts
// Good: 화면 전용 helper/util 모음
export const normalizeSettingsSearch = (value: string | undefined) => {
	return value?.trim().toLowerCase() ?? "";
};

export const buildSettingsRedirect = (tab: string) => {
	return {to: "/app/settings/general", search: {tab}};
};
```

```ts
// Bad: route 파일에 helper를 계속 누적
const normalizeSettingsSearch = (value: string | undefined) => {
	return value?.trim().toLowerCase() ?? "";
};

const buildSettingsRedirect = (tab: string) => {
	return {to: "/app/settings/general", search: {tab}};
};
```

### 4.6 최상위 그룹 이름 규칙

- 최상위 그룹 이름은 기능명이 아니라 레이아웃 셸 의미가 드러나야 한다.
- 예를 들어 public/app, auth/workspace, marketing/admin 같은 식으로 셸 단위를 표현한다.
- 서로 다른 레이아웃 셸이라면 이름도 분리하고, 같은 셸이면 새 그룹을 만들지 않는다.

## 5. 라우트 선언 규칙

### 5.1 `Route` export

- 각 라우트 파일은 `export const Route = createFileRoute("...")({...})` 형태를 기본으로 한다.
- export 이름은 항상 `Route`로 고정한다.
- route definition은 파일 상단에 선언하고, 화면 컴포넌트는 그 아래에 둔다.

### 5.2 경로 문자열 작성

- `createFileRoute()` 문자열은 실제 파일 구조와 대응되게 작성한다.
- 일반 폴더, pathless group, 동적 세그먼트, trailing slash를 문자열에 그대로 반영한다.
- `layout` route는 보통 끝 슬래시 없이, `index` route는 끝 슬래시가 있는 형태를 사용한다.

```ts
export const Route = createFileRoute("/app")({...});
export const Route = createFileRoute("/app/")({...});
export const Route = createFileRoute("/app/(settings)/settings/")({...});
```

### 5.3 기본 진입 리다이렉트

- 실화면이 없는 중간 route의 기본 진입은 `index`의 `beforeLoad`에서 redirect로 처리한다.
- path param이나 search를 유지해야 하면 명시적으로 다시 넘긴다.

```ts
// Bad: 컴포넌트 렌더링 후 useEffect로 강제 이동
function SettingsIndex() {
	const navigate = useNavigate();
	
	useEffect(() => {
		void navigate({to: "/app/settings/general"});
	}, [navigate]);
	
	return null;
}
```

```ts
// Good: route 진입 단계에서 redirect
export const Route = createFileRoute("/app/(settings)/settings/")({
	beforeLoad: ({search}) => {
		throw redirect({to: "/app/settings/general", search, replace: true});
	},
});
```

### 5.4 인증/권한 가드

- 인증/권한 보장은 라우트 컴포넌트 본문이 아니라 `beforeLoad`에서 처리한다.
- 공통 가드 로직은 route 전용 유틸로 분리해 여러 라우트에서 재사용한다.

```ts
// Bad: 컴포넌트 렌더링 이후 조건부 네비게이션
function ProtectedPage() {
	const token = useTokenStore();
	const navigate = useNavigate();
	
	if (!token) {
		void navigate({to: "/login"});
	}
	
	return <Outlet / >;
}
```

```ts
// Good: 진입 전 가드
export const Route = createFileRoute("/app")({
	beforeLoad: async ({context}) => {
		await ensureAuthenticated(context);
	},
	component: AppLayout,
});
```

### 5.5 `validateSearch` 우선

- 쿼리스트링을 읽는 화면은 `Route.useSearch()` 사용 전에 `validateSearch`를 선언한다.
- search schema는 `z.object(...)`로 작성한다.
- 숫자형 페이지네이션/선택값은 `z.coerce.number()`로 보정한다.
- 초기값/방어값이 필요하면 `.default()`와 `.catch()`를 함께 사용한다.

```ts
// Bad: 사용처마다 문자열 파싱
const search = useSearch({from: "/app/users"});
const page = Number(search.page ?? 1);
```

```ts
// Good: route에서 먼저 정규화
export const Route = createFileRoute("/app/(users)/users/")({
	validateSearch: z.object({
		page: z.coerce.number().int().min(1).default(1).catch(1),
		size: z.coerce.number().int().min(1).max(100).default(20).catch(20),
	}),
	component: UsersIndex,
});
```

### 5.6 `Route.useParams()` / `Route.useSearch()` 사용

- param/search 접근은 해당 파일의 `Route`에서 꺼내 쓰는 것을 기본으로 한다.
- 훅 사용 패턴은 route definition과 가까운 위치에서 일관되게 유지한다.

```ts
const {useParams, useSearch} = Route;
const params = useParams();
const search = useSearch();
```

## 6. 라우트 파일 책임 규칙

### 6.1 `layout` 파일 책임

- `*.layout.tsx`는 부모 경로 등록, 접근 제어, 공통 래퍼, 메뉴 상태 동기화, `<Outlet />`까지만 담당한다.
- 하위 leaf 화면만 쓰는 API 호출이나 상세 폼 로직은 넣지 않는다.

```ts
// Good
function AppLayout() {
	return <Outlet / >;
}
```

### 6.2 `index` 파일 책임

- `*.index.tsx`는 실제 화면 렌더링, API Hook, 이벤트 핸들러, search 기반 상태 동기화, 화면 조립을 담당한다.
- 화면 흐름이 드러나도록 유지하고, 근거 없는 조기 추상화는 지양한다.

### 6.3 `-local` 폴더 책임

- 해당 라우트에서만 쓰는 모달, 폼, 상수, 헬퍼는 라우트 하위 `-local/`에 둔다.
- 다른 라우트와 계약이 안정되지 않았다면 공용 UI로 먼저 올리지 않는다.

```txt
Good
(settings)/
  settings.index.tsx
  -local/
    modal-setting-form.tsx
    modal-setting-form.css
```

## 7. 스타일 및 생성물 규칙

### 7.1 라우트 CSS 배치

- route 공용 스타일은 해당 route 폴더의 `*.css`에 둔다.
- 같은 route의 `layout`과 `index`가 같은 시각 컨텍스트를 공유하면 같은 CSS를 함께 import할 수 있다.
- `-local` 컴포넌트 스타일은 `.workflow/source/css.md`에 따라 `-local/*.css`에 둔다.

```txt
Bad
(settings)/
  settings.index.tsx
  -local/
    modal-setting-form.tsx
settings.css에 modal 전용 스타일까지 모두 선언
```

```txt
Good
(settings)/
  settings.css
  settings.index.tsx
  -local/
    modal-setting-form.tsx
    modal-setting-form.css
```

### 7.2 생성 파일 수동 수정 금지

- 라우트 추가/변경 결과로 생성되는 `src/routeTree.gen.ts`는 수동 수정하지 않는다.
- 라우트 소스만 수정하고, 생성물은 결과물로만 다룬다.

## 8. 신규 라우트 추가 순서

1. 모든 화면이 같은 레이아웃 셸인지 먼저 판단한다.
2. 레이아웃 셸이 다르면 최상위 라우트 그룹을 분리하고, 같으면 기존 부모 `layout` 아래에 둔다.
3. URL에 반영되는 상위 계층은 일반 폴더로 만든다.
4. 하위 라우트가 생기면 `(<feature>)` 그룹 폴더를 만든다.
5. 그룹 폴더 안에는 기본적으로 `feature.css`, `feature.ts`, `feature.layout.tsx`, `feature.index.tsx`를 둔다.
6. `feature.ts`에는 화면 전용 유틸, 헬퍼, 정규화 로직을 먼저 모아둘 자리를 만든다.
7. 동적 세그먼트가 필요하면 `{$param}`, `{-$param}` 규칙을 사용한다.
8. search를 읽는 화면이면 `validateSearch`를 먼저 선언한다.
9. route 전용 모달/헬퍼가 있으면 같은 계층 `-local/`에 둔다.
10. 생성된 `src/routeTree.gen.ts`는 수동 수정하지 않는다.

## 9. 체크리스트

- 최상위 라우트 분리가 기능명이 아니라 레이아웃 셸 기준인가
- 폴더 전용 구조와 플랫 전용 구조 중 하나로 치우치지 않았는가
- URL에 반영되는 상위는 일반 폴더로 두었는가
- 하위 route 묶음은 `()` 그룹 폴더로 분리했는가
- 하위 route라면 `feature.css`, `feature.ts`, `feature.layout.tsx`, `feature.index.tsx` 기본 세트를 갖췄는가
- 그룹 폴더 안의 엔트리 파일명이 `index.tsx`가 아니라 `feature.index.tsx`처럼 검색 가능하게 되어 있는가
- 화면 전용 유틸/헬퍼가 route 파일 안에 누적되지 않고 같은 계층 `*.ts` 파일로 정리될 자리를 확보했는가
- 인증/권한 가드를 컴포넌트 본문이 아니라 `beforeLoad`에 두었는가
- 쿼리스트링에 `validateSearch`가 선언되어 있는가
- route 전용 보조 모듈이 `-local/`에 정리되어 있는가
- `src/routeTree.gen.ts`를 수동 수정하지 않았는가
