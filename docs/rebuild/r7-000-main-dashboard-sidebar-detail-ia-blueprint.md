# R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint

> 기준 버전: `v1.12.87`
> Status: R7-000 complete
> 목적: R6 read-only adapter 3종 완료 후, 실제 화면 구현 전에 메인 대시보드/사이드바/상세페이지/하위페이지 IA를 고정한다.

## 1. Position

```text
R6-001 Crop cycle read-only adapter ✅
R6-002 Monitoring read-only adapter ✅
R6-003 Safety/Interlock read-only adapter ✅
→ R7-000 Main Dashboard / Sidebar / Detail Page IA Blueprint
→ R7-001 Main dashboard redesign
→ R7-002 Sidebar navigation + page shell
→ R7-003~R7-006 detail/configuration subpages
```

R7-000 is an IA blueprint only. R7-000 runtime code remains unchanged.

```text
No panel DOM implementation change in R7-000
No API route change in R7-000
No DB migration in R7-000
No execution authority in R7-000
No SafetyGuard/Interlock runtime behavior change in R7-000
question gates must use clarify tool
```

## 2. Product frame

R7 keeps the product frame crop-centered rather than legacy domain-first navigation.

```text
crop-centered operating frame
작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행
```

The main dashboard should answer the operator's daily questions in this order:

1. 지금 작물 상태는 어떤가?
2. 현재 생육목표와 목표 이탈은 무엇인가?
3. 환경/관수/장치 상태가 작물에 어떤 영향을 주는가?
4. 추천·실행 검토에서 무엇을 승인/보류/리허설해야 하는가?

## 3. Zone drilldown rule

```text
zone drilldown lives inside each crop-centered stage
do not create standalone 구역별 작물 운영
```

Confirmed CBA shape:

```text
PAGE-CropCenteredHome
→ MOD-CropStageZoneDetail
→ COM-ZoneTabs
→ COM-ZonePanel
→ COM-ZoneDetailModal
```

Each crop-centered stage has its own selected-zone detail:

| Stage | Zone detail focus |
|---|---|
| 작물상태 | zone current crop, state badge, freshness, survey evidence |
| 생육목표 | zone target stage/focus and target-basis evidence |
| 환경/관수/장치 영향 | zone equipment profile, monitoring freshness, impact evidence |
| 추천/실행 | zone recommendation review, safety/interlock evidence, virtual rehearsal status |

R7 UI implementation slices should default to a readable one-card-per-row stage flow:

```text
one-card-per-row stage flow
data-cba-layout="single-column-stage-flow"
```

## 4. R7 sidebar primary groups

```text
R7 sidebar primary groups
```

| Group | Purpose | Notes |
|---|---|---|
| 운영 홈 | daily crop-centered overview | default landing surface |
| 작물 중심 운영 | crop status, growth target, zone drilldown | not a legacy-only crop-settings page |
| 현장 상태 | environment/irrigation/device read-only effects | support crop-centered decisions |
| 추천·실행 검토 | recommendation, approval, virtual rehearsal, safety evidence | read-only first; execution authority remains separate |
| 설정 | Admin/System, device mapping, RBAC/config | farm_staff avoids technical fields |

The R7 sidebar must not merely copy the legacy domain order as the conceptual model. Domain pages can remain as compatibility/detail surfaces, but the primary operator mental model is crop-centered.

## 5. Detail page shell

```text
detail page shell
detailHeader → evidenceSummary → zoneTabs → selectedZonePanel → optionalDetailModal
```

Required grammar:

1. `detailHeader`: title, crop/zone scope, read-only/execution boundary pill.
2. `evidenceSummary`: operator summary before technical evidence.
3. `zoneTabs`: primary navigation across zones, not a horizontal card rail as the main navigation.
4. `selectedZonePanel`: one selected zone's state/projection/evidence.
5. `optionalDetailModal`: deeper evidence and troubleshooting, opened intentionally.

## 6. Subpage grammar

```text
subpage grammar
read-only evidence first
operator summary before technical evidence
mobile 360px 기준
PC sidebar + detail workspace
```

Subpages should follow this order:

```text
operator summary → source freshness → zone-scoped evidence → safety/interlock boundary → optional technical details
```

Implementation notes for later R7 slices:

- Mobile: 360px 기준, single-column, tabs are touch-friendly.
- PC: left sidebar + detail workspace, selected zone panel remains readable.
- Technical fields go behind detail/advanced affordances.
- Execution buttons are not introduced by IA alone.

## 7. R6 read-only source shapes

R7 UI must render from existing R6 read-only source shapes, not fake standalone cards.

```text
R6 read-only source shapes
currentCropAssignment
monitoringReadOnlyAdapter
safetyInterlockReadOnlyAdapter
environmentImpactProjection
recommendationReviewProjection
virtualExecutionRehearsalScaffold
render from existing GET /api/green_smart/rebuild/home/context shape
No fixture-only cards in R7 UI implementation slices
```

Source mapping:

| R7 area | R6 source |
|---|---|
| 작물상태 | `currentCrop`, `currentCropAssignment`, `dataAvailability` |
| 생육목표 | `growthTargetProjection` |
| 환경/관수/장치 영향 | `monitoringReadOnlyAdapter`, `environmentImpactProjection`, `equipmentProfile` |
| 추천·실행 | `recommendationReviewProjection`, `safetyInterlockReadOnlyAdapter`, `virtualExecutionRehearsalScaffold` |

## 8. Role/RBAC visibility principle

R7 remains role-aware:

| Role | Main UI emphasis |
|---|---|
| farm_staff | today's status, records, alerts, read-only reasons, allowed tasks |
| farm_owner | strategy review, approval review, risk summaries, reports |
| admin | RBAC, HA/entity mapping, diagnostics, system config |

R7-000 does not add new permissions or routes. Role-specific rendering rules are documented here for later UI slices.

## 9. Forbidden drift for R7 implementation slices

When R7-001+ starts, do not drift into these without a separate decision:

```text
No live device hookup before virtual verification
No manual execution controls from dashboard redesign alone
No approval/override release from sidebar/page shell alone
No sensor scheduler or HA entity read API from UI card demand alone
No standalone 구역별 작물 운영 section
No legacy operator copy such as 레거시를 참고하되 in rendered UI
```

## 10. Next slice

```text
R7-001 Main dashboard redesign
```

R7-001 may implement the first operator-visible crop-centered dashboard, but it must use the source shapes listed above and retain read-only/no-execution boundaries unless separately approved.


## R7-001 Main Dashboard Redesign

`v1.12.87`에서 R7-001 main dashboard redesign을 완료했다.

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

`v1.12.87`에서 R7-002 sidebar navigation + page shell을 완료했다.

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

`v1.12.87`에서 R7-003 detail/configuration subpages baseline을 완료했다.

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

`v1.12.87`에서 R7-004 settings/admin read-only detail을 완료했다.

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
