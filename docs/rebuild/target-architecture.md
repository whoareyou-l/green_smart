# Green Smart Target Architecture — From-Scratch Rebuild Baseline

> 기준 버전: `v1.15.03`
> 상태: 방향 전환 기준선
> 목적: 기존 RB 산출물을 이어서 계속 패치하지 않고, 이전 작업을 reference/evidence로 삼아 새 제품 구조를 설계한 뒤 새 vertical rebuild slice로 구현한다.

---

## 1. Direction correction

사용자가 말한 리빌딩은 기존 구조에서 `RB-007`, `RB-008`처럼 다음 분리 작업을 계속 진행한다는 뜻이 아니다.

```text
기존 RB 산출물은 reference/evidence로만 사용
기존 구조를 계속 쪼개는 방식으로 다음 RB를 진행하지 않는다
새 master docs → 새 target architecture → 새 vertical slice scaffold
기존 코드 수정은 hotfix와 호환 adapter로만 제한
```

이 문서의 기준을 `from-scratch rebuild 기준선`으로 둔다.

---

## 2. Master docs linkage

이 target architecture는 아래 5대 master docs를 구현 가능한 구조로 연결한다.

| Master doc | target architecture에서 받는 역할 |
|---|---|
| `01-cba-ui-ux-spec.md` | UI component/module/page grammar의 출처 |
| `02-interface-spec.md` | frontend service, backend route, MQTT/HA service 계약의 출처 |
| `03-database-schema.md` | physical/logical schema와 migration gate의 출처 |
| `04-workflow-diagrams.md` | sensor/control/fail-safe workflow의 출처 |
| `05-ml-interlock-failsafe-spec.md` | VPD/PID/SafetyGuard/Interlock/Fail Safe 로직 boundary의 출처 |

Gap 관리는 `docs/rebuild/master-docs-gap-inventory.md`에서 추적한다.

---

## 3. What is preserved

기존 운영 제품은 버리지 않는다. 운영 안정성과 호환성은 보존한다.

| 보존 항목 | 이유 |
|---|---|
| Home Assistant custom integration/HACS 형태 | 현재 배포/사용 형태 |
| `green-smart-panel` public element | HA panel loading 호환 |
| `/api/green_smart/*` route compatibility | 기존 UI/API/테스트 호환 |
| MariaDB physical tables | 승인 없는 migration 금지 |
| SafetyGuard/Interlock/Fail Safe 실행 boundary | 실제 제어 안전성 |
| virtual rehearsal before physical device hookup | 실제 장비 연결 전 안전 gate |
| Prod runtime | 리빌딩 중 운영 안정성 |

---

## 4. What becomes reference only

| 이전 작업 | 새 리빌딩에서의 역할 |
|---|---|
| RB-001 Admin/System shell | Admin/System ownership evidence |
| RB-002 API client adapter | frontend interface boundary evidence |
| RB-003/RB-004 Crop render extraction | panel monolith hotspot evidence |
| RB-005 execution proximity safety UI | execution UX safety evidence |
| RB-006 crop service/repo split | backend route/service/repository boundary evidence |

위 항목은 다음 구현 순서가 아니다. 새 구조 설계의 참고 자료다. **RB-007 이후를 기존 계획대로 계속 진행하지 않는다.**

---

## 5. New architecture workflow

다음 작업은 아래 순서로만 진행한다.

```text
1. docs/master 5대 문서 현행화
2. current-state inventory에서 기존 구현과 RB 산출물 evidence 분류
3. target architecture 확정
4. 첫 vertical rebuild slice scaffold 정의
5. RED contract
6. 새 scaffold 기준 구현
7. compat adapter/hotfix만 기존 runtime에 연결
8. local/prod verification/release
```

---

## 6. Target module tree

아래는 구현 방향을 설명하는 target tree다. Stage 3에서 첫 slice가 선택되기 전까지는 실제 runtime import를 연결하지 않는다.

