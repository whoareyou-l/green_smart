# VS-N001 RBAC/Admin Ownership Scaffold

> 기준 버전: `v1.15.01`
> 상태: first from-scratch rebuild slice scaffold
> 원칙: backend permission enforcement before UI-only hiding

---

## 1. Direction and non-goals

VS-N001은 새 리빌딩의 첫 slice다. 기존 RBAC 구현과 Admin/System UI는 reference/evidence로만 사용한다.

Non-goals:

```text
No DB migration
No prod stack change
No physical MQTT/device hookup
No existing RBAC runtime rewrite in this planning slice
No old RB-007 continuation
```

---

## 2. Role ownership matrix

| Role | Korean label | Primary ownership | May do | Must not own |
|---|---|---|---|---|
| `admin` | 어드민 | System setup, HA mapping, RBAC, diagnostics, config/secrets metadata | manage users/roles, system settings, entity mapping, diagnostics, backup/audit | daily farm operation as the default UX |
| `farm_owner` | 농장주 | Farm operation responsibility, approvals, strategy review, high-impact execution review | view summaries, approve strategies, review audit, execute allowed high-impact actions after gate | raw secrets/API tokens, low-level HA diagnostics by default |
| `farm_staff` | 농장직원 | Daily work, records, routine checks | enter crop records, view assigned monitoring, acknowledge allowed routine items | role mapping, system config, broad execute authority |

Identity source baseline:

```text
HA user ID remains the identity source
Home Assistant user ID → Green Smart role → permissions
```

---

## 3. Permission bucket matrix

All UI and backend actions are classified through the product buckets:

```text
조회 / 기록 / 전략 / 실행 / 안전 / 고급설정
```

| Bucket | Typical permissions | Primary roles | Backend enforcement required? |
|---|---|---|---|
| 조회 | `view_dashboard`, `view_control_pages`, `view_crop_records` | all roles, scope-limited | yes for scoped data |
| 기록 | `edit_crop_records`, `manage_crop_seasons` | farm_staff, farm_owner, admin | yes for save/delete |
| 전략 | `edit_strategy_settings`, `approve_strategy` | farm_owner, admin | yes for save/apply |
| 실행 | `run_dry_run`, `execute_final_targets`, `manual_device_control` | farm_owner, admin, limited staff | yes for execute/apply |
| 안전 | `ack_safety_event`, `clear_safety_event`, `approve_interlock_override` | farm_owner, admin | yes for ack/clear/override |
| 고급설정 | `system_settings`, `manage_users_roles`, `edit_entity_mapping` | admin | yes for all writes |

---

## 4. UI display state contract

UI visibility states are presentation only and must not be treated as security boundaries.

| State | Meaning |
|---|---|
| `visible_enabled` | 권한과 안전 조건이 맞아 사용 가능 |
| `visible_disabled` | 표시하지만 비활성, 이유와 다음 행동 표시 |
| `summary_only` | 기술 상세 없이 요약만 표시 |
| `hidden` | 역할상 무관하거나 보안상 숨김 |

Backend still checks permissions for every write/execute/save/delete/ack/clear/apply request.

---

## 5. Admin/System ownership matrix

| Admin/System area | Owner | Notes |
|---|---|---|
| User/role mapping | `admin` | `farm_owner can manage farm_staff role assignment` is a Question gate, not default |
| HA entity mapping | `admin` | farm_owner may view summary later if approved |
| API/Central/weather/pesticide config metadata | `admin` | raw secrets stay hidden/redacted |
| Diagnostics/backup/audit export | `admin` | farm_owner may receive summary_only audit review later |
| RBAC policy docs/contracts | `admin` ownership, product reviewed | implementation must remain backend-enforced |

---

## 6. Backend enforcement contract

Principle:

```text
backend permission enforcement before UI-only hiding
```

The following action classes require backend permission enforcement:

```text
write/execute/save/delete/ack/clear/apply
```

Required backend checks:

1. Resolve HA user ID.
2. Resolve Green Smart role.
3. Resolve permissions for role.
4. Check action permission.
5. Apply Safety/Interlock gate when action affects execution/safety.
6. Return denial reason suitable for farm_owner/farm_staff wording.
7. Log/audit high-impact denial or approval action when applicable.

---

