# Test 가이드라인

## 목차

1. 문서 목적
2. 핵심 원칙
3. 기본 전략
   1. Playwright 단일 도구 원칙
   2. 이 프로젝트의 기본 테스트 레벨
   3. `vi` / Vitest 위치
4. Integration / E2E 경계
   1. Integration
   2. E2E
   3. 분류 질문
5. 파일 및 네이밍 규칙
   1. spec 배치
   2. 파일명 규칙
   3. 공용 코드 배치
6. 테스트 작성 기본 규칙
   1. 테스트 제목
   2. 한 테스트의 책임
   3. `beforeEach` / 공용 setup
   4. 데이터 고립과 정리
   5. 신규 테스트 작성 순서
   6. 주석 규칙
7. Integration 작성 규칙
   1. 다루는 범위
   2. mocking 규칙
   3. 상태 검증 규칙
   4. 대기 규칙
8. E2E 작성 규칙
   1. 다루는 범위
   2. 실제 백엔드/인증 사용 원칙
   3. seed / cleanup 규칙
   4. 공유 계정과 병렬 실행 주의
9. Locator / Assertion / Waiting 규칙
   1. locator 우선순위
   2. assertion 원칙
   3. 명시적 wait 허용 범위
10. 금지 패턴
11. 권장 예시
12. 작업 직전 체크포인트

## 1. 문서 목적
이 문서는 현재 `web/tests`에서 사용하는 테스트 작성 기준을 정의한다.
이 프로젝트의 브라우저 기반 테스트 기본 도구는 `Playwright`이며, 별도 합의가 없으면 아래 규칙은 모두 MUST로 취급한다.

## 2. 핵심 원칙
- 사용자 관점 우선: 테스트는 DOM 구조나 내부 구현이 아니라 사용자가 보는 결과와 완료 가능한 흐름을 검증한다.
- 원인 분리 우선: 실패 시 “mock/setup 문제인지, 화면 상태 문제인지, 백엔드 연결 문제인지”를 빠르게 좁힐 수 있어야 한다.
- 경계 명확화: `Integration`과 `E2E`는 도구가 아니라 의존 경계로 구분한다.
- Playwright 문법 통일: locator, assertion, waiting 방식은 Playwright의 web-first 패턴으로 통일한다.
- 공유 상태 최소화: 원격 API, 공유 관리자 계정, 공용 데이터에 의존하는 테스트는 항상 충돌 가능성을 먼저 검토한다.
- 숨은 setup 금지: 테스트를 읽는 위치에서 네트워크 제어, 인증 상태, seed 데이터가 추적 가능해야 한다.

## 3. 기본 전략

### 3.1 Playwright 단일 도구 원칙
- 브라우저 UI 테스트의 기본 도구는 `Playwright` 하나로 통일한다.
- 이 프로젝트의 기본 테스트 조합은 `Playwright Integration + Playwright E2E`다.
- “도구를 통일한다”와 “레벨을 섞는다”는 다른 말이다. 같은 도구를 써도 경계는 분명히 나눈다.

### 3.2 이 프로젝트의 기본 테스트 레벨
- 기본 필수 레벨은 `Integration`과 `E2E`다.
- `Integration`은 화면 상태 분기, 폼 검증, 라우팅 결과, 권한 분기, 로딩/에러/빈 상태를 빠르게 검증하는 기본 레벨이다.
- `E2E`는 실제 로그인, 실제 저장, 실제 권한 가드, 실제 백엔드 연결이 살아 있는 핵심 업무 흐름을 보증하는 레벨이다.
- 새 기능은 기본적으로 “Integration으로 상태와 분기를 먼저 잡고, 필요한 최소 핵심 흐름만 E2E로 남긴다”를 따른다.

### 3.3 `vi` / Vitest 위치
- `vi` / `Vitest`는 이 프로젝트의 기본 UI 테스트 도구가 아니다.
- 화면/라우트 기능 검증을 위해 `Vitest`를 기본 도입하지 않는다.
- 순수 계산, formatter, mapper, validation helper처럼 DOM/브라우저 없이 검증하는 편이 더 싼 로직이 충분히 생겼을 때만 별도 합의 후 도입한다.
- 즉, “UI 테스트는 Playwright”, “순수 로직은 정말 필요할 때만 별도 도구 검토”가 기본값이다.

