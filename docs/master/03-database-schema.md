# 3. DB 구상도 — RBAC-first Target Database Schema

> 기준일: `2026-06-28`
> 기준 버전: `v1.14.7`
> 문서 목적: Green Smart rebuild의 DB를 **RBAC-first target schema**로 새로 정의한다. 기존 legacy physical schema is adapter-only이며, 제품/API/문서 방향은 이 문서를 기준으로 한다.

## 0. 중요한 범위 선언

- 이 문서는 **목표 DB 설계도**다.
- 실제 운영 DB migration은 별도 승인 slice 전까지 금지한다.
- 기존 물리 테이블/컬럼명은 구현 호환 adapter에서만 다룬다.
- 새 제품 방향은 `gs_` prefix, `crop_cycle`, `currentCrop`, RBAC permission, audit/event 중심이다.
- 실행/제어/승인/안전은 모두 user/role/permission/audit trail을 남겨야 한다.

---

## 1. Target schema principles

1. 모든 write/approve/execute/ack/clear 요청은 RBAC permission과 audit event를 거친다.
2. `farm → zone → crop_cycle`이 운영 context의 기본 축이다.
3. crop cycle은 제품/API canonical 용어다. legacy `season` naming은 목표 모델에 사용하지 않는다.
4. 추천과 실행은 분리한다: recommendation은 명령이 아니며, approval과 Safety/Interlock을 통과해야 execution command가 된다.
5. raw sensor 장기 시계열은 외부 저장소와 병행할 수 있으나, 운영 판단 snapshot은 RDB에 재현 가능하게 저장한다.
6. DB field는 snake_case를 사용한다. Frontend camelCase는 adapter에서만 허용한다.
7. `read_only`, `execution_enabled`는 API/context 수준에서 명시한다.
8. `v1.14.7` RS-017의 `currentCropAssignment`는 DB table이 아니라 read model projection이다. legacy physical schema is adapter-only이며 `sourceRowId`는 legacy row evidence로만 보존한다. No DB migration in RS-017.

---

## 2. RBAC and audit core

### 2.1 `gs_users`

```sql
CREATE TABLE gs_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ha_user_id VARCHAR(128) UNIQUE NULL,
  login_name VARCHAR(128) NULL,
  display_name VARCHAR(128) NOT NULL,
  status ENUM('active','disabled','invited') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 `gs_roles`

```sql
CREATE TABLE gs_roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name_ko VARCHAR(128) NOT NULL,
  description TEXT NULL,
  built_in TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Built-in roles:

| code | name_ko | 방향 |
|---|---|---|
| `admin` | 관리자 | 시스템/스키마/권한/장치 매핑 관리 |
| `farm_owner` | 농장주 | 운영 승인, 전략 검토, 주요 설정 |
| `farm_staff` | 농장직원 | 기록 입력, 상태 확인, 제한된 작업 |

### 2.3 `gs_permissions`

