# CRUD Rules

## 1. 문서 목적
- 관리형 CRUD 화면, 특히 list/table 화면의 기본 형태를 고정합니다.
- 이 문서는 목록 화면의 컬럼 구성, 행 액션, bulk 액션 배치 기준만 다룹니다.

## 2. 목록 화면 규칙
- 목록 화면은 단일 대표 텍스트가 아니라 `table` 중심으로 렌더링합니다.
- `name`만 단독으로 보여주는 목록 화면을 금지합니다.
- 각 row는 리소스 스키마에 근거한 여러 의미 있는 컬럼을 노출해야 합니다.
- 운영자/관리자가 빠르게 스캔할 수 있는 구조를 우선합니다.

### 2.1 컬럼 선택
- 기본적으로 스키마에서 5~8개 컬럼을 선택합니다.
- 아래 필드는 스키마에 존재할 때 우선 검토합니다.
  - primary identifier (`id`, `code`, `key`)
  - `name` 또는 `title`
  - `status`
  - `type` 또는 `category`
  - `owner` 또는 `creator`
  - `createdAt`
  - `updatedAt`
- 스키마에 없는 필드는 임의로 만들어 넣지 않습니다.
- `name`이 있더라도 단독 컬럼으로 끝내지 않습니다.

### 2.2 레이아웃
- 목록 첫 컬럼은 bulk action용 체크박스 컬럼이어야 합니다.
- 체크박스 컬럼은 여러 row를 동시에 선택할 수 있어야 합니다.
- 목록은 운영자 스캔이 쉬운 표 구조를 우선합니다.

### 2.3 행 액션
- 리소스가 수정 가능하면 각 row에 edit 액션을 둡니다.
- edit 액션은 연필 아이콘 버튼을 기본으로 합니다.
- edit 버튼은 체크박스 컬럼 바로 오른쪽에 배치합니다.
- edit 버튼은 해당 리소스의 edit view로 이동해야 합니다.

```txt
[checkbox] [edit] [schema columns...]
```

### 2.4 삭제 액션
- delete는 row 단위 액션으로 두지 않습니다.
- delete는 선택된 row 기준의 bulk action으로만 처리합니다.
- `Delete` 버튼은 테이블 toolbar 우측 상단에 배치합니다.
- 선택된 row가 없으면 `Delete` 버튼은 비활성화 상태여야 합니다.

```txt
Table Toolbar (top-right)
[Delete]
```

### 2.5 액션 배치
- row 액션은 edit 하나만 둡니다.
- bulk 액션은 delete를 둡니다.
- row delete와 bulk delete를 혼용하지 않습니다.
