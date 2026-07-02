# R7-075 Settings users-permissions DB binding

Status: current baseline for `v1.14.41`.

## Why

설정 > 사용자·권한 화면에 `admin`, `owner01`, `staff01` 같은 프론트 하드코딩 값이 남아 있으면 운영 화면이 실제 상태를 보여주지 못한다. 이 영역은 DB와 API를 통해 읽어야 한다.

## Tables

- `gs_users`
  - Home Assistant 사용자 ID와 Green Smart 역할/상태/권한 요약을 저장한다.
  - `uq_gs_users_ha_user`로 HA user ID를 unique key로 관리한다.
- `gs_approval_requests`
  - 사용자 승인 요청, 자동제어 활성화 요청, 안전 리밋 변경 요청 같은 승인 대기 작업을 저장한다.
- `gs_audit_logs`
  - 역할 변경, 승인 처리, 권한/안전/기록 변경 이력을 저장한다.

## API

users-permissions API:

```text
GET /api/green_smart/rebuild/settings/users-permissions
```

Frontend `hass.callApi` path:

```text
green_smart/rebuild/settings/users-permissions
```

응답은 `users`, `approvalRows`, `auditRows`, `counts`, `source`를 반환한다.

## Runtime behavior

- API 호출 시 현재 Home Assistant 로그인 사용자를 `gs_users`에 idempotent upsert한다.
- 승인 요청과 감사 로그는 DB 테이블에서 최신순으로 읽는다.
- 화면은 `data-r7-settings-users-data-source`로 데이터 출처를 표시한다.

## Rule

더미 데이터 금지. 설정 > 사용자·권한 화면은 프론트에 박힌 `admin/owner01/staff01/staff02/viewer01/retired01` 배열을 source of truth로 사용하지 않는다. 비어 있는 DB는 비어 있는 승인/감사 상태로 표시해야 하며, 사용자는 현재 HA 사용자 upsert 결과만 표시한다.