```sql
CREATE TABLE gs_permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(128) NOT NULL UNIQUE,
  description TEXT NULL,
  risk_level ENUM('read','write','approve','execute','admin') NOT NULL DEFAULT 'read',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Core permission seed:

```text
home_context.read
crop_cycle.read
crop_cycle.write
crop_cycle.delete
growth_observation.write
pest_scouting.write
treatment_record.write
device.mapping.manage
recommendation.read
recommendation.approve
execution.dry_run
execution.command
safety.rule.manage
safety.event.ack
safety.event.clear
settings.manage
rbac.manage
audit.read
```

### 2.3.1 RBAC permission naming boundary

```text
Target permission seed remains `gs_permissions.code`
Compatibility permission aliases are adapter-only
manage_crop_seasons -> crop_cycle.write
edit_crop_records -> growth_observation.write
run_dry_run -> execution.dry_run
execute_final_targets -> execution.command
manage_users_roles -> rbac.manage
system_settings -> settings.manage
```

Legacy compatibility strings may be accepted by adapters while existing routes remain live, but target docs/API/rebuild UI must use `gs_permissions.code` names.

### 2.4 `gs_user_role_assignments`

```sql
CREATE TABLE gs_user_role_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  farm_id BIGINT NULL,
  zone_id BIGINT NULL,
  rbac_scope_type ENUM('global','farm','zone') NOT NULL DEFAULT 'farm',
  assigned_by_user_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES gs_users(id),
  FOREIGN KEY (role_id) REFERENCES gs_roles(id),
  INDEX idx_gs_user_role_scope (user_id, farm_id, zone_id, revoked_at)
);
```

### 2.5 `gs_role_permission_grants`

```sql
CREATE TABLE gs_role_permission_grants (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES gs_roles(id),
  FOREIGN KEY (permission_id) REFERENCES gs_permissions(id)
);
```

### 2.6 `gs_audit_events`

```sql
CREATE TABLE gs_audit_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NULL,
  zone_id BIGINT NULL,
  actor_user_id BIGINT NULL,
  actor_type ENUM('user','system','scheduler','adapter') NOT NULL DEFAULT 'user',
  action_code VARCHAR(128) NOT NULL,
  required_permission_code VARCHAR(128) NULL,
  result_status ENUM('allowed','blocked','created','updated','deleted','failed') NOT NULL,
  reason_code VARCHAR(128) NULL,
  request_json JSON NULL,
  result_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gs_audit_lookup (farm_id, zone_id, action_code, created_at)
);
```

---

## 3. Farm, zone, and crop cycle core

### 3.1 `gs_farms`

```sql
CREATE TABLE gs_farms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  site_code VARCHAR(64) NULL,
  location_name VARCHAR(128) NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 `gs_zones`

```sql
CREATE TABLE gs_zones (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  name VARCHAR(128) NOT NULL,
  zone_kind ENUM('crop_zone','nutrient_zone','weather_zone','virtual_zone') NOT NULL DEFAULT 'crop_zone',
  current_crop_cycle_id BIGINT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES gs_farms(id),
  INDEX idx_gs_zones_farm (farm_id, active, sort_order)
);
```

### 3.3 `gs_crop_cycles`

```sql
CREATE TABLE gs_crop_cycles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  crop_code VARCHAR(64) NOT NULL,
  crop_label_ko VARCHAR(128) NOT NULL,
  variety_name VARCHAR(128) NULL,
  cycle_name VARCHAR(128) NOT NULL,
  growth_stage VARCHAR(128) NULL,
  status ENUM('planned','active','paused','completed','demolished') NOT NULL DEFAULT 'planned',
  plant_date DATE NULL,
  expected_harvest_date DATE NULL,
  actual_end_date DATE NULL,
  created_by_user_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES gs_farms(id),
  INDEX idx_gs_crop_cycles_farm_status (farm_id, status, plant_date)
);
```

### 3.4 `gs_zone_crop_cycle_assignments`

```sql
CREATE TABLE gs_zone_crop_cycle_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NOT NULL,
  crop_cycle_id BIGINT NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unassigned_at DATETIME NULL,
  assigned_by_user_id BIGINT NULL,
  FOREIGN KEY (farm_id) REFERENCES gs_farms(id),
  FOREIGN KEY (zone_id) REFERENCES gs_zones(id),
  FOREIGN KEY (crop_cycle_id) REFERENCES gs_crop_cycles(id),
  INDEX idx_gs_zone_current_crop (farm_id, zone_id, is_current, unassigned_at)
);
```

---

## 4. Observation and work records

### 4.1 `gs_growth_observations`

```sql
CREATE TABLE gs_growth_observations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NOT NULL,
  crop_cycle_id BIGINT NOT NULL,
  observed_at DATETIME NOT NULL,
  actor_user_id BIGINT NULL,
  growth_stage VARCHAR(128) NULL,
  leaf_length_mm DECIMAL(10,2) NULL,
  leaf_width_mm DECIMAL(10,2) NULL,
  leaf_count INT NULL,
  plant_height_mm DECIMAL(10,2) NULL,
  fresh_weight_g DECIMAL(10,2) NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gs_growth_cycle (crop_cycle_id, zone_id, observed_at)
);
```

