# R7-106 Green Smart schema + greenhouse modal API

Version: v1.14.65
Status: prod verified

## Scope

User requested a new Green Smart DB schema and tables for the greenhouse creation modal.

This slice creates a dedicated MariaDB schema:

```text
green_smart
```

and keeps Home Assistant recorder data in `homeassistant` untouched.

## Tables

Minimal settings-modal tables now bootstrapped in `green_smart`:

```text
green_smart_settings_greenhouses
green_smart_settings_zones
green_smart_settings_device_sensor_mappings
```

## Greenhouse modal fields

`green_smart_settings_greenhouses` stores the visible greenhouse creation modal fields:

- `name` — 온실명
- `location` — 위치
- `operating_status` — 운영상태
- `install_type` — 설치유형
- `timezone` — 기본 시간대
- `creation_reason` / `note` — 생성 사유

## API

The existing settings API now uses the dedicated `green_smart` schema through `GREEN_SMART_DB_NAME=green_smart` default:

```text
GET  /api/green_smart/rebuild/settings/greenhouses
POST /api/green_smart/rebuild/settings/greenhouses
PATCH /api/green_smart/rebuild/settings/greenhouses/{greenhouse_id}
DELETE /api/green_smart/rebuild/settings/greenhouses/{greenhouse_id}
GET  /api/green_smart/rebuild/settings/snapshot
```

When full legacy schema bootstrap is off, only the settings modal schema/API is enabled. Heavy DB-backed legacy views and schedulers remain skipped.

## Prod verification

- Full tests: `1489 passed`
- HA config check: passed
- HA readiness: HTTP 200
- `green_smart` schema exists
- `homeassistant` schema still has zero non-HA/Green Smart tables
- `green_smart` table count: 3
- Greenhouse API service smoke saved all modal fields and the smoke row was removed after verification
- Recent Green Smart error log window: empty
