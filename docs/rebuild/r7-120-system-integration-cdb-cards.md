# R7-120 Settings system integration CDB cards

Status: current baseline for `v1.14.72`.

## Scope

`설정 > 시스템·연동` 하위탭의 내용카드를 CDB 4종 카드 문법으로 구현한다.

Allowed card wrappers:

- `renderR7CdbSummaryCard()`
- `renderR7CdbButtonTwoCard()`
- `renderR7CdbListCard()`

## CDB layout

```text
summary row: 3 summary cards
  - Home Assistant 연동
  - DB 연결
  - API 상태

action row: 3 two-button cards
  - HA 리소스
  - DB 경계
  - Secret redaction

list row: 1 list card
  - 연동 목록
```

## Markers

Root/layout:

- `data-r7-settings-system-integration`
- `data-r7-settings-system-integration-layout="summary-action-list"`
- `data-r7-cdb-subtab-content-layout="summary3-action3-list"`
- `data-r7-cdb-layout-row="summary"`
- `data-r7-cdb-layout-row="actions"`
- `data-r7-cdb-layout-row="list"`

Summary cards:

- `data-r7-settings-system-summary-card="ha-connection"`
- `data-r7-settings-system-summary-card="db-connection"`
- `data-r7-settings-system-summary-card="api-status"`

Action cards:

- `data-r7-settings-system-action-card="system-ha-resources"`
- `data-r7-settings-system-action-card="system-db-boundary"`
- `data-r7-settings-system-action-card="system-secret-redaction"`

List rows:

- `data-r7-settings-system-integration-row="ha"`
- `data-r7-settings-system-integration-row="db"`
- `data-r7-settings-system-integration-row="api"`
- `data-r7-settings-system-integration-row="secret"`

## Secret boundary

Secret values render as [REDACTED] only. Raw secret material must never be rendered in this subtab.
