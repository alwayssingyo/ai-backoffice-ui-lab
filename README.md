# 사내 CMS 백오피스 UI 시스템화 TF

> AI 에이전트와 함께 백오피스 CMS를 구축한 사내 TF 프로젝트입니다.

콘텐츠·회원·권한·미디어 등을 관리하는 백오피스 CMS를 구축하며, 단순 화면 개발보다 **AI 에이전트가 일관된 코드를 생성할 수 있는 환경을 설계하는 것**에 초점을 맞췄습니다.

---

# 프론트 유지보수 가이드

## 1. 문서 목적
이 문서는 이 저장소를 유지보수하는 사람을 위한 빠른 이해·운영·수정 가이드입니다.

## 2. 빠른 시작
- 설치: `npm install`
- 개발 서버: `npm run dev` (기본 포트 `3001`)
- 빌드: `npm run build`
- 프리뷰: `npm run preview`
- 테스트: `npm run test`

## 3. 핵심 스택
- React 19 + React Compiler
- Vite
- TanStack Router / TanStack React Query
- Ant Design
- i18next
- Zustand
- Kubb (OpenAPI 기반 코드 생성)
- Playwright
- Biome (lint/format)

## 4. 엔트리 포인트/핵심 흐름
- 진입점: `web/index.html`, `web/src/main.tsx`
- 라우팅: `web/src/routes/**` (TanStack Router 파일 기반 라우팅)
- 라우트 트리: `web/src/routeTree.gen.ts` (자동 생성, 수동 수정 금지)
- 전역 Provider 조합: `web/src/main.tsx`에서 React Query/Ant Design/Google OAuth/Nice Modal/TanStack Devtools 구성

## 5. 환경 변수
- Vite 런타임: `VITE_*` (예: `VITE_GOOGLE_CLIENT_ID`)
- Kubb 코드 생성: `KUBB_API_BASE_URL`, `KUBB_API_DOCS_URL`, `KUBB_OUTPUT_ROOT`
- 환경 파일: `web/.env.development`, `web/.env.production`

## 6. 코드 생성 흐름
- API 변경 시: `npm run kubb:generate` (또는 `kubb:generate:dev`)
- 생성 위치: `web/src/services/**`
- 생성물 직접 수정 금지: `web/src/services/clients`, `web/src/services/hooks`, `web/src/services/mocks`, `web/src/services/schemas`, `web/src/services/types`, `web/src/services/.kubb`
- 라우트 구조 변경 시: TanStack Router 생성 결과(`web/src/routeTree.gen.ts`)는 수동 수정하지 않고 라우트 소스 변경으로 갱신
- 토큰/이미지 생성물 변경 시: `npm run antd:generate`, `npm run img:generate`로 재생성

## 7. i18n 흐름
- 리소스 위치: `web/src/i18n/{ko,en}/*.json`
- 키 추출/동기화: `npm run i18n:extract`, `npm run i18n:sync`
- 타입 생성: `npm run i18n:types` (결과는 `web/src/types/i18next.d.ts`)

## 8. 컨벤션
- 작업 파이프라인: `web/AGENTS.md`
- Workflow 개요: `web/.workflow/README.md`
- 작업 흐름: `web/.workflow/pipeline.md`
- 적용 규칙: `web/.workflow/rules.md` (`파일 표면 + 작업 단계` 기준으로 선택)
- React 규칙: `web/.workflow/source/react.md`
- CSS 규칙: `web/.workflow/source/css.md`
- Route 규칙: `web/.workflow/source/route.md`
- Test 규칙: `web/.workflow/source/test.md`
- 코드 생성/포맷 규칙: Kubb + Biome 설정을 우선한다.

## 9. 폴더 구조와 역할

### 9.1 `web/` 하위 폴더
- `web/src`: 실제 애플리케이션 코드
- `web/public`: 정적 파일 (그대로 서빙됨)
- `web/dist`: 빌드 산출물 (자동 생성)
- `web/.workflow`: 에이전트 작업 흐름, 규칙, 원문 컨벤션을 한곳에 모은 운영 폴더
- `web/.workflow/source`: 분야별 원문 컨벤션
- `web/node_modules`: 의존성
- `web/.husky`: Git hooks
- `web/.tanstack`: TanStack Router 캐시/메타
- `web/stats.html`: 번들 분석 리포트(빌드 시 생성)

### 9.2 `web/src/` 하위 폴더
- `web/src/types`: 전역 타입 정의, i18n 타입 출력
- `web/src/assets`: 앱 내부에서 import하는 이미지/아이콘
- `web/src/components`: UI/위젯 컴포넌트 모음
- `web/src/components/ui`: 공통 UI 컴포넌트 (Ant Design 래핑 포함)
- `web/src/components/widget`: 기능 단위 위젯 컴포넌트
- `web/src/config`: 설정/상수 원본 모듈
- `web/src/entry`: 공개 진입점 namespace 모듈
- `web/src/i18n`: 번역 리소스
- `web/src/libraries`: 외부 라이브러리 초기화/래핑 (axios, react-query, i18n 등)
- `web/src/mocks`: 고정 JSON 데이터(개발/테스트 참고용)
- `web/src/routes`: 파일 기반 라우팅 화면
- `web/tests`: Playwright Integration/E2E 시나리오
- `web/src/scripts`: 로컬 유틸 스크립트(antd 변수/이미지 상수 생성)
- `web/src/services`: API 클라이언트/훅/스키마/타입/Mock (Kubb 생성물 포함)
- `web/src/stores`: Zustand 전역 스토어
- `web/src/styles`: 전역 스타일/변수/리셋
- `web/src/utils`: 순수 유틸리티 함수

