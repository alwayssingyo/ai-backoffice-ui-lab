# React 가이드라인

## 목차
1. 문서 목적
2. 핵심 원칙
3. 파일 및 네이밍 규칙
    1. 파일명/식별자
    2. export/import
    3. 쿼리/뮤테이션 네이밍
    4. 상수 관리 규칙
    5. 공용 컴포넌트 작성 가이드
        1. `ui` 컴포넌트
        2. `widget` 컴포넌트
        3. `-local`과의 경계
        4. 공용 컴포넌트 파일명 규칙
        5. 공용 보조 로직 배치
4. 타입 선언 원칙
    1. 최우선 원칙: 함수 변수 타입 선언 우선
    2. 차선 원칙: 함수 타입이 없을 때만 매개변수 타입 선언
    3. Props 타입 재사용 우선
    4. 미사용 매개변수 규칙
    5. Bad/Good: 타입 선언 우선순위
    6. API 타입 재사용 원칙
    7. 커스텀 타입/인터페이스 문서화 규칙
5. 함수/컴포넌트 작성 규칙
    1. 함수 선언
    2. enum 대체
    3. Props 처리
    4. JSX 작성
        1. JSX 인라인 핸들러
        2. JSX 조건부 렌더링
    5. 화면 파일 책임
        1. 화면 흐름 유지
        2. 조기 공용화 금지
    6. 파일 배치 기준 (`-local` vs 같은 계층)
        1. `-local` 컴포넌트
        2. 같은 계층 `.ts` 파일
    7. 유틸 함수 분리 기준 (엄격)
    8. 화면 상단 명령형 조립 금지
    9. Bad/Good: 유틸 분리 판단
    10. 화면 파일 책임 경계
        1. 화면 파일 상단에 둘 수 있는 것
        2. 화면 파일 상단에서 밖으로 뺄 것
6. 이벤트 핸들러 규칙
    1. Bad/Good: 핸들러 바인딩
7. 상태 및 데이터 패칭 규칙
    1. 상태 도구 선택
    2. 공용 역할/권한 상태 규칙
        1. 공용 판별 결과 저장 위치
        2. 스토어 접근 패턴
    3. React Query 데이터 가공
    4. 응답/스토어 오리진 보존
    5. Bad/Good: 오리진 추적
    6. JSX 표시값 지역 스코프
    7. React Compiler 메모이징 규칙
    8. 옵셔널 값/폴백 처리 규칙
    9. 로딩/펜딩 렌더링 규칙
8. 주석 및 useEffect 규칙
    1. 주석 원칙
    2. 선언 헤더 JSDoc 필수 지점
    3. API 주석 규칙 (`@description`)
    4. 비-API 함수 주석 규칙 (`@summary`)
        1. 이벤트 핸들러
        2. `useEffect`, 일반 유틸 함수
    5. 함수 내부 주석 규칙 (`//`)
    6. Bad/Good: 주석 규칙
9. 금지 패턴
10. 권장 예시

## 1. 문서 목적
이 문서는 프로젝트의 모든 React/TypeScript 코드 작성 기준을 단일 규격으로 정의한다.
컴포넌트, 훅, 이벤트 처리, 비동기 데이터 흐름은 본 문서를 기준으로 작성한다.

## 2. 핵심 원칙
- 명시성: 타입, 데이터 출처, 의도가 코드에서 즉시 드러나야 한다.
- 일관성: 같은 문제를 같은 패턴으로 해결해 코드베이스를 예측 가능하게 유지한다.
- 책임 분리: 렌더링, 상태, 데이터 가공 책임을 분리해 변경 비용을 낮춘다.
- 추적 가능성: 값을 읽는 위치에서 원본 출처를 쉽게 따라갈 수 있어야 한다.
- 컴파일러 우선: React 19 컴파일러 최적화에 맡기고, 선제적인 메모이징/캐싱은 최소화한다.
- 결측값 노출: 옵셔널 값의 부재를 숨기기 위한 폴백을 지양하고 상태의 부재를 명확히 드러낸다.

## 3. 파일 및 네이밍 규칙

### 3.1 파일명/식별자
- 파일명은 `kebab-case`를 사용한다.
- 변수/함수는 `camelCase`, 타입/컴포넌트는 `PascalCase`, 상수는 `SCREAMING_SNAKE_CASE`를 사용한다.

### 3.2 export/import
- `index.ts` 기반 barrel export를 금지한다.
- 단일 컴포넌트 파일은 `export default` 사용을 허용한다.
- React 타입은 전역 네임스페이스 참조(`React.MouseEvent`)를 금지하고 `import type`을 사용한다.

```ts
import type { MouseEventHandler } from "react";
```

### 3.3 쿼리/뮤테이션 네이밍
- Swagger 스펙 기반 훅 이름을 그대로 따른다.
- 접두사는 `response`(query), `mutation`(mutation)만 사용한다.
- 예시
	- `useContentTypeGetListSuspense` -> `responseContentTypeGetListSuspense`
	- `useContentManagerRemoves` -> `mutationContentManagerRemoves`

### 3.4 상수 관리 규칙
- 여러 화면/모듈에서 공유되는 설정/상수 namespace는 `src/entry/config.ts`를 공개 진입점으로 사용한다.
- 실제 도메인별 정의는 `src/config/**`에 두고, 사용처에서는 `config.*` 형태로 접근한다.
- 라우트/`-local`/컴포넌트 파일에 공용 상수를 분산 선언하지 않는다.

```ts
// Bad: 공용 상수를 라우트 파일에 분산 선언
export const DASHBOARD_MENU_KEY = {
	DASHBOARD: "dashboard",
	// ...
} as const;
```

```ts
// Good: 공용 설정/상수는 entry/config를 통해 가져와 사용
import { config } from "@/entry/config.ts";

config.navigation.projectMenuKey.home;
```

### 3.5 공용 컴포넌트 작성 가이드

#### 3.5.1 `ui` 컴포넌트
- `web/src/components/ui/**`는 코어 UI 레이어다.
- `ui`는 완전히 view만 담당한다.
- `ui`에는 페이지 의존 비즈니스 로직, 서비스 호출, 도메인 규칙, 권한 판단, 라우터 의존성, query/mutation orchestration을 넣지 않는다.
- `ui`는 라이브러리 래핑, 스타일 표준화, 공통 시각 표현, 입력/출력 인터페이스 정리에 집중한다.
- `ui`는 props를 받아 렌더링하고 이벤트를 위임하는 수준에서 끝내야 한다.
- `ui` 파일명은 반드시 `ui-*.tsx`, `ui-*.css` 규칙을 따른다.
- 예시: `web/src/components/ui/button/ui-button.tsx`, `web/src/components/ui/upload/ui-upload-dragger.tsx`