## 4. Integration / E2E 경계

### 4.1 Integration
- 파일 기준: `web/tests/**/*.spec.ts`
- 목적: 화면 단위/라우트 단위 상태 분기와 사용자 반응을 검증한다.
- 허용 의존성 제어
	- `page.route()` 기반 API mocking
	- 인증 상태/권한 상태 mocking
	- 초기 데이터 강제 주입
- 대표 대상
	- 폼 검증
	- 로딩 / empty / error / success
	- 목록 / 검색 / 필터 / 페이지네이션
	- 권한에 따른 redirect / 접근 차단
	- 저장 payload 검증 + 저장 후 화면 변화

### 4.2 E2E
- 파일 기준: `web/tests/**/*.e2e.spec.ts`
- 목적: 실제 사용자가 브라우저에서 기능을 끝까지 완료할 수 있는지 검증한다.
- 필수 조건
	- 실제 백엔드 사용
	- 실제 인증 플로우 사용
	- 실제 라우팅/번들 결과 사용
- 허용되는 사전 제어는 “테스트 전제조건 준비”에 한정한다.
	- API seed
	- 테스트 데이터 cleanup
	- 인증 helper
- 핵심 엔드포인트를 `page.route()`로 막으면서 그 테스트를 `E2E`로 부르지 않는다.

### 4.3 분류 질문
- 주요 API를 mock해도 테스트 목적이 유지되는가: `Integration`
- 실제 로그인/저장/권한 연결이 끊기면 이 테스트 의미가 사라지는가: `E2E`
- 상태 조합을 여러 개 보고 싶은가: `Integration`
- 핵심 사용자 여정이 “진짜 끝까지 되는가”만 확인하면 되는가: `E2E`
- 한 spec 안에서 두 성격을 섞지 않는다.

## 5. 파일 및 네이밍 규칙

### 5.1 spec 배치
- 테스트는 `web/tests/<기능 경로>/...` 아래에 둔다.
- 디렉터리 구조는 실제 화면/도메인 구조를 따라간다.
- 예시
	- `web/tests/login/login.spec.ts`
	- `web/tests/login/login.e2e.spec.ts`
	- `web/tests/project/members/members.form.{-$mid}.spec.ts`
	- `web/tests/project/members/members.e2e.spec.ts`

### 5.2 파일명 규칙
- Integration은 `*.spec.ts`
- E2E는 `*.e2e.spec.ts`
- 파일명은 라우트/기능 이름이 바로 보이게 유지한다.
- `index.spec.ts`, `test.spec.ts` 같은 탐색 불가 이름을 금지한다.
- 한 파일 안에는 한 레벨의 테스트만 둔다.

### 5.3 공용 코드 배치
- 전역 공용 helper는 `web/tests/support.ts`에 둔다.
- `support.ts`에는 여러 feature가 함께 쓰는 인증, API seed, 공용 route setup만 둔다.
- 특정 기능 하나에서만 쓰는 mock builder, request body helper, bootstrap wait는 해당 spec 근처에 둔다.
- 공용화 승격은 “두 개 이상 feature/spec에서 반복”될 때만 한다.
- Page Object Model은 기본값이 아니다. 먼저 local helper 또는 `support.ts` 수준에서 해결한다.

## 6. 테스트 작성 기본 규칙

### 6.1 테스트 제목
- `test.describe()`는 기능 단위 이름을 사용한다.
- `test()` 제목은 “사용자 행동 + 기대 결과” 형태로 쓴다.
- 구현 세부사항이 아니라 행동 결과가 읽혀야 한다.

### 6.2 한 테스트의 책임
- 한 테스트는 한 행동과 한 결과에 집중한다.
- 기본 구조는 `Arrange -> Act -> Assert` 순서를 따른다.
- setup, action, assertion이 섞여 읽기 어려운 테스트를 금지한다.
- 같은 테스트 안에서 unrelated assertion을 과도하게 나열하지 않는다.

