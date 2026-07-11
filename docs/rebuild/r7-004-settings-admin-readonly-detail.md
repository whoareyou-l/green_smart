# R7-004 Settings/Admin Read-only Detail

> 기준 버전: `v1.15.24`
> Status: R7-004 complete
> user-selected scope: 설정 — RBAC/config/admin read-only detail

> R7-005+ direction note: R7-004 remains `KEEP/ADAPT` under the new target `설정` domain. It must keep its read-only, no-mutation, secret-redaction boundary while the surrounding sidebar/IA changes to the manual-first environment-control model in `r7-006-manual-first-target-domain-spec.md`.

## 1. Scope

The user selected the Settings/Admin group for the first real R7 detail subpage implementation.

R7-004 replaces the shallow `설정` placeholder with a deeper read-only detail while preserving the other R7-003 placeholders.

Implemented focus:

```text
Admin/System ownership matrix
Role ownership matrix
Permission bucket matrix
HA entity mapping metadata
Diagnostics/backup/audit export metadata
RBAC policy contract evidence
```

## 2. Implemented panel markers

```text
data-r7-settings-admin-detail
data-r7-settings-admin-readonly-boundary="true"
data-r7-settings-admin-role-ownership
data-r7-settings-admin-permission-buckets
data-r7-settings-admin-area="user-role-mapping"
data-r7-settings-admin-area="ha-entity-mapping"
data-r7-settings-admin-area="system-config-metadata"
data-r7-settings-admin-area="diagnostics-backup-audit"
data-r7-settings-admin-area="rbac-policy-contract"
data-r7-settings-admin-farm-owner-staff-scope
data-r7-settings-admin-secret-redaction
data-r7-settings-admin-backend-enforcement
```

## 3. Source evidence

R7-004 renders policy evidence from the existing pure policy/scaffold baseline:

```text
custom_components/green_smart/rbac_policy.py
docs/rebuild/vs-n001-rbac-admin-ownership-scaffold.md
```

Evidence terms surfaced in the UI:

```text
RBAC_ROLE_OWNERSHIP
RBAC_PERMISSION_BUCKETS
RBAC_ADMIN_OWNERSHIP
RBAC_BACKEND_ENFORCED_ACTION_CLASSES
manage_farm_staff_roles
system_settings
edit_entity_mapping
view_audit_logs
```

## 4. Read-only ownership summary

| Area | Owner/scope | R7-004 behavior |
|---|---|---|
| User/role mapping | admin owns all; farm_owner only farm_staff assignment evidence | read-only summary only |
| HA entity mapping | admin | metadata only |
| System config metadata | admin | raw secrets redacted |
| Diagnostics/backup/audit export | admin; farm_owner summary may be future slice | metadata only |
| RBAC policy contract | backend enforcement required | evidence only |

## 5. Boundaries

```text
No API route change in R7-004
No DB migration in R7-004
No execution authority in R7-004
No role assignment mutation in R7-004
No settings save/delete in R7-004
No raw secrets in R7-004
No approval/override release in R7-004
No SafetyGuard/Interlock runtime behavior change in R7-004
No MQTT/device command in R7-004
```

R7-004 intentionally does not add save, delete, role assignment, HA mapping edit, diagnostic export, service call, or device command controls.

## 6. Secret handling

The page may show that a secret field exists, but values are never rendered.

```text
[REDACTED]
```

## 7. Next slice

```text
R7-005 Next real detail subpage implementation
```

R7-005 should ask which remaining group should be implemented deeply next: 작물 중심 운영, 추천·실행 검토, 현장 상태, or 운영 홈.