#### 3.5.2 `widget` 컴포넌트
- `web/src/components/widget/**`는 공용 조합 레이어다.
- `widget`은 공용 + 로직 + view를 함께 담당할 수 있다.
- `widget`은 여러 페이지에서 재사용되는 상위 개념 컴포넌트이며, `ui`보다 한 단계 높은 추상화다.
- `widget`에는 화면 공통 비즈니스 로직, 상태 조합, 서비스 호출, query/mutation orchestration, 도메인 매핑 로직이 포함될 수 있다.
- 다만 특정 단일 페이지에 종속된 로직이면 `widget`이 아니라 해당 route의 `-local` 또는 route 파일에 둔다.
- `widget`은 페이지에 직접 의존하지 않는 공용 흐름일 때만 만든다.
- 예시: `web/src/components/widget/lnb/widget-lnb.tsx`, `web/src/components/widget/sidebar/widget-sidebar.tsx`

#### 3.5.3 `-local`과의 경계
- 특정 route 한 곳에서만 쓰이고 그 화면 맥락을 직접 아는 컴포넌트는 `-local`에 둔다.
- 둘 이상의 페이지에서 재사용되거나 페이지 맥락과 분리된 공용 흐름이면 `components/widget/**`에 둔다.
- 완전히 범용적인 입력/표시 컴포넌트면 `components/ui/**`에 둔다.
- 정리하면 다음 기준을 따른다.
	- view만 필요하다 -> `ui`
	- 공용 view + 공용 로직 + 서비스 조합이 필요하다 -> `widget`
	- 특정 페이지 내부 맥락에 묶인다 -> `-local`

#### 3.5.4 공용 컴포넌트 파일명 규칙
- `ui` 폴더의 컴포넌트 파일명은 `ui-button.tsx`, `ui-upload-dragger.tsx`처럼 `ui-` 접두사를 사용한다.
- `widget` 폴더의 컴포넌트 파일명은 `widget-lnb.tsx`, `widget-sidebar.tsx`처럼 `widget-` 접두사를 사용한다.
- `widget` 스타일 파일도 `widget-lnb.css`, `widget-media-uploader.css`처럼 `widget-` 접두사를 동일하게 사용한다.

#### 3.5.5 공용 보조 로직 배치
- 공용 컴포넌트의 보조 로직은 기본적으로 hook보다 일반 `.ts` 파일로 분리하는 것을 우선한다.
- 이 규칙은 `useContentMediaCreatePresignedUrls` 같은 생성된 API hook 또는 React Query hook 사용 자체를 금지하는 뜻이 아니다.
- 이미 프로젝트의 공용 데이터 접근 계층으로 제공되는 API hook은 route, widget, 화면에서 필요에 따라 그대로 호출할 수 있다.
- `useXxx` hook은 “React 생명주기/상태/컨텍스트/효과”에 실제로 묶일 때만 만든다.
- 특정 widget 하나를 위해 만든 계산, 매핑, payload 생성, 정규화, 업로드 단계 변환 로직은 먼저 일반 `.ts` 파일로 뺀다.
- 이유는 다음과 같다.
	- hook으로 만들면 React 호출 규칙과 렌더링 문맥에 묶여 재사용 범위가 오히려 좁아진다.
	- 테스트도 hook harness가 필요해져 단순 로직 검증 비용이 커진다.
	- 컴포넌트 종속 로직을 hook 이름으로 감싸면 “재사용 가능한 고수준 유틸”처럼 보이지만 실제로는 해당 컴포넌트 전용 코드일 가능성이 높다.
- hook은 프로젝트 전역 또는 여러 화면에서 공통으로 쓰는 고수준 추상화일 때만 허용한다.
- 즉, 금지 대상은 “생성된 API hook 사용”이 아니라 “로컬 helper/utility를 새 custom hook으로 포장하는 습관”이다.
- 예를 들어 여러 페이지가 같은 권한 문맥, 세션 문맥, 공용 query orchestration, 브라우저 이벤트 구독을 공유한다면 hook으로 승격할 수 있다.
- 반대로 한 widget 내부에서만 쓰는 upload step 계산, file list 정규화, request payload 조합, 표시값 파생은 `widget-media-uploader.ts` 같은 인접 일반 파일로 둔다.
- 판단 기준은 다음과 같다.
	- React API 호출이 필요하다 -> hook 검토 가능
	- React API 없이 순수 계산/조합이다 -> 일반 `.ts`
	- 한 컴포넌트/한 widget에 종속적이다 -> 일반 `.ts`
	- 여러 페이지/여러 route에서 공통으로 쓰는 상위 개념이다 -> hook 검토 가능
- 즉, hook은 “컴포넌트 보조물”이 아니라 “프로젝트 전역에서 재사용되는 고수준 React 유틸”에 가깝게 유지한다.
- hook이 꼭 필요해도 소유 범위가 드러나게 이름을 맞춘다. 예: `use-project-permission.ts`, `use-dashboard-scroll-sync.ts`
- widget에 새 공용 업로더를 만든다면 기본값은 `widget-media-uploader.tsx` + 인접 일반 `.ts` helper 조합이고, 별도 hook은 정말 여러 화면에서 같은 React orchestration을 공유할 때만 추가한다.
- 새 공용 업로더를 만든다면 `web/src/components/widget/media-uploader/widget-media-uploader.tsx`처럼 폴더는 도메인 개념, 파일은 `widget-` 접두사 규칙을 따른다.

## 4. 타입 선언 원칙

### 4.1 최우선 원칙: 함수 변수 타입 선언 우선
- 함수 타입 선언은 매개변수 타입 선언보다 우선한다.
- 특히 이벤트 핸들러는 반드시 핸들러 변수에 함수 타입을 선언한다.

```ts
import type { MouseEventHandler } from "react";

const handleContentAddButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
	// ...
};
```

### 4.2 차선 원칙: 함수 타입이 없을 때만 매개변수 타입 선언
- 적절한 함수 타입(핸들러 타입, Props 재사용 타입 등)이 없을 때만 매개변수에 직접 타입을 명시한다.
- 커스텀 유틸/도메인 함수처럼 표준 함수 타입이 없는 경우가 여기에 해당한다.

```ts
const parseContentId = (value: string): number => {
	return Number(value);
};
```

### 4.3 Props 타입 재사용 우선
- Props로 전달받은 콜백 구현 시, 매개변수 재타이핑보다 Props 시그니처 재사용을 우선한다.

```ts
import type { MouseEvent } from "react";

interface LinkProps {
	onLinkClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}

const handleLinkClick: LinkProps["onLinkClick"] = (e) => {
	e.preventDefault();
};
```

### 4.4 미사용 매개변수 규칙
- 미사용 매개변수도 생략하지 않고 `_` 접두사로 명시한다.

```ts
import type { ChangeEventHandler } from "react";

const handleChange: ChangeEventHandler<HTMLInputElement> = (_e) => {
	// no-op
};
```

