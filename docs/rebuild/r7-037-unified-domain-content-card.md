# R7-037 Unified Domain Content Card

> 기준 버전: `v1.14.58`
> Status: R7-037 planned
> Purpose: 작물 운영부터 설정까지 도메인 페이지에서 하위탭, 선택 구역, 내용 영역을 하나의 카드로 통합한다.

## User request

```text
작물 운영~설정 도메인 페이지의 하위탭, 선택 구역, 내용 카드를 1개로 합쳐서 1개의 카드로 만들어줘.
```

## Required behavior

For every R7 domain page from `crop-operations` through `settings-admin`:

```text
1. title / hero card
2. one unified content card containing:
   - domain sub-tabs
   - selected zone / zone selector
   - active sub-tab content
```

The tabs, selected-zone selector, and active content must no longer be rendered as three sibling cards directly under the visual frame.

## Required markers

```text
data-r7-domain-frame-order="title-unified-card"
data-r7-domain-content-card="tabs-zone-content"
data-r7-domain-content-card-unified="true"
data-r7-domain-top-env-metrics="removed"
data-r7-domain-visual-hero
[data-r7-domain-subtabs]
[data-r7-zone-context-bar]
[data-r7-domain-subtab-panel]
```

## Boundary

```text
No API route change in R7-037
No DB migration in R7-037
No HA service call in R7-037
No MQTT/device command in R7-037
No save/apply/execute control in R7-037
No approval/override release in R7-037
No SafetyGuard/Interlock runtime behavior change in R7-037
No physical device hookup in R7-037
```
