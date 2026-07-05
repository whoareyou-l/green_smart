# R7-019 Environment Detail Absorption

> 기준 버전: `v1.14.79`
> Status: R7-019 complete
> Purpose: Remove the rendered Environment Control read-only detail card and absorb its content into the zone-scoped visual tabs.

## 1. User correction

The Environment Control visual UI must not keep the old detail card as a collapsed or hidden compatibility block.

```text
Old detail card = source design inventory
New visual tabs = final product UI
Docs/tests = mapping and regression evidence
```

## 2. Existing detail inventory

`renderR7EnvironmentControlDetail()` previously contained these product facts.

| Old detail section | Items | New visual location |
|---|---|---|
| Manual/Base Settings | 주간 온도, 야간 온도, 습도, VPD, CO₂, 광/DLI | 설정값 tab cards |
| Rule/Schedule Automation | 주야간 전환, 환기 단계, 난방 최소온도, CO₂ 시간대 | 일정·규칙 tab cards |
| AI Assist / Optimization | aiEnvironmentCorrection, 수동 기준 대비 차이, fallback | 추천·보조 tab cards |
| Safety / Interlock / Fail Safe | environmentSafetyLimits, deviceInterlock, finalEnvironmentTargets | 인터록·차단 tab cards |
| Fallback principle | AI disabled/unhealthy/timeout/stale handling | 추천·보조 tab + docs only |

## 3. Product UI rule

The rendered Environment Control page must use only the shared domain visual frame and zone-scoped tabs.

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
data-r7-environment-control-detail
R7-008 read-only environment control detail
Manual/Base Settings
Rule/Schedule Automation
AI Assist / Optimization
Safety / Interlock / Fail Safe Finalization
AI 장애/fallback 원칙
```

The old items must still be visible through the new visual tabs:

```text
주간 온도
야간 온도
습도
VPD
CO₂
광/DLI
주야간 전환
환기 단계
난방 최소온도
CO₂ 시간대
aiEnvironmentCorrection
수동 기준 대비 차이
fallback
환경 한계
장치 인터록
최종 환경 후보
```

## 4. Runtime boundaries

```text
No API route change in R7-019
No DB migration in R7-019
No HA service call in R7-019
No MQTT/device command in R7-019
No save/apply/execute controls in R7-019
No approval/override release in R7-019
No SafetyGuard/Interlock runtime behavior change in R7-019
No physical device hookup in R7-019
```

## 5. Acceptance

```text
R7-019 contract passes
Environment Control default visual render has no old detail card
All old detail content is mapped to visual tabs/cards
R7-017 environment visual contract still passes
Full pytest passes
node --check passes
Prod static smoke verifies v1.14.79 and R7-019 markers
```
