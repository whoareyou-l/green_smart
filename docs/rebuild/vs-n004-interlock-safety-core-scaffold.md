# VS-N004 Interlock/Safety Core Scaffold

> 기준 버전: `v1.15.45`
> Status: R5 interlock/safety core scaffold
> 범위 확정: pure Interlock/Safety DTO/권한/상태 scaffold만 추가하고 기존 SafetyGuard/Interlock/실행 판단 로직은 변경하지 않는다.

## 0. Scope

```text
Interlock/Safety core scaffold
interlockSafetyCoreScaffold
safety/interlock read-only DTO boundary
safety state gate boundary
backend permission enforcement before UI-only hiding
safetyMode = scaffold_only
runtimeSafetyAdapterEnabled = false
executionDecisionEnabled = false
approvalOverrideEnabled = false
dbMigrationEnabled = false
No DB migration in VS-N004
No existing SafetyGuard runtime behavior change in VS-N004
No existing Interlock runtime behavior change in VS-N004
No execution decision change in VS-N004
No approval/override release in VS-N004
No MQTT/device command in VS-N004
No panel safety card in VS-N004
```

VS-N004는 R5의 네 번째 from-scratch rebuild foundation slice다. VS-N001 RBAC/Admin ownership, VS-N002 Crop cycle recording, VS-N003 real-time monitoring scaffold 뒤에 safety/interlock read-only DTO와 state-gate 경계를 고정한다.

## 1. DTO boundary

Product-facing names:

```text
safety/interlock read-only DTO boundary
zone_id
crop_cycle_id
monitoringState
safetyStateGateBoundary
safetyMode
```

This slice may carry monitoring state as caller-provided evidence, but it does not evaluate live runtime interlocks or SafetyGuard rules.

## 2. Permission boundary

```text
requiredPermission = safety.core.read
legacyAlias = view_safety_status
bucket = 안전
backend permission enforcement before UI-only hiding
```

Initial policy: all roles can view the read-only safety/interlock scaffold, but no role receives approval, override, or execution release from this slice.

| Role | canViewSafetyScaffold | Notes |
|---|---:|---|
| admin | true | system/admin can view |
| farm_owner | true | owns safety review and high-impact approval later |
| farm_staff | true | may view allowed safety status for daily work |

## 3. Non-goals

```text
No DB migration in VS-N004
No existing SafetyGuard runtime behavior change in VS-N004
No existing Interlock runtime behavior change in VS-N004
No execution decision change in VS-N004
No approval/override release in VS-N004
No MQTT/device command in VS-N004
No panel safety card in VS-N004
```

## 4. Implementation artifact

Pure module only:

```text
custom_components/green_smart/interlock_safety_scaffold.py
```

The module must not import Home Assistant, aiohttp, aiomysql, MQTT, Docker, runtime SafetyGuard services, or device service-call helpers.

## 5. R5 foundation sequence status

VS-N004 completes the initially confirmed R5 foundation sequence:

```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
```

Next work should not silently add execution authority. Any future SafetyGuard adapter, Interlock adapter, approval/override release, DB migration, panel card, or device command requires a new explicit slice and question gate.
