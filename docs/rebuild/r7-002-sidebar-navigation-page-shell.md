# R7-002 Sidebar Navigation + Page Shell

> 기준 버전: `v1.12.36`
> Status: R7-002 complete
> 목적: R7-000에서 확정한 sidebar primary groups와 page shell을 rebuild panel에 구현한다.

## 1. Scope

R7-002 implements the R7 sidebar primary groups and page shell around the existing R7-001 crop-centered dashboard.

```text
운영 홈
작물 중심 운영
현장 상태
추천·실행 검토
설정·관리
```

R7-002 does not create new functional pages yet. It wraps the current crop-centered dashboard in a stable shell so later R7-003~R7-006 detail/configuration subpages have a consistent place to land.

## 2. Implemented panel markers

```text
data-r7-app-shell
data-r7-sidebar
data-r7-sidebar-primary-groups
data-r7-sidebar-group="operations-home"
data-r7-sidebar-group="crop-centered"
data-r7-sidebar-group="field-status"
data-r7-sidebar-group="recommendation-review"
data-r7-sidebar-group="settings-admin"
data-r7-page-shell
data-r7-page-header
data-r7-page-workspace
data-r7-mobile-nav
```

## 3. Shell composition

```text
R7_SIDEBAR_GROUPS
renderR7Sidebar()
renderR7MobileNav()
renderR7PageShell()
```

The page shell keeps the dashboard workspace as:

```text
renderR7PageShell() → data-r7-page-workspace → renderOperatingHome()
```

So R7-001 markers remain available:

```text
data-r7-main-dashboard
data-r7-stage-grid
data-r7-source-shapes
data-r7-detail-page-shell
```

## 4. Navigation model

The sidebar is not a legacy domain-only navigation copy. It is the R7 primary group model:

| Group | Meaning |
|---|---|
| 운영 홈 | crop-centered daily operating overview |
| 작물 중심 운영 | crop status, growth target, zone drilldown |
| 현장 상태 | environment/irrigation/device effects on crops |
| 추천·실행 검토 | recommendation, approval, virtual rehearsal, safety evidence |
| 설정·관리 | Admin/System, device mapping, RBAC/config |

## 5. Boundaries

```text
No API route change in R7-002
No DB migration in R7-002
No execution authority in R7-002
No approval/override release in R7-002
No SafetyGuard/Interlock runtime behavior change in R7-002
No MQTT/device command in R7-002
No standalone 구역별 작물 운영 section
```

The sidebar may link to existing dashboard anchors, but it does not add service calls, device commands, approval override, or execution controls.

## 6. Next slice

```text
R7-003 Detail/configuration subpages baseline
```

R7-003 should start turning these shell groups into concrete read-only detail/configuration subpage placeholders or the first approved detail page, while preserving read-only/no-execution boundaries.