### 4.2 `gs_pest_scouting_records`

```sql
CREATE TABLE gs_pest_scouting_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NOT NULL,
  crop_cycle_id BIGINT NOT NULL,
  scouted_at DATETIME NOT NULL,
  actor_user_id BIGINT NULL,
  pest_code VARCHAR(128) NULL,
  severity ENUM('none','low','medium','high','critical') NOT NULL DEFAULT 'none',
  location_note VARCHAR(255) NULL,
  evidence_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gs_pest_cycle (crop_cycle_id, zone_id, scouted_at)
);
```

### 4.3 `gs_treatment_records`

```sql
CREATE TABLE gs_treatment_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NOT NULL,
  crop_cycle_id BIGINT NOT NULL,
  treated_at DATETIME NOT NULL,
  actor_user_id BIGINT NULL,
  treatment_type ENUM('pesticide','biological','physical','other') NOT NULL,
  material_json JSON NULL,
  dosage_json JSON NULL,
  pls_check_json JSON NULL,
  mix_check_json JSON NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gs_treatment_cycle (crop_cycle_id, zone_id, treated_at)
);
```

---

## 5. Device, entity, and sensor core

### 5.1 `gs_devices`

```sql
CREATE TABLE gs_devices (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  device_code VARCHAR(128) NOT NULL,
  device_label VARCHAR(128) NOT NULL,
  device_kind ENUM('sensor','actuator','controller','gateway','virtual') NOT NULL,
  domain ENUM('environment','irrigation','device','safety','crop') NOT NULL,
  capability_json JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_gs_device_code (farm_id, device_code)
);
```

### 5.2 `gs_device_entity_bindings`

```sql
CREATE TABLE gs_device_entity_bindings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  device_id BIGINT NOT NULL,
  ha_entity_id VARCHAR(255) NOT NULL,
  control_role VARCHAR(128) NULL,
  read_only TINYINT(1) NOT NULL DEFAULT 0,
  execution_enabled TINYINT(1) NOT NULL DEFAULT 0,
  validation_status ENUM('unknown','valid','invalid','unavailable') NOT NULL DEFAULT 'unknown',
  validation_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES gs_devices(id),
  UNIQUE KEY uq_gs_device_entity (farm_id, ha_entity_id, control_role)
);
```

### 5.3 `gs_sensor_observations`

```sql
CREATE TABLE gs_sensor_observations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  device_id BIGINT NULL,
  observation_type VARCHAR(128) NOT NULL,
  value_num DECIMAL(16,4) NULL,
  value_text VARCHAR(255) NULL,
  unit VARCHAR(32) NULL,
  quality ENUM('ok','stale','missing','estimated','out_of_range') NOT NULL DEFAULT 'ok',
  measured_at DATETIME NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gs_sensor_lookup (farm_id, zone_id, observation_type, measured_at)
);
```

---

## 6. Strategy, recommendation, approval, and execution

### 6.1 `gs_strategy_runs`

```sql
CREATE TABLE gs_strategy_runs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  crop_cycle_id BIGINT NULL,
  strategy_domain ENUM('crop','environment','irrigation','device','safety') NOT NULL,
  input_snapshot_json JSON NOT NULL,
  output_json JSON NOT NULL,
  calculated_by VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gs_strategy_scope (farm_id, zone_id, crop_cycle_id, strategy_domain, created_at)
);
```

### 6.2 `gs_recommendations`

```sql
CREATE TABLE gs_recommendations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  strategy_run_id BIGINT NULL,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  crop_cycle_id BIGINT NULL,
  recommendation_type VARCHAR(128) NOT NULL,
  recommendation_json JSON NOT NULL,
  decision_status ENUM('draft','review_required','approved','rejected','expired') NOT NULL DEFAULT 'review_required',
  safety_decision_json JSON NULL,
  interlock_result_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_run_id) REFERENCES gs_strategy_runs(id)
);
```