```text
custom_components/green_smart/
  api_views_next/
    home.py
    crop.py
    environment.py
    irrigation.py
    device.py
    safety.py
    admin.py
  services_next/
    home_service.py
    crop_service.py
    environment_service.py
    irrigation_service.py
    device_service.py
    safety_service.py
    admin_service.py
  repositories_next/
    crop_repository.py
    sensor_repository.py
    control_log_repository.py
    device_repository.py
    rbac_repository.py
  safety_core/
    safety_guard.py
    interlock.py
    fail_safe.py
    state_verification.py
  panel_next/
    app-shell.js
    core/api-client.js
    core/state-store.js
    core/rbac.js
    components/
    domains/
      home/
      crop/
      environment/
      irrigation/
      device/
      safety/
      admin/
```

Compatibility rule: existing `green-smart-panel.js` and existing `/api/green_smart/*` routes remain the production entrypoints until a vertical rebuild slice explicitly wires a compat adapter.

---

## 7. Domain ownership matrix

| Domain | UI owner | Frontend service owner | Backend owner | DB owner | Safety owner |
|---|---|---|---|---|---|
| Home | dashboard/read-only summary | `homeService` | `api_views_next/home.py` | read models/recent logs | safety summaries only |
| Crop | crop cycle, records, crop model evidence | `cropService` | `api_views_next/crop.py` | crop cycles, growth/pest/control records | crop interlock evidence |
| Environment | temperature, humidity, VPD, CO2, environment targets | `environmentService` | `api_views_next/environment.py` | sensor logs, environment settings, control logs | environment SafetyGuard |
| Irrigation | VWC, EC, pH, irrigation targets | `irrigationService` | `api_views_next/irrigation.py` | irrigation settings/logs | irrigation SafetyGuard |
| Device | entity/device state, mapping, manual allowed actions | `deviceService` | `api_views_next/device.py` | device mappings/status/logs | device fail-safe |
| Safety | SafetyGuard, Interlock, Fail Safe, state verification | `safetyService` | `api_views_next/safety.py` | safety events, interlock decisions, audit logs | owns shared safety core |
| Admin/System | RBAC, HA mapping, diagnostics, secrets/config ownership | `adminService` | `api_views_next/admin.py` | users, roles, permissions, config metadata | policy configuration only |

---

## 8. Route compatibility adapter policy

1. Existing route paths stay stable until explicit migration approval.
2. route path breaking change 금지.
3. New backend code may live under `api_views_next/`, but production routes must adapt through existing `/api/green_smart/*` paths or a documented compatibility adapter.
4. Response shape changes require RED contract, migration note, and user approval when client-visible.
5. Write/execute routes require backend RBAC enforcement, not UI-only hiding.

---

## 9. DB physical/logical naming policy

1. Existing physical tables remain: `crop_seasons`, `growth_surveys`, `pest_surveys`, `control_records`, `zone_control_logs`, etc.
2. physical table rename 금지 without explicit user approval.
3. New docs may use logical aliases such as `crop_cycle`/`crop_cycles`, but must map them to current physical tables.
4. DB migration requires a separate migration gate, backup/rollback note, and prod approval.
5. New vertical slices should prefer additive schema only, and only after RED contract.

---

## 10. Safety and execution boundary

1. AI output 직접 실행 권한 금지.
2. All execution passes through `Control Mode → Limited Auto → Operator Confirmation → SafetyGuard → Interlock → Entity Mapping → State Verification → Log`.
3. 실제 장비/MQTT 물리 연결 금지 until virtual rehearsal passes normal, strong-wind, rain, low-temp, sensor-fault, blocked, Fail Safe, and recovery scenarios.
4. `safety_core/` may be scaffolded as read-only/evaluation code first; it must not grant execution authority.
5. Emergency/fail-safe behavior takes precedence over model recommendations.

---

## 11. Question gate

Proceed without asking when the change is documentation alignment, inventory, static contract, or wording that does not alter product behavior.

Ask the user with one `clarify` question when any of these decisions appears:

