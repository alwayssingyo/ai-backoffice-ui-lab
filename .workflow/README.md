# 워크플로 개요

## 목적
- `web/` 작업에 필요한 운영 문서를 한 곳에서 관리합니다.

## 현재 문서
- `web/.workflow/pipeline.md`
  - 실행 순서와 종료 조건
- `web/.workflow/rules.md`
  - 적용할 규칙과 읽어야 할 원문 선택 기준
- `web/.workflow/source/react.md`
- `web/.workflow/source/css.md`
- `web/.workflow/source/route.md`
- `web/.workflow/source/test.md`
- `web/.workflow/source/crud.md`

## 읽는 순서
1. `web/.workflow/README.md`
2. `web/.workflow/pipeline.md`
3. `web/.workflow/rules.md`
4. 필요한 `web/.workflow/source/*.md`
   - `rules.md`가 지목한 문서와 섹션만 읽습니다.

## 메모
- `web/AGENTS.md`, `web/CLAUDE.md`는 이 폴더로 연결하는 얇은 진입점입니다.
- 규칙 적용은 `파일 표면 세트`와 `작업 단계 세트`를 함께 보고 결정합니다.
