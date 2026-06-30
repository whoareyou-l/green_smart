# R7-021 Device Control Detail Absorption

> 기준 버전: `v1.12.90`
> Status: R7-021 planned/contracted
> Purpose: Remove the rendered Device Control read-only detail card and absorb its content into the zone-scoped visual tabs.

## 1. Product correction carried forward

The old detail card must not remain as a folded, hidden, or duplicate compatibility block after the visual UI absorbs its content.

```text
Old detail card = source design inventory
New visual tabs = final product UI
Docs/tests = mapping and regression evidence
```

## 2. Existing detail inventory

`renderR7DeviceControlDetail()` previously contained these product facts.

| Old detail section | Items | New visual location |
|---|---|---|
| Manual/Base Settings | manual, auto, locked, maintenance, HA entity mapping, MQTT topic mapping later only | 설정값 tab cards |
| Rule/Schedule Automation | operatorRequestedAction, automationCandidate, mode gate, mapping health | 일정·규칙 tab cards |
| AI Assist / Optimization | optional aiStrategyHint, hint only, fallback | 추천·보조 tab cards |
| Permission / Safety / Interlock / Fail Safe | permission check, Safety check, Interlock check, Fail Safe check, HA/MQTT status | 인터록·차단 tab cards |
| Fallback principle | AI hint-only, physical MQTT/device hookup blocked until virtual verification | 추천·보조 tab + docs only |

## 3. Product UI rule

The rendered Device Control page must use the shared domain visual frame and zone-scoped tabs.

Required tabs:

```text
상태 요약
설정값
일정·규칙
인터록·차단
추천·보조
추세·근거
```

The old detail card must not be rendered:

```text
data-r7-device-control-detail
R7-010 read-only device control detail
Manual/Base Settings
Rule/Schedule Automation
AI Assist / Optimization
Permission / Safety / Interlock / Fail Safe Finalization
장치 실행/fallback 원칙
```

The old items must still be visible through the new visual tabs:

```text
수동 모드
auto
locked
maintenance
HA entity mapping
MQTT topic mapping later only
operatorRequestedAction
automationCandidate
mode gate
mapping health
optional aiStrategyHint
hint only
fallback
permission check
Safety check
Interlock check
Fail Safe check
HA/MQTT status
Physical MQTT/device hookup remains blocked
```

## 4. Runtime boundaries

```text
No API route change in R7-021
No DB migration in R7-021
No HA service call in R7-021
No MQTT/device command in R7-021
No save/apply/execute controls in R7-021
No approval/override release in R7-021
No SafetyGuard/Interlock runtime behavior change in R7-021
No physical device hookup in R7-021
```

## 5. Acceptance

```text
R7-021 contract passes
Device Control default visual render has no old detail card
All old detail content is mapped to visual tabs/cards
Existing R7 routing/sidebar contracts still pass
Full pytest passes
node --check passes
Prod static/render smoke verifies v1.12.90 and R7-021 markers
```