### 4.5 Bad/Good: 타입 선언 우선순위

```ts
// Bad: 핸들러 타입이 있는데 매개변수 타입만 사용
const handleAddButtonClick = (e: MouseEvent<HTMLButtonElement>): void => {
	// ...
};
```

```ts
// Good: 함수 변수 타입 선언 우선
const handleAddButtonClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
	// ...
};
```

### 4.6 API 타입 재사용 원칙
- API 인터페이스/응답 타입이 이미 존재하면 동일 구조의 별도 타입 선언을 금지한다.
- 필요한 경우에도 API 타입을 직접 참조하거나 `Pick`/`Omit`/Indexed Access로 파생한다.
- 신규 타입 선언은 “구조 중복”이 아닌 “의미 차이”가 실제로 있는 경우에만 예외적으로 허용한다.

```ts
// Bad: API 타입과 동일/유사 구조의 별도 타입 선언
interface PermissionMemberEditValues {
	id: number;
	name: string;
	role: string;
}
```

```ts
// Good: API 타입 직접 사용
type PermissionGroupAdmin = PermissionGroupAdminResponse;
```

```ts
// Good: API 타입에서 필요한 필드만 파생
type PermissionGroupAdminSummary = Pick<PermissionGroupAdminResponse, "id" | "name">;
```

### 4.7 커스텀 타입/인터페이스 문서화 규칙
- API 생성 타입이 아닌 커스텀 `type`, `interface` 선언에는 무엇을 표현하는지 JSDoc을 작성한다.
- 객체형 `type`, `interface`는 필드 의미를 `@property`로 모두 명시한다.
- 함수 타입 필드도 `@property`로 설명한다.
- 타입/인터페이스 선언은 관련 파일 최상단에 모아 배치한다.
- 구현부 중간에 타입/인터페이스를 흩뿌리지 않는다.

```ts
/**
 * @summary 엔트리 트리 사이드바 노드
 * @property id 노드 식별자
 * @property nodeType 폴더/테이블 노드 유형
 * @property name 사이드바 표시 이름
 * @property tableName TABLE 노드의 실제 테이블명
 * @property children 하위 노드 목록
 */
export interface EntrySidebarNode {
	id: number;
	nodeType: "FOLDER" | "TABLE";
	name: string;
	tableName?: string;
	children: EntrySidebarNode[];
}
```

## 5. 함수/컴포넌트 작성 규칙

### 5.1 함수 선언
- 함수는 화살표 함수 사용을 기본으로 한다.
- 매개변수 타입은 항상 명시하되, 함수 타입 선언이 가능한 경우 함수 변수 타입 선언을 우선 적용한다.
- 반환 타입은 복잡한 함수에서 명시를 권장한다.
- 매개변수가 3개 이상이거나 같은 계열 값이 묶여 전달되면 단일 객체 매개변수로 묶는다.
- 단일 객체 매개변수 타입은 파일 최상단 `interface` 또는 `type`으로 선언한다.
- 함수 본문 첫 줄에서 `props`처럼 구조분해해 사용한다.

### 5.2 enum 대체
- `enum` 대신 객체 리터럴 + `as const`를 사용한다.

```ts
const STATUS = {
	PENDING: "pending",
	SUCCESS: "success",
	ERROR: "error",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];
```

### 5.3 Props 처리
- 컴포넌트 시그니처는 `props` 객체 전체를 받고, 함수 본문 첫 줄에서 구조분해한다.
- 이 규칙은 `props` 계약을 읽기 쉽게 하기 위한 예외이며, `7.4 응답/스토어 오리진 보존` 규칙과 충돌하지 않는다.

```tsx
interface UserCardProps {
	id: string;
	onSave: () => void;
}

const UserCard = (props: UserCardProps) => {
	const { id, onSave } = props;
	return <button onClick={onSave}>{id}</button>;
};
```

### 5.4 JSX 작성
#### 5.4.1 JSX 인라인 핸들러
- 기본 원칙은 명명된 핸들러 참조를 사용하고 JSX 인라인 함수는 지양한다.
- 다만 아래 조건에서는 인라인 함수를 예외적으로 허용한다.
	- 한 줄의 단순 위임/전달(`onClick={() => onClose()}`)처럼 의도가 즉시 보이는 경우
	- 별도 핸들러 분리가 오히려 가독성을 떨어뜨리는 아주 짧은 표현식
- 분기, 비동기 호출, 여러 부수효과가 포함되면 인라인 함수 사용을 금지하고 명명된 핸들러로 분리한다.

```tsx
// 허용: 단순 전달
<UiButton onClick={() => onClose()} />
```

```tsx
// 금지: 분기/비동기/여러 동작 포함
<UiButton
	onClick={async () => {
		if (!selectedTable) {
			return;
		}
		await mutationContentTypeRemove.mutateAsync({data: {projectId, tableName: selectedTable.tableName}});
		void navigate({to: "/next"});
	}}
/>
```

#### 5.4.2 JSX 조건부 렌더링
- JSX 반환부에서 렌더링 노드를 선택하는 조건부 분기에는 `?:`를 사용하지 않는다.
- 렌더링 분기는 `<Activity />`를 사용한다.
- 단순 속성값 계산(`mode={isOpen ? "visible" : "hidden"}`)에는 `?:` 사용을 허용한다.
- 분기 대상이 두 개 이상일 때는 `<Activity />`를 2개 사용해 각각 표시/숨김을 제어한다.
- 큰 렌더링 블록은 섹션 주석으로 구분할 수 있다.

```tsx
// 금지: 삼항 렌더링 분기
return hasItems ? <ItemList /> : <EmptyState />;
```

```tsx
// 권장: Activity로 렌더링 분기
return (
	<>
		<Activity mode={hasItems ? "visible" : "hidden"}>
			<ItemList />
		</Activity>
		<Activity mode={hasItems ? "hidden" : "visible"}>
			<EmptyState />
		</Activity>
	</>
);
```

### 5.5 화면 파일 책임
#### 5.5.1 화면 흐름 유지
- 라우트 엔트리 파일(예: `src/routes/(dashboard)/dashboard/(permissions)/permissions.index.tsx`)은 화면 흐름이 드러나도록 구성한다.
- 라우트 엔트리 파일은 API Hook, `useEffect`, 이벤트 핸들러, 렌더링 조립을 중심으로 유지한다.
- 레이아웃 분리, 섹션 구분만을 목적으로 한 컴포넌트화는 기본값으로 두지 않는다.

#### 5.5.2 조기 공용화 금지
- 반복 로직이 보인다는 이유만으로 즉시 공용 모듈/컴포넌트로 분리하지 않는다.
- 동일 레이아웃/컴포넌트가 여러 화면에서 반복되고 계약이 안정된 경우에만 공용화를 허용한다.
- 공용화 여부는 실제 재사용 범위와 계약 안정성으로 판단한다.