| Decision | Ask? | Why |
|---|---|---|
| First vertical rebuild slice selection | Yes | Product implementation order changes |
| physical DB migration | Yes | Data/compatibility risk |
| prod stack cutover | Yes | Operational risk |
| actual MQTT/device hookup | Yes | Field safety risk |
| RBAC policy conflict | Yes | User access and backend enforcement |

## 12. First vertical rebuild slice selection gate

Do not choose the first new slice silently. Present only the viable choices and ask the user to choose one.

The first selected slice is `VS-N001 RBAC/Admin ownership scaffold`.

Reference doc:

```text
docs/rebuild/vs-n001-rbac-admin-ownership-scaffold.md
```

Confirmed decision: first rebuild slice order

1. RBAC/Admin ownership scaffold
2. Crop cycle recording scaffold
3. Real-time monitoring read-only slice
4. Interlock/Safety core scaffold

RBAC first because permission ownership must exist before records, monitoring scope, and interlock approval. The first selected slice is therefore `VS-N001 RBAC/Admin ownership scaffold`.

Role baseline:

```text
admin: system ownership, HA mapping, RBAC, diagnostics, secret/config ownership
farm_owner: approvals, strategy ownership, audit review, high-impact actions
farm_staff: daily records, allowed monitoring, allowed routine actions
```

Implementation principle: backend permission enforcement before UI-only hiding.

The chosen slice must define UI → frontend service → backend route/service → DB/log → Safety/Interlock impact → tests before implementation.

---

## 13. Stop list

- 기존 `green-smart-panel.js`를 helper 파일로만 계속 찢는 작업
- `crop_views.py`/`zone_control_views.py`에 다음 service 위임만 추가하는 작업
- RB-007 이후를 기존 계획대로 계속 진행하는 작업
- 새 카드/모달/기능 추가
- 승인 없는 DB migration
- 승인 없는 prod stack rewrite
- prod stack cutover 금지 without explicit user approval and rollback runbook
- 실제 장비/MQTT 물리 연결

---

## 14. Continue list

- 운영 장애 hotfix
- 호환 adapter
- master docs 정렬
- current-state inventory
- target architecture 계약
- static/contract test 유지
- prod health smoke


## 14. VS-N002 Crop cycle recording scaffold

`v1.15.03` adds the second R5 scaffold slice:

```text
VS-N002 Crop cycle recording scaffold
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice
cropCycleRecordingScaffold
crop_cycle/currentCrop DTO boundary
No write/mutation in VS-N002
No DB migration in VS-N002
```

This slice is scaffold-only. It does not change existing crop season save behavior and does not add a runtime write adapter.


## 15. VS-N003 Real-time monitoring read-only scaffold

`v1.15.03` adds the third R5 scaffold slice:

```text
VS-N003 Real-time monitoring read-only scaffold
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
realtimeMonitoringReadOnlyScaffold
monitoring/read-only DTO boundary
sensor state freshness boundary
No DB migration in VS-N003
No sensor collection/scheduler in VS-N003
```

This slice is scaffold-only. It does not query `sensor_readings`, read HA entities, start sensor collection, or render a panel monitoring card.


## 16. VS-N004 Interlock/Safety core scaffold

`v1.15.03` adds the fourth R5 scaffold slice:

```text
VS-N004 Interlock/Safety core scaffold
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
interlockSafetyCoreScaffold
safety/interlock read-only DTO boundary
safety state gate boundary
No execution decision change in VS-N004
No approval/override release in VS-N004
```

This slice is scaffold-only. It does not change existing SafetyGuard/Interlock runtime behavior and does not release approval, override, execution, MQTT, or device-command authority.


## R5 Foundation Completion Baseline

`v1.15.03`에서 R5 foundation closure를 완료했다.

Reference:

```text
docs/rebuild/r5-foundation-completion-baseline.md
```

Boundary:

