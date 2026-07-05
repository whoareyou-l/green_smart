# R7-014 Domain Page Routing

> 기준 버전: `v1.14.83`
> Status: R7-014 complete
> Purpose: R7 manual-first domains를 운영 홈 아래에 누적 렌더하지 않고, sidebar/mobile nav 선택에 따라 각 도메인을 실제 page/detail view로 전환한다.

## 1. Scope

R7-014 changes only the rebuild panel page structure.

Before R7-014:

```text
운영 홈 shell
  + 모든 R7 detail subpage blocks
  + 운영 홈 dashboard
```

After R7-014:

```text
운영 홈 = summary dashboard page
작물 운영 = independent domain page
환경 제어 = independent domain page
관수 제어 = independent domain page
장치 제어 = independent domain page
자동화 제어 = independent domain page
안전 제어 = independent domain page
설정 = independent domain page
```

Only one active domain page is visible at a time.

## 2. Required behavior

```text
Default active domain: operations-home
Sidebar click changes active domain without page reload
Mobile nav click changes active domain without page reload
Active sidebar/mobile item is marked with aria-current="page"
Active page has data-r7-domain-page-active="true"
Inactive pages are not dumped into the main workspace
The operator no longer sees all domain details stacked under 운영 홈
```

## 3. Required markers

```text
data-r7-domain-page-router="true"
data-r7-active-domain="operations-home|crop-operations|environment-control|irrigation-fertigation|device-control|recommendation-automation|safety-history|settings-admin"
data-r7-domain-page-shell
 data-r7-domain-page="operations-home"
 data-r7-domain-page="crop-operations"
 data-r7-domain-page="environment-control"
 data-r7-domain-page="irrigation-fertigation"
 data-r7-domain-page="device-control"
 data-r7-domain-page="recommendation-automation"
 data-r7-domain-page="safety-history"
 data-r7-domain-page="settings-admin"
data-r7-domain-page-active="true"
data-r7-domain-page-hidden="true"
data-r7-sidebar-active="true"
data-r7-mobile-nav-active="true"
```

## 4. Runtime boundaries

```text
No API route change in R7-014
No DB migration in R7-014
No HA service call in R7-014
No MQTT/device command in R7-014
No execution/apply/save controls in R7-014
No approval/override release in R7-014
No SafetyGuard/Interlock runtime behavior change in R7-014
```

## 5. Operator acceptance

The page should feel like:

```text
sidebar navigation → selected domain page
```

not:

```text
one long document containing every domain
```

R7-014 is still read-only structure work. Visual dashboard widgets, charts, status badges, and alert effects are the next UI-design slice after page routing.

## 6. Acceptance

```text
R7-014 targeted contract passes
R7-007 through R7-013 contracts still pass
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
