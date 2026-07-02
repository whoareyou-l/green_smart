# Green Smart DB Rationalization / Legacy Retirement Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Stop Green Smart product code from depending on legacy tables, migrate required data into current product tables, and retire legacy tables safely without damaging HA recorder data or live production operation.

**Architecture:** Treat `homeassistant` MariaDB as a mixed database containing HA recorder tables, Green Smart legacy/compatibility tables, and Green Smart current/product tables. Do not drop or rename tables first. Add read/write boundaries and contract tests first, introduce current canonical tables where missing, backfill/migrate data, switch code reads/writes, run prod smoke, then archive/drop only after an explicit operator gate.

**Tech Stack:** Home Assistant custom integration, MariaDB/InnoDB, aiomysql, Python contract tests, JS panel contracts, Docker prod containers.

---

## Current production snapshot

- Container: `greenity-prod-mariadb`
- Database: `homeassistant`
- Total tables: `59`
- Classified snapshot file: `/tmp/homeassistant_schema_classified_ha_legacy_current.md`

### HA 기본 테이블 — do not touch

Home Assistant recorder-owned tables. Never migrate/drop/rename these from Green Smart work.

```text
event_data
event_types
events
migration_changes
recorder_runs
schema_changes
state_attributes
states
states_meta
statistics
statistics_meta
statistics_runs
statistics_short_term
```

### Green Smart legacy/compatibility tables

These are not all immediately unused. They are legacy because their physical schema predates the R7/rebuild/product DB model or belongs to earlier broad domain tables.

```text
zones
crop_seasons
growth_surveys
pest_surveys
control_records
control_pesticides
devices
device_alarms
device_control_logs
device_failsafe_rules
device_groups
device_group_items
device_interlocks
device_status
ventilation_device_settings
screen_device_settings
irrigation_settings
sensor_readings
irrigation_drain_feedback
ai_irrigation_outputs
final_irrigation_targets
irrigation_control_logs
audit_logs
```

### Green Smart current/product tables

Current R7/rebuild/settings/RBAC/control/model-oriented tables.

```text
green_smart_settings_greenhouses
green_smart_settings_zones
green_smart_settings_device_sensor_mappings
gs_users
gs_approval_requests
gs_audit_logs
green_smart_admin_role_mappings
green_smart_admin_system_config
green_smart_admin_diagnostics
green_smart_admin_backups
zone_control_settings
zone_interlock_settings
zone_control_modes
zone_final_control_targets
zone_control_logs
zone_control_copy_jobs
zone_device_entity_mappings
ai_zone_control_outputs
crop_interlock_approvals
crop_stage_calibrations
crop_model_feature_snapshots
crop_model_training_snapshots
edge_crop_policy_cache
```

## Current legacy code reference audit

Non-test Python references found under `custom_components/green_smart`:

| Legacy table | Current code references | Risk |
|---|---:|---|
| `zones` | 10 files | High — old/current zone concepts conflict with `green_smart_settings_zones` |
| `crop_seasons` | 10 files | High — crop cycle data still core to crop records/model paths |
| `growth_surveys` | 5 files | High — records workflow still uses it |
| `pest_surveys` | 4 files | High — records workflow still uses it |
| `control_records` | 6 files | High — records workflow still uses it |
| `control_pesticides` | 4 files | High — pesticide modal/history uses it |
| `devices` | 3 files | Medium — device/control scaffolds reference it |
| `sensor_readings` | 5 files | Medium/High — monitoring/control summaries reference it |
| `irrigation_settings` | 2 files | Medium — old irrigation settings path |
| `irrigation_drain_feedback` | 2 files | Medium — old irrigation feedback path |
| `irrigation_control_logs` | 2 files | Medium — old irrigation log path |
| `audit_logs` | 4 files | Medium — old audit vs `gs_audit_logs` conflict |
| device config/status group tables | mostly `db.py` only | Low/Medium — bootstrap-only but may become accidental future dependency |
| `ai_irrigation_outputs`, `final_irrigation_targets` | `db.py` only | Low/Medium — old AI irrigation path conflicts with zone final targets |

