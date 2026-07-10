# R7-038 HA MDI Sidebar Icons

> 기준 버전: `v1.15.00`
> Status: R7-038 planned
> Purpose: 사이드바 로고와 도메인 아이콘을 사용자가 지정한 Home Assistant `ha-icon`/MDI 아이콘으로 교체한다.

## User request

```text
로고 이미지: ha-icon icon="mdi:leaf"
운영 홈: ha-icon icon="mdi:home-variant"
작물 운영: ha-icon icon="mdi:sprout"
환경 제어: ha-icon icon="mdi:thermometer-lines"
관수 제어: ha-icon icon="mdi:water"
장치 제어: ha-icon icon="mdi:cog-box"
자동화 제어: ha-icon icon="mdi:robot-outline"
안전 제어: ha-icon icon="mdi:shield-check-outline"
설정: ha-icon icon="mdi:cog"
```

## Required mapping

```text
logo -> mdi:leaf
operations-home -> mdi:home-variant
crop-operations -> mdi:sprout
environment-control -> mdi:thermometer-lines
irrigation-fertigation -> mdi:water
device-control -> mdi:cog-box
recommendation-automation -> mdi:robot-outline
safety-history -> mdi:shield-check-outline
settings-admin -> mdi:cog
```

## Required behavior

```text
Sidebar brand/logo must render <ha-icon icon="mdi:leaf">.
All sidebar nav/utility domain icons must render <ha-icon> with the requested MDI icon values.
Do not render the previous inline SVG path icon for sidebar domain icons.
Do not render the previous PNG reference-logo asset for the sidebar logo.
Keep the HA-adjacent sidebar layout, settings utility placement, and logout/profile layout unchanged.
```

## Required markers

```text
R7_HA_MDI_ICONS
data-r7-sidebar-icon-style="ha-mdi"
data-r7-sidebar-ha-icon="<domain-key>"
data-r7-sidebar-logo-style="ha-mdi-leaf"
ha-icon icon="mdi:leaf"
ha-icon icon="mdi:home-variant"
ha-icon icon="mdi:sprout"
ha-icon icon="mdi:thermometer-lines"
ha-icon icon="mdi:water"
ha-icon icon="mdi:cog-box"
ha-icon icon="mdi:robot-outline"
ha-icon icon="mdi:shield-check-outline"
ha-icon icon="mdi:cog"
```

## Boundary

```text
No API route change in R7-038
No DB migration in R7-038
No HA service call in R7-038
No MQTT/device command in R7-038
No save/apply/execute control in R7-038
No approval/override release in R7-038
No SafetyGuard/Interlock runtime behavior change in R7-038
No physical device hookup in R7-038
```
