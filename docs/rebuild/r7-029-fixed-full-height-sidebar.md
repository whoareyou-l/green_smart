# R7-029 Fixed Full-Height Sidebar

> 기준 버전: `v1.15.15`
> Status: R7-029 planned
> Purpose: 간략형/상세형, 운영자/비운영자 모든 Green Smart sidebar를 화면 세로길이와 동일하게 하고, 페이지를 상하로 스크롤해도 고정된 위치에서 동일하게 보이도록 한다.

## User correction

사이드바는 어떤 모드에서도 본문 스크롤에 따라 위아래로 밀리면 안 된다.

Required behavior:

```text
height:100vh
max-height:100vh
position:fixed
top:0
bottom:0
overflow-y:auto
```

## Required markers

```text
data-r7-sidebar-fixed-viewport="true"
data-r7-sidebar-height-policy="100vh-fixed"
data-r7-sidebar-scroll-policy="internal-auto"
```

## Applies to all sidebar modes

```text
operator compact reference rail
operator detailed sidebar
non-operator compact sidebar
non-operator detailed sidebar
```

## Layout rule

The content grid still reserves the sidebar track width, but the sidebar itself is fixed to the viewport.

```text
compact operator rail = 68px track, fixed 100vh
compact non-operator rail = 82px track, fixed 100vh
detailed sidebar = 248px visual width, fixed 100vh
```

## Boundary

```text
No API route change in R7-029
No DB migration in R7-029
No HA service call in R7-029
No MQTT/device command in R7-029
No save/apply/execute control in R7-029
No approval/override release in R7-029
No SafetyGuard/Interlock runtime behavior change in R7-029
No physical device hookup in R7-029
```