```ts
// Bad: 단순 반복만 근거로 조기 추상화
const useA = () => {/* 유사 로직 */};
const useB = () => {/* 유사 로직 */};
```

```ts
// Good: 계약을 명시한 공용화
/**
 * @summary 입력 검증/저장/오류 표시 계약
 */
export const useContentEditor = () => {
	// ...
};
```

### 5.6 파일 배치 기준 (`-local` vs 같은 계층)
#### 5.6.1 `-local` 컴포넌트
- 해당 화면에서만 사용하는 컴포넌트는 라우트 하위 `-local` 폴더에 배치해 스코프를 고정한다.
	- 예시: `src/routes/(dashboard)/dashboard/(permissions)/-local/modal-permission-form.tsx`
- `-local`은 스코프가 고정된 컴포넌트/컴포넌트 보조 모듈(예: 모달 내부 상수, 전용 하위 뷰)에 우선 적용한다.
- `-local` 컴포넌트는 해당 라우트 내부에서만 사용하며, 다른 라우트로의 직접 재사용을 금지한다.
- `-local` 컴포넌트의 스타일 파일은 동일 `-local` 계층에 배치하고, 컴포넌트 파일에서 직접 import 한다.
	- 예시: `-local/modal-entry-column-form.tsx` + `-local/modal-entry-column-form.css`
- `-local` 컴포넌트 스타일을 라우트 상위 CSS(예: `entries.css`)에 선언하는 것을 금지한다.

#### 5.6.2 같은 계층 `.ts` 파일
- 화면 전용 훅/유틸/타입처럼 비컴포넌트 로직은 라우트 엔트리와 같은 계층 파일로 분리한다.
	- 예시: `src/routes/(project)/project/(content-manager)/content-manager/(folders)/folders.ts`
- 같은 계층 유틸 파일명은 라우트 세그먼트 기준(`folders.ts`, `entries.ts`)으로 정하고, 화면 단위 진입점 역할을 유지한다.
- 같은 계층 `.ts` 유틸 파일에는 JSX를 직접 작성하지 않는다.
- 유틸에서 UI 렌더링 구성이 필요하면 제어 역전(IoC) 방식으로 렌더링 콜백(`renderTitle`, `renderIcon`)을 매개변수로 주입받는다.

### 5.7 유틸 함수 분리 기준 (엄격)

- 유틸 분리는 아래 `필수 조건`을 모두 만족하고, `추가 트리거` 중 2개 이상을 만족할 때만 허용한다.
- 필수 조건
	- React Hook/컴포넌트 상태(`useState`, `useEffect` 지역 상태)와 직접 결합되지 않는다.
	- 입력/출력 계약이 명확하다(매개변수로 입력을 받고 반환값/부작용이 함수 시그니처로 설명 가능).
	- 함수명이 도메인 의도를 설명한다(예: `normalizeFolderTreeNodes`, `updateNodeDisplayed`).
- 추가 트리거 (2개 이상)
	- 동일/유사 로직이 같은 파일에서 2회 이상 반복된다.
	- 조건 분기 3개 이상, 재귀/트리 순회, 직렬화/정규화 같은 도메인 변환이 포함된다.
	- 핸들러/이펙트 본문 길이가 과도해(예: 70줄 이상) 화면 흐름 파악을 방해한다.
	- 단위 테스트로 독립 검증할 가치가 명확하다.
- 아래 경우는 유틸 분리를 금지한다.
	- 단순 값 대입/한 줄 계산/단회성 분기 추출
	- `queryClient.invalidateQueries`처럼 해당 훅 컨텍스트에 붙어 있어야 읽기 쉬운 동기화 로직
	- 재사용 근거 없이 “보기 좋게” 만드는 목적의 분리
- 유틸 분리가 결정된 로직은 `*.index.tsx` 내부에 남겨두지 않고 같은 계층 유틸 파일로 이동한다.
- 매개변수 가독성 때문에 함수 시그니처를 한 줄로 유지해야 할 때만 함수 헤더 JSDoc 내부에 `* biome-ignore format: ...`를 제한적으로 사용한다.

### 5.7.1 화면 상단 명령형 조립 금지
- 화면 파일 상단에서 `let`으로 값을 변경하거나(`let x = ...; if (...) x = ...`), 배열을 `push`로 조립하는 패턴을 금지한다.
- 선택 상태 복원/기본값 보정처럼 분기 + 탐색 + fallback이 결합된 계산은 `resolve*` 형태 유틸로 같은 계층 `.ts` 파일로 이동한다.
- Hook 파라미터/의존성 배열에 넣기 위해 값이 필요해 보여도, 화면 상단 `const`로 먼저 빼두지 않는다.
- 여러 곳에서 재사용할 계산이면 같은 계층 `*.ts` 유틸로 이동하고, 단회성 사용이면 Hook 호출부/핸들러/이펙트 내부의 좁은 스코프에서 직접 계산한다.
- 화면 상단 별칭/구조분해 규칙은 `7.4 응답/스토어 오리진 보존`, JSX 표시값 규칙은 `7.5.1 JSX 표시값 지역 스코프`를 따른다.

```ts
// Bad: 화면 상단 Hook 응답 별칭 + 표시용 파생값 선언
const tableInfoData = responseContentManagerGetTableInfo.data;
const contentListData = responseContentManagerSearchContents.data;
const hasSelectedRows = selectedRows.length > 0;
```

```tsx
// Good: 좁은 스코프에서만 구조분해
useEffect(() => {
	const {data: searchContentsData, isFetching} = responseContentManagerSearchContents;
	if (isFetching || !searchContentsData) {
		return;
	}
	// ...
}, [responseContentManagerSearchContents.data, responseContentManagerSearchContents.isFetching]);

// Good: JSX 라인에서 오리진 체이닝/직접 조건 사용
<Activity mode={selectedRows.length > 0 ? "visible" : "hidden"} />
```

```ts
// Bad: Hook 파라미터 전달용 파생값을 화면 상단에 선언
const selectedTableNameForQuery = selectedEntryTableState.selectedTableNode?.tableName;

const responseContentManagerSearchContents = useContentManagerSearchContentsSuspense({
	tableName: selectedTableNameForQuery,
});
```

```ts
// Good: Hook 호출부에서 오리진 체이닝을 직접 사용
const responseContentManagerSearchContents = useContentManagerSearchContentsSuspense({
	tableName: selectedEntryTableState.selectedTableNode?.tableName,
});
```

```ts
// Good: 분기 + 보정이 있는 계산은 같은 계층 유틸로 이동
const responseContentManagerSearchContents = useContentManagerSearchContentsSuspense({
	tableName: resolveSelectedEntryTableNameForQuery(selectedEntryTableState),
});
```

### 5.8 Bad/Good: 유틸 분리 판단

