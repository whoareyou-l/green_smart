# R7-088 Settings greenhouse/zone CDB card layout

Status: current baseline for `v1.15.45`.

## Scope

`설정 > 온실·구역` 하위탭은 하위탭 공통 CDB 카드 문법을 따른다. 화면에서 직접 쓰는 카드 wrapper는 CDB 4종만 허용한다.

Allowed card wrappers:

- `renderR7CdbSummaryCard()`
- `renderR7CdbButtonOneCard()`
- `renderR7CdbButtonTwoCard()`
- `renderR7CdbListCard()`

## CDB card grammar hotfix in v1.15.45

The greenhouse/zone subtab is locked to the same CDB grammar used by the device/sensor mapping subtab.

Visible row grammar:

```text
summary row: 3 summary cards
  - 온실 기본 정보
  - 구역 기본 정보
  - 장치 목록

action row: 2 two-button cards + 1 one-button equipment check card
  - 온실 생성
  - 구역 생성
  - 장치 확인

list row: 1 list card
  - 구역 목록
```

Implementation rules:

- The subtab root keeps `data-r7-cdb-subtab-content-layout="summary3-action3-list"`.
- The summary row keeps `data-r7-cdb-layout-row="summary"` and exactly the three visible summary concepts above.
- The action row keeps `data-r7-cdb-layout-row="actions"`, two `renderR7CdbButtonTwoCard()` create cards, and one `renderR7CdbButtonOneCard()` equipment check card.
- The list row keeps `data-r7-cdb-layout-row="list"` and the zone list is rendered through `renderR7CdbListCard()`.
- Old four-summary-card reference layout is historical only and must not be reintroduced.

## Current markers

Root/layout:

- `data-r7-settings-greenhouse-zones`
- `data-r7-settings-greenhouse-zones-layout="info-create-equipment-list"`
- `data-r7-cdb-subtab-content-layout="summary3-action3-list"`
- `data-r7-cdb-layout-row="summary"`
- `data-r7-cdb-layout-row="actions"`
- `data-r7-cdb-layout-row="list"`

Summary cards:

- `data-r7-settings-greenhouse-summary-card="greenhouse-basic-info"` — 온실 기본 정보
- `data-r7-settings-greenhouse-summary-card="zone-basic-info"` — 구역 기본 정보; historical wording: 구역 구성
- `data-r7-settings-greenhouse-summary-card="equipment-composition"` — 장치 목록

Action cards:

- `data-r7-settings-create-card="settings-greenhouse-create"`
- `data-r7-settings-create-card="settings-zone-create"`
- `data-r7-settings-check-card="settings-equipment-check"`

List:

- `data-r7-settings-zone-list-panel`
- `data-r7-settings-zone-list-panel-width="full"`
- `data-r7-settings-zone-table-header`
- `data-r7-settings-zone-list-row="..."`

## Boundary

온실 생성/구역 생성 버튼은 공통 모달 shell과 API 연결 상태를 유지한다. 온실·구역 하위탭의 장치 카드는 `장치 확인` 1버튼 카드로 목록/확인 모달만 연다. 이 문서는 화면 문법과 marker contract를 다루며, DB mutation 세부 정책은 `r7-098-settings-greenhouse-zone-real-db-api.md`에서 관리한다.
