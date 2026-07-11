# R6-003 Safety/Interlock Read-only Adapter

> 기준 버전: `v1.15.19`
> Status: R6-003 complete
> 목적: R6-002 monitoring evidence와 기존 preflight projection을 조합해 안전·인터록 read-only evidence DTO를 zone context에 붙인다.

## 1. Position

```text
R6-002 Monitoring Read-only Adapter → R6-003 Safety/Interlock Read-only Adapter
```

R6-003은 R5 VS-N004 scaffold-only safety/interlock boundary를 실제 rebuild home context의 zone DTO에 얇게 연결한다. 단, SafetyGuard/Interlock runtime을 호출하거나 실행 판단/override 권한을 열지 않는다.

## 2. Adapter contract

```text
monitoringReadOnlyAdapter + safetyInterlockPreflightProjection → safetyInterlockReadOnlyAdapter
runtimeSafetyAdapterEnabled = true
executionDecisionEnabled = false
approvalOverrideEnabled = false
```

Implementation:

```text
custom_components/green_smart/services/rebuild_crop_context_service.py
```

Zone DTO field:

```text
safetyInterlockReadOnlyAdapter
```

It contains:

```text
r6_003_adapter = true
adapterName = R6-003 Safety/Interlock read-only adapter
sourceMonitoringReadOnlyAdapter
sourcePreflightProjection
safetyState
interlockState
failSafeState
blockedReasons
safetySummary
readOnly = true
writeEnabled = false
executionDecisionEnabled = false
approvalOverrideEnabled = false
deviceCommandEnabled = false
mqttEnabled = false
```

## 3. Boundaries

```text
No write/mutation in R6-003
No DB migration in R6-003
No existing SafetyGuard runtime behavior change in R6-003
No existing Interlock runtime behavior change in R6-003
No execution decision change in R6-003
No approval/override release in R6-003
No MQTT/device command in R6-003
No panel redesign in R6-003
```

## 4. Relationship to R7 UI work

R6-003 only makes safety/interlock evidence available in the API response shape. It does not create dashboard cards, sidebars, detail pages, settings pages, approval controls, override controls, or execution controls.

Those belong to later phases:

```text
R7-000 Main dashboard/sidebar/detail-page IA blueprint
R7-001 Main dashboard redesign
R7-002 Sidebar navigation + page shell
R7-003~R7-006 detail/configuration subpages
```

## 5. Next recommended slice

```text
R7-000 Main dashboard/sidebar/detail-page IA blueprint
```

```text
question gates must use clarify tool
```


## R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint

`v1.15.19`에서 R7-000 IA blueprint를 완료했다.

Reference:

```text
docs/rebuild/r7-000-main-dashboard-sidebar-detail-ia-blueprint.md
```

Boundary:

```text
R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint
작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행
R7-000 is an IA blueprint only
No panel DOM implementation change in R7-000
No API route change in R7-000
No DB migration in R7-000
No execution authority in R7-000
No SafetyGuard/Interlock runtime behavior change in R7-000
question gates must use clarify tool
```