```ts
// Bad: 단회성 계산까지 유틸로 분리
const getNextPage = (page: number) => page + 1;
const handleMoveNextPage = () => {
	setPage(getNextPage(page));
};
```

```ts
// Good: 트리 정규화/순회는 유틸로 분리
export const normalizeFolderTreeNodes = (nodes: ContentFolderNodeResponse[]): ContentFolderTreeNode[] => {
	// 재귀 정규화
	return [];
};
```

```ts
// Good: 화면 파일에는 흐름만 남김
const responseContentFolderGetListSuspense = useContentFolderGetListSuspense({
	query: {
		select: (data) => ({nodes: normalizeFolderTreeNodes(data.data.list)}),
	},
});
```

```ts
// Good: .ts 유틸은 JSX 없이 콜백 주입으로 트리 데이터 구성
export const mapFolderNodeToTreeData = (node: ContentFolderTreeNode, renderers: FolderTreeRenderers) => {
	return {
		key: String(node.id),
		title: renderers.renderTitle(node),
		icon: renderers.renderIcon(node),
	};
};
```

```tsx
// Good: .tsx 화면에서 JSX 렌더링 콜백 전달
<UiTree
		treeData={draftFolderNodes.map((node) =>
				mapFolderNodeToTreeData(node, {
					renderTitle: (node) => {
						if (node.nodeType === "TABLE") {
							return (
									<span className={clsx(!node.displayed && "rt_pcmfi__treeNodeLabel--hidden")}>
														{node.name}
													</span>
							);
						}
						
						return (
								<span
										className={clsx(
												"rt_pcmfi__treeNodeLabel--folder",
												!node.displayed && "rt_pcmfi__treeNodeLabel--hidden",
										)}
								>
													{node.name}
												</span>
						);
					},
					renderIcon: (node) => {
						if (node.nodeType === "TABLE") {
							return (
									<File
											{...iconPreset.outlined()}
											className={clsx(!node.displayed && "rt_pcmfi__treeNodeIcon--hidden")}
									/>
							);
						}
						
						return <Folder {...iconPreset.outlined()} />;
					},
				}),
		)}
/>
```

### 5.9 화면 파일 책임 경계
#### 5.9.1 화면 파일 상단에 둘 수 있는 것
- 라우트/화면 엔트리(`*.index.tsx`, `*.form.tsx`)에는 화면 흐름 중심 요소만 남긴다.
- 화면 파일 상단에는 `state`, `api(response/mutation)`, `handler`, `useEffect` 선언만 배치한다.

#### 5.9.2 화면 파일 상단에서 밖으로 뺄 것
- 화면 전용 불변 설정 상수(옵션 목록, preset 목록, 컬럼 메타 포함)도 같은 계층 `*.ts` 파일로 이동한다.
- 아래 항목은 화면 파일 상단 로컬 헬퍼로 두지 않고 같은 계층 `*.ts`로 이동하거나 JSX 내부로 이동한다.
  - 값 정규화/파싱/직렬화
  - 요청 바디 조립/변환
  - 폼 검증 규칙 생성
  - Upload 이벤트 값 변환(`getValueFromEvent` 대응)
  - 화면과 독립적인 조건 계산/도메인 변환
- 화면 전용 타입/인터페이스도 같은 계층 `*.ts` 파일 최상단에 모아 선언한다.
- JSX 표현 목적의 단발성 계산은 JSX 블록 내부(가까운 스코프)에 둔다.
- React 상태/훅 컨텍스트와 강하게 결합된 로직만 화면 파일에 남긴다.

```ts
// Bad: 화면 파일 상단에 순수 헬퍼 누적
const getMediaColumnRules = () => {/* ... */};
const buildFileRequests = () => {/* ... */};
const normalizeUploadEvent = () => {/* ... */};
```

```tsx
// Good: 화면 흐름 선언만 유지
const [mediaUploadFileListByColumn, setMediaUploadFileListByColumn] = useState({});
const responseContentManagerGetTableInfo = useContentManagerGetTableInfo(/* ... */);
const handleFormFinish = () => {/* ... */};
useEffect(() => {/* ... */}, []);
```

## 6. 이벤트 핸들러 규칙
- 네이밍은 `handle + Target + Event` 패턴을 사용한다.
- 추가 인자가 필요한 경우 고차 함수 패턴을 사용한다.

```ts
import type { MouseEventHandler } from "react";

const handleSelect = (id: string): MouseEventHandler<HTMLLIElement> => (_e) => {
	console.log(id);
};
```

- 핸들러가 길어져도 무조건 유틸로 분리하지 않는다.
- 우선 원칙은 “가독성”이며, early return/단계적 변수/의미 있는 블록 구분으로 읽기 쉽게 유지한다.
- 유틸 분리 판단은 `5.7 유틸 함수 분리 기준 (엄격)`을 따른다.
- `5.7` 기준을 충족하지 못한 화면 전용 분기/내비게이션 동기화 로직은 별도 보조 함수로 추출하지 않고 각 핸들러 내부에 인라인으로 작성한다.
- 동일 파일 내 여러 핸들러에서 유사한 분기가 발생해도, 유틸 추출 기준을 만족하지 않으면 중복을 허용한다.

```ts
// Bad: 기준 미충족 로직을 화면 보조 함수로 추출
const syncSelectedNodeSearch = (nodeContext: NodeContext | undefined) => {
	// ...
};
```

```ts
// Good: 핸들러 내부에서 흐름을 직접 기술
const handleTreeSelect = () => {
	if (!selectedNodeContext) {
		void navigate({to: "/project/content-manager/folders", search: {folder: undefined, table: undefined}});
		return;
	}
};
```

```ts
// 권장: early return과 단계적 처리로 본문 가독성 유지
const handleSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
	if (!responseContentTypeGetListSuspense.data.selectedTable) {
		return;
	}

	if (mutationContentTypeUpsert.isPending) {
		return;
	}

	const request = {
		projectId: toNumber(params.pid),
		tableName: responseContentTypeGetListSuspense.data.selectedTable.tableName,
	};

	await mutationContentTypeUpsert.mutateAsync({data: request});
	void navigate({to: "/{$pname}/{$pid}/content-type-builder", params: {pname: params.pname, pid: params.pid}});
};
```

```ts
// 비권장: 재사용 근거 없이 지나치게 잘게 분해
const validate = () => {/* ... */};
const buildRequest = () => {/* ... */};
const runMutation = async () => {/* ... */};
const postProcess = () => {/* ... */};

const handleSubmitButtonClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
	if (!validate()) {
		return;
	}
	const request = buildRequest();
	await runMutation(request);
	postProcess();
};
```

### 6.1 Bad/Good: 핸들러 바인딩

