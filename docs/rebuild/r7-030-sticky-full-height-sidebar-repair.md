# R7-030 Sticky Full-Height Sidebar Repair

> 기준 버전: `v1.13.9`
> Status: R7-030 planned
> Purpose: v1.13.9의 `position:fixed; left:0` sidebar가 HA/sidebar/content layout 흐름을 깨는 문제를 수정한다.

## Root cause

`position:fixed; left:0`는 Green Smart sidebar를 grid layout에서 빼내 viewport 왼쪽에 강제로 붙인다. 이 방식은 다음 문제를 만든다.

```text
HA sidebar와 겹칠 수 있음
content grid reserved track과 실제 sidebar 위치가 불일치함
operator compact rail이 HA sidebar 바로 오른쪽이라는 R7-028 의도를 깨뜨림
```

## Corrected behavior

스크롤 중 고정 효과는 유지하되, sidebar는 자기 grid column 안에 남아야 한다.

```text
height:100vh
max-height:100vh
position:sticky
top:0
overflow-y:auto
```

Forbidden in product sidebar style:

```text
position:fixed
left:0
```

## Required markers

```text
data-r7-sidebar-fixed-viewport="true"
data-r7-sidebar-height-policy="100vh-sticky"
data-r7-sidebar-scroll-policy="internal-auto"
data-r7-sidebar-position-policy="sticky-grid-safe"
```

## Applies to all sidebar modes

```text
operator compact reference rail
operator detailed sidebar
non-operator compact sidebar
non-operator detailed sidebar
```

## Boundary

```text
No API route change in R7-030
No DB migration in R7-030
No HA service call in R7-030
No MQTT/device command in R7-030
No save/apply/execute control in R7-030
No approval/override release in R7-030
No SafetyGuard/Interlock runtime behavior change in R7-030
No physical device hookup in R7-030
```
