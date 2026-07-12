# R7-075/R7-116 Settings users-permissions DB binding

Status: current baseline for `v1.15.46`.

## Why

설정 > 사용자·권한 화면에 `admin`, `owner01`, `staff01` 같은 프론트 하드코딩 값이 남아 있으면 운영 화면이 실제 상태를 보여주지 못한다. 이 영역은 DB와 API를 통해 읽고, 내용카드 버튼은 실제 DB/API 흐름으로 동작해야 한다.

## Tables

- `gs_users`
  - Home Assistant 사용자 ID와 Green Smart 역할/상태/권한 요약을 저장한다.
  - `uq_gs_users_ha_user`로 HA user ID를 unique key로 관리한다.
- `gs_approval_requests`
  - 사용자 승인 요청, 권한 변경 요청, 자동제어 활성화 요청, 안전 리밋 변경 요청 같은 승인 대기 작업을 저장한다.
- `gs_audit_logs`
  - 역할 변경, 승인/반려 처리, 권한/안전/기록 변경 이력을 저장한다.

## API

users-permissions API and working card APIs:

```text
GET /api/green_smart/rebuild/settings/users-permissions
hass.callApi("GET", "green_smart/rebuild/settings/users-permissions")
```

Create current-user access request:

```text
POST /api/green_smart/rebuild/settings/approval-request
hass.callApi("POST", "green_smart/rebuild/settings/approval-request", {})
```

Approve/reject approval-card rows:

```text
POST /api/green_smart/rebuild/settings/approval-requests/{request_id}/decision
body: { "decision": "approve" | "reject", "memo": "..." }
```

Create permission-matrix change request:

```text
POST /api/green_smart/rebuild/settings/permission-change-request
body: { "bucket": "실행", "requestedRole": "farm_staff", "note": "..." }
```

Update user role/status from the user-list card action:

```text
PATCH /api/green_smart/rebuild/settings/users/{ha_user_id}
body: { "role": "admin" | "farm_owner" | "farm_staff", "status": "active" | "pending" | "disabled" }
```

All write APIs insert `gs_audit_logs` rows.

## Runtime behavior

- API 호출 시 현재 Home Assistant 로그인 사용자를 `gs_users`에 idempotent upsert한다.
- 승인 요청과 감사 로그는 DB 테이블에서 최신순으로 읽는다.
- 화면은 `data-r7-settings-users-data-source`로 데이터 출처를 표시한다.
- `GREEN_SMART_SCHEMA_BOOTSTRAP=0`이어도 사용자/권한 read/write views는 settings schema와 함께 등록된다.
- `승인 필요 작업` 카드의 승인/반려 버튼은 `gs_approval_requests.status`를 갱신하고 감사 로그를 남긴다.
- `권한 버킷 매트릭스` 카드의 변경 요청 버튼은 즉시 권한 변경 승인 요청을 생성한다.
- `사용자 목록` 카드의 역할 변경 버튼은 관리자 권한으로 `gs_users.role/status/permission_summary`를 갱신한다.

## Rule

더미 데이터 금지. 설정 > 사용자·권한 화면은 프론트에 박힌 `admin/owner01/staff01/staff02/viewer01/retired01` 배열을 source of truth로 사용하지 않는다. 비어 있는 DB는 비어 있는 승인/감사 상태로 표시해야 하며, 사용자는 현재 HA 사용자 upsert 결과만 표시한다.

## Verification

- Focused users-permissions contracts: `35 passed`
- Full suite: `1522 passed`