```tsx
// Bad: 분기/비동기/부수효과가 포함된 JSX 인라인 핸들러
<UiButton
	onClick={async () => {
		if (!selectedTable) {
			return;
		}
		await mutationContentTypeRemove.mutateAsync({params: {projectId}});
		void navigate({to: "/next"});
	}}
/>
```

```tsx
// Good: 명명된 핸들러 참조
<UiButton onClick={handleRemoveTableButtonClick} />
```

## 7. 상태 및 데이터 패칭 규칙

### 7.1 상태 도구 선택
- 로컬 UI 상태: `useState`, `useReducer`
- 전역 클라이언트 상태: `Zustand`
- 서버 상태: `@tanstack/react-query`

### 7.2 공용 역할/권한 상태 규칙
#### 7.2.1 공용 판별 결과 저장 위치
- 역할/권한처럼 전역적으로 공유되는 판별 결과는 스토어에 저장한다.
- 문자열 정규화/키워드 매칭 같은 판별 로직을 유틸로 반복 호출하지 않는다.
- 서버 응답 수신 시점(`onSuccess`)에 판별 결과를 한 번 계산해 스토어에 적재한다.
- Suspense 훅처럼 `onSuccess` 옵션이 없는 경우 `useLayoutEffect` 또는 `useEffect`로 동기화하며 `@summary` 주석을 작성한다.
- 스토어는 `use-*-store.ts` 형태로 만들고, 화면에서는 스토어 상태만 참조한다.

#### 7.2.2 스토어 접근 패턴
- 스토어 참조는 구조분해하지 않고 `const roleStore = useRoleStore()` 형태로 오리진을 유지한다.
- Zustand 스토어도 selector를 여러 번 나눠 호출하지 않고 `const themeStore = useThemeStore()`처럼 한 번 참조한 뒤 `themeStore.mode`, `themeStore.setTheme()` 형태로 체이닝한다.
- 예외적으로 selector 최적화가 꼭 필요하면 근거를 코드 인접 한글 주석으로 남긴다.

```ts
// Bad: 유틸 호출로 화면마다 반복 계산
const isSuperAdmin = isSuperAdminRoleName(roleName);
```

```ts
// Bad: 스토어 구조분해로 오리진 손실
const { isSuperAdmin } = useRoleStore();
```

```ts
// Good: 공용 역할은 스토어에 적재 후 오리진 유지
const roleStore = useRoleStore();
const isSuperAdmin = roleStore.isSuperAdmin;
```

```ts
// Bad: selector 호출을 여러 줄로 분산
const mode = useThemeStore((state) => state.mode);
const setTheme = useThemeStore((state) => state.setTheme);
```

```ts
// Good: 스토어 원본을 한 번 참조 후 체이닝
const themeStore = useThemeStore();
themeStore.setTheme(themeStore.mode === "light" ? "dark" : "light");
```

### 7.3 React Query 데이터 가공
- 패칭 데이터 변형은 렌더링 본문이 아니라 `query.select`에서 처리한다.
- 이렇게 하면 가공 책임이 한 곳에 모이고 재사용 및 테스트가 쉬워진다.
- `select` 결과는 `data.list`처럼 범용적인 이름을 노출하지 않고, 도메인 의미가 드러나는 이름으로 재명명한다.
- 필요한 만큼만 최소 가공한다. 단순 매핑/필터/결합을 `useMemo`로 감싸지 않는다.
- 여러 쿼리 데이터를 결합해야 한다면 가능하면 `select` 또는 전용 훅에서 합성하고, 부득이한 경우 렌더링 직전의 작은 스코프에서만 계산한다.

```ts
const responseContentTypeGetListSuspense = useContentTypeGetListSuspense(
	{ projectId, includePrivateFields: true, includeSystemColumns: false },
	{
		query: {
			select: (data) => {
				const tables = data.data.list;
				const selectedTable = tables[0];
				return { tables, selectedTable };
			},
		},
	},
);
```

```ts
/**
 * @description API 엔드포인트 목록 조회 API
 */
const responsePermissionGroupGetApiEndpointListSuspense = usePermissionGroupGetApiEndpointListSuspense({
	query: {
		select: ({ data }) => ({
			endpoints: data.list,
		}),
	},
});
```

```ts
// 금지: select 없이 data.list 직접 사용
const endpoints = responsePermissionGroupGetApiEndpointListSuspense.data.list;
```

### 7.4 응답/스토어 오리진 보존
- 핵심 원칙은 넓은 스코프에서 오리진을 잃지 않는 것이다.
- 화면/페이지/레이아웃 단위 스코프에서는 구조분해와 별칭 상수를 금지한다.
- 페이지/레이아웃 단위 스코프에서는 패칭 응답과 스토어 값을 구조분해하지 않고 원본 객체 체이닝을 우선한다.
- 이렇게 해야 변수 이름이 바뀌어도 원본(`response...`, `mutation...`, `*Store`)을 즉시 추적할 수 있다.
- `props` 구조분해는 `5.3 Props 처리`의 예외 규칙으로 본다.
- 허용 스코프는 함수 내부의 매우 짧은 클로즈 스코프뿐이다.
- 핸들러/이펙트 내부라도 함수 상단 전체에 퍼지는 구조분해/별칭은 지양하고, 실제 사용하는 바로 근처 블록에서만 허용한다.

```ts
// 금지: 넓은 스코프에서 오리진 손실
const { tables, selectedTable } = responseContentTypeGetListSuspense.data;
```

```tsx
// 권장: 오리진 체이닝으로 추적 가능성 유지
<UiList dataSource={responseContentTypeGetListSuspense.data.tables} />
<UiTable dataSource={responseContentTypeGetListSuspense.data.selectedTable.columns} />
```

```ts
// 허용: 좁은 스코프(useEffect 내부)에서의 제한적 구조분해
useEffect(() => {
	const { data, isFetching } = responseContentManagerSearchContentsSuspense;
	if (!isFetching && data.contents.length === 0) {
		// ...
	}
}, [responseContentManagerSearchContentsSuspense]);
```

### 7.5 Bad/Good: 오리진 추적

```tsx
// Bad: 넓은 스코프 구조분해로 출처 흐림
const { contents } = responseContentManagerSearchContentsSuspense.data;
return <UiTable dataSource={contents} />;
```

```tsx
// Good: 체이닝으로 출처 유지
return <UiTable dataSource={responseContentManagerSearchContentsSuspense.data.contents} />;
```

### 7.5.1 JSX 표시값 지역 스코프
- 원칙적으로 JSX에서만 사용하는 표시용 값은 컴포넌트 상단 `const`로 파생 선언하지 않는다.
- JSX 라인에서 오리진 체이닝(`response...`, `selected...Context`)으로 직접 참조한다.
- 이벤트 핸들러/복잡 계산 블록 내부의 지역 변수는 예외적으로 허용한다.
- 오리진 체이닝이 길더라도 화면 상단 별칭으로 끊지 않는다.
- `const -> JSX -> const -> JSX` 이동 비용을 줄이기 위해, 기본 원칙은 JSX에서 원본 출처를 직접 따라가는 것이다.
- 화면 단위 상단 별칭은 금지하고, 정말 필요한 지역 변수도 JSX/블록 바로 근처의 작은 스코프에서만 허용한다.

