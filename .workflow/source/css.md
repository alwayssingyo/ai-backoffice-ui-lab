# CSS 가이드라인

## 목차
1. 문서 목적
2. 핵심 원칙
3. 네이밍 규칙
    1. 기본 문법
    2. 구분자 의미
    3. 세그먼트 작명 원칙
    4. slug 작명 원칙
    5. 클래스 네임스페이스 고유성(필수)
    6. Bad/Good: 네이밍
    7. `-local` 스타일 스코프 규칙
4. 클래스 사용 규칙
    1. TSX에서의 클래스 조합
    2. 단일 책임 클래스
    3. Bad/Good: 클래스 조합
    4. 조립식 element 클래스 금지
    5. Ui 컴포넌트 className 사용 금지
    6. Ui 래퍼 Props 타입 우선 사용
5. CSS 작성 규칙
    1. 플랫 구조
    2. 자기 자신 DOM 상태 nested 허용
    3. 미노출 클래스(라이브러리 내부 DOM) 타겟팅 예외
    4. Bad/Good: 선택자 범위
    5. 값 관리 원칙
    6. CSS 변수 폴백 값 필수 적용
    7. 레이아웃 원칙
    8. 상태/인터랙션 원칙
    9. Bad/Good: 상태 스타일
6. 파일 구성 및 주석 규칙
7. 금지 패턴
    1. Bad/Good: 구조 깊이
8. 권장 예시

## 1. 문서 목적
이 문서는 프로젝트의 모든 CSS 작성 방식을 단일 규격으로 정의한다.
스타일은 개인 취향이 아니라 팀 표준으로 관리하며, 예외는 팀 합의가 있을 때만 허용한다.

## 2. 핵심 원칙
- 명확성: 클래스 이름만 읽어도 소속과 역할을 추적할 수 있어야 한다.
- 일관성: 동일한 목적의 스타일은 항상 동일한 네이밍/구조로 작성한다.
- 예측 가능성: 선택자 의존도를 낮추고 플랫 구조를 유지해 변경 영향 범위를 좁힌다.
- 재사용성: 시각 값은 토큰/변수로 관리하고 하드코딩을 최소화한다.

## 3. 네이밍 규칙

### 3.1 기본 문법
```txt
<scope>_<slug>__<element>[--<modifier>]
```

- `scope`: `rt` | `ui` | `wg` | `loc` (필수)
- `slug`: 파일명 또는 도메인 의미 기반 축약 (필수, 2~6자 권장)
- `element`: UI 역할을 나타내는 이름 (필수, camelCase)
- `modifier`: 상태/변형 이름 (선택, camelCase)

### 3.2 구분자 의미
- `_`: `scope`와 `slug`를 구분한다.
- `__`: `slug`와 `element`를 구분한다.
- `--`: `element`와 `modifier`를 구분한다.

### 3.3 세그먼트 작명 원칙
- `element`, `modifier`는 camelCase로 작성한다.
- 이름은 구조가 아닌 역할을 표현한다.
- `container`, `wrapper`, `box` 같은 포괄 단어 단독 사용을 금지한다.
- 숫자/치수 기반 의미를 이름에 넣지 않는다.
	- 금지: `ui_card__body--gap12`

### 3.4 slug 작명 원칙
- slug는 길이보다 추적 가능성을 우선한다.
- 라우트 slug는 라우트 트리 계층 순서를 반영해 축약한다.
- 라우트 slug는 과도하게 길면 축약하되, 도메인 의미가 보존되어야 한다.
- 라우트 slug는 상위 -> 하위 세그먼트 순서를 유지해 읽을 수 있어야 한다.
- index/layout 같은 라우트 역할이 포함되면 suffix를 일관되게 포함한다.
- 예시
	- `project.content-type-builder` -> `rt_pctb`
	- `project.content-type-builder.index` -> `rt_pctbi`

### 3.5 클래스 네임스페이스 고유성(필수)
- 클래스명은 프로젝트 전역에서 고유해야 한다.
- 동일한 `scope_slug` 조합은 단일 소유자(특정 라우트/특정 UI 컴포넌트)만 사용할 수 있다.
- 이미 사용 중인 `scope_slug`를 다른 라우트/컴포넌트에서 재사용하는 것을 금지한다.
	- 예: `rt_pctbi`를 한 라우트에서 사용 중이면 다른 라우트는 `rt_pctbi`를 사용할 수 없다.