### 6.3 `beforeEach` / 공용 setup
- 반복되는 인증 stub, 공용 이동 경로, 공용 seed 설치처럼 진짜 반복되는 준비만 `beforeEach`에 둔다.
- `beforeEach` 안에 핵심 assertion을 숨기지 않는다.
- 테스트마다 다른 mock/seed는 각 테스트 본문에서 선언한다.

### 6.4 데이터 고립과 정리
- 원격 백엔드를 건드리는 테스트는 고유 데이터로 실행한다.
- `Date.now()`, worker별 suffix, 고유 login ID 등으로 충돌을 피한다.
- seed 데이터는 `try/finally`로 cleanup한다.
- 공용 관리자 계정, 공용 멤버, 고정 ID를 파괴적으로 수정하는 테스트를 금지한다.

### 6.5 신규 테스트 작성 순서
1. 먼저 `Integration`인지 `E2E`인지 결정한다.
2. 의존 경계에 맞는 setup만 선언한다.
3. 사용자 locator로 action을 작성한다.
4. web-first assertion으로 결과를 검증한다.
5. 정말 필요한 비동기 경계만 명시적으로 기다린다.

### 6.6 주석 규칙
- 테스트 주석은 한글로 작성한다.
- helper, seed/cleanup, bootstrap wait처럼 목적이 바로 드러나지 않는 setup에는 “왜 필요한지”를 짧게 남긴다.
- 특히 `web/tests/support.ts`와 feature 전용 helper는 인증 주입, 외부 API 차단, eventual consistency polling 같은 비자명한 경계를 주석으로 드러낸다.
- 코드 그대로를 반복 설명하는 주석은 금지한다.
- 재사용 helper 선언은 `/** @summary ... */`, 함수 본문 내부 보조 설명은 `//`를 사용한다.
- 테스트 본문에는 Arrange/Act/Assert를 줄마다 설명하는 과한 단계 주석을 기본값으로 쓰지 않는다.

## 7. Integration 작성 규칙

### 7.1 다루는 범위
- 화면 상태 분기와 프론트엔드 조합 책임을 검증한다.
- API 응답 shape에 따른 UI 변화, validation 메시지, redirect, search state 변경, 폼 제출 결과가 핵심 대상이다.
- 라이브러리 자체 동작 재검증은 하지 않는다.

### 7.2 mocking 규칙
- `page.route()`는 반드시 `page.goto()` 전에 등록한다.
- 인증이 필요하면 `support.route.setupAuthenticatedSession(page)`를 우선 사용한다.
- mock은 해당 테스트 목적에 필요한 엔드포인트만 선언한다.
- “어디서 무엇이 응답되는지”를 spec에서 읽을 수 있어야 한다.

### 7.3 상태 검증 규칙
- Integration은 상태 매트릭스를 책임진다.
- 우선 검토 대상
	- loading
	- empty
	- error
	- success
	- validation error
	- permission redirect
	- search / pagination 동기화
- submit 계열 테스트는 request body 검증만으로 끝내지 않고, 저장 후 URL/토스트/화면 전환 같은 사용자 결과도 함께 본다.

### 7.4 대기 규칙
- Suspense, bootstrap query, lazy data 주입이 있는 화면은 관련 응답이나 안정적인 화면 marker가 생긴 뒤 assertion을 시작한다.
- `waitForTimeout()` 대신 다음 중 하나를 쓴다.
	- `expect(page).toHaveURL(...)`
	- `page.waitForResponse(...)`
	- `expect(locator).toHaveValue(...)`
	- `locator.waitFor(...)`
- 대기는 “시간”이 아니라 “상태”를 기다려야 한다.

## 8. E2E 작성 규칙

### 8.1 다루는 범위
- 실제 로그인
- 실제 저장/수정/삭제 완료
- 실제 권한 가드
- 실제 업로드/다운로드
- 실제 핵심 navigation
- smoke 성격의 핵심 업무 시나리오

