# R7-086 Permission matrix modal hotfix

Status: current baseline for `v1.15.36`.

## Scope

`설정 > 사용자·권한`의 **권한 매트릭스 보기** 버튼은 카드 내부 숨김 영역을 남기는 것이 아니라, 클릭 시 권한 매트릭스 표를 **팝업 모달**로 열어야 한다.

## Changes

- `data-r7-settings-permission-matrix-button` 버튼 marker를 추가한다.
- `_openSettingsPermissionMatrixModal()` / `_closeSettingsPermissionMatrixModal()` 상태 전환을 추가한다.
- `renderR7SettingsPermissionMatrixModal()`이 CDA modal primitive를 사용해 권한 매트릭스 표를 렌더한다.
- 닫힌 상태는 placeholder만 렌더한다. 열린 상태에서만 `data-r7-settings-permission-matrix-table-modal="true"` 표가 표시된다.
- 예전 `data-r7-settings-users-action="open-permission-matrix-modal"`/`close-permission-matrix-modal` 숨김 shell 방식은 제거한다.

## Contract markers

- `data-r7-settings-permission-matrix-button`
- `data-r7-settings-permission-matrix-cda-modal="true"`
- `data-r7-settings-permission-matrix-modal-open="true|false"`
- `data-r7-settings-permission-matrix-table-modal="true"`
- `data-r7-settings-permission-matrix-close-button`

## Operator rule

권한 매트릭스는 read-only 기준표다. 권한 변경/저장은 별도 승인 필요 작업 모달에서 처리한다.
