# HA Device Registry 기반 Green Smart 장치/엔티티/값 통합 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 기존 Settings 장치 연결 구조를 정리해 HA Device Registry의 미연결 장치를 Green Smart 장치로 연결하고, 해당 장치의 Entity Registry 엔티티 N개를 역할 자동 추정과 함께 저장하며, 엔티티별 현재값/시간열 데이터를 공통 테이블에 안전하게 축적한다.

**Architecture:** HA Device/Entity Registry와 HA state machine은 읽기 전용 source of truth로 유지한다. Green Smart MariaDB에는 `green_smart_devices`(장치), `green_smart_device_entities`(장치별 엔티티), `green_smart_device_entity_latest_values`(최신값 캐시), `green_smart_device_entity_samples`(공통 long-form 시간열)를 신규 canonical 모델로 둔다. 장치별 동적 테이블/동적 컬럼은 만들지 않고, `device_id + entity_id + sampled_at`으로 데이터 혼선을 방지한다.

**Tech Stack:** Home Assistant custom integration Python views, MariaDB/InnoDB, HA `device_registry`/`entity_registry` helpers, `hass.states`, rebuild panel JavaScript, pytest contract tests, Prod HA/Docker smoke.

---

## 1. Confirmed Decisions

- 장치마다 시간열 테이블을 따로 만들지 않는다.
- 시간열 데이터는 공통 long-form 테이블 하나에 저장한다.
- 장치 row에는 entity 배열 JSON을 보조 snapshot/cache로 둘 수 있지만 canonical source는 별도 entity row 테이블이다.
- 팝업 모달 엔티티 그룹에는 `역할`을 추가한다.
- `역할`은 자동 유추해 기본 채움하고, 사용자가 수정 가능하게 한다. 역할은 자동 유추 후 사용자 수정 가능으로 처리한다.
- 기존 Settings 장치 3개 테이블/API는 즉시 물리 삭제하지 않고, 새 canonical API/UI 전환 후 legacy/deprecated로 둔다. 물리 drop은 별도 승인 후 진행한다.
- 이번 slice는 HA Registry/State 읽기 + Green Smart DB 저장/캐시만 한다. HA Registry 수정, HA Recorder 수정, MQTT/HA service 실행, 실제 장치 제어는 금지한다.

## 2. Non-goals / Safety Boundaries

금지 범위:

```text
HA Device Registry 직접 수정 금지
HA Entity Registry 직접 수정 금지
HA Recorder DB 수정 금지
MQTT publish 금지
HA service call 실행 금지
실제 장치 제어 금지
기존 테이블 drop/rename 금지
기존 데이터 물리 삭제 금지
```

허용 범위:

```text
HA Device Registry 읽기
HA Entity Registry 읽기
hass.states 현재값 읽기
Green Smart 신규 canonical 테이블 생성/upsert
새 API 추가
장치 연결 모달 UI 변경
계약/문서/Prod smoke
```

## 3. Target DB Model

### 3.1 `green_smart_devices`

장치 1개당 1 row. HA Device Registry의 device를 Green Smart 구역/장비종류에 연결한 canonical 장치 테이블이다.