## 7. DB/migration boundary

No DB migration in this scaffold slice.

Current physical data sources remain reference:

```text
green_smart_admin_role_mappings
green_smart_admin_system_config
green_smart_admin_diagnostics
green_smart_admin_backups
```

Any proposal to create/rename physical RBAC tables is a Question gate and requires user confirmation.

---

## 8. Interface/API ownership

Current reference API:

```text
GET /api/green_smart/auth/me
```

Future target may introduce explicit admin/RBAC API ownership, but route path breaking changes are forbidden. Compatibility adapters must preserve existing route behavior until a migration is approved.

---

## 9. Question gate

Ask the user one question at a time if any of the following becomes necessary:

1. Should `farm_owner can manage farm_staff role assignment` become allowed?
2. Should `role mapping stays HA-user-ID based` remain permanent, or move to Green Smart-owned users?
3. Is any `farm_staff write/execute permission expansion` needed beyond current baseline?
4. Should `DB physical RBAC tables should be migrated` or renamed?

Default until confirmed:

```text
admin owns system config, HA mapping, diagnostics, secrets/config metadata.
farm_owner may assign or revoke farm_staff role for operational convenience.
farm_owner owns approvals/strategy/high-impact operations.
farm_staff owns daily records and allowed routine actions.
HA user ID remains the identity source.
No DB migration.
```

Confirmed decision: farm_owner can manage farm_staff role assignment for operational convenience. This permission is limited to assigning/revoking `farm_staff` role and must not grant farm_owner access to admin-only system config, raw secrets, HA diagnostics, DB migration, or global admin role assignment.

---

## 10. Policy module scaffold

The first runtime scaffold is a Home Assistant independent policy module:

```text
custom_components/green_smart/rbac_policy.py
```

Required policy helpers/markers:

```text
manage_farm_staff_roles
can_assign_role
RBAC_ROLE_OWNERSHIP
RBAC_PERMISSION_BUCKETS
RBAC_ADMIN_OWNERSHIP
RBAC_BACKEND_ENFORCED_ACTION_CLASSES
```

The existing HA-dependent `rbac.py` may import/re-export this pure policy for compatibility, but the policy module itself must not import Home Assistant or aiohttp.

## 11. Role assignment authorization API

VS-N001-B adds a backend-enforced role assignment surface without DB migration:

```text
POST /api/green_smart/auth/roles/{ha_user_id}
```

Request body:

```json
{"role": "farm_staff"}
```

Decision helper:

```text
role_assignment_authorization
assignmentDecision
role_assignment_not_allowed
```

Policy:

```text
admin may assign/revoke admin, farm_owner, farm_staff.
farm_owner may assign/revoke farm_staff only.
farm_staff may not assign roles.
No DB migration.
```

Denied assignments return HTTP 403 with `assignmentDecision` and `reasonCode = role_assignment_not_allowed`.

## 12. VS-N001-C Admin/System role assignment UI adapter

Admin/System role UI must use the backend role assignment API first:

```text
assignRole
POST /api/green_smart/auth/roles/{ha_user_id}
data-admin-role-api-status
role_mapping_saved_via_api
role_mapping_saved_fallback_localstorage
```

Rules:

```text
localStorage-only role mapping is compatibility fallback.
Backend API is the primary save path.
UI text must state backend permission enforcement.
farm_owner can assign/revoke farm_staff only.
```

## 13. VS-N001-D role assignment behavior smoke

This step verifies the Admin/System role-assignment flow with source-level behavior smoke before any Prod deployment.

```text
source-level behavior smoke
Backend API success status
Backend API failure fallback status
assignmentDecision preservation
No Prod sync in this smoke step
```

Smoke scope:

```text
_saveAdminRoleMapping uses assignRole before fallback.
Successful API responses preserve assignmentDecision.
Failed API responses show Backend API failure fallback status.
localStorage remains compatibility fallback only.
UI explains backend reasonCode for denied role assignment.
```

## 14. Next implementation tasks

1. Keep this scaffold as the contract baseline.
2. Add future RED tests for a new RBAC/Admin scaffold module only after this documentation slice is green.
3. Do not wire runtime changes until the next implementation task explicitly scopes them.
4. If a role conflict appears, stop and ask one `clarify` question.
