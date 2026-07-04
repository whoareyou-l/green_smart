# R7-071 Common card components and HA icon policy

Status: current baseline for `v1.14.63`.

## Scope

공통 카드 컴포넌트 구조를 보강하고, `기록·작업`과 `설정 > 사용자·권한`이 같은 UI 문법을 쓰도록 정리한다.

## HA icon policy

특별한 사용자 지시가 없는 한 모든 공통 카드 아이콘은 `ha-icon icon="mdi:..."` 형식을 사용한다.

공통 helper:

- `renderR7CommonHaIcon()`
- `renderR7CommonCardHeader()`
- `renderR7CommonCardButton()`
- `renderR7CommonCardActionRow()`
- `renderR7CommonCardShell()`
- `renderR7CommonRecentRow()`
- `renderR7CommonRecentPanel()`

CDB 카드 타입 wrapper:

- `renderR7CdbSummaryCard()` — 요약카드. 예: `구역 기본 정보`처럼 title/subtitle + label/value rows.
- `renderR7CdbButtonOneCard()` — 버튼 1개 카드. 예: compact `사용자 목록`처럼 subtitle + 3-row 요약 + action 1개.
- `renderR7CdbButtonTwoCard()` — 버튼 2개 카드. 예: `역활별 권한`처럼 subtitle + 3-row 요약 + action 2개.
- `renderR7CdbListCard()` — 목록카드. 예: full-width `사용자 목록`처럼 recent/list rows를 넓게 표시.

DOM marker:

- `data-r7-cdb-common-card="summary-card"`
- `data-r7-cdb-common-card="button-1-card"`
- `data-r7-cdb-common-card="button-2-card"`
- `data-r7-cdb-common-card="list-card"`

## Button order

버튼 공동 컴포넌트는 항상 `아이콘, 텍스트 순`이다.

```html
<ha-icon icon="mdi:..."></ha-icon>
<span>텍스트</span>
```

## Applied surfaces

- `기록·작업 공동 컴포넌트`
  - 카드 header
  - card action button
  - 최근 기록 row/panel

- `사용자·권한`
  - 승인 필요 작업
  - 감사 로그
  - 권한 버킷 매트릭스
  - 사용자 목록

## Recent records

작물 운영 도메인의 `기록·작업 > 최근 기록`도 `renderR7CommonRecentPanel()` / `renderR7CommonRecentRow()` 기반으로 연결한다.

## Boundary

This is a UI component unification slice. It does not add write authority, role mutation, save/delete/apply, or execution behavior.
