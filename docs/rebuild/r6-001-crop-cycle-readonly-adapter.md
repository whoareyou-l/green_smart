# R6-001 Crop Cycle Read-only Adapter

> 기준 버전: `v1.12.51`
> Status: R6-001 complete
> 목적: R5 foundation 이후 첫 runtime adapter를 쓰기/실행 없이 얇게 열고, 기존 물리 작기 데이터를 product-facing `crop_cycle/currentCrop` DTO로 연결한다.

## 1. Position after R5 foundation

```text
R5 foundation complete before runtime adapters
R6-001 is the first read-only adapter after R5 foundation closure
```

R5에서 만든 scaffold-only 경계는 유지한다. R6-001은 그 경계를 깨지 않고 기존 runtime DB를 읽기 전용으로 target DTO에 맞춘다.

## 2. Adapter source and shape

```text
legacy physical crop_seasons rows → product-facing crop_cycle/currentCrop DTO
zone parent + currentCrop attached
existing RS-013/RS-014 adapter is re-baselined as R6-001
```

Implementation:

```text
custom_components/green_smart/repositories/rebuild_crop_context_repo.py
custom_components/green_smart/services/rebuild_crop_context_service.py
custom_components/green_smart/rebuild_views.py
```

API route remains:

```text
GET /api/green_smart/rebuild/home/context
```

Response source remains:

```text
legacy-physical-readonly-adapter
```

## 3. DTO contract

Each zone row is the parent. `currentCrop` is attached inside the zone context.

```text
zone_id
name
currentCrop.crop_cycle_id
currentCrop.crop_type
currentCrop.crop_label_ko
currentCrop.growth_stage
currentCropAssignment.currentCrop
activeCropCycleId
crop_cycle
readOnly = true
executionEnabled = false
```

## 4. Boundaries

```text
No write/mutation in R6-001
No DB migration in R6-001
No execution decision change in R6-001
No SafetyGuard runtime behavior change in R6-001
No Interlock runtime behavior change in R6-001
No approval/override release in R6-001
No MQTT/device command in R6-001
No panel redesign in R6-001
```

This slice does not add dashboard cards or sidebar/detail pages. Those belong to R7 after the read-only data adapters are in place.

## 5. Next slices

Recommended order:

```text
R6-002 Monitoring read-only adapter
R6-003 Safety/Interlock read-only adapter
R7-000 Main dashboard/sidebar/detail-page IA blueprint
R7-001 Main dashboard redesign
R7-002 Sidebar navigation + page shell
R7-003~R7-006 detail/configuration subpages
```

```text
question gates must use clarify tool
```

If a later slice changes runtime behavior, page IA, or adapter scope, ask one fresh `clarify` question first.


## R6-002 Monitoring Read-only Adapter

`v1.12.51`에서 R6-002 Monitoring read-only adapter를 완료했다.

Reference:

```text
docs/rebuild/r6-002-monitoring-readonly-adapter.md
```

Boundary:

```text
R6-002 Monitoring Read-only Adapter
R6-001 Crop Cycle Read-only Adapter → R6-002 Monitoring Read-only Adapter
dataAvailability + equipmentProfile → monitoringReadOnlyAdapter
runtimeReadAdapterEnabled = true
sensorCollectionEnabled = false
No write/mutation in R6-002
No DB migration in R6-002
No sensor collection/scheduler in R6-002
No HA entity read API in R6-002
No execution decision change in R6-002
No SafetyGuard runtime behavior change in R6-002
No Interlock runtime behavior change in R6-002
No approval/override release in R6-002
No MQTT/device command in R6-002
No panel redesign in R6-002
question gates must use clarify tool
```