### 6.3 `gs_approval_requests`

```sql
CREATE TABLE gs_approval_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  crop_cycle_id BIGINT NULL,
  recommendation_id BIGINT NULL,
  requested_permission_code VARCHAR(128) NOT NULL,
  approval_status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  requested_by_user_id BIGINT NULL,
  approved_by_user_id BIGINT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  FOREIGN KEY (recommendation_id) REFERENCES gs_recommendations(id)
);
```

### 6.4 `gs_execution_commands`

```sql
CREATE TABLE gs_execution_commands (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  crop_cycle_id BIGINT NULL,
  approval_request_id BIGINT NULL,
  actor_user_id BIGINT NULL,
  command_domain ENUM('environment','irrigation','device','safety') NOT NULL,
  command_json JSON NOT NULL,
  dry_run TINYINT(1) NOT NULL DEFAULT 1,
  execution_enabled TINYINT(1) NOT NULL DEFAULT 0,
  required_permission_code VARCHAR(128) NOT NULL,
  safety_decision_json JSON NOT NULL,
  interlock_result_json JSON NOT NULL,
  command_status ENUM('created','blocked','queued','sent','cancelled') NOT NULL DEFAULT 'created',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.5 `gs_execution_results`

```sql
CREATE TABLE gs_execution_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  execution_command_id BIGINT NOT NULL,
  result_status ENUM('success','failed','blocked','timeout','dry_run') NOT NULL,
  ha_service_call_json JSON NULL,
  before_state_json JSON NULL,
  after_state_json JSON NULL,
  verification_json JSON NULL,
  error_message TEXT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (execution_command_id) REFERENCES gs_execution_commands(id)
);
```

---

## 7. Safety, interlock, failsafe, and events

### 7.1 `gs_safety_rules`

```sql
CREATE TABLE gs_safety_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  domain ENUM('crop','environment','irrigation','device','safety') NOT NULL,
  rule_code VARCHAR(128) NOT NULL,
  rule_json JSON NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_gs_safety_rule (farm_id, zone_id, domain, rule_code)
);
```

### 7.2 `gs_interlock_rules`

```sql
CREATE TABLE gs_interlock_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  crop_cycle_id BIGINT NULL,
  domain ENUM('crop','environment','irrigation','device','safety') NOT NULL,
  rule_code VARCHAR(128) NOT NULL,
  condition_json JSON NOT NULL,
  action_on_match ENUM('block','require_confirmation','warn','failsafe') NOT NULL DEFAULT 'block',
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 7.3 `gs_failsafe_events`

```sql
CREATE TABLE gs_failsafe_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NOT NULL,
  zone_id BIGINT NULL,
  crop_cycle_id BIGINT NULL,
  event_code VARCHAR(128) NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
  event_status ENUM('active','acknowledged','cleared') NOT NULL DEFAULT 'active',
  source_json JSON NULL,
  acknowledged_by_user_id BIGINT NULL,
  cleared_by_user_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at DATETIME NULL,
  cleared_at DATETIME NULL,
  INDEX idx_gs_failsafe_status (farm_id, zone_id, event_status, created_at)
);
```

---

## 8. Configuration, integration, and external adapters

### 8.1 `gs_system_settings`

```sql
CREATE TABLE gs_system_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  farm_id BIGINT NULL,
  setting_key VARCHAR(128) NOT NULL,
  setting_json JSON NOT NULL,
  secret_ref VARCHAR(255) NULL,
  updated_by_user_id BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_gs_setting (farm_id, setting_key)
);
```

### 8.2 `gs_external_adapter_states`

```sql
CREATE TABLE gs_external_adapter_states (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  adapter_code VARCHAR(128) NOT NULL,
  farm_id BIGINT NULL,
  status ENUM('ok','degraded','failed','disabled') NOT NULL DEFAULT 'ok',
  last_success_at DATETIME NULL,
  last_error_at DATETIME NULL,
  state_json JSON NULL,
  UNIQUE KEY uq_gs_adapter_state (adapter_code, farm_id)
);
```

