# R6-002 Monitoring Read-only Adapter

> 기준 버전: `v1.12.61`
> Status: R6-002 complete
> 목적: R6-001 crop-cycle zone context 위에 모니터링 evidence DTO를 읽기 전용으로 붙인다.

## 1. Position

```text
R6-001 Crop Cycle Read-only Adapter → R6-002 Monitoring Read-only Adapter
```

R6-002는 R5 VS-N003 scaffold-only monitoring boundary를 실제 rebuild home context의 zone DTO에 얇게 연결한다. 단, 센서 수집/HA entity read/Panel redesign은 하지 않는다.

## 2. Adapter contract

```text
monitoring read-only adapter attaches to each zone context
dataAvailability + equipmentProfile → monitoringReadOnlyAdapter
runtimeReadAdapterEnabled = true
sensorCollectionEnabled = false
```

Implementation:

```text
custom_components/green_smart/services/rebuild_crop_context_service.py
```

Zone DTO field:

```text
monitoringReadOnlyAdapter
```

It contains:

```text
r6_002_adapter = true
adapterName = R6-002 Monitoring read-only adapter
sourceDataAvailability
sourceEquipmentProfile
dataFreshnessState
freshnessBoundary
monitoringSummary
readOnly = true
writeEnabled = false
executionEnabled = false
deviceCommandEnabled = false
mqttEnabled = false
```

## 3. Boundaries

```text
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
```

## 4. Relationship to later UI work

R6-002 only makes monitoring evidence available in the API response shape. It does not yet create dashboard cards, sidebars, detail pages, or settings pages.

Those belong to:

```text
R7-000 Main dashboard/sidebar/detail-page IA blueprint
R7-001 Main dashboard redesign
R7-002 Sidebar navigation + page shell
R7-003~R7-006 detail/configuration subpages
```

## 5. Next recommended slice

```text
R6-003 Safety/Interlock read-only adapter
```

```text
question gates must use clarify tool
```


## R6-003 Safety/Interlock Read-only Adapter

`v1.12.61`에서 R6-003 Safety/Interlock read-only adapter를 완료했다.

Reference:

```text
docs/rebuild/r6-003-safety-interlock-readonly-adapter.md
```

Boundary:

```text
R6-003 Safety/Interlock Read-only Adapter
R6-002 Monitoring Read-only Adapter → R6-003 Safety/Interlock Read-only Adapter
monitoringReadOnlyAdapter + safetyInterlockPreflightProjection → safetyInterlockReadOnlyAdapter
runtimeSafetyAdapterEnabled = true
executionDecisionEnabled = false
approvalOverrideEnabled = false
No write/mutation in R6-003
No DB migration in R6-003
No existing SafetyGuard runtime behavior change in R6-003
No existing Interlock runtime behavior change in R6-003
No execution decision change in R6-003
No approval/override release in R6-003
No MQTT/device command in R6-003
No panel redesign in R6-003
question gates must use clarify tool
```
