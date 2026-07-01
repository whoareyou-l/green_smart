# Green Smart From-Scratch Rebuild Execution Plan

> **For Hermes:** Use this plan task-by-task. Do not continue old RB-007/RB patch treadmill. Ask the user one question at a time only when a decision changes architecture, product behavior, migration, safety, or UX ownership.

**Goal:** 기존 Green Smart 작업 산출물을 reference/evidence로 활용하되, 새 제품 구조를 처음부터 다시 설계하고 그 기준에서 새 vertical rebuild slice를 구현한다.

**Architecture:** 기존 운영 제품은 보존하고, 기존 RB 산출물은 evidence로만 분류한다. 구현은 `docs/master` 5대 문서 현행화 → `docs/rebuild/target-architecture.md` 확정 → 새 scaffold/vertical slice 정의 → RED contract → 구현 순서로만 진행한다. 기존 코드 수정은 hotfix 또는 compatibility adapter로 제한한다.

**Tech Stack:** Home Assistant custom integration, Python HomeAssistantView, MariaDB/aiomysql, Vanilla JS Web Component, Docker Compose prod/dev stack, pytest contract tests, Markdown master docs, GitHub releases.

---

## Operating Rules

1. **기존 RB 계속 진행 금지:** RB-007/RB-008 또는 기존 monolith 계속 분리로 가지 않는다.
2. **Docs First:** 구현 전 반드시 5대 master docs와 target architecture를 정렬한다.
3. **질문 기준:** 모호하지만 결과가 작은 문구/문서 배치는 기본값으로 진행한다. 다음은 반드시 사용자에게 한 번에 하나씩 질문한다.
   - 제품 형태가 바뀌는 선택
   - DB physical migration 여부
   - 실제 장비/MQTT 연결 여부
   - 역할/RBAC 정책 충돌
   - 첫 vertical rebuild slice 선택
   - prod stack 변경/cutover
4. **질문 방식:** `clarify`로 한 질문만 묻고, 답변을 문서에 confirmed decision으로 기록한 뒤 다음 단계 진행.
5. **기존 코드 변경 제한:** 운영 장애 hotfix/compat adapter 외 runtime code 변경 금지.
6. **검증:** 문서 변경도 계약 테스트와 `git diff --check`로 검증한다.

---

## Stage 0 — Direction Lock

**Objective:** from-scratch rebuild 방향이 문서와 테스트로 고정되어 있는지 확인한다.

**Files:**
- Modify/verify: `docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md`
- Modify/verify: `docs/PROJECT_MASTER_PLAN.md`
- Modify/verify: `docs/rebuild/target-architecture.md`
- Test: `tests/test_rebuild_product_first_plan_contract.py`

**Steps:**
1. 기존 RB 산출물이 `reference/evidence`로만 명시되어 있는지 확인한다.
2. “다음 RB 계속 진행 금지” 문구가 master plan에 있는지 확인한다.
3. Run: `pytest -q tests/test_rebuild_product_first_plan_contract.py tests/test_rebuild_frontend_decomposition_contract.py`
4. Expected: all pass.

**Status:** 완료됨. `14 passed` 확인.

---

## Stage 1 — Master Docs Gap Inventory

**Objective:** 5대 master docs가 현재 from-scratch rebuild 기준을 충족하는지 gap을 목록화한다.

**Files:**
- Create: `docs/rebuild/master-docs-gap-inventory.md`
- Modify: `docs/master/README.md`
- Test: `tests/test_rebuild_master_docs_gap_contract.py`

**Steps:**
1. 5대 master docs 파일 존재/line count를 기록한다.
2. 각 문서가 from-scratch 기준, 기존 RB evidence, target architecture 연결, 질문 gate를 포함하는지 점검한다.
3. 오래된 “현재 진행 VS-003” 같은 표현은 active가 아니라 historical/reference로 분류한다.
4. RED contract 작성 후 실패 확인.
5. README와 gap inventory를 수정해 통과시킨다.

**Question Gate:** 첫 vertical rebuild slice를 고르는 질문은 Stage 3에서 묻는다. Stage 1은 질문 없이 진행한다.

---

## Stage 2 — Target Architecture Expansion

**Objective:** `docs/rebuild/target-architecture.md`를 실제 구현자가 쓸 수 있는 수준으로 확장한다.

**Files:**
- Modify: `docs/rebuild/target-architecture.md`
- Possibly modify: 5 master docs
- Test: `tests/test_rebuild_target_architecture_contract.py`

**Required Sections:**
- target module tree
- domain ownership matrix
- route compatibility adapter policy
- DB physical/logical naming policy
- safety/execution boundary
- old RB evidence map
- scaffold candidates and non-goals

**Question Gate:** target module tree에서 새 코드 루트 후보가 충돌하면 질문한다.

---

## Stage 3 — First Vertical Rebuild Slice Selection

**Objective:** 첫 새 vertical rebuild slice를 선택하고 scope를 고정한다.

Confirmed decision: first rebuild slice order

1. RBAC/Admin ownership scaffold
2. Crop cycle recording scaffold
3. Real-time monitoring read-only slice
4. Interlock/Safety core scaffold

First selected slice: VS-N001 RBAC/Admin ownership scaffold

Reason: RBAC/Admin ownership must come first because permission ownership must exist before Crop records, monitoring scope, and interlock approval. This prevents UI-only hiding and forces backend permission enforcement before later slices.