### 9.3 주요 폴더 상세 역할

#### 9.3.1 `web/src/libraries/`
- `web/src/libraries/ant-design`: Ant Design 테마/ConfigProvider, notification/message/modal 인스턴스 제공
- `web/src/libraries/axios`: Axios 인터셉터 구성(토큰 주입, 401 리프레시, 로그아웃 처리)
- `web/src/libraries/dayjs`: dayjs 플러그인 등록 및 공용 날짜 포맷 유틸
- `web/src/libraries/google-oauth`: Google OAuth Provider 래퍼(`VITE_GOOGLE_CLIENT_ID` 사용)
- `web/src/libraries/i18n`: i18next 초기화 및 리소스/NS 구성
- `web/src/libraries/nice-modal`: NiceModal Provider 래퍼
- `web/src/libraries/react-query`: QueryClient 기본 옵션/에러 토스트/메타 규칙
- `web/src/libraries/tanstack-devtools`: Router/Query Devtools 패널 통합

#### 9.3.2 `web/src/services/`
- `web/src/services/.kubb`: Kubb 런타임(fetch/axios 인스턴스) 및 설정
- `web/src/services/clients`: API 클라이언트 함수(axios 기반)
- `web/src/services/hooks`: React Query 훅(기본적으로 suspense)
- `web/src/services/schemas`: 요청/응답 스키마
- `web/src/services/types`: API 타입 정의
- `web/src/services/mocks`: Faker 기반 mock 데이터

#### 9.3.3 `web/src/routes/`
- `web/src/routes/__root.tsx`: 전역 메타/레이아웃, 공통 스피너 등 루트 설정
- `web/src/routes/(project)`: 프로젝트 영역 라우트 그룹
- `web/src/routes/index.tsx`: 루트 인덱스 화면
- `web/src/routes/login.tsx`: 로그인 화면
- `web/tests/**/*.spec.ts`: Playwright Integration spec (`*.e2e.spec.ts` 제외)

#### 9.3.4 `web/src/components/`
- `web/src/components/ui`: 앱 전역 공통 UI(버튼/폼/테이블 등), Ant Design 래핑 포함
- `web/src/components/widget`: 기능 단위 조합 컴포넌트(메뉴/사이드바 등)

#### 9.3.5 `web/src/styles/`
- `web/src/styles/_reset.css`: 전역 리셋
- `web/src/styles/_variables.css`: Ant Design 토큰 기반 CSS 변수(스크립트 생성)
- `web/src/styles/style.css`: 전역 스타일 엔트리

#### 9.3.6 `web/src/scripts/`
- `web/src/scripts/generate-antd-variables.ts`: Ant Design 토큰 → CSS 변수 생성
- `web/src/scripts/generate-image-constant.ts`: 이미지 상수(`web/src/assets/images.ts`) 자동 생성

#### 9.3.7 `web/src/config/`, `web/src/entry/`
- `web/src/config`: 날짜, 네비게이션, 숫자 제한 등 도메인/앱 설정 원본 모듈
- `web/src/entry`: `config`, `util`, `asset` 공개 진입점 모듈

#### 9.3.8 `web/src/stores/`
- `web/src/stores/use-theme-store.ts`: 테마 모드 저장
- `web/src/stores/use-token-store.ts`: 인증 토큰 저장/갱신

## 10. 주요 설정 파일
- Vite: `web/vite.config.ts`
- TypeScript: `web/tsconfig.json`
- Kubb: `web/kubb.config.ts`
- i18next: `web/i18next.config.ts`
- Biome: `web/biome.json`

## 11. 추가 운영 메모
- 경로 별칭: `@` → `web/src`
- 테스트 환경: Playwright Integration(`web/tests/**/*.spec.ts`) + Playwright E2E(`web/tests/**/*.e2e.spec.ts`)
- Git hooks: 신규 환경에서 필요 시 `npm run husky:prepare` 실행

## 12. 유지보수 체크리스트
- 라우팅 변경 시: `web/src/routes/**` 수정 후 `routeTree.gen.ts` 재생성 여부 확인
- API 변경 시: Kubb 재생성 후 생성물만 갱신되는지 확인
- i18n 키 변경 시: `i18n:*` 스크립트로 키/타입 동기화
- UI/스타일 변경 시: Ant Design 변수(`npm run antd:generate`) 및 전역 스타일 확인
- 린트/포맷: `npm run biome:check:all` 또는 `biome:check:write`
