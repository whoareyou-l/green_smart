# R7-102 CDA entity modal zone rows

## 목적

구역 목록 모달도 온실 정보와 같은 **CDA entity 공통 팝업 모달** 문법을 사용한다.

## 핵심 원칙

- 왼쪽 목록은 **구역별 row**여야 한다.
- `구역명`, `용도`, `베드` 같은 필드는 row가 아니라 선택 구역의 상세 필드다.
- 따라서 **필드별 row 금지**를 계약으로 잠근다.
- 구역 목록은 온실 정보와 같은 `renderR7CdaEntityListDetailModal`을 재사용한다.
- 공통 팝업 모달 기준은 엔티티 목록 + 선택 엔티티 상세 + footer action이다.

## 구역 목록 row schema

구역 row는 아래 컬럼 순서를 따른다.

```text
구역명 → 온실 → 용도 → 베드 → 상태
```

## 구역 상세 field schema

선택 구역 상세는 아래 순서를 따른다.

```text
구역명 → 온실 → 용도 → 면적 → 베드 → 현재 작물 → 상태 → 수정시각 → 메모
```

## 구현 기준

```text
R7_SETTINGS_ZONE_LIST_COLUMNS
R7_SETTINGS_ZONE_DETAIL_FIELD_ORDER
normalizeR7SettingsZoneEntityRows
renderR7CdaEntityListDetailModal(entityType="zone-list")
```

## fallback 규칙

DB에 구역이 없을 때도 `구역명/용도/베드` 같은 필드 row를 만들지 않는다. 대신 대표 `1구역` 1개 row를 fallback으로 만든다.
