# R7-120 Settings system integration CDB cards

Status: current baseline for `v1.15.29`.

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
    - HA 버전: 도커에 설치된 Home Assistant 버전
    - HACS 버전: `/config/custom_components/hacs/manifest.json` 버전 또는 미설치
    - GS 버전: Green Smart manifest 버전
  - DB 연결
    - DB 사용: MariaDB
    - DB 버전: `SELECT VERSION()` 결과
    - DB 상태: 정상 또는 오류 N건
  - API 상태
    - Center 연결 상태: 연결 또는 미연결
    - Center API 상태: 정상 또는 오류 N건
    - Edge API 상태: 정상 또는 오류 N건

action row: 2 one-button cards + 1 two-button card
  - 업데이트: button-one, DB/HA/HACS/GS 업데이트 기능은 Update Agent 도입 전까지 기능 보류
  - DB/API 오류: button-one, watchdog DB/API 오류 로그 확인 및 수정 진입점
  - Center 연결: button-two, 허용 토큰 연결 + Center 연결 목록

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

- `data-r7-settings-system-action-card="system-update-deferred"`
- `data-r7-settings-system-action-card="system-db-api-errors"`
- `data-r7-settings-system-action-card="system-center-connection"`

List rows:

- `data-r7-settings-system-integration-row="ha"`
- `data-r7-settings-system-integration-row="db"`
- `data-r7-settings-system-integration-row="api"`
- `data-r7-settings-system-integration-row="secret"`

## Secret boundary

Secret values render as [REDACTED] only. Raw secret material must never be rendered in this subtab.
