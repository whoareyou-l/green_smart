# R7-031 HA-like Sidebar

> 기준 버전: `v1.12.73`
> Status: R7-031 planned
> Purpose: Green Smart sidebar를 Home Assistant 사이드바처럼 보이도록 정리한다. 강제 fixed overlay가 아니라 grid-safe sticky 레이아웃을 유지한다.

## User request

```text
ha 사이드바처럼 만들어줘.
```

## Interpretation

Home Assistant-like sidebar means:

```text
left navigation rail
full viewport height
straight vertical panel, not floating rounded card
subtle right border
compact icon-only width around 64px
expanded width around 256px
logo/header at top
nav icons with text when expanded
selected item uses a left accent bar and soft active background
utility buttons at bottom
internal vertical scrolling only when nav overflows
grid-safe sticky positioning, not fixed left overlay
```

## Required markers

```text
data-r7-sidebar-visual-style="ha-like"
data-r7-sidebar-surface="vertical-rail"
data-r7-sidebar-compact-width="64"
data-r7-sidebar-expanded-width="256"
data-r7-sidebar-active-indicator="left-bar"
data-r7-sidebar-position-policy="sticky-grid-safe"
data-r7-sidebar-height-policy="100vh-sticky"
```

## Required style tokens

```text
border-right:1px solid #e1e5ea
border-radius:0
box-shadow:none
background:#ffffff
height:100vh
max-height:100vh
position:sticky
top:0
overflow-y:auto
```

## Forbidden sidebar style tokens

```text
position:fixed
left:0
border-radius:22px
box-shadow:8px 0 24px
```

## Boundary

```text
No API route change in R7-031
No DB migration in R7-031
No HA service call in R7-031
No MQTT/device command in R7-031
No save/apply/execute control in R7-031
No approval/override release in R7-031
No SafetyGuard/Interlock runtime behavior change in R7-031
No physical device hookup in R7-031
```
