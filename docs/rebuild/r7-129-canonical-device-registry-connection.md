# R7-129 Canonical HA device registry connection

Status: current canonical direction for HA Device Registry based Green Smart device connection.

## Purpose

Replace the old settings-device/sensor-mapping meaning with a clearer model:

```text
HA Device Registry device
  → Green Smart device row
  → HA Entity Registry entity N rows
  → latest value cache / long-form sample rows
```

## Canonical DB tables

```text
green_smart_devices
green_smart_device_entities
green_smart_device_entity_latest_values
green_smart_device_entity_samples
```

### `green_smart_devices`

One row per connected HA device. Stores Green Smart placement and HA device metadata:

```text
zone_id
equipment_kind
device_name
ha_device_id
ha_device_name
manufacturer/model/version/area/config_entry
entities_snapshot_json
status/connection_status/last_seen_at
```

### `green_smart_device_entities`

One row per HA entity attached to a connected device:

```text
entity_id
entity_domain
unit_of_measurement
device_class/state_class
entity_role
value_kind
read_write_mode
```

`entity_role` is auto-inferred and can be corrected by the operator in the modal.

### `green_smart_device_entity_latest_values`

Latest value cache from HA state machine. HA state/Recorder remains the source of truth.

### `green_smart_device_entity_samples`

Long-form time-series table. Green Smart does **not** create per-device tables or dynamic per-device columns. Each sample row is identified by:

```text
green_smart_device_id
entity_id
sampled_at
```

## Canonical APIs

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

## Modal structure

```text
장치 연결 그룹
  장치 ID      HA Device Registry 미연결 device select
  장비종류     Green Smart equipment kind
  장치명       HA device name default, editable
  구역         Green Smart zone

엔티티 N 그룹
  엔티티ID     read-only
  종류         HA entity domain read-only
  단위         unit_of_measurement read-only
  역할         auto-inferred, editable
```

## Role inference

Priority:

```text
device_class → unit → entity_id/name keyword → domain fallback
```

Examples:

```text
temperature/temp/°C → 온도
humidity/% → 습도
co2/ppm → CO₂
lux/light → 광량
ec → EC
ph → pH
fan → 순환팬
roof/window → 천창
cover fallback → 개폐 장치
switch fallback → 스위치
sensor fallback → 측정값
```

## Safety boundary

This slice only reads HA Registry/State and writes Green Smart DB connection/cache rows.

Forbidden:

```text
HA Device Registry mutation
HA Entity Registry mutation
HA Recorder mutation
MQTT publish
HA service call execution
physical device control
legacy table drop/rename
```

## Legacy policy

Existing tables/APIs remain for compatibility during transition:

```text
green_smart_settings_devices
green_smart_settings_device_sensor_mappings
green_smart_settings_device_groups
```

They are not the canonical target for new device/entity/value modeling. Physical retirement requires a separate migration/backfill/drop approval slice.
