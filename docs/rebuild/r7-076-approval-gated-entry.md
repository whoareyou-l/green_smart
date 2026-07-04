# R7-076 Approval-gated entry

Status: current baseline for `v1.14.67`.

## Why

`v1.14.0`에서 Settings > 사용자·권한 DB 연결은 완료했지만, 신규 사용자를 `gs_users.status='active'`로 바로 upsert해 미승인 사용자도 Green Smart 화면에 진입할 수 있었다. 승인 DB는 보기만 하는 데이터가 아니라 진입 조건이어야 한다.

## Rule

- 미승인 사용자는 Green Smart workspace에 진입할 수 없다.
- 승인된 상태는 `active/approved`만 인정한다.
- 신규 Home Assistant 비관리자 사용자는 최초 접근 시 `pending`으로 생성한다.
- Home Assistant 관리자 사용자는 bootstrap/운영 복구를 위해 최초 접근 시 `active`로 생성할 수 있다.
- 기존 `pending` 사용자는 단순 재접근으로 `active`가 되지 않는다.

## Backend response

미승인 사용자 응답:

```json
{
  "ok": false,
  "approvalRequired": true,
  "approvalStatus": "pending",
  "reasonCode": "user_approval_required"
}
```

## Frontend behavior

`approvalRequired=true`이면 `data-r7-approval-gate="pending"` 승인 대기 화면만 표시하고, `data-r7-page-workspace` / 정상 domain router는 렌더하지 않는다.

## Result

승인 전에는 진입 차단, 승인 후(`active/approved`)에만 정상 Green Smart workspace 진입.
