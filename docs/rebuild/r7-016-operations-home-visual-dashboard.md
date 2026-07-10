# R7-016 Operations Home Visual Dashboard Rewrite

> 기준 버전: `v1.15.00`
> Status: R7-016 complete
> Purpose: R7-015 공통 visual component를 이용해 운영 홈을 더 실제 control-room dashboard처럼 재배치한다.

## 1. Scope

R7-016 changes only the read-only operations-home layout.

```text
Before: visual components exist, but operations home still reads like a visual block plus older explanatory content.
After: operations home starts with a dashboard summary grid: command center hero, today priority, KPI rail, domain board, alert stack, trend board, and secondary CBA stage flow.
```

## 2. Required operations-home sections

```text
Command Center Hero
Today Priority Panel
KPI Rail
Domain Board
Alert Stack
Trend Board
Secondary CBA Stage Flow
```

## 3. Required markers

```text
data-r7-operations-dashboard-rewrite="true"
data-r7-command-center-hero
data-r7-today-priority-panel
data-r7-kpi-rail
data-r7-kpi-rail-item
data-r7-domain-board
data-r7-domain-board-card
data-r7-alert-stack
data-r7-trend-board
data-r7-secondary-stage-flow
```

Existing R7-015 visual markers must remain:

```text
data-r7-visual-system="true"
data-r7-status-badge
data-r7-severity-card
data-r7-freshness-pill
data-r7-metric-card
data-r7-domain-health-strip
data-r7-alert-banner
data-r7-mini-trend-chart
```

## 4. Visual hierarchy rule

The operator should see this order first:

```text
1. 현재 전체 상태
2. 오늘 우선 확인 사항
3. 핵심 KPI
4. 도메인별 상태
5. 차단/인터록/Fail Safe/센서 오류
6. 추세 placeholder
7. 작물 중심 CBA 단계 흐름
```

The older crop-centered OS explanation remains as secondary context, not the first visual element.

## 5. Required visible labels

```text
운영 지휘판
오늘 우선 확인
핵심 KPI
도메인 보드
경보 스택
추세 보드
보조 CBA 단계 흐름
전체 상태
작물 상태
환경 편차
관수 상태
장치 응답
안전 판단
최우선 조치
```

## 6. Runtime boundaries

```text
No API route change in R7-016
No DB migration in R7-016
No HA service call in R7-016
No MQTT/device command in R7-016
No save/apply/execute controls in R7-016
No approval/override release in R7-016
No SafetyGuard/Interlock runtime behavior change in R7-016
```

## 7. Acceptance

```text
R7-016 targeted contract passes
R7-015 common visual system contract still passes
R7-014 routing contract still passes
Full pytest passes
node --check passes for both panel files
Prod HA check_config/restart/static smoke passes before release
```