## Product DB principles

1. **No direct legacy table reads/writes from product code.** Current product code should use repositories/services that point to current tables or explicit compatibility adapters.
2. **Legacy tables are read-only during transition.** If data is needed, copy it forward; do not keep writing new records into legacy tables.
3. **One canonical entity per domain.** Example: zone registry should not be split across `zones` and `green_smart_settings_zones`.
4. **Physical drop is last.** First block usage, then migrate, then verify, then archive, then drop only after explicit approval.
5. **HA recorder is out of scope.** Do not alter `events`, `states`, `statistics*`, etc.
6. **Current product labels are Korean where operator-facing.** Keep recent correction: `green_smart_settings_zones.purpose` stores Korean labels.

## Proposed canonical target model

### Canonical settings/foundation

| Concept | Canonical table | Legacy source to retire |
|---|---|---|
| Greenhouse | `green_smart_settings_greenhouses` | none/implicit old fields |
| Zone registry | `green_smart_settings_zones` | `zones` |
| Device/sensor mapping | `green_smart_settings_device_sensor_mappings`, `zone_device_entity_mappings` | `devices`, `device_status`, old device settings tables |
| Users/permissions/approval | `gs_users`, `gs_approval_requests`, `gs_audit_logs`, `green_smart_admin_role_mappings` | `audit_logs` for app audit |

### Crop records/model

Current code still relies on `crop_seasons`, `growth_surveys`, `pest_surveys`, `control_records`, `control_pesticides`. Do not delete these until current replacements exist.

Preferred future tables should be explicitly named under current product namespace or current canonical prefix, for example:

```text
green_smart_crop_cycles
green_smart_growth_surveys
green_smart_pest_surveys
green_smart_control_records
green_smart_control_pesticides
```

Migration should preserve old IDs in `legacy_*_id` columns for traceability.

### Control/execution

| Concept | Canonical table | Legacy source to retire |
|---|---|---|
| Zone settings | `zone_control_settings` | domain-specific old settings tables |
| Interlocks | `zone_interlock_settings`, `crop_interlock_approvals` | `device_interlocks`, `device_failsafe_rules` as primary product source |
| Final targets | `zone_final_control_targets` | `final_irrigation_targets` |
| AI outputs | `ai_zone_control_outputs` | `ai_irrigation_outputs` |
| Control logs | `zone_control_logs` | `irrigation_control_logs`, `device_control_logs` as product log source |

## Implementation sequence

### Slice DB-00: Freeze destructive actions

**Objective:** Prevent accidental legacy table deletion or direct migration against production.

**Tasks:**
1. Add `docs/design/current-db-rationalization.md` with the classification above.
2. Add a static contract test that asserts HA recorder tables are protected and that destructive SQL (`DROP TABLE`, `RENAME TABLE`) is not introduced without an explicit migration file and approval marker.
3. Verify: `pytest -q tests/test_db_rationalization_boundary_contract.py`.

**Do not:** change production schema.

### Slice DB-01: Add legacy usage boundary contracts

**Objective:** Make legacy usage visible and intentionally fail when new product code imports legacy tables directly.

**Tasks:**
1. Create `tests/test_db_legacy_usage_boundary_contract.py`.
2. Allow legacy table names only in:
   - `db.py` bootstrap temporarily
   - explicit `legacy_adapters/*`
   - migration scripts
   - tests/docs
3. Fail if `rebuild_*`, `zone_control_*`, product services, or panel API views directly query legacy tables.
4. Initial expected result may be RED because current code still references many legacy tables.

### Slice DB-02: Introduce repository/adapters boundary

**Objective:** Route all DB access through repositories/services before changing physical tables.

**Tasks:**
1. Create `custom_components/green_smart/repositories/legacy_adapters/`.
2. Move legacy reads for crop records into explicit adapter classes.
3. Product services must call canonical repositories, not raw table names.
4. Add tests proving raw SQL in view files no longer names legacy tables.