**Candidate Choices kept as historical alternatives:**
1. `VS-N001 실시간 온도/습도/VPD read-only monitoring` — deferred to third.
2. `VS-N002 Safety core scaffold` — deferred to fourth after RBAC/Crop/Monitoring context.
3. `VS-N003 Admin/System ownership scaffold` — selected conceptually and renamed to `VS-N001 RBAC/Admin ownership scaffold`.
4. `VS-N004 Crop cycle recording scaffold` — deferred to second.

**Question Gate:** completed. Next questions are only needed if RBAC role semantics, backend permission scope, or Admin/System ownership choices conflict.

---

## Stage 4 — RED Contract for Selected Slice

**Objective:** 선택된 첫 slice의 문서/코드 scaffold 계약을 먼저 실패시키고, 그 뒤 구현한다.

**Files:**
- Create: focused test under `tests/`
- Modify: relevant master docs
- Create: scaffold files only after RED is verified

**Rules:**
- Existing runtime route/DB/service semantics 변경 금지.
- Prod sync/release는 slice가 실제 runtime 영향을 가질 때만 진행한다.

---

## Stage 5 — Implementation + Verification Loop

**Objective:** 선택 slice를 새 scaffold 기준으로 작게 구현하고 검증한다.

**Loop:**
1. RED contract
2. minimal scaffold/implementation
3. targeted tests
4. docs update
5. full local verification
6. prod health smoke if runtime touched
7. commit/tag/release only after agreed DoD

---

## Immediate Next Action

Proceed with Stage 1 now:

```text
Create docs/rebuild/master-docs-gap-inventory.md
Create tests/test_rebuild_master_docs_gap_contract.py
Update docs/master/README.md so active work is from-scratch rebuild, not VS-003
Run targeted tests
```


## Stage 6 — Second Vertical Rebuild Slice Selection

Second selected slice: VS-N002 Crop cycle recording scaffold

Status: `v1.14.11`에서 scaffold-only 계약/DTO/권한 경계 완료.

Reason: after VS-N001 RBAC/Admin ownership, crop-cycle recording needs a product-facing DTO/permission scaffold before monitoring and interlock slices consume crop context.

```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice
No write/mutation in VS-N002
No DB migration in VS-N002
```


## Stage 7 — Third Vertical Rebuild Slice Selection

Third selected slice: VS-N003 Real-time monitoring read-only scaffold

Status: `v1.14.11`에서 scaffold-only monitoring DTO/권한/freshness 경계 완료.

Reason: after RBAC/Admin ownership and crop-cycle context, monitoring needs a read-only DTO and freshness boundary before Interlock/Safety consumes sensor state.

```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
No DB migration in VS-N003
No sensor collection/scheduler in VS-N003
```


## Stage 8 — Fourth Vertical Rebuild Slice Selection

Fourth selected slice: VS-N004 Interlock/Safety core scaffold

Status: `v1.14.11`에서 scaffold-only safety/interlock DTO/권한/state-gate 경계 완료.

Reason: after RBAC, crop-cycle context, and monitoring read-only state, Interlock/Safety needs a read-only state-gate boundary before any future runtime adapter or approval/override release.

```text
RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold
No execution decision change in VS-N004
No approval/override release in VS-N004
```


## R5 Foundation Completion Baseline

`v1.14.11`에서 R5 foundation closure를 완료했다.

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

`v1.14.11`에서 R6-001 Crop cycle read-only adapter를 완료했다.

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

`v1.14.11`에서 R6-002 Monitoring read-only adapter를 완료했다.

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

`v1.14.11`에서 R6-003 Safety/Interlock read-only adapter를 완료했다.

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

`v1.14.11`에서 R7-000 IA blueprint를 완료했다.

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

`v1.14.11`에서 R7-001 main dashboard redesign을 완료했다.

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

`v1.14.11`에서 R7-002 sidebar navigation + page shell을 완료했다.

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

`v1.14.11`에서 R7-003 detail/configuration subpages baseline을 완료했다.

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

`v1.14.11`에서 R7-004 settings/admin read-only detail을 완료했다.

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

## R7-017~R7-024 Corrected Domain Tabs / Zone Context / Browser QA Plan

User correction after R7-016: domain visual rewrites must not become long single pages, and detailed work must be zone-scoped even though the main IA remains crop-centered.

Reference:

```text
docs/rebuild/r7-017-024-domain-tabs-zone-qa-plan.md
```

Corrected sequence:

```text
R7-017 환경 제어 visual rewrite with sub-tabs + zone context
R7-018 관수 제어 visual rewrite with sub-tabs + zone context
R7-019 장치 제어 visual rewrite with sub-tabs + zone context
R7-020 작물 운영 visual rewrite with sub-tabs + zone context
R7-021 자동화 제어 visual rewrite with sub-tabs + zone context
R7-022 안전 제어 visual rewrite with sub-tabs + zone/event context
R7-023 설정 visual rewrite with sub-tabs + zone/global-admin boundaries
R7-024 Browser QA + shared visual component correction loop
```

Required direction:

```text
Main IA remains crop-centered.
Detail work must be zone-scoped.
Every domain page from 작물 운영 through 설정 must use sub-tabs.
Do not stack all domain content into one long vertical page.
R7-024 Browser QA may modify shared visual components based on actual rendered screen evidence.
```

Boundaries remain:

```text
No API route change unless explicitly scoped
No DB migration unless explicitly scoped
No HA service call
No MQTT/device command
No save/apply/execute controls
No approval/override release
No SafetyGuard/Interlock runtime behavior change
No physical device hookup
```