---

## 9. Legacy adapter boundary

legacy physical schema is adapter-only.

| Target concept | Target name | Legacy adapter source |
|---|---|---|
| crop cycle | `gs_crop_cycles`, `crop_cycle_id`, `currentCrop` | old crop season table/fields only inside adapter |
| farm | `gs_farms`, `farm_id` | old greenhouse/site field only inside adapter |
| RBAC | `gs_users`, `gs_roles`, `gs_permissions` | old role mapping table only inside adapter |
| device binding | `gs_device_entity_bindings` | old entity mapping table only inside adapter |

Rules:

- 새 제품/API/docs에서 legacy table/field name을 방향성으로 쓰지 않는다.
- adapter code may read legacy physical names, but response DTO must use target names.
- Physical migration requires explicit user approval, backup, rollback SQL, rehearsal, and prod cutover plan.
- RS-008 writes this target schema only; it does not run migration.

---

## 10. API/RBAC mapping baseline

| API | Permission | DB target | 실행 가능 여부 |
|---|---|---|---|
| `GET /api/green_smart/rebuild/home/context` | `home_context.read` | `gs_farms`, `gs_zones`, `gs_crop_cycles` future source | `readOnly: true`, `executionEnabled: false` |
| `GET /api/green_smart/crop-cycles` | `crop_cycle.read` | `gs_crop_cycles` | 읽기 |
| `POST /api/green_smart/crop-cycles` | `crop_cycle.write` | `gs_crop_cycles` | 쓰기, audit 필요 |
| `POST /api/green_smart/recommendations/{id}/approve` | `recommendation.approve` | `gs_approval_requests` | 승인만, 실행 아님 |
| `POST /api/green_smart/execution-commands/dry-run` | `execution.dry_run` | `gs_execution_commands`, `gs_execution_results` | Dry Run only |
| `POST /api/green_smart/execution-commands` | `execution.command` | `gs_execution_commands`, `gs_execution_results` | Safety/Interlock 필수 |

---

## 11. Completion criteria for schema design

### 10.1 Read-only adapter from legacy physical schema to target DTO

```text
Read-only adapter from legacy physical schema to target DTO
crop_seasons is read through adapter-only repository
external DTO uses crop_cycle/currentCrop
```

The RS-013 adapter may read `crop_seasons` and `zones` as physical compatibility sources, but target product/API docs must not treat those physical names as product schema direction. The external context DTO uses `currentCrop.crop_cycle_id`, `crop_cycle`, `activeCropCycleId`, and `compatibilityAliases.cropSeasonId`.

## 11. Completion criteria for schema design

- [x] RBAC core tables are target-named and permission-driven.
- [x] crop cycle is canonical product/API naming.
- [x] recommendation/approval/execution are separate tables.
- [x] safety/interlock/failsafe tables are explicit.
- [x] legacy physical schema is adapter-only.
- [x] No production migration is implied by this document.


## VS-N002 Crop cycle recording scaffold DB boundary

```text
VS-N002 Crop cycle recording scaffold
No DB migration in VS-N002
legacy physical crop_seasons remains adapter-only
dbMigrationEnabled = false
```

Physical `crop_seasons` remains the current compatibility source. Product-facing docs and DTOs use `crop_cycle/currentCrop`.


## VS-N003 Real-time monitoring read-only scaffold DB boundary

```text
VS-N003 Real-time monitoring read-only scaffold
No DB migration in VS-N003
No sensor_readings query adapter in VS-N003
dbMigrationEnabled = false
```

Physical `sensor_readings` remains a historical/current compatibility source, but VS-N003 does not read it.


## VS-N004 Interlock/Safety core scaffold DB boundary

```text
VS-N004 Interlock/Safety core scaffold
No DB migration in VS-N004
dbMigrationEnabled = false
```

Physical safety/interlock/audit tables remain current compatibility sources, but VS-N004 does not read, write, create, or rename them.