### Slice DB-03: Canonical zone registry migration

**Objective:** Make `green_smart_settings_zones` the only product zone registry.

**Tasks:**
1. Add migration/backfill script from `zones` → `green_smart_settings_zones` with `legacy_zone_id` if needed.
2. Add uniqueness/label normalization checks.
3. Update code that resolves zone names to use `green_smart_settings_zones`.
4. Mark `zones` read-only compatibility source.
5. Prod smoke: create zone, verify only `green_smart_settings_zones` changes.

### Slice DB-04: Crop record canonical tables

**Objective:** Stop writing crop records into old `crop_seasons/growth_surveys/pest_surveys/control_records/control_pesticides` physical tables.

**Tasks:**
1. Decide exact current table names. Recommended:
   - `green_smart_crop_cycles`
   - `green_smart_growth_surveys`
   - `green_smart_pest_surveys`
   - `green_smart_control_records`
   - `green_smart_control_pesticides`
2. Add DDL in `db.py` or a controlled migration module.
3. Add backfill from legacy tables with `legacy_*_id` fields.
4. Update `rebuild_crop_records_views.py`, `crop_views.py`, `repositories/crop_repo.py`, and `services/crop_service.py` to read/write canonical tables.
5. Add RED tests first for “new record writes do not touch legacy tables”.

### Slice DB-05: Control/device/irrigation canonicalization

**Objective:** Stop using old domain-specific control tables as product primary sources.

**Tasks:**
1. Map `irrigation_settings` → `zone_control_settings(domain='irrigation')`.
2. Map `final_irrigation_targets` → `zone_final_control_targets(domain='irrigation')`.
3. Map `ai_irrigation_outputs` → `ai_zone_control_outputs(domain='irrigation')`.
4. Map `irrigation_control_logs` and `device_control_logs` → `zone_control_logs` where product-facing.
5. Keep raw hardware/event traces only if explicitly required.

### Slice DB-06: Audit/user/admin cleanup

**Objective:** Replace old `audit_logs` product usage with current `gs_audit_logs` or scoped admin audit tables.

**Tasks:**
1. Identify every `audit_logs` writer.
2. Replace product audit writes with `gs_audit_logs` or domain-specific current audit shape.
3. Backfill only if operationally useful.
4. Mark `audit_logs` legacy/archive.

### Slice DB-07: Legacy archive gate

**Objective:** Archive legacy tables without deleting them first.

**Tasks:**
1. Rename is still destructive enough to defer. Prefer copy to `green_smart_legacy_archive_*` or dump file first.
2. Create SQL dump: schema + data for legacy tables.
3. Add runtime checks that no product code writes to legacy tables for at least one release cycle.
4. Only after explicit user approval, run drop/rename.

## Verification commands

Use these after every slice:

```bash
node --check custom_components/green_smart/panel/green-smart-panel.js
node --check custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
python3 -m py_compile custom_components/green_smart/*.py
pytest -q
```

Prod DB smoke examples:

```bash
docker exec greenity-prod-mariadb sh -lc 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" homeassistant -e "SHOW TABLES;"'
docker exec greenity-prod-mariadb sh -lc 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" homeassistant -e "SELECT COUNT(*) FROM green_smart_settings_zones;"'
```

## Non-goals for the first cleanup pass

- Do not touch HA recorder tables.
- Do not drop legacy tables in the same release that removes code usage.
- Do not rename `homeassistant` database.
- Do not change production DB credentials or container topology.
- Do not physically connect real devices as part of DB cleanup.

## Recommended immediate next task

Start with **Slice DB-00 + DB-01 only**:

1. Create durable DB rationalization doc.
2. Add a static contract that classifies all 59 tables.
3. Add a boundary contract that fails on direct legacy table usage outside allowlisted legacy adapters.
4. Do not migrate data yet.

This gives a safe baseline and makes the remaining technical debt measurable before any destructive DB work.
