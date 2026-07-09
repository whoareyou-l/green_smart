# R5 Foundation Completion Baseline

> 기준 버전: `v1.14.94`
> Status: R5 foundation complete
> 목적: `VS-N001~VS-N004` scaffold-only sequence를 하나의 foundation baseline으로 닫고, runtime/UI/adapter/실행 권한 작업으로 자동 전진하지 못하게 한다.

## 1. Completed R5 foundation sequence

```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
```

Completed slices:

| Slice | Artifact | Boundary |
|---|---|---|
| VS-N001 RBAC/Admin ownership scaffold | `docs/rebuild/vs-n001-rbac-admin-ownership-scaffold.md` | role/permission/backend-enforcement ownership |
| VS-N002 Crop cycle recording scaffold | `docs/rebuild/vs-n002-crop-cycle-recording-scaffold.md` | `cropCycleRecordingScaffold`, `crop_cycle/currentCrop DTO boundary` |
| VS-N003 Real-time monitoring read-only scaffold | `docs/rebuild/vs-n003-realtime-monitoring-readonly-scaffold.md` | `realtimeMonitoringReadOnlyScaffold`, `monitoring/read-only DTO boundary` |
| VS-N004 Interlock/Safety core scaffold | `docs/rebuild/vs-n004-interlock-safety-core-scaffold.md` | `interlockSafetyCoreScaffold`, `safety/interlock read-only DTO boundary` |

Status markers:

```text
R5 foundation complete before runtime adapters
R5 foundation complete before panel read-only cards
R5 foundation complete before SafetyGuard/Interlock adapters
```

## 2. Closure boundary

R5 foundation closure is documentation/contract alignment only.

```text
No DB migration in R5 foundation closure
No write/mutation in R5 foundation closure
No runtime adapter in R5 foundation closure
No panel read-only card in R5 foundation closure
No SafetyGuard runtime behavior change in R5 foundation closure
No Interlock runtime behavior change in R5 foundation closure
No execution decision change in R5 foundation closure
No approval/override release in R5 foundation closure
No MQTT/device command in R5 foundation closure
```

## 3. Question gate discipline

```text
question gates must use clarify tool
```

All post-R5 foundation choices must be asked one at a time through the `clarify` tool. Do not present a normal-message choice list as the question mechanism.

## 4. Next phase requires fresh confirmation

```text
Next phase requires a fresh clarify question
Do not auto-advance from R5 foundation closure into runtime/UI/adapter work
```

Candidate next slices that require a new `clarify` question:

1. Runtime read-only adapter slice
2. Panel read-only display slice
3. SafetyGuard/Interlock read-only adapter slice
4. Crop-centered product UI continuation slice

No option is selected by this baseline.

## 5. Definition of done

R5 foundation is complete only when:

- `VS-N001~VS-N004` docs are linked from target architecture and plans.
- No authority boundary is loosened.
- Full local tests pass.
- Prod static smoke verifies the released version if version surfaces change.
- GitHub release is verified.


## R6-001 Crop Cycle Read-only Adapter

`v1.14.94`에서 R6-001 Crop cycle read-only adapter를 완료했다.

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
