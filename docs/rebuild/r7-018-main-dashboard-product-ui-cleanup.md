# R7-018 Main Dashboard Product UI Cleanup

> 기준 버전: `v1.14.27`
> Status: R7-018 complete
> Purpose: Rework the operations-home dashboard so rendered UI is operator-facing product UI, not a roadmap/development explanation surface.

## 1. Scope

R7-018 changes only rendered copy and layout hierarchy for the operations-home/main dashboard.

```text
Keep data-* markers for contracts.
Keep docs and tests as the place for direction/roadmap/boundary explanations.
Rendered UI must show current operating status, crop, zone, metrics, warnings, freshness, and next checks.
```

## 2. Main dashboard product-copy rule

The rendered main dashboard must not show developer/roadmap/process terms:

```text
R7-
RS-
shared domain visual frame
read-only
boundary
compatibility evidence
projection
scaffold
adapter
later only
manual-first
Crop-centered OS
Developer
No API
No DB
```

These can remain in source comments, docs, tests, and `data-*` attributes where necessary, but not in `panel.innerHTML` for the default operations-home render.

## 3. Required operator-facing sections

```text
오늘의 작물 운영
현재 선택 구역
우선 확인
핵심 지표
구역별 상태
경보
추세
작물 상태
생육 목표
환경·관수·장치 영향
추천·확인
```

## 4. Required product markers

```text
data-r7-main-product-dashboard="true"
data-r7-main-product-hero
data-r7-main-zone-focus
data-r7-main-priority-checks
data-r7-main-kpi-grid
data-r7-main-zone-status-grid
data-r7-main-alerts
data-r7-main-trends
```

Existing compatibility markers may remain:

```text
data-r7-operations-dashboard-rewrite="true"
data-r7-command-center-hero
data-r7-today-priority-panel
data-r7-kpi-rail
data-r7-domain-board
data-r7-alert-stack
data-r7-trend-board
```

## 5. Runtime boundaries

```text
No API route change in R7-018
No DB migration in R7-018
No HA service call in R7-018
No MQTT/device command in R7-018
No save/apply/execute controls in R7-018
No approval/override release in R7-018
No SafetyGuard/Interlock runtime behavior change in R7-018
No physical device hookup in R7-018
```

## 6. Acceptance

```text
R7-018 contract passes
Default operations-home render has no visible dev/roadmap terms
R7-014~R7-017 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod static smoke verifies v1.14.27 and R7-018 markers
```
