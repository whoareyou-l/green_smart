# RS-011 RBAC Permission Naming Boundary

> 기준 버전: `v1.12.25`
> Status: active boundary contract
> 목적: 기존 role/permission 문자열이 새 제품 권한 모델로 보이지 않도록 compatibility alias와 `gs_permissions.code` target permission 경계를 고정한다.

## 0. Boundary decision

```text
Compatibility permission labels are adapter-only
Product-facing permission names use gs_permissions target codes
No role table migration in RS-011
No production permission removal in RS-011
```

RS-011은 permission naming boundary와 adapter alias 해석만 다룬다. 기존 HA 사용자 role store, legacy panel permission strings, physical compatibility table은 제거하지 않는다.

---

## 1. Compatibility alias map

| Compatibility permission | Product-facing target permission |
|---|---|
| manage_crop_seasons -> crop_cycle.write | `crop_cycle.write` |
| delete_crop_records -> crop_cycle.delete | `crop_cycle.delete` |
| view_crop_records -> crop_cycle.read | `crop_cycle.read` |
| edit_crop_records -> growth_observation.write | `growth_observation.write` |
| edit_crop_records -> pest_scouting.write | `pest_scouting.write` |
| edit_crop_records -> treatment_record.write | `treatment_record.write` |
| run_dry_run -> execution.dry_run | `execution.dry_run` |
| execute_final_targets -> execution.command | `execution.command` |
| manual_device_control -> execution.command | `execution.command` |
| edit_entity_mapping -> device.mapping.manage | `device.mapping.manage` |
| edit_strategy_settings -> recommendation.approve | `recommendation.approve` |
| edit_interlock_rules -> safety.rule.manage | `safety.rule.manage` |
| edit_interlock_thresholds -> safety.rule.manage | `safety.rule.manage` |
| ack_safety_event -> safety.event.ack | `safety.event.ack` |
| clear_safety_event -> safety.event.clear | `safety.event.clear` |
| manage_users_roles -> rbac.manage | `rbac.manage` |
| manage_farm_staff_roles -> rbac.manage | `rbac.manage` |
| system_settings -> settings.manage | `settings.manage` |
| view_audit_logs -> audit.read | `audit.read` |

Rules:

1. Target docs, rebuild UI, and future product APIs must use target permission names.
2. Compatibility adapters may accept legacy permission strings and normalize through `RBAC_PERMISSION_ALIASES`.
3. Responses that expose legacy permission names must place them under `compatibilityAliases.permissions`.
4. Backend write/execute/admin checks should ask for target permission names and let alias helpers resolve legacy grants.

---

## 2. Code boundary

| Surface | RS-011 treatment |
|---|---|
| `rbac_policy.py` | owns `RBAC_PERMISSION_ALIASES`, `normalize_permission_aliases`, `has_permission` |
| `services/crop_service.py` | checks target permissions through `has_permission` while still accepting legacy grants |
| `green-smart-panel.js` | legacy compatibility surface; may keep old strings until UI migration |
| rebuild panel | must not render legacy permission copy |

---

## 3. Current non-goals

```text
No role table migration in RS-011
No production permission removal in RS-011
No HA user role store migration in RS-011
No frontend RBAC UI rewrite in RS-011
```

---

## 4. Completion criteria

- [x] Compatibility permission labels are adapter-only.
- [x] Product-facing permission names use `gs_permissions` target codes.
- [x] Alias helper accepts old grants for current production behavior.
- [x] Crop service uses target permission checks through alias boundary.
- [x] Master DB schema documents alias map without promoting legacy names.
- [x] Rebuild frontend remains free of legacy permission copy.
