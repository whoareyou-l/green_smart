# R7-100 CDA entity modal greenhouse rows

## 목적

온실 정보 모달이 필드별 row처럼 보이는 문제를 온실 정보 단일 화면에서 임시 수정하지 않고, **CDA entity 공통 팝업 모달** 문법으로 정리한다.

## 핵심 원칙

- 왼쪽 목록은 **온실별 row**여야 한다.
- `온실명`, `위치`, `설치유형` 같은 필드는 row가 아니라 선택 온실의 상세 필드다.
- 따라서 **필드별 row 금지**를 계약으로 잠근다.
- 공통 팝업 모달은 엔티티 목록 + 선택 엔티티 상세를 재사용할 수 있어야 한다.
- CDA 방식의 목적은 그때그때 화면별 하드코딩이 아니라 **재사용, 모듈화, 통일성**이다.

## 공통 helper

프론트 rebuild panel에 다음 공통 helper를 추가한다.

```text
renderR7CdaEntityListDetailModal
renderR7CdaEntityRows
renderR7CdaEntityDetailFields
```

온실 정보는 이 공통 helper를 사용하며, 온실 전용 normalization만 별도로 둔다.

```text
normalizeR7SettingsGreenhouseEntityRows
R7_SETTINGS_GREENHOUSE_LIST_COLUMNS
R7_SETTINGS_GREENHOUSE_DETAIL_FIELD_ORDER
```

## 온실 목록 row schema

온실 row는 아래 컬럼 순서를 따른다.

```text
온실명 → 위치 → 설치유형 → 승인범위 → 상태
```

## 온실 상세 field schema

선택 항목 상세는 아래 순서를 따른다.

```text
온실명 → 위치 → 설치유형 → 승인범위 → 상태 → 수정시각 → 생성시각 → 메모
```

## fallback 규칙

DB에 온실이 없을 때도 `온실명/위치/설치유형` 3개 row를 만들지 않는다. 대신 대표 온실 1개 row를 fallback으로 만든다.