- 새 스타일을 추가할 때는 기존 `scope_slug` 충돌 여부를 먼저 확인한다.
- 의미가 겹치더라도 파일이 다르면 별도 slug를 부여한다.

### 3.6 Bad/Good: 네이밍

```txt
Bad
ui_button_container
rt_pctbi_item_active
rt_pctbi__header  // 이미 다른 라우트에서 rt_pctbi 사용 중인데 재사용
```

```txt
Good
ui_button__root
rt_pctbi__item--active
rt_mgri__header  // members-group-role.index 전용 slug
```

### 3.7 `-local` 스타일 스코프 규칙
- `-local` 폴더 컴포넌트의 스타일은 반드시 같은 `-local` 계층의 전용 `*.css` 파일에 작성한다.
	- 예시: `-local/modal-entry-column-form.tsx` -> `-local/modal-entry-column-form.css`
- `-local` 스타일 클래스는 `loc_` 스코프를 사용한다.
	- 예시: `loc_mecf__root`
- 라우트 공용 스타일 파일(예: `entries.css`)에 `-local` 컴포넌트 전용 스타일을 선언하는 것을 금지한다.
- 반대로 `-local` CSS 파일에 라우트 전용 `rt_*` 스타일을 선언하는 것도 금지한다.

## 4. 클래스 사용 규칙

### 4.1 TSX에서의 클래스 조합
- 클래스 조합은 `clsx()` 사용을 기본으로 한다.
- modifier는 독립 클래스로 선언하고 기본 element 클래스와 함께 적용한다.

```tsx
<button
	className={clsx(
		"rt_pctbi__listButton",
		isActive && "rt_pctbi__listButton--active",
	)}
>
	저장
</button>
```

### 4.2 단일 책임 클래스
- 하나의 클래스는 하나의 시각적 책임만 가진다.
- 상태/변형이 필요하면 modifier를 추가하고 기본 클래스를 오염시키지 않는다.

### 4.3 Bad/Good: 클래스 조합

```tsx
// Bad: 상태를 별도 element처럼 분리
<div className={clsx("rt_pctbi__listButtonActive")}/>
```

```tsx
// Good: 기본 클래스 + modifier 조합
<div className={clsx("rt_pctbi__listButton", isActive && "rt_pctbi__listButton--active")}/>
```

### 4.4 조립식 element 클래스 금지
- 한 DOM 노드는 기본적으로 `scope_slug__element` 클래스 1개만 사용한다.
- 상태 표현이 필요한 경우에만 `element + modifier` 조합을 예외적으로 허용한다.
- `modifier(--*)`는 `active`, `hidden`, `disabled`, `selected`, `error` 같은 상태값에만 사용한다.
- 레이아웃/간격/구조 차이(예: `compactTop`, `leftPanel`)를 modifier로 표현하는 것을 금지한다.
- 레이아웃/간격/구조 차이는 별도 element 이름(`section`, `detailSection`)으로 분리한다.

```tsx
// Bad: 구조 차이를 modifier로 조립
<div className={clsx("rt_pcmei__section", "rt_pcmei__section--compactTop")} />
```

```tsx
// Good: 구조 차이는 별도 element로 분리
<div className={clsx("rt_pcmei__detailSection")} />
```

```tsx
// Good: 상태일 때만 modifier 사용
<button className={clsx("rt_pcmei__saveButton", isActive && "rt_pcmei__saveButton--active")} />
```

### 4.5 Ui 컴포넌트 className 사용 금지
- `Ui*` 컴포넌트(`UiCollapse`, `UiAvatar`, `UiButton` 등)에 직접 `className`을 주입하지 않는다.
- 스타일링이 필요하면 화면/로컬 래퍼 클래스를 두고, 내부 서드파티 라이브러리 클래스(예: `.ant-*`, `.rc-*`, `.tippy-*`)를 제한적으로 타겟팅한다.