```tsx
// 금지: JSX 표시값을 상단 파생 변수로 선언
const selectedNode = selectedNodeContext?.node;
const selectedNodeName = selectedNode?.name;
return <UiInput value={selectedNodeName} />;
```

```tsx
// 권장: JSX 라인에서 오리진 체이닝을 직접 사용
return <UiInput value={selectedNodeContext?.node?.name} />;
```

### 7.6 React Compiler 메모이징 규칙
- `useMemo`, `useCallback`은 React 19 컴파일러가 자동 처리하므로 기본적으로 사용하지 않는다.
- 반드시 필요한 경우에만 사용하고, 바로 위에 한글 주석으로 이유를 명시한다.
- 허용 예시: 외부 라이브러리가 referential equality에 민감한 경우, 비용이 큰 계산이 실제로 병목임이 확인된 경우.

```ts
// 금지: 단순 가공을 위한 useMemo
const columns = useMemo(() => buildColumns(response.data.columns), [response.data.columns]);
```

```ts
// 권장: 불가피한 경우에만 주석으로 의도 설명
// 테이블 라이브러리가 columns 참조 동일성을 요구하여 리렌더 폭증을 방지한다.
const columns = useMemo(() => buildColumns(response.data.columns), [response.data.columns]);
```

### 7.7 옵셔널 값/폴백 처리 규칙
- 옵셔널 값에 대해 `??`, `||`로 기본값을 넣는 폴백 처리를 기본 금지한다.
- 값이 없을 수 있음을 명확히 드러내고, 필요한 경우 `Activity` 또는 전용 빈 상태 컴포넌트로 표시한다.
- `let name = ""; if (data) name = data;` 같은 명령형 폴백 패턴도 동일하게 금지한다.
- 예외적으로 폴백이 꼭 필요하면 아래 조건을 모두 만족해야 한다.
	- 도메인/요구사항상 기본값이 명확하다.
	- 코드 바로 위에 한글 주석으로 이유를 남긴다.
	- `??`, `||`, `?:` 중 가장 직접적인 표현 하나만 사용한다.


```ts
// 금지: 명령형 재대입으로 결측값 은닉
let parentFolderName = "";
if (selectedNodeContext?.parentNode) {
	parentFolderName = selectedNodeContext.parentNode.name;
}
```

```ts
// 허용: 도메인 기본값이 명확하고 이유를 주석으로 남긴 경우
// breadcrumb 요구사항상 최상위 폴더는 빈 문자열로 표현한다.
const parentFolderName = selectedNodeContext?.parentNode?.name ?? "";
```

```ts
// 금지: 결측값을 숨기는 폴백
const name = responseUserGetItemSuspense.data?.name ?? "";
const items = responseUserGetItemSuspense.data?.items ?? [];
```

```tsx
// 권장: 결측값을 드러내고 렌더링 분기를 Activity로 처리
const name = responseUserGetItemSuspense.data?.name;

return (
	<Activity mode={name ? "visible" : "hidden"}>
		<UserName value={name} />
	</Activity>
);
```

### 7.8 로딩/펜딩 렌더링 규칙
- `isPending`, `isFetching` 같은 상태를 UI에서 직접 렌더링하지 않는다.
- 반드시 필요할 때만 사용하고, 바로 위에 한글 주석으로 이유를 명시한다.
- 로딩 상태는 기본적으로 Suspense 경계나 상위 레이아웃에서 처리한다.

```tsx
// 금지: isPending 상태를 즉시 렌더링
if (responseUserGetItemSuspense.isPending) {
	return <Spinner />;
}
```

```tsx
// 권장: 불가피한 경우 의도 주석 명시
// 검색 UX 요구로 인해 입력 직후에만 스피너를 노출한다.
if (responseUserSearchSuspense.isPending) {
	return <SearchSpinner />;
}
```

## 8. 주석 및 useEffect 규칙

### 8.1 주석 원칙
- 주석은 한글로 작성한다.
- 본 문서에서 지정한 대상에는 주석을 필수로 작성한다.
- 설명형 문장보다 목적/제약/부작용 중심으로 간결하게 작성한다.
- 코드만으로 자명한 내용은 주석을 생략한다.
- `@summary`, `@description` 문장은 명사형 종결/개조식 표현을 기본으로 한다.
- `~합니다`, `~해준다`, `~이다` 등 서술형 문장 종결을 금지한다.
- 코드 동작 설명(How)보다 도입 이유(Why), 예외 방지 의도, 주의사항 중심 서술을 우선한다.
- JSDoc 블록 주석(`/** ... */`)은 함수 선언, API/훅 변수 선언, 커스텀 `type`/`interface` 선언 헤더에 사용한다.
- 함수 내부 주석, 타입/변수 보조 설명은 `//` 라인 주석을 사용한다.
- API 선언은 `@description` 단일 사용, API 이외 선언은 `@summary` 단일 사용을 기본으로 한다.

### 8.2 선언 헤더 JSDoc 필수 지점
- 아래 항목은 예외 없이 주석을 작성한다.
- API 호출 훅/뮤테이션 선언
- 이벤트 핸들러 선언(단순 전달 포함)
- `useEffect` 선언
- 화면 파일/유틸 파일의 주요 함수 선언(공개 함수, 재사용 함수, 도메인 규칙 함수)
- `useMemo`, `useCallback` 사용 시
- 커스텀 `type`, `interface` 선언
- 상태 변수/단순 파생값은 JSDoc 필수 대상이 아니다.
- `isPending` 등 로딩 상태 렌더링은 JSDoc 대상이 아니라 코드 바로 위 `//` 주석 대상으로 본다.

### 8.3 API 주석 규칙 (`@description`)
- API 관련 변수(`response...`, `mutation...`) 선언 바로 위에 주석을 작성한다.
- `@description`은 API 기능을 한국어로 설명한다.
- API 주석에서는 `@summary`를 사용하지 않는다.

```ts
/**
 * @description 테이블 목록 조회 API
 */
const responseContentTypeGetListSuspense = useContentTypeGetListSuspense();
```

```ts
/**
 * @description 테이블 삭제 API
 */
const mutationContentTypeRemove = useContentTypeRemove();
```

### 8.4 비-API 함수 주석 규칙 (`@summary`)
#### 8.4.1 이벤트 핸들러
- 핸들러 선언 바로 위에 `@summary` 주석을 작성한다.
- “무엇을 클릭했는지”보다 “무엇을 수행하는지”를 기준으로 작성한다.

