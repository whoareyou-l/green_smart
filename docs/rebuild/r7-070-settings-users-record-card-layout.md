# R7-070 Settings users-permissions record-card layout

Status: current baseline for `v1.14.52`.

## Scope

`설정 > 사용자·권한`에 `기록·작업 공동 컴포넌트` 카드 문법을 적용한다.

## Requested layout

Top row:

- 승인 필요 작업
- 감사 로그
- 권한 버킷 매트릭스

Bottom row:

- 사용자 목록 full-width

Written as the user requested:

`승인 필요 작업, 감사 로그, 권한 버킷 매트릭스`
`사용자 목록 full-width`

## Changes

- Approval, audit, and permission-matrix cards use the same compact record-card grammar as the records-workflow dashboard.
- `사용자 목록 버튼 제거`: no user-list invite/role-change buttons.
- The `권한 버킷 매트릭스` card no longer renders the detailed table inline.
- `권한 매트릭스 표는 모달`: the detailed permission matrix table is placed inside hidden modal markup and will be opened by a future popup button.
- The summary card exposes `권한 매트릭스 보기` as the modal trigger affordance.

## Boundary

This remains a UI layout slice. The modal markup and buttons are affordances only; this slice does not add backend role mutation, save/delete/apply, or real permission editing authority.
