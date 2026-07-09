# R7-001 Main Dashboard Redesign

> 기준 버전: `v1.14.89`
> Status: R7-001 complete
> 목적: R7-000 IA blueprint를 첫 operator-visible crop-centered dashboard로 구현한다.

> R7-005+ direction note: this document is historical completion evidence for the earlier crop-centered R7 dashboard. The current target domain direction is now defined by `r7-005-legacy-audit-domain-research-manual-first-plan.md` and `r7-006-manual-first-target-domain-spec.md`: Green Smart is a manual-operable environment-control OS, AI is an assist layer, and the old `현장 상태` / `추천·실행 검토` framing must be adapted before future UI work.

## 1. Scope

R7-001 implements the first operator-visible crop-centered dashboard in the rebuild panel.

```text
작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행
```

The dashboard renders from the existing read-only home context API and R6 source shapes.

```text
render from existing GET /api/green_smart/rebuild/home/context shape
No fixture-only cards in R7-001
```

Fallback static context remains only for loading/error fallback; the operator dashboard contract is bound to the same normalized home context shape.

## 2. Implemented panel markers

```text
data-r7-main-dashboard
data-r7-dashboard-hero
data-r7-source-shapes
data-r7-readonly-boundary
data-r7-stage-grid
data-r7-stage-card="crop-status"
data-r7-stage-card="growth-goal"
data-r7-stage-card="environment-impact"
data-r7-stage-card="recommend-act"
data-r7-detail-page-shell
```

Detail shell grammar remains:

```text
detailHeader → evidenceSummary → zoneTabs → selectedZonePanel → optionalDetailModal
```

## 3. R6 read-only source shapes used by R7-001

```text
currentCropAssignment
monitoringReadOnlyAdapter
safetyInterlockReadOnlyAdapter
environmentImpactProjection
recommendationReviewProjection
virtualExecutionRehearsalScaffold
sourceMonitoringReadOnlyAdapter
sourceSafetyInterlockReadOnlyAdapter
```

Displayed source markers:

```text
data-r7-source-current-crop-assignment
data-r7-source-monitoring-readonly-adapter
data-r7-source-safety-interlock-readonly-adapter
data-r7-source-environment-impact-projection
data-r7-source-recommendation-review-projection
data-r7-source-virtual-execution-rehearsal-scaffold
```

## 4. Fixed stage-key regression

Before R7-001, the visible stage key was:

```text
recommend-act
```

but some projection helpers still checked the older internal key:

```text
recommendation-execution
```

R7-001 aligns recommendation/approval/safety/rehearsal helper rendering to:

```text
recommend-act
```

so the `추천·실행` stage actually renders its read-only evidence cards.

## 5. Boundaries

```text
No API route change in R7-001
No DB migration in R7-001
No execution authority in R7-001
No approval/override release in R7-001
No SafetyGuard/Interlock runtime behavior change in R7-001
No MQTT/device command in R7-001
No standalone 구역별 작물 운영 section
```

The dashboard may show read-only safety/interlock/rehearsal evidence, but it does not grant execution, override, device command, or MQTT authority.

## 6. Next slice

```text
R7-002 Sidebar navigation + page shell
```

R7-002 should restructure the navigation shell around the R7 sidebar primary groups without changing execution authority.


## R7-002 Sidebar Navigation + Page Shell

`v1.14.89`에서 R7-002 sidebar navigation + page shell을 완료했다.

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
