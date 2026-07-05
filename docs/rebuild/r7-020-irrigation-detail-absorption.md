# R7-020 Irrigation/Fertigation Detail Absorption

> 기준 버전: `v1.14.84`
> Status: R7-020 planned/contracted
> Purpose: Remove the rendered Irrigation/Fertigation read-only detail card and absorb its content into the zone-scoped visual tabs.

## 1. Product correction carried forward

The old detail card must not remain as a folded, hidden, or duplicate compatibility block after the visual UI absorbs its content.

```text
Old detail card = source design inventory
New visual tabs = final product UI
Docs/tests = mapping and regression evidence
```

## 2. Existing detail inventory

`renderR7IrrigationFertigationDetail()` previously contained these product facts.

| Old detail section | Items | New visual location |
|---|---|---|
| Manual/Base Settings | 관수 스케줄, 일사 누적 관수, EC 목표, pH 목표, 급액량, 배액률, 드라이백, 양액 레시피 | 설정값 tab cards |
| Rule/Schedule Automation | 시간 기반 관수, 일사 누적 관수, 근권 수분 기준 관수, 저수조/배액 재활용 점검 | 일정·규칙 tab cards |
| AI Assist / Optimization | aiIrrigationCorrection, 수동 기준 대비 차이, fallback | 추천·보조 tab cards |
| Safety / Interlock / Fail Safe | irrigationSafetyLimits, sensorFreshness, finalIrrigationTargets | 인터록·차단 tab cards |
| Fallback principle | AI disabled/unhealthy/timeout/stale handling | 추천·보조 tab + docs only |

## 3. Product UI rule

The rendered Irrigation/Fertigation page must use the shared domain visual frame and zone-scoped tabs.

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
data-r7-irrigation-fertigation-detail
R7-009 read-only irrigation/fertigation detail
Manual/Base Settings
Rule/Schedule Automation
AI Assist / Optimization
Safety / Interlock / Fail Safe Finalization
AI 장애/fallback 원칙
```

The old items must still be visible through the new visual tabs:

```text
관수 스케줄
일사 누적 관수
EC 목표
pH 목표
급액량
배액률
드라이백
양액 레시피
시간 기반 관수
근권 수분 기준 관수
저수조/배액 재활용 점검
aiIrrigationCorrection
수동 기준 대비 차이
fallback
관수 한계
센서 신선도
최종 관수 후보
```

## 4. Runtime boundaries

```text
No API route change in R7-020
No DB migration in R7-020
No HA service call in R7-020
No MQTT/device command in R7-020
No save/apply/execute controls in R7-020
No approval/override release in R7-020
No SafetyGuard/Interlock runtime behavior change in R7-020
No physical device hookup in R7-020
```

## 5. Acceptance

```text
R7-020 contract passes
Irrigation/Fertigation default visual render has no old detail card
All old detail content is mapped to visual tabs/cards
Existing R7 routing/sidebar contracts still pass
Full pytest passes
node --check passes
Prod static smoke verifies v1.14.84 and R7-020 markers
```
