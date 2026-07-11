# R7-003 Detail/Configuration Subpages Baseline

> 기준 버전: `v1.15.30`
> Status: R7-003 complete
> selected scope: all five sidebar groups receive read-only detail/config placeholder baselines
> 목적: all five R7 sidebar groups receive read-only detail/config placeholder baselines.

> R7-005+ direction note: these five placeholders are now classified as `DEPRECATE/REWRITE` in `r7-005-legacy-audit-domain-research-manual-first-plan.md`. Keep this document as evidence of what was released, but do not treat the old placeholder set as the product target. New detail pages must follow the manual-first target domains in `r7-006-manual-first-target-domain-spec.md`.

## 1. Scope

R7-003 creates the first baseline for R7 detail/configuration subpages across the five sidebar groups selected by the user.

```text
운영 홈
작물 중심 운영
현장 상태
추천·실행 검토
설정
```

This is not yet a deep implementation of one subpage. It is the page-slot baseline that lets later R7-004+ slices replace placeholders one group at a time without changing shell grammar.

## 2. Implemented panel markers

```text
data-r7-detail-subpages-baseline
data-r7-detail-subpage="operations-home"
data-r7-detail-subpage="crop-centered"
data-r7-detail-subpage="field-status"
data-r7-detail-subpage="recommendation-review"
data-r7-detail-subpage="settings-admin"
data-r7-subpage-readonly-boundary="true"
data-r7-subpage-config-placeholder
data-r7-subpage-evidence-summary
data-r7-subpage-source-freshness
data-r7-subpage-zone-scope
data-r7-subpage-safety-boundary
```

## 3. Subpage registry and helpers

```text
R7_DETAIL_SUBPAGES
renderR7DetailSubpage()
renderR7SubpagePlaceholders()
```

The baseline is rendered inside the existing R7 page workspace:

```text
data-r7-page-workspace
→ data-r7-detail-subpages-baseline
→ data-r7-main-dashboard
```

R7-001 dashboard and R7-002 shell markers remain present.

## 4. Subpage grammar

Each placeholder follows the R7-000 grammar:

```text
operator summary → source freshness → zone-scoped evidence → safety/interlock boundary → optional technical details
```

This keeps the operator summary first and pushes technical details behind an intentional details affordance.

## 5. Group baseline mapping

| Group | Placeholder focus | Read-only source/basis |
|---|---|---|
| 운영 홈 | daily crop-centered overview | currentCropAssignment + dataAvailability |
| 작물 중심 운영 | crop status/growth target detail slot | currentCropAssignment + growthTargetProjection |
| 현장 상태 | environment/irrigation/device effect slot | monitoringReadOnlyAdapter + environmentImpactProjection |
| 추천·실행 검토 | recommendation/safety/rehearsal review slot | recommendationReviewProjection + safetyInterlockReadOnlyAdapter + virtualExecutionRehearsalScaffold |
| 설정 | Admin/System, device mapping, RBAC/config slot | RBAC/config documentation baseline |

## 6. Boundaries

```text
No API route change in R7-003
No DB migration in R7-003
No execution authority in R7-003
No approval/override release in R7-003
No SafetyGuard/Interlock runtime behavior change in R7-003
No MQTT/device command in R7-003
No standalone 구역별 작물 운영 section
```

The placeholders are read-only. They do not add save/delete/approve/execute controls or service calls.

## 7. Next slice

```text
R7-004 First real detail subpage implementation
```

R7-004 should choose one group to replace its placeholder with a deeper read-only implementation. If multiple groups are possible, ask the user before choosing.


## R7-004 Settings/Admin Read-only Detail

`v1.15.30`에서 R7-004 settings/admin read-only detail을 완료했다.

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
