# R7-040 Domain Subtab Top Navbar

> 기준 버전: `v1.14.96`
> Status: R7-040 planned
> Purpose: 작물 운영~설정 도메인의 하위탭을 버튼 묶음이 아니라 상단 네비게이션바 느낌으로 바꾸고, 각 탭에 HA `ha-icon`과 제목을 표시한다.

## User request

```text
작물 운영~설정에 있는 하위탭을 시각적으로 상단 네비게이션바의 느낌으로 만들어줘.
현재는 너무 버튼을 뭉쳐놓은 곳 같은 느낌임.
ha-icon과 제목 있게 해줘.
```

## Required behavior

```text
Apply to shared R7 domain frames:
- crop-operations
- environment-control
- irrigation-fertigation
- device-control
- recommendation-automation
- safety-history
- settings-admin

The domain subtab strip must render as a top navigation bar, not pill-button clusters.
Each subtab must include:
- a real <ha-icon icon="mdi:...">
- a visible title text
- active indicator / underline style

Preserve:
- existing domain keys
- existing subtab keys
- existing click binding through data-r7-domain-subtab-key
- unified content card order: tabs -> zone -> panel
```

## Required markers/tokens

```text
R7_DOMAIN_SUBTAB_ICONS
_r7DomainSubtabIcon(domainKey, tabKey)
data-r7-domain-subtabs-visual-style="top-navbar"
data-r7-domain-subtabs-old-style="pill-cluster"
data-r7-domain-subtab-layout="nav-item"
data-r7-domain-subtab-icon="ha-mdi"
data-r7-domain-subtab-title
ha-icon icon="mdi:
```

## Forbidden visual tokens on the rendered subtab nav

```text
border-radius:999px
flex-wrap:wrap;gap:8px
```

## Boundary

```text
No API route change in R7-040
No DB migration in R7-040
No HA service call in R7-040
No MQTT/device command in R7-040
No save/apply/execute control in R7-040
No SafetyGuard/Interlock runtime behavior change in R7-040
No physical device hookup in R7-040
```
