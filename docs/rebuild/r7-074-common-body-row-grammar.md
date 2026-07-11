# R7-074 Common body row grammar

Status: current baseline for `v1.15.32`.

## Why

`renderR7CommonCardShell()`가 공통 header/body/button wrapper를 쓰더라도, 카드별 본문 row를 `html:` 안에서 직접 만들면 화면은 서로 달라진다. 실제 통일감은 헤더와 버튼 사이의 본문 row 공통 문법까지 포함해야 한다.

## Common helpers

- `renderR7CommonCardDataRow()`
- `renderR7CommonCardDataRows()`

공통 row는 아래 marker를 가진다.

- `data-r7-common-card-data-row`
- `data-r7-common-card-data-row-label`
- `data-r7-common-card-data-row-meta`

## Applied surfaces

### 설정 > 사용자·권한

- 승인 필요 작업
  - `data-r7-common-card-data-row="settings-approval"`
  - 기존 compatibility marker: `data-r7-settings-approval-row`, `data-r7-settings-user-approval-request-row`

- 감사 로그
  - `data-r7-common-card-data-row="settings-audit"`
  - 기존 compatibility marker: `data-r7-settings-audit-row`

### 작물 운영 > 기록·작업

- 누락·검증 필요
  - `data-r7-common-card-data-row="record-missing-item"`
  - 기존 item marker: `data-r7-record-missing-item`

## Rule

본문 row는 카드별 bespoke `display:flex`/`grid-template-columns:1fr auto` HTML로 직접 만들지 않는다. 필요한 경우 `extraAttrs`로 기존 marker만 보존하고, visual row grammar는 common helper를 사용한다.
