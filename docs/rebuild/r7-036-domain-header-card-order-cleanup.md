# R7-036 Domain Header Card Order Cleanup

> 기준 버전: `v1.15.49`
> Status: R7-036 planned
> Purpose: 작물 운영부터 설정까지 도메인 페이지 상단 카드 구조를 사용자 요청 순서로 정리한다.

## User request

```text
1. 작물 운영~설정관리 도메인까지의 페이지 상단에 있는 온도, 습도, vpd, co2 카드는 없애줘.
2. 작물 운영~설정관리 도메인까지의 페이지 있는 카드의 순서를 제목, 하위탭, 선택 구역, 하위탭 내용카드 순으로 변경해줘.
```

## Required behavior

For every R7 domain page from `crop-operations` through `settings-admin`:

```text
1. title / hero card
2. domain sub-tabs
3. selected zone / zone selector
4. active sub-tab content card
```

The old top metric summary grid must be removed from these domain pages:

```text
온도
습도
VPD
CO₂
```

## Required markers

```text
data-r7-domain-frame-order="title-subtabs-zone-content"
data-r7-domain-top-env-metrics="removed"
data-r7-domain-visual-hero
[data-r7-domain-subtabs]
[data-r7-zone-context-bar]
[data-r7-domain-subtab-panel]
```

## Boundary

```text
No API route change in R7-036
No DB migration in R7-036
No HA service call in R7-036
No MQTT/device command in R7-036
No save/apply/execute control in R7-036
No approval/override release in R7-036
No SafetyGuard/Interlock runtime behavior change in R7-036
No physical device hookup in R7-036
```
