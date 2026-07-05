# R7-071 Common card components and HA icon policy

Status: current baseline for `v1.14.78`.

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

## Subtab content layout rule

앞으로 하위탭의 내용카드는 아래 4개 CDB 카드 타입만 사용한다. 각 카드가 연결하는 DB/API는 하위탭마다 다를 수 있지만, 화면 구조와 동작 문법은 고정한다.

표준 3줄 구성:

1. `요약카드` 3개 — `renderR7CdbSummaryCard()`
2. `버튼 1개 카드` 또는 `버튼 2개 카드` 3개 — `renderR7CdbButtonOneCard()` / `renderR7CdbButtonTwoCard()`
3. `목록카드` 1개 — `renderR7CdbListCard()`

표준 layout helper:

- `renderR7CdbSubtabContentLayout()`
- `data-r7-cdb-subtab-content-layout="summary3-action3-list"`
- `data-r7-cdb-layout-row="summary"`
- `data-r7-cdb-layout-row="actions"`
- `data-r7-cdb-layout-row="list"`

버튼 동작 규칙:

- 버튼 1개 카드는 목록 팝업 모달을 연다. Marker: `data-r7-cdb-button-role="list"`, `data-r7-cdb-opens-modal="list"`.
- 버튼 2개 카드는 공통 컴포넌트에서 subtitle을 보장한다. 호출부가 `subtitle`을 넘기지 않으면 `primary`가 header subtitle로 자동 표시된다. Marker: `data-r7-cdb-button-two-subtitle="present"`.
- 버튼 2개 카드의 첫 번째/추가 버튼은 추가·생성 팝업 모달을 연다. Marker: `data-r7-cdb-button-role="create"`, `data-r7-cdb-opens-modal="create"`.
- 버튼 2개 카드의 두 번째/목록 버튼은 목록 팝업 모달을 연다. Marker: `data-r7-cdb-button-role="list"`, `data-r7-cdb-opens-modal="list"`.

목록 팝업 모달 규칙:

- 목록 팝업 모달은 좌측 목록 + 우측 상세 구조를 사용한다.
- 우측 상세 하단에는 긍정 버튼과 부정 버튼이 존재해야 한다.
- 긍정 버튼 예: `수정`, `승인`. Marker: `data-r7-cdb-modal-action="positive"`.
- 부정 버튼 예: `삭제`, `거부`. Marker: `data-r7-cdb-modal-action="negative"`.
- Footer marker: `data-r7-cdb-list-modal-action-footer="positive-negative"`.

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
  - 1줄 요약카드 3개: 승인 대기, 사용자 현황, 권한 역할
    - 승인 대기 row: 전체 승인, 로그인 승인, 역활 승인
    - 사용자 현황 row: 전체 사용자, 활성 사용자, 비활성 사용자
  - 2줄 작업카드 3개: 로그인 승인 작업, 사용자 목록, 역활별 권한
  - 3줄 목록카드 1개: 사용자 목록
  - 역활별 권한 추가 버튼 라벨: `새 역활 추가`
  - 유저 수정 팝업의 역할 select는 `rolePermissions` DB/API 목록을 사용한다.
  - 승인 필요 작업
  - 감사 로그
  - 권한 버킷 매트릭스
  - 사용자 목록

## Recent records

작물 운영 도메인의 `기록·작업 > 최근 기록`도 `renderR7CommonRecentPanel()` / `renderR7CommonRecentRow()` 기반으로 연결한다.

## Boundary

This is a UI component unification slice. It does not add write authority, role mutation, save/delete/apply, or execution behavior.
