# R7-035 Reference Logo + Sage Sidebar Icons

> 기준 버전: `v1.14.67`
> Status: R7-035 planned
> Purpose: 사용자가 제공한 사이드바 이미지 기준으로 Green Smart 로고와 sidebar icon visual style을 맞춘다.

## User request

```text
이미지의 최상단에 있는 그린스마트의 로고 이미지로 해줘.
그리고 아이콘은 여기서 상용한 아이콘의 느낌으로 변경해줘.
```

## Visual reference interpretation

```text
Top logo: green rounded square tile with white leaf mark.
Icon style: muted sage green, simple soft filled/line hybrid icons.
Active state: pale mint rounded square tile behind icon.
Inactive state: plain white rail with sage icon only.
Spacing: centered vertical rail icons with generous gaps.
```

## Required behavior

```text
Sidebar brand/logo uses the reference green rounded-square leaf logo, not the previous generic crop line icon.
Domain/sidebar utility icons use the reference sage icon style instead of the previous stroke-only currentColor line icon look.
Active nav icon uses a pale mint rounded tile matching the reference image.
Compact and expanded modes both preserve the reference logo/icon style.
Settings/Admin and logout/user utility keep their current behavior and placement.
```

## Required markers/tokens

```text
data-r7-sidebar-logo-style="reference-leaf-tile"
data-r7-sidebar-logo-source="attached-reference"
data-r7-sidebar-logo-leaf="true"
data-r7-sidebar-icon-reference-style="soft-sage-filled"
data-r7-sidebar-icon-palette="reference-sage"
data-r7-sidebar-active-icon-tile="soft-mint"
data-r7-sidebar-icon-tone="#6f8d7b"
data-r7-sidebar-active-icon-bg="#eef8ee"
#43ad5e
#6f8d7b
#eef8ee
```

## Boundary

```text
No API route change in R7-035
No DB migration in R7-035
No HA service call in R7-035
No MQTT/device command in R7-035
No save/apply/execute control in R7-035
No approval/override release in R7-035
No SafetyGuard/Interlock runtime behavior change in R7-035
No physical device hookup in R7-035
```
