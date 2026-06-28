# VS-N002 Crop Cycle Recording Scaffold

> 기준 버전: `v1.12.40`
> Status: R5 crop cycle recording scaffold
> 범위 확정: 새 scaffold/계약/DTO/권한 경계만 만들고 기존 저장 동작은 변경하지 않는다.

## 0. Scope

```text
Crop cycle recording scaffold
cropCycleRecordingScaffold
crop_cycle/currentCrop DTO boundary
backend permission enforcement before UI-only hiding
recordingMode = scaffold_only
runtimeWriteAdapterEnabled = false
dbMigrationEnabled = false
No DB migration in VS-N002
No write/mutation in VS-N002
No existing crop season save behavior change in VS-N002
No production route removal in VS-N002
No physical MQTT/device hookup in VS-N002
No approval/execution release in VS-N002
```

VS-N002는 R5의 두 번째 from-scratch rebuild slice다. VS-N001 RBAC/Admin ownership scaffold 다음에 Crop cycle recording의 DTO/권한 경계를 고정한다.

## 1. DTO boundary

Product-facing names:

```text
crop_cycle/currentCrop DTO boundary
crop_cycle_id
currentCrop
zone_id
recordingState
recordingMode
```

Compatibility source remains adapter-only:

```text
legacy physical crop_seasons remains adapter-only
```

## 2. Permission boundary

```text
requiredPermission = crop_cycle.write
legacyAlias = manage_crop_seasons
bucket = 기록
backend permission enforcement before UI-only hiding
```

Initial scaffold policy:

| Role | canScaffoldRecord | Notes |
|---|---:|---|
| admin | true | system/admin ownership retained |
| farm_owner | true | owns operation responsibility and crop-cycle decisions |
| farm_staff | false | may write daily records later, but not crop-cycle scaffold ownership by default |

## 3. Non-goals

```text
No DB migration in VS-N002
No write/mutation in VS-N002
No existing crop season save behavior change in VS-N002
No production route removal in VS-N002
No physical MQTT/device hookup in VS-N002
No approval/execution release in VS-N002
```

## 4. Implementation artifact

Pure module only:

```text
custom_components/green_smart/crop_cycle_scaffold.py
```

The module must not import Home Assistant, aiohttp, aiomysql, MQTT, Docker, or runtime service-call helpers.

## 5. Next slice

After VS-N002, the confirmed rebuild order continues:

```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice
```