```sql
CREATE TABLE IF NOT EXISTS green_smart_devices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  farm_id BIGINT NOT NULL DEFAULT 1,
  zone_id VARCHAR(128) NOT NULL,
  equipment_kind VARCHAR(64) NOT NULL,
  device_name VARCHAR(128) NOT NULL,

  ha_device_id VARCHAR(255) NOT NULL,
  ha_device_name VARCHAR(128) NOT NULL DEFAULT '',
  manufacturer VARCHAR(128) NOT NULL DEFAULT '',
  model VARCHAR(128) NOT NULL DEFAULT '',
  model_id VARCHAR(128) NOT NULL DEFAULT '',
  sw_version VARCHAR(128) NOT NULL DEFAULT '',
  hw_version VARCHAR(128) NOT NULL DEFAULT '',
  serial_number VARCHAR(128) NOT NULL DEFAULT '',
  area_id VARCHAR(128) NOT NULL DEFAULT '',
  config_entry_id VARCHAR(255) NOT NULL DEFAULT '',
  integration_domain VARCHAR(128) NOT NULL DEFAULT '',

  entities_snapshot_json JSON NULL,

  status VARCHAR(32) NOT NULL DEFAULT 'active',
  connection_status VARCHAR(32) NOT NULL DEFAULT 'unknown',
  last_seen_at DATETIME NULL,
  note TEXT NULL,

  created_by VARCHAR(128) NULL,
  updated_by VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_green_smart_device_ha_device (farm_id, ha_device_id),
  KEY idx_green_smart_devices_zone (farm_id, zone_id, status),
  KEY idx_green_smart_devices_equipment (farm_id, equipment_kind, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 `green_smart_device_entities`

장치가 가진 HA entity N개를 entity 1개당 1 row로 저장한다.

```sql
CREATE TABLE IF NOT EXISTS green_smart_device_entities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  farm_id BIGINT NOT NULL DEFAULT 1,
  green_smart_device_id BIGINT NOT NULL,
  ha_device_id VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,

  entity_domain VARCHAR(64) NOT NULL DEFAULT '',
  platform VARCHAR(128) NOT NULL DEFAULT '',
  unique_id VARCHAR(255) NOT NULL DEFAULT '',
  original_name VARCHAR(128) NOT NULL DEFAULT '',
  display_name VARCHAR(128) NOT NULL DEFAULT '',
  device_class VARCHAR(64) NOT NULL DEFAULT '',
  state_class VARCHAR(64) NOT NULL DEFAULT '',
  unit_of_measurement VARCHAR(64) NOT NULL DEFAULT '',
  entity_category VARCHAR(64) NOT NULL DEFAULT '',
  disabled_by VARCHAR(64) NOT NULL DEFAULT '',
  hidden_by VARCHAR(64) NOT NULL DEFAULT '',

  entity_role VARCHAR(64) NOT NULL DEFAULT '',
  value_kind VARCHAR(64) NOT NULL DEFAULT '',
  read_write_mode VARCHAR(32) NOT NULL DEFAULT 'readonly',

  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_by VARCHAR(128) NULL,
  updated_by VARCHAR(128) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_green_smart_device_entity (farm_id, entity_id),
  KEY idx_green_smart_device_entities_device (farm_id, green_smart_device_id, status),
  KEY idx_green_smart_device_entities_ha_device (farm_id, ha_device_id, status),
  KEY idx_green_smart_device_entities_domain (farm_id, entity_domain, status),
  KEY idx_green_smart_device_entities_role (farm_id, entity_role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 `green_smart_device_entity_latest_values`

HA state machine의 현재값을 Green Smart용 latest cache로 저장한다. Source of truth는 HA state/Recorder이고 이 테이블은 캐시다.

```sql
CREATE TABLE IF NOT EXISTS green_smart_device_entity_latest_values (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  farm_id BIGINT NOT NULL DEFAULT 1,
  green_smart_device_id BIGINT NOT NULL,
  green_smart_entity_id BIGINT NOT NULL,
  ha_device_id VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,

  state_value VARCHAR(255) NOT NULL DEFAULT '',
  state_numeric DOUBLE NULL,
  state_bool TINYINT(1) NULL,
  unit_of_measurement VARCHAR(64) NOT NULL DEFAULT '',
  device_class VARCHAR(64) NOT NULL DEFAULT '',
  entity_domain VARCHAR(64) NOT NULL DEFAULT '',
  entity_role VARCHAR(64) NOT NULL DEFAULT '',
  attributes_json JSON NULL,

  ha_last_changed DATETIME NULL,
  ha_last_updated DATETIME NULL,
  sampled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  freshness_state VARCHAR(32) NOT NULL DEFAULT 'unknown',
  stale_seconds INT NULL,
  source VARCHAR(64) NOT NULL DEFAULT 'ha_state',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_green_smart_entity_latest (farm_id, entity_id),
  KEY idx_green_smart_latest_device (farm_id, green_smart_device_id),
  KEY idx_green_smart_latest_freshness (farm_id, freshness_state, sampled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 `green_smart_device_entity_samples`

시간열 축적용 공통 long-form 테이블. 장치마다 테이블을 만들지 않는다.

```sql
CREATE TABLE IF NOT EXISTS green_smart_device_entity_samples (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  farm_id BIGINT NOT NULL DEFAULT 1,
  green_smart_device_id BIGINT NOT NULL,
  green_smart_entity_id BIGINT NOT NULL,
  ha_device_id VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  sampled_at DATETIME NOT NULL,

  state_value VARCHAR(255) NOT NULL DEFAULT '',
  state_numeric DOUBLE NULL,
  state_bool TINYINT(1) NULL,
  unit_of_measurement VARCHAR(64) NOT NULL DEFAULT '',
  device_class VARCHAR(64) NOT NULL DEFAULT '',
  entity_domain VARCHAR(64) NOT NULL DEFAULT '',
  entity_role VARCHAR(64) NOT NULL DEFAULT '',
  attributes_json JSON NULL,
  ha_last_changed DATETIME NULL,
  ha_last_updated DATETIME NULL,
  freshness_state VARCHAR(32) NOT NULL DEFAULT 'unknown',
  source VARCHAR(64) NOT NULL DEFAULT 'ha_state',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_gs_samples_entity_time (farm_id, entity_id, sampled_at),
  KEY idx_gs_samples_device_time (farm_id, green_smart_device_id, sampled_at),
  KEY idx_gs_samples_role_time (farm_id, entity_role, sampled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 4. Target APIs

새 canonical route prefix는 짧고 명확하게 `/api/green_smart/devices`를 사용한다.

```text
GET    /api/green_smart/devices/ha/unlinked
GET    /api/green_smart/devices/ha/{ha_device_id}/entities
GET    /api/green_smart/devices
POST   /api/green_smart/devices
GET    /api/green_smart/devices/{device_id}
PATCH  /api/green_smart/devices/{device_id}
DELETE /api/green_smart/devices/{device_id}
GET    /api/green_smart/devices/{device_id}/data/latest
POST   /api/green_smart/devices/{device_id}/data/refresh
GET    /api/green_smart/devices/{device_id}/data/samples
```

### 4.1 `GET /api/green_smart/devices/ha/unlinked`

- HA Device Registry 전체 조회.
- `green_smart_devices`에 active 상태로 저장된 `ha_device_id` 제외.
- 각 device의 entity count 포함.

Response shape:

```json
{
  "ok": true,
  "devices": [
    {
      "haDeviceId": "abc123",
      "deviceName": "1동 온실 제어기",
      "manufacturer": "Green Smart",
      "model": "GS-CTRL-001",
      "areaId": "greenhouse_1",
      "configEntryId": "entry-id",
      "integrationDomain": "mqtt",
      "entityCount": 6
    }
  ]
}
```

### 4.2 `GET /api/green_smart/devices/ha/{ha_device_id}/entities`

- Entity Registry에서 `device_id == ha_device_id` 필터.
- `hass.states.get(entity_id)`로 unit/current value/device_class 보강.
- `entity_role`, `value_kind`, `read_write_mode` 자동 유추.

Response shape:

```json
{
  "ok": true,
  "haDeviceId": "abc123",
  "entities": [
    {
      "entityId": "sensor.greenhouse_temperature",
      "domain": "sensor",
      "unitOfMeasurement": "°C",
      "deviceClass": "temperature",
      "stateClass": "measurement",
      "state": "24.7",
      "entityRole": "온도",
      "valueKind": "temperature",
      "readWriteMode": "readonly",
      "name": "온도"
    }
  ]
}
```

### 4.3 `POST /api/green_smart/devices`

Payload:

```json
{
  "haDeviceId": "abc123",
  "deviceName": "1동 온실 제어기",
  "equipmentKind": "복합환경제어기",
  "zoneId": "1",
  "entities": [
    {
      "entityId": "sensor.greenhouse_temperature",
      "domain": "sensor",
      "unitOfMeasurement": "°C",
      "entityRole": "온도",
      "valueKind": "temperature",
      "readWriteMode": "readonly"
    }
  ],
  "note": ""
}
```

Validation:

```text
haDeviceId required
deviceName required
equipmentKind required
zoneId required
entities array required
entities[].entityId required
entities[].entityRole required, 자동 추정값 허용
```

Save:

1. `green_smart_devices` upsert by `(farm_id, ha_device_id)`.
2. `green_smart_device_entities` upsert N rows by `(farm_id, entity_id)`.
3. latest values refresh for saved entities.
4. Return device + entities + latestValues.

## 5. Popup Modal Target UX

### 5.1 장치 연결 그룹

```text
장치 ID      select: HA Device Registry 중 Green Smart 미연결 device
장비종류     select: 복합환경제어기/온습도 센서/CO₂ 센서/광량 센서/천창/측창/커튼/순환팬/관수밸브/양액기/기타
장치명       input: HA name 기반 자동 입력, 사용자 수정 가능
구역         select: Green Smart settings zones
```

### 5.2 엔티티 N 그룹

선택 device가 가진 entity 수만큼 반복.

```text
엔티티ID     read-only
종류         read-only domain
단위         read-only unit_of_measurement
역할         select/input: 자동 유추 후 사용자 수정 가능
```

Markers:

```text
data-r7-device-canonical-connection-modal="true"
data-r7-device-connection-group="true"
data-r7-ha-unlinked-device-select
data-r7-equipment-kind-select
data-r7-device-name-input
data-r7-device-zone-select
data-r7-device-entity-repeat-group="true"
data-r7-device-entity-row
data-r7-device-entity-id-readonly
data-r7-device-entity-domain-readonly
data-r7-device-entity-unit-readonly
data-r7-device-entity-role-select
```

## 6. Role Inference Rules

Priority:

1. HA `device_class`
2. unit_of_measurement
3. entity_id/name keywords
4. domain fallback

Examples:

```text
device_class=temperature → entityRole=온도, valueKind=temperature
device_class=humidity → 습도, humidity
device_class=carbon_dioxide → CO₂, co2
unit=ppm + co2 keyword → CO₂
unit=lx → 광량
entity_id/name contains ec → EC
entity_id/name contains ph → pH
domain=switch + fan keyword → 순환팬
domain=cover + roof/window keyword → 천창
domain=cover + curtain/screen keyword → 커튼
domain=number → 설정값
domain=button → 명령 버튼
domain=sensor fallback → 측정값
domain=switch fallback → 스위치
domain=cover fallback → 개폐 장치
```

Read/write mode inference:

```text
sensor,binary_sensor → readonly
switch,cover,fan,valve,climate → controllable
number,select → setpoint
button → command
else → readonly
```

## 7. Implementation Tasks

### Task 1: Write RED contract for canonical device model

**Files:**
- Create: `tests/test_r7_129_canonical_device_registry_connection_contract.py`

**Objective:** Lock DB schema strings, API route classes, role inference helper, and modal markers before implementation.

**Expected RED:** missing `green_smart_devices`, `green_smart_device_entities`, canonical APIs, and modal markers.

Run:

```bash
pytest -q tests/test_r7_129_canonical_device_registry_connection_contract.py
```

Expected: FAIL.

### Task 2: Add canonical schema bootstrap

**Files:**
- Modify: `custom_components/green_smart/db.py`

Add `CREATE TABLE IF NOT EXISTS` statements for:

```text
green_smart_devices
green_smart_device_entities
green_smart_device_entity_latest_values
green_smart_device_entity_samples
```

Verification:

```bash
pytest -q tests/test_r7_129_canonical_device_registry_connection_contract.py
```

Expected: schema tests pass, API/UI tests still fail.

### Task 3: Add backend helpers and APIs

**Files:**
- Modify: `custom_components/green_smart/rebuild_settings_write_views.py`
- Modify: `custom_components/green_smart/__init__.py`

Add helpers:

```python
infer_green_smart_entity_role(...)
infer_green_smart_read_write_mode(...)
list_green_smart_unlinked_ha_devices(...)
list_green_smart_ha_device_entities(...)
create_green_smart_device_connection(...)
list_green_smart_devices(...)
refresh_green_smart_device_latest_values(...)
```

Add views:

```python
GreenSmartHaUnlinkedDevicesView
GreenSmartHaDeviceEntitiesView
GreenSmartDevicesView
GreenSmartDeviceItemView
GreenSmartDeviceLatestDataView
GreenSmartDeviceDataRefreshView
GreenSmartDeviceSamplesView
```

Verification:

```bash
python3 -m py_compile custom_components/green_smart/rebuild_settings_write_views.py custom_components/green_smart/__init__.py
pytest -q tests/test_r7_129_canonical_device_registry_connection_contract.py
```

### Task 4: Update rebuild panel modal UI

**Files:**
- Modify: `custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js`

Add API paths and modal state. Update the existing 장치 연결 modal render path to show canonical fields and entity role selection. Preserve existing open button behavior but make the save target canonical `POST /api/green_smart/devices`.

Verification:

```bash
node --check custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
pytest -q tests/test_r7_129_canonical_device_registry_connection_contract.py tests/test_r7_128_device_connection_authoring_contract.py tests/test_r7_115_device_sensor_mapping_cards_contract.py
```

### Task 5: Docs and migration notes

**Files:**
- Create: `docs/rebuild/r7-129-canonical-device-registry-connection.md`
- Modify: `docs/design/current-backend-api-db-ha-contract.md`
- Modify: `docs/design/current-ui-design-and-navigation.md`

Document:

```text
new canonical tables
legacy tables deprecated/no new writes
new APIs
modal fields
role inference
HA Registry/State read-only boundary
```

### Task 6: Full verification and Prod delivery

Run:

```bash
node --check custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 -m py_compile custom_components/green_smart/db.py custom_components/green_smart/rebuild_settings_write_views.py custom_components/green_smart/__init__.py
pytest -q
git diff --check
```

Prod:

```text
copy integration to Prod config
HA check_config
restart HA
readiness 200
API smoke for /api/green_smart/devices/ha/unlinked
API smoke for selected HA device entities if available
served JS marker smoke
browser/modal smoke
MariaDB SHOW CREATE TABLE verification
```

Release:

```text
commit
tag
push
GitHub Release
Korean report
```

## 8. Definition of Done

- Plan document exists.
- RED contract created and fails before implementation.
- New canonical tables are created in schema bootstrap.
- New canonical APIs are registered.
- HA unlinked device list excludes devices already saved in `green_smart_devices`.
- HA device entities include entityId/domain/unit/current value/role/readWriteMode.
- Popup modal shows 장치 ID/장비종류/장치명/구역 and 엔티티ID/종류/단위/역할 N rows.
- Role is auto-inferred and editable.
- Save writes device + entities + latest cache without controlling devices.
- Full tests and Prod smoke pass.
- Release is created.