```text
R5 foundation complete before runtime adapters
No DB migration in R5 foundation closure
No write/mutation in R5 foundation closure
No runtime adapter in R5 foundation closure
No panel read-only card in R5 foundation closure
No SafetyGuard runtime behavior change in R5 foundation closure
No Interlock runtime behavior change in R5 foundation closure
No execution decision change in R5 foundation closure
No approval/override release in R5 foundation closure
No MQTT/device command in R5 foundation closure
question gates must use clarify tool
```


## R6-001 Crop Cycle Read-only Adapter

`v1.15.03`에서 R6-001 Crop cycle read-only adapter를 완료했다.

Reference:

```text
docs/rebuild/r6-001-crop-cycle-readonly-adapter.md
```

Boundary:

```text
R6-001 Crop Cycle Read-only Adapter
R5 foundation complete before runtime adapters
legacy physical crop_seasons rows → product-facing crop_cycle/currentCrop DTO
zone parent + currentCrop attached
No write/mutation in R6-001
No DB migration in R6-001
No execution decision change in R6-001
No SafetyGuard runtime behavior change in R6-001
No Interlock runtime behavior change in R6-001
No approval/override release in R6-001
No MQTT/device command in R6-001
question gates must use clarify tool
```


## R6-002 Monitoring Read-only Adapter

`v1.15.03`에서 R6-002 Monitoring read-only adapter를 완료했다.

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


## R6-003 Safety/Interlock Read-only Adapter

`v1.15.03`에서 R6-003 Safety/Interlock read-only adapter를 완료했다.

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


## R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint

`v1.15.03`에서 R7-000 IA blueprint를 완료했다.

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


## R7-001 Main Dashboard Redesign

`v1.15.03`에서 R7-001 main dashboard redesign을 완료했다.

Reference:

```text
docs/rebuild/r7-001-main-dashboard-redesign.md
```

Boundary:

```text
R7-001 Main Dashboard Redesign
implements the first operator-visible crop-centered dashboard
render from existing GET /api/green_smart/rebuild/home/context shape
No fixture-only cards in R7-001
No API route change in R7-001
No DB migration in R7-001
No execution authority in R7-001
No approval/override release in R7-001
No SafetyGuard/Interlock runtime behavior change in R7-001
```


## R7-002 Sidebar Navigation + Page Shell

`v1.15.03`에서 R7-002 sidebar navigation + page shell을 완료했다.

Reference:

```text
docs/rebuild/r7-002-sidebar-navigation-page-shell.md
```

Boundary:

```text
R7-002 Sidebar Navigation + Page Shell
implements the R7 sidebar primary groups and page shell
운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
No API route change in R7-002
No DB migration in R7-002
No execution authority in R7-002
No approval/override release in R7-002
No SafetyGuard/Interlock runtime behavior change in R7-002
```


## R7-003 Detail/Configuration Subpages Baseline

`v1.15.03`에서 R7-003 detail/configuration subpages baseline을 완료했다.

Reference:

```text
docs/rebuild/r7-003-detail-configuration-subpages-baseline.md
```

Boundary:

```text
R7-003 Detail/Configuration Subpages Baseline
selected scope: all five sidebar groups receive read-only detail/config placeholder baselines
운영 홈 / 작물 중심 운영 / 현장 상태 / 추천·실행 검토 / 설정
No API route change in R7-003
No DB migration in R7-003
No execution authority in R7-003
No approval/override release in R7-003
No SafetyGuard/Interlock runtime behavior change in R7-003
No MQTT/device command in R7-003
```


## R7-004 Settings/Admin Read-only Detail

`v1.15.03`에서 R7-004 settings/admin read-only detail을 완료했다.

Reference:

```text
docs/rebuild/r7-004-settings-admin-readonly-detail.md
```

Boundary:

```text
R7-004 Settings/Admin Read-only Detail
user-selected scope: 설정 — RBAC/config/admin read-only detail
No API route change in R7-004
No DB migration in R7-004
No execution authority in R7-004
No role assignment mutation in R7-004
No raw secrets in R7-004
No MQTT/device command in R7-004
```