#### 8.4.2 `useEffect`, 일반 유틸 함수
- `useEffect`, 일반 유틸 함수, 이벤트 핸들러 등 API 이외 함수 선언은 동일하게 `@summary` 단일 사용을 적용한다.
- 매개변수가 많은 함수는 개별 매개변수 나열보다 객체 매개변수 타입 선언을 우선한다.
- 객체 매개변수 필드는 타입/인터페이스 JSDoc의 `@property`로 설명한다.

```ts
/**
 * @summary 테이블 선택 쿼리스트링 갱신
 */
const handleSelectTable: MouseEventHandler<HTMLButtonElement> = (_e) => {
	// ...
};
```

```ts
/**
 * @summary 사용자 데이터 변경 시 폼 상태 동기화
 */
useEffect(() => {
	// 폼 초기값 반영
	resetForm(userData);
}, [userData, resetForm]);
```

### 8.5 함수 내부 주석 규칙 (`//`)

- 함수 본문 내부에서는 JSDoc 블록 주석을 사용하지 않는다.
- 아래 조건 중 1개 이상일 때만 `//` 주석을 작성한다.
	- 도메인 규칙/정합성 제약 설명이 없으면 오해 가능
	- 예외 케이스 방어(순환 참조, 타입 편차, 데이터 유실 방지) 의도 노출 필요
	- 라이브러리 동작 제약/우회 로직 설명 필요
	- 부수효과 순서(상태 반영, 네비게이션, 캐시 갱신) 의존성 설명 필요
- 아래 항목은 `//` 주석을 생략한다.
	- 변수명 그대로 반복하는 설명
	- 단순 상태 선언(`useState`)·단순 파생값 대입
	- 한 줄 매핑/필터/직접적인 값 전달
- 긴 시그니처 포맷 예외가 필요할 때만 함수 헤더 JSDoc에 `* biome-ignore format: ...`를 추가한다.

```ts
/**
 * @summary 트리 노드 UiTree 데이터 변환
 * biome-ignore format: 매개변수 가독성 목적 시그니처 한 줄 유지
 */
export const mapFolderNodeToTreeData = (node: ContentFolderTreeNode, renderers: FolderTreeRenderers) => {
	// 렌더링 결정을 화면 레이어 콜백으로 위임
	return {
		title: renderers.renderTitle(node),
		icon: renderers.renderIcon(node),
	};
};
```

```ts
/**
 * @summary MEDIA 업로드 파일 한 건 갱신 파라미터
 * @property uploadFileListByColumn 컬럼별 업로드 파일 목록
 * @property columnName 대상 컬럼명
 * @property fileUid 대상 파일 UID
 * @property updater 대상 파일 갱신 함수
 */
interface UpdateEntryMediaUploadFileByUidParams<T extends EntryMediaUploadFileWithUid> {
	uploadFileListByColumn: Record<string, T[]>;
	columnName: string;
	fileUid: string;
	updater: (uploadFile: T) => T;
}

/**
 * @summary MEDIA 업로드 파일 한 건 상태 갱신
 */
export const updateEntryMediaUploadFileByUid = <T extends EntryMediaUploadFileWithUid>(
	params: UpdateEntryMediaUploadFileByUidParams<T>,
): Record<string, T[]> => {
	const {uploadFileListByColumn, columnName, fileUid, updater} = params;

	return updateEntryMediaUploadFileListByColumn(uploadFileListByColumn, columnName, (uploadFileList) => {
		return uploadFileList.map((uploadFile) => {
			if (uploadFile.uid !== fileUid) {
				return uploadFile;
			}

			return updater(uploadFile);
		});
	});
};
```

```ts
// Bad: 변수명 반복
const selectedKey = selectedKeys[0];
```

```ts
// Good: 도메인 규칙 노출이 필요한 경우만 작성
// TABLE 단건 ON 시 해당 TABLE의 상위 FOLDER만 ON으로 복구하고 형제 TABLE 상태는 유지
const updatedNodes = updateNodeDisplayed(nodes, targetId, true);
```

### 8.6 Bad/Good: 주석 규칙

```ts
// Bad: 서술형 문장 + How 중심
/**
 * @summary 특정 노드 하위에 대상 id가 존재하는지 검사합니다.
 */
```

```ts
// Good: 명사형 종결 + Why 중심
/**
 * @summary 순환 참조(Circular Drop) 방지용 하위 노드 포함 여부 검사
 */
```

```ts
// Bad: API 주석에 @summary를 혼용
/**
 * @description 테이블 목록 조회 API
 * @summary v1 테이블 목록 조회
 */
const responseContentTypeGetListSuspense = useContentTypeGetListSuspense();
```

```ts
// Good: API는 @description 단일 사용
/**
 * @description 테이블 목록 조회 API
 */
const responseContentTypeGetListSuspense = useContentTypeGetListSuspense();
```

## 9. 금지 패턴
- barrel export(`index.ts`) 생성
- UMD 글로벌 타입 참조(`React.*`)
- 분기/비동기/여러 부수효과가 있는 JSX 인라인 핸들러
- 타입 없는 이벤트 핸들러 선언
- 서버 데이터 후처리를 렌더링 본문에서 반복 수행
- 출처 추적이 어려운 넓은 스코프 구조분해
- JSX 전용 파생 표시값의 상단 `const` 선언
- 안정된 계약 없이 반복 코드만 보고 성급하게 공용화
- JSX 렌더링 노드 선택을 위한 조건부 렌더링의 `?:` 사용
- 옵셔널 값 폴백 처리(`??`, `||`)
- 사유 없는 `useMemo`, `useCallback`
- `useMemo`로 데이터 가공/결합을 우회
- `isPending` 등 로딩 상태 렌더링(주석 없는 경우)
- `select` 없이 `data.list` 같은 원시 응답 구조를 직접 사용
- API 타입이 있는데 동일/유사 구조의 별도 타입 재선언
- `invalidateQueries` 모음을 별도 유틸로 모듈화
- 공용 역할/권한 판별 로직을 유틸로 반복 호출
- 공용 상수를 라우트/`-local`/컴포넌트 파일에 분산 선언

## 10. 권장 예시

```tsx
import type { MouseEventHandler } from "react";

interface ContentActionsProps {
	onAdd: MouseEventHandler<HTMLButtonElement>;
}

const ContentActions = (props: ContentActionsProps) => {
	const { onAdd } = props;

	return <button onClick={onAdd}>콘텐츠 추가</button>;
};
```

```ts
/**
 * @description 관리자 상세 조회 API
 */
const responseAdminGetItemSuspense = useAdminGetItemSuspense({mid});

/**
 * @summary 멤버 목록 이동
 */
const handleNavigateMembers: MouseEventHandler<HTMLButtonElement> = (_e) => {
	void navigate({to: "/dashboard/members"});
};
```
