# R7-103 CDA entity modal equipment mapping rows

## 목적

장비 구성 모달도 온실 정보/구역 목록과 같은 **CDA entity 공통 팝업 모달** 문법을 사용한다.

## 핵심 원칙

- 왼쪽 목록은 **장비/센서 매핑별 row**여야 한다.
- `센서`, `장비`, `미연결` 같은 집계/필드성 summary row를 만들지 않는다.
- **필드별 row 금지**: 매핑 역할/구역/센서/장비는 선택 매핑 상세 필드이거나 매핑 row 컬럼이어야 하며, 각각 독립 row가 되면 안 된다.
- 매핑 역할, 구역, 센서 entity, 장비 entity, 상태를 한 row에 보여준다.
- 오른쪽은 선택 매핑 상세를 보여준다.
- 공통 팝업 모달 기준은 엔티티 목록 + 선택 엔티티 상세 + footer action이다.

## 장비/센서 매핑 row schema

```text
역할 → 구역 → 센서 → 장비 → 상태
```

## 장비/센서 매핑 상세 field schema

```text
역할 → 구역 → 센서 entity → 장비 entity → 프로토콜 → 방향 → 상태 → 수정시각 → 메모
```

## 구현 기준

```text
R7_SETTINGS_EQUIPMENT_LIST_COLUMNS
R7_SETTINGS_EQUIPMENT_DETAIL_FIELD_ORDER
normalizeR7SettingsEquipmentEntityRows
renderR7CdaEntityListDetailModal(entityType="equipment-info")
```

## fallback 규칙

DB에 매핑이 없을 때도 `센서 1개`, `장비 1개`, `미연결 없음` 같은 summary row를 만들지 않는다. 대신 대표 `환경 센서/환기 장치` 매핑 1개 row를 fallback으로 만든다.

## 금지

```text
field-as-row
data-r7-cda-entity-field-row
센서</b>
장비</b>
미연결</b>
```
