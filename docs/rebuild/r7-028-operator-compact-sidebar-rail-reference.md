# R7-028 Operator Compact Sidebar Rail Reference

> 기준 버전: `v1.15.45`
> Status: R7-028 planned
> Purpose: 사용자가 제공한 reference image 기준으로 운영자 간략형 sidebar를 HA sidebar 바로 오른쪽의 slim icon rail로 정렬한다.

## Reference image interpretation

이미지는 두 개의 인접한 vertical rail 구조다.

```text
[HA sidebar ~48px] [Green Smart compact rail ~68px] [content]
```

Green Smart compact rail characteristics:

- white background
- subtle right divider/shadow
- top rounded green logo tile
- icon-only navigation
- no text labels in compact/operator rail
- selected item uses pale green rounded-square background
- icons are muted green/gray
- vertical spacing is even and roomy
- bottom utility area keeps settings and exit/logout style icons

## Required markers

```text
data-r7-sidebar-rail-style="reference-slim-operator"
data-r7-sidebar-compact-rail="true"
data-r7-sidebar-rail-width="64"
data-r7-sidebar-logo-tile
data-r7-sidebar-nav-list
data-r7-sidebar-nav-icon-button
data-r7-sidebar-active-icon-tile="true"
data-r7-sidebar-utility-group
data-r7-sidebar-utility="settings"
data-r7-sidebar-utility="exit"
```

## Role/layout rule

- `operator` + collapsed/compact mode renders the reference-like slim rail immediately to the right of the HA sidebar.
- Non-operator roles may still use the full-left no-HA-sidebar policy from R7-027.
- Detailed mode remains available, but compact operator mode must not show domain text labels/summaries.

## Visual intent

```text
operator compact = HA sidebar kept + Green Smart slim icon rail
operator detail = HA sidebar kept + wider Green Smart detail sidebar
non-operator compact/detail = HA sidebar hidden + Green Smart starts at left
```

## Boundary

```text
No API route change in R7-028
No DB migration in R7-028
No HA service call in R7-028
No MQTT/device command in R7-028
No save/apply/execute control in R7-028
No approval/override release in R7-028
No SafetyGuard/Interlock runtime behavior change in R7-028
No physical device hookup in R7-028
```