```tsx
// Bad: Ui 컴포넌트에 직접 className 부여
<UiCollapse className={clsx("rt_srol__collapse")} />
```

```tsx
// Good: 래퍼 클래스를 기준으로 스타일링
<div className={clsx("rt_srol__collapse")}>
	<UiCollapse />
</div>
```

```css
/* Good: 래퍼 루트 하위에서만 라이브러리 클래스 타겟팅 */
.rt_srol__collapse {
	& .ant-collapse-item {
		border-radius: var(--cms-border-radius, 10px);
	}
}
```

### 4.6 Ui 래퍼 Props 타입 우선 사용
- `Ui*` 래퍼 컴포넌트를 사용할 때는 라이브러리 원본 타입(`AntDesign*Props`)이 아니라 래퍼 타입(`Ui*Props`)을 우선 사용한다.
- 래퍼가 의도적으로 제한/보강한 Props 계약을 보존하기 위해, 사용처에서 원본 라이브러리 타입 직접 참조를 금지한다.

```tsx
// Bad: 라이브러리 원본 Props 타입 직접 참조
import UiCollapse, {type AntDesignCollapseProps} from "@/components/ui/collapse/ui-collapse.tsx";
const items: NonNullable<AntDesignCollapseProps["items"]> = [];
```

```tsx
// Good: Ui 래퍼 Props 타입 사용
import UiCollapse, {type UiCollapseProps} from "@/components/ui/collapse/ui-collapse.tsx";
const items: NonNullable<UiCollapseProps["items"]> = [];
```

## 5. CSS 작성 규칙

### 5.1 플랫 구조
- 기본 선택자는 플랫 구조로 작성한다.
- 플랫 선택자 깊이는 1뎁스로 제한한다.
	- 1뎁스 예시: `.rt_xxx__root`
- 2뎁스 이상이 필요한 경우에는 5.2 미노출 클래스 예외 규칙을 적용한다.
- 전처리기 중첩 문법(Sass nesting 등)은 금지하되, 미노출 DOM 타겟팅과 자기 자신 DOM 상태 표현을 위한 제한적 nested만 허용한다.

```css
.rt_pctbi__layout {
	display: grid;
}

.rt_pctbi__panel {
	border: 1px solid var(--cms-color-border, #d9d9d9);
}
```

### 5.1.1 자기 자신 DOM 상태 nested 허용
- `:hover`, `:focus`, `:focus-visible`, `:disabled`, `:checked`처럼 브라우저/DOM이 직접 부여하는 상태는 pseudo-class로 표현한다.
- 이런 상태는 modifier가 아니라 같은 클래스 블록 내부 nested(`&:...`)로 작성할 수 있다.
- 허용 범위는 “현재 클래스 자기 자신”의 상태 표현만이다.
- 다른 element를 함께 타는 nested, 후손 선택자 nested는 여기에 포함되지 않는다.
- `--active`, `--selected`, `--error`처럼 화면 상태/도메인 상태는 기존처럼 modifier를 사용한다.

```css
/* Good: 자기 자신 DOM 상태는 nested 허용 */
.rt_pmli__assetCardButton {
	cursor: default;

	&:disabled {
		opacity: 1;
	}

	&:hover:not(:disabled) {
		cursor: pointer;
	}
}
```

```css
/* Bad: DOM 상태가 아닌 화면 상태를 pseudo-class처럼 표현 */
.rt_pmli__assetCard {
	&:selected {
		border-color: var(--cms-color-primary, #1677ff);
	}
}
```

```css
/* Good: 화면 상태는 modifier 사용 */
.rt_pmli__assetCard--selected {
	border-color: var(--cms-color-primary, #1677ff);
}
```

### 5.2 미노출 클래스(라이브러리 내부 DOM) 타겟팅 예외
- 미노출 클래스는 TSX/HTML의 `className`으로 직접 제어하지 못하는 서드파티 라이브러리 내부 클래스(예: `.ant-*`, `.rc-*`, `.tippy-*`)를 의미한다.
- 루트는 반드시 프로젝트 클래스(`scope_slug__element`)여야 한다.
- 미노출 클래스 타겟팅은 루트 블록 내부 nested로 작성한다.
- 용어 정의
	- 체이닝 뎁스: `.a`=1, `.a .b`=2, `.a .b .c`=3
	- 루트 프로젝트 클래스(`.rt_xxx__root`)는 체이닝 뎁스 계산에서 제외한다.
	- 중첩 블록 뎁스: 루트 블록=1, 루트 내부 `& ... {}` 블록=2
