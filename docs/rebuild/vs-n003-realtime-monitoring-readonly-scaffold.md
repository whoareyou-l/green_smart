# VS-N003 Real-time Monitoring Read-only Scaffold

> 기준 버전: `v1.14.74`
> Status: R5 real-time monitoring read-only scaffold
> 범위 확정: read-only monitoring DTO/권한/상태 scaffold만 추가하고 DB/API/센서수집/Panel 표시 변경은 하지 않는다.

## 0. Scope

```text
Real-time monitoring read-only slice
realtimeMonitoringReadOnlyScaffold
monitoring/read-only DTO boundary
sensor state freshness boundary
backend permission enforcement before UI-only hiding
monitoringMode = scaffold_only
runtimeReadAdapterEnabled = false
sensorCollectionEnabled = false
dbMigrationEnabled = false
No DB migration in VS-N003
No sensor_readings query adapter in VS-N003
No HA entity read API in VS-N003
No sensor collection/scheduler in VS-N003
No panel monitoring card in VS-N003
No write/mutation in VS-N003
No MQTT/device command in VS-N003
```

VS-N003은 R5의 세 번째 from-scratch rebuild slice다. VS-N001 RBAC/Admin ownership과 VS-N002 Crop cycle recording scaffold 다음에 monitoring read-only DTO/권한/freshness 경계를 고정한다.

## 1. DTO boundary

Product-facing names:

```text
monitoring/read-only DTO boundary
zone_id
crop_cycle_id
sensorSnapshot
dataFreshnessState
freshnessBoundary
monitoringMode
```

This slice may accept caller-provided evidence for tests/contracts, but it does not read HA state or DB rows.

## 2. Permission boundary

```text
requiredPermission = monitoring.read
legacyAlias = view_dashboard
bucket = 조회
backend permission enforcement before UI-only hiding
```

Initial policy: all roles can view the read-only monitoring scaffold.

| Role | canViewMonitoringScaffold | Notes |
|---|---:|---|
| admin | true | system/admin can view |
| farm_owner | true | owns operation review |
| farm_staff | true | allowed monitoring is part of daily work |

## 3. Non-goals

```text
No DB migration in VS-N003
No sensor_readings query adapter in VS-N003
No HA entity read API in VS-N003
No sensor collection/scheduler in VS-N003
No panel monitoring card in VS-N003
No write/mutation in VS-N003
No MQTT/device command in VS-N003
```

## 4. Implementation artifact

Pure module only:

```text
custom_components/green_smart/realtime_monitoring_scaffold.py
```

The module must not import Home Assistant, aiohttp, aiomysql, MQTT, Docker, or runtime service-call helpers.

## 5. Next slice

After VS-N003, the confirmed rebuild order continues:

```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
```