### 8.2 실제 백엔드/인증 사용 원칙
- 인증 자체가 검증 대상이 아니어도 실제 로그인 또는 검증된 인증 helper를 사용한다.
- 로그인 검증이 필요한 spec은 로그인 flow를 그대로 둔다.
- 백엔드 주력 엔드포인트를 mock하지 않는다.

### 8.3 seed / cleanup 규칙
- 사전 상태가 필요하면 `support.members.createMemberViaApi(...)` 같은 API helper로 준비한다.
- seed는 브라우저 UI로 장황하게 만들지 않는다. E2E의 핵심이 아닌 준비 단계는 API로 단축할 수 있다.
- 다만 검증 대상 자체를 API로 우회하지 않는다.
- cleanup은 항상 `finally`에서 수행한다.

### 8.4 공유 계정과 병렬 실행 주의
- 공유 관리자 계정으로 실패/잠금/비밀번호 변경 같은 destructive 시나리오를 검증하지 않는다.
- 실제 공용 계정을 일부러 틀린 비밀번호로 반복 호출하는 패턴을 금지한다.
- 같은 원격 자원이나 계정을 동시에 건드릴 수 있으면 serial 실행 또는 고립된 데이터 전략을 우선한다.
- 로컬 `test:ui`와 `test:e2e`는 안정성을 위해 serial 실행을 기본으로 본다.

## 9. Locator / Assertion / Waiting 규칙

### 9.1 locator 우선순위
- 1순위: `getByRole`
- 2순위: `getByLabel`, `getByPlaceholder`
- 3순위: `getByText`
- 4순위: `getByTestId`
- 최후수단: CSS/XPath
- 접근 가능한 이름과 실제 사용자 표현을 우선 사용한다.

### 9.2 assertion 원칙
- UI는 web-first assertion을 기본으로 쓴다.
	- `toBeVisible`
	- `toHaveText`
	- `toHaveValue`
	- `toHaveURL`
- 즉시 평가되는 generic assertion은 non-UI 값에만 쓴다.
- 내부 state, React Query cache, hook return 값 같은 구현 디테일 assertion을 금지한다.

### 9.3 명시적 wait 허용 범위
- 허용
	- navigation 완료 대기
	- 특정 API 응답 대기
	- suspense bootstrap 대기
	- 비동기 background job polling
- 제한적 허용
	- `expect.poll()`은 UI assertion으로 표현할 수 없는 서버 상태 polling에만 사용한다.
	- `waitForLoadState("networkidle")`는 특정 응답 기준을 잡을 수 없을 때만 쓴다.
- 금지
	- `waitForTimeout`
	- “느리니까 1초 더 기다리기” 식 임의 sleep

## 10. 금지 패턴
- `Integration`과 `E2E`를 한 파일에 섞는 패턴
- E2E에서 핵심 API를 route mocking하는 패턴
- CSS class, DOM 구조, nth-child에 과도하게 의존하는 locator
- `waitForTimeout()` 기반 안정화
- 공용 계정을 틀린 비밀번호/잠금 시나리오로 소모하는 패턴
- 전역 숨은 mock으로 테스트 의미를 흐리는 패턴
- 같은 시나리오를 Integration과 E2E에 중복 복사하는 패턴
- 거대한 Page Object를 기본 전제로 도입하는 패턴

## 11. 권장 예시
- 폼 validation, 권한 redirect, empty/error/success 매트릭스: `Integration`
- 목록 화면에서 생성 화면으로 이동, 생성 후 목록 복귀: `Integration`
- 실제 로그인 성공 smoke: `E2E`
- API로 멤버를 seed한 뒤 실제 수정 화면에서 확인: `E2E`
- 실제 공유 관리자 계정의 실패 로그인 반복: 금지

## 12. 작업 직전 체크포인트
- 이 테스트가 `Integration`인지 `E2E`인지 한 줄로 설명 가능한가
- mock을 없애도 의미가 유지되면 `E2E`라고 잘못 부르고 있지 않은가
- `page.route()`를 `page.goto()` 전에 등록했는가
- `waitForTimeout()` 없이 상태 기반 대기를 사용했는가
- 공용 계정/공용 데이터에 destructive 영향을 주지 않는가
- assertion이 사용자 결과를 보고 있는가
