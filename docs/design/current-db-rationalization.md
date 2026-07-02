# Current DB Rationalization

Version: `1.14.53`

운영 DB 구조 변경 없음. 이 문서는 DB-00/DB-01 baseline으로, 현재 운영 MariaDB `homeassistant` DB의 59개 테이블을 HA 기본 테이블, Green Smart 레거시/호환 테이블, Green Smart 현재/신규 테이블로 분류하고 레거시 사용 금지 경계를 고정한다.

Total tables: `59`

## DB-00 보호 원칙

- HA recorder 테이블은 Green Smart migration/drop/rename 대상이 아니다.
- 운영 DB 구조 변경 없음: 이 slice에서는 `CREATE/ALTER/DROP/RENAME/TRUNCATE`를 운영 DB에 실행하지 않는다.
- `archive/drop은 명시 승인 후` 별도 release에서만 수행한다.
- destructive SQL은 explicit migration file + approval marker 없이는 금지한다.

## DB-01 레거시 사용 금지 경계

- 신규 product/rebuild/control 코드가 레거시 테이블을 직접 SQL로 참조하지 못하게 한다.
- 현재 남아있는 직접 참조는 `docs/design/db-legacy-usage-manifest.md`에 debt marker로 격리한다.
- 이후 slice에서 `legacy_adapters/*` 또는 current canonical repositories로 옮긴다.

## HA 기본 테이블

- `event_data`
- `event_types`
- `events`
- `migration_changes`
- `recorder_runs`
- `schema_changes`
- `state_attributes`
- `states`
- `states_meta`
- `statistics`
- `statistics_meta`
- `statistics_runs`
- `statistics_short_term`

## Green Smart 레거시/호환 테이블

- `zones` → 이관 대상
- `crop_seasons` → 이관 대상
- `growth_surveys` → 이관 대상
- `pest_surveys` → 이관 대상
- `control_records` → 이관 대상
- `control_pesticides` → 이관 대상
- `devices` → 이관 대상
- `device_alarms` → 이관 대상
- `device_control_logs` → 이관 대상
- `device_failsafe_rules` → 이관 대상
- `device_groups` → 이관 대상
- `device_group_items` → 이관 대상
- `device_interlocks` → 이관 대상
- `device_status` → 이관 대상
- `ventilation_device_settings` → 이관 대상
- `screen_device_settings` → 이관 대상
- `irrigation_settings` → 이관 대상
- `sensor_readings` → 이관 대상
- `irrigation_drain_feedback` → 이관 대상
- `ai_irrigation_outputs` → 이관 대상
- `final_irrigation_targets` → 이관 대상
- `irrigation_control_logs` → 이관 대상
- `audit_logs` → 이관 대상

## Green Smart 현재/신규 테이블

- `green_smart_settings_greenhouses`
- `green_smart_settings_zones`
- `green_smart_settings_device_sensor_mappings`
- `gs_users`
- `gs_approval_requests`
- `gs_audit_logs`
- `green_smart_admin_role_mappings`
- `green_smart_admin_system_config`
- `green_smart_admin_diagnostics`
- `green_smart_admin_backups`
- `zone_control_settings`
- `zone_interlock_settings`
- `zone_control_modes`
- `zone_final_control_targets`
- `zone_control_logs`
- `zone_control_copy_jobs`
- `zone_device_entity_mappings`
- `ai_zone_control_outputs`
- `crop_interlock_approvals`
- `crop_stage_calibrations`
- `crop_model_feature_snapshots`
- `crop_model_training_snapshots`
- `edge_crop_policy_cache`

## Canonical target notes

- Zone registry canonical target: `green_smart_settings_zones`; legacy `zones` → 이관 대상
- Greenhouse registry canonical target: `green_smart_settings_greenhouses`
- Settings device/sensor mapping target: `green_smart_settings_device_sensor_mappings` and `zone_device_entity_mappings`
- Control canonical targets: `zone_control_settings`, `zone_interlock_settings`, `zone_control_modes`, `zone_final_control_targets`, `zone_control_logs`, `ai_zone_control_outputs`
- Crop record legacy tables `crop_seasons`, `growth_surveys`, `pest_surveys`, `control_records`, `control_pesticides` need explicit future current tables before physical retirement.

## Next slices

### DB-02 status

- `legacy_adapters` package introduced for explicit compatibility bridges.
- `repositories/legacy_adapters/environment_telemetry.py` now owns the remaining `sensor_readings` lookup used by edge environment telemetry scheduling.
- `__init__.py` scheduler no longer queries `sensor_readings` directly.
- 운영 DB 구조 변경 없음: adapter slice only.

### DB-02B status

- `repositories/legacy_adapters/zones.py` introduced for legacy `zones` compatibility fragments.
- `crop_repo.py no longer embeds `LEFT JOIN zones`; crop-season zone-name SQL fragments are imported from the adapter.
- Stale `config_flow.py -> zones` manifest marker removed after verifying current config flow has no `zones` SQL.
- 운영 DB 구조 변경 없음: adapter slice only.

### DB-02C status

- `rebuild_crop_context_repo.py no longer embeds `LEFT JOIN zones`; rebuild crop-context zone-name SQL fragments are imported from `repositories/legacy_adapters/zones.py`.
- Adapter now exposes `REBUILD_CROP_CONTEXT_ZONE_NAME_SELECT` and `REBUILD_CROP_CONTEXT_ZONE_LEFT_JOIN`.
- 운영 DB 구조 변경 없음: adapter slice only.

1. DB-02 follow-up: move additional direct legacy reads into `legacy_adapters/*` or canonical repositories.
2. DB-03: migrate `zones` to `green_smart_settings_zones`.
3. DB-04: create canonical crop record tables and backfill.
4. DB-05: canonicalize irrigation/device/control logs and final targets.
5. DB-07: archive/drop only after zero-write evidence and explicit user approval.