- 루트 블록은 항상 1개여야 하며, 내부 중첩 블록은 최대 2뎁스까지만 허용한다.
	- 허용: `.rt_xxx__root { & .ant-a { ... } }`
	- 허용: `.rt_xxx__root { & .ant-a .ant-b { ... } }`
	- 허용: `.rt_xxx__root { & .ant-a .ant-b .ant-c { ... } }`
	- 금지(중첩 안의 중첩): `.rt_xxx__root { & .ant-a { & .ant-b { ... } } }`
	- 금지(플랫 체이닝): `.rt_xxx__root .ant-a { ... }`
- 체이닝 뎁스 2 이상이 필요하면 같은 줄 체이닝(`.ant-a .ant-b .ant-c`)으로만 확장한다.
- 위 예외는 미노출 클래스 타겟팅일 때만 허용한다.
- 체이닝된 내부 선택자는 모두 미노출 클래스여야 한다.
- 직계 자식 관계가 명확하면 `>` 사용을 권장한다. 단, 필수 규칙은 아니다.

```css
.rt_pctb__lnbTop {
	& .ant-btn-icon {
		color: var(--cms-color-text-tertiary, rgba(0, 0, 0, 0.45));
	}
}
```

### 5.2.1 Bad/Good: 선택자 범위

```css
/* Bad: 루트 없는 단독 타겟팅 */
.ant-tree-node-content-wrapper {
	border-radius: 4px;
}
```

```css
/* Bad: 플랫 체이닝으로 2뎁스 작성 */
.rt_pcmei__treeBox .ant-tree-node-content-wrapper {
	border-radius: 4px;
}
```

```css
/* Good: nested 블록 2 + 선택자 1 */
.rt_pcmei__treeBox {
	& .ant-tree-node-content-wrapper {
		display: inline-flex;
	}
}
```

```css
/* Good: nested 블록 2 + 선택자 2 */
.rt_pcmei__treeBox {
	& .ant-tree-node-content-wrapper .ant-tree-iconEle {
		display: inline-flex;
	}
}
```

```css
/* Good: nested 블록 2 + 선택자 3 이상 체이닝 */
.rt_pcmei__treeBox {
	& .ant-tree-node-content-wrapper .ant-tree-iconEle .ant-tree-title {
		color: #999;
	}
}
```

```css
/* Bad: 2뎁스를 중첩 안의 중첩으로 작성 */
.rt_pcmei__treeBox {
	& .ant-tree-node-content-wrapper {
		& .ant-tree-iconEle {
			display: inline-flex;
		}
	}
}
```

```css
/* Bad: nested 블록 3뎁스 중첩 */
.rt_pcmei__treeBox {
	& .ant-tree-node-content-wrapper {
		& .ant-tree-iconEle {
			& .ant-tree-title {
				color: #999;
			}
		}
	}
}
```

```css
/* Good: 직계 자식도 nested로 표현 */
.rt_pctb__lnbTop {
	& > .ant-btn-icon {
		color: var(--cms-color-text-tertiary, rgba(0, 0, 0, 0.45));
	}
}
```

### 5.3 값 관리 원칙
- 색상/간격/타이포/그림자는 CSS 변수(디자인 토큰) 우선 사용.
- 반복 가능성이 있는 고정값 하드코딩 금지.
- 동일 값이 2회 이상 반복되면 토큰화 여부를 먼저 검토한다.

### 5.3.1 CSS 변수 폴백 값 필수 적용
- CSS 변수(`var(--*)`)를 사용할 때는 반드시 폴백 값을 함께 지정한다.
- 폴백 값은 변수가 정의되지 않았거나 예외 상황에서의 기본값을 보장한다.
- 폴백 값은 디자인 시스템 기본값 또는 브라우저 안전 값을 사용한다.

