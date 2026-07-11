# R7-032 HA-adjacent Green Line Sidebar

> 기준 버전: `v1.15.28`
> Status: R7-032 planned
> Purpose: Green Smart sidebar를 HA 사이드바 바로 오른쪽에 붙이고, Green Smart 메인 컬러를 초록으로 복귀하며, 하단 2번째 utility를 설정 도메인으로 대체하고, 아이콘을 심플 라인 아이콘 느낌으로 변경한다.

## User request

```text
사이드바를 ha사이드바 바로 오른쪽옆에 붙여줘.
그리고 메인 컬러는 이전에 초록색으로 하면 좋겠어.
그리고 사이드바의 밑에서 2번째를 설정 관리 도메인으로 대체해줘.
마지막으로 아이콘은 심플한 라인 아이콘 느낌으로 변경해줘.
```

## Required behavior

```text
HA sidebar is kept visible for operator-adjacent layout.
Green Smart sidebar is the immediate next grid column after HA sidebar.
No visual gap between HA sidebar and Green Smart sidebar.
Green Smart compact rail remains 64px; expanded rail remains 256px.
Main accent color returns to green.
The second utility item from the bottom opens/settings-admin domain, not a separate gear settings screen.
The bottom-most utility remains exit/back.
All navigation icons render as simple line-icon style, not emoji.
```

## Required markers

```text
data-r7-ha-adjacent-placement="right-of-ha-sidebar"
data-r7-sidebar-adjacent-gap="0"
data-r7-sidebar-main-color="green"
data-r7-sidebar-accent-color="#43ad5e"
data-r7-sidebar-icon-style="line"
data-r7-sidebar-utility-domain="settings-admin"
data-r7-sidebar-utility-position="second-from-bottom"
data-r7-sidebar-utility="exit"
```

## Required style tokens

```text
column-gap:0
margin-left:0
border-left:0
#43ad5e
#e3f4e6
#31523b
```

## Forbidden rendered sidebar tokens

```text
🏠
🌱
🌡️
💧
⚙️
🤖
🛡️
🧩
#03a9f4
설정" data-r7-sidebar-utility="settings"
```

## Boundary

```text
No API route change in R7-032
No DB migration in R7-032
No HA service call in R7-032
No MQTT/device command in R7-032
No save/apply/execute control in R7-032
No approval/override release in R7-032
No SafetyGuard/Interlock runtime behavior change in R7-032
No physical device hookup in R7-032
```
