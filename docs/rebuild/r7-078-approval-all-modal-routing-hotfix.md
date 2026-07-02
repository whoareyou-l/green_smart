# R7-078 Approval-all modal routing hotfix

Status: current baseline for `v1.14.42`.

## Problem

`모든 승인 요청 확인` reused the common card button helper. That helper adds record-workflow attributes, so the button could be captured by record/history modal bindings. This caused a 바인딩 충돌. It also reused the individual approval row marker, mixing “all requests” and “single request approval”.

Observed behavior: pressing `모든 승인 요청 확인` opened a 기록 히스토리 팝업 모달, and closing it surfaced 승인 필요 작업 again.

## Fix

- `모든 승인 요청 확인` now uses `data-r7-settings-approval-list-button`.
- It adds `data-r7-settings-approval-skip-record-binding="true"` so record workflow binding ignores it.
- It opens a dedicated approval request list modal: `data-r7-settings-approval-list-modal`.
- Individual row `확인` still opens the individual approval modal: `data-r7-settings-approval-modal`.
- The list modal close button only closes the list modal.

## Separation rule

- All requests button → 전용 목록 모달
- List item button / row 확인 → 개별 승인 모달
- Record history modal → crop records only, never settings approvals
