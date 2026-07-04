# R7-022 Recommendation/Automation Detail Absorption

> 기준 버전: `v1.14.56`
> Status: R7-022 planned/contracted
> Purpose: Remove the rendered Recommendation/Automation read-only detail card and absorb its content into the zone-scoped visual tabs.

## 1. Product correction carried forward

The old detail card must not remain as a folded, hidden, or duplicate compatibility block after the visual UI absorbs its content.

```text
Old detail card = source design inventory
New visual tabs = final product UI
Docs/tests = mapping and regression evidence
```

## 2. Existing detail inventory

`renderR7RecommendationAutomationDetail()` previously contained these product facts.

| Old detail section | Items | New visual location |
|---|---|---|
| Manual baseline shown first | 환경 수동 기준, 관수 제어 수동 기준, 장치 모드 기준, AI off fallback value | 설정값 tab cards |
| Rule/Schedule candidate | rule/schedule candidate, automation eligibility, difference from manual baseline | 일정·규칙 tab cards |
| AI recommendation / correction / explanation | AI recommendation/correction, explanation, fallback | 추천·보조 tab cards |
| Safety-final candidate | Safety-final candidate, not final command, no final command authority | 인터록·차단 tab cards |
| Fallback principle | AI disabled/unhealthy/timeout/stale fallback value; no final command authority | 추천·보조 tab + docs only |

## 3. Product UI rule

The rendered Recommendation/Automation page must use the shared domain visual frame and zone-scoped tabs.

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
data-r7-recommendation-automation-detail
R7-011 read-only recommendation/automation detail
Manual baseline shown first
Rule/Schedule candidate
AI recommendation / correction / explanation
Safety-final candidate
AI off / fallback 원칙
```

The old items must still be visible through the new visual tabs:

```text
환경 수동 기준
관수 제어 수동 기준
장치 모드 기준
AI off fallback value
rule/schedule candidate
automation eligibility
difference from manual baseline
AI recommendation/correction
explanation
fallback
Safety-final candidate
not final command
no final command authority
final command authority none
```

## 4. Runtime boundaries

```text
No API route change in R7-022
No DB migration in R7-022
No HA service call in R7-022
No MQTT/device command in R7-022
No save/apply/execute controls in R7-022
No approval/override release in R7-022
No SafetyGuard/Interlock runtime behavior change in R7-022
No physical device hookup in R7-022
```

## 5. Acceptance

```text
R7-022 contract passes
Recommendation/Automation default visual render has no old detail card
All old detail content is mapped to visual tabs/cards
Existing R7 routing/sidebar contracts still pass
Full pytest passes
node --check passes
Prod static/render smoke verifies v1.14.56 and R7-022 markers
```
