# R7-077 Approval request + admin modal flow

Status: current baseline for `v1.15.22`.

## Flow

1. 미승인 사용자는 승인 대기 화면에서 **승인 요청 보내기** 버튼을 누른다.
2. Frontend calls `POST /api/green_smart/rebuild/settings/approval-request`.
3. Backend creates/reuses a pending row in `gs_approval_requests` for the HA user.
4. 관리자는 설정 > 사용자·권한의 **승인 필요 작업** 카드에서 요청을 연다.
5. 팝업 모달에서 **승인하기**를 누른다.
6. Frontend calls `POST /api/green_smart/rebuild/settings/approval-requests/{request_id}/decision`.
7. Backend sets `gs_users.status = active`, marks the request approved, and writes `gs_audit_logs`.

## UI markers

- Pending gate: `data-r7-approval-request-button`
- Request state: `data-r7-approval-request-state`
- Approval row button: `data-r7-settings-approval-row-button`
- Modal: `data-r7-settings-approval-modal`
- Modal open state: `data-r7-settings-approval-modal-open`
- Approve button: `data-r7-settings-approval-approve-button`

## Backend tables

- `gs_approval_requests`: pending/approved access requests
- `gs_users.status`: actual access gate, where `active/approved` can enter
- `gs_audit_logs`: approval evidence

## Product rule

Pending 화면에는 승인 요청 버튼이 있어야 하며, 관리자는 승인 필요 작업 버튼의 팝업 모달에서 승인한다.