```css
/* Bad: 폴백 없는 CSS 변수 */
.rt_pcmei__detailPanel {
	border: 1px solid var(--cms-color-border);
	background: var(--cms-color-bg-base);
}
```

```css
/* Good: 폴백 값 포함 */
.rt_pcmei__detailPanel {
	border: 1px solid var(--cms-color-border, #d9d9d9);
	border-radius: var(--cms-border-radius, 4px);
	background-color: var(--cms-color-bg-base, #fff);
}
```

```css
/* Good: nested 블록 내부에서도 폴백 적용 */
.rt_srol__collapse {
	& .ant-collapse-item {
		border-radius: var(--cms-border-radius, 10px);
		background: var(--cms-color-bg-base, #fff);
	}
}
```

### 5.4 레이아웃 원칙
- 레이아웃 의도는 클래스명과 선언에서 즉시 확인 가능해야 한다.
- `position`, `width`, `height` 강제는 최소화하고 부모/자식 책임을 분리한다.
- `sticky`, `fixed` 사용 시 기준 컨테이너와 z-index 의도를 주석으로 남긴다.

### 5.5 상태/인터랙션 원칙
- 화면 상태/도메인 상태는 modifier로 표현한다: `--active`, `--selected`, `--error`.
- 브라우저/DOM 상호작용 상태는 pseudo-class를 사용한다: `:hover`, `:focus-visible`, `:disabled`.
- hover/focus-visible/disabled 상태를 세트로 점검한다.
- 포커스 링 제거를 금지하며, 대체 포커스 스타일을 반드시 제공한다.

### 5.6 Bad/Good: 상태 스타일

```css
/* Bad: 포커스 제거 */
.ui_button__root:focus {
  outline: none;
}
```

```css
/* Good: 접근 가능한 포커스 스타일 제공 */
.ui_button__root:focus-visible {
  outline: 2px solid var(--cms-color-primary, #1677ff);
  outline-offset: 2px;
}
```

## 6. 파일 구성 및 주석 규칙
- 스타일 파일은 하나의 컴포넌트/라우트 책임 범위를 기본 단위로 유지한다.
- 파일이 길어질 경우 섹션 주석으로 블록을 구분한다.
- 선언 순서는 아래 순서를 권장한다.
	1. 레이아웃
	2. 박스 모델
	3. 타이포그래피
	4. 시각 효과
	5. 상태/변형

## 7. 금지 패턴
- 요소 선택자 중심 스타일링 (`div`, `button` 직접 타겟팅)
- 깊은 후손 선택자 체인 (`.a .b .c .d`)  
  단, 5.2 미노출 클래스 타겟팅 예외 규칙은 제외한다.
- 동일 DOM 노드에서 element 클래스 조립식 결합 (`.scope_slug__a + .scope_slug__b`)
- 상태 의미가 아닌 modifier 사용 (`--compactTop`, `--leftPanel`)
- 미노출 클래스 타겟팅을 플랫 체이닝으로 작성 (`.root .third-party-*`)
- 미노출 선택자를 중첩 안의 중첩으로 작성 (`& .third-party-a { & .third-party-b { ... } }`)
- 미노출 클래스 타겟팅 시 nested 블록 3단계 이상 중첩
- `!important` 남용
- 문맥이 없는 축약어
- 라이브러리 클래스 단독 타겟팅

### 7.1 Bad/Good: 구조 깊이

```css
/* Bad: 깊은 후손 선택자 의존 */
.rt_pctbi__layout .rt_pctbi__panel .rt_pctbi__detail .rt_pctbi__item {
	padding: 8px;
}
```

```css
/* Good: 플랫 클래스 단위 */
.rt_pctbi__item {
  padding: 8px;
}
```

## 8. 권장 예시

```tsx
<div className={clsx("ui_table__container")}>
	<div className={clsx("ui_table__toolbar")}>...</div>
	<div className={clsx("ui_table__body")}>...</div>
</div>
```

```css
.ui_table__container {
	display: grid;
	gap: 12px;
}

.ui_table__toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.ui_table__row {
	display: grid;
	grid-template-columns: 1fr auto;
}

.ui_table__row--selected {
	background: var(--cms-color-fill-secondary, #f5f5f5);
}
```
