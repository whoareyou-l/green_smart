# R7-026 Browser QA Visual Cleanup

> 기준 버전: `v1.14.70`
> Status: R7-026 planned
> Purpose: 실제 화면 QA에서 확인된 중복 navigation/header/documentation-style UI를 제품 화면에서 제거한다.

## User-requested cleanup

1. 상단 네비게이션바 제거
   - 왼쪽 사이드바가 있으므로 중복 상단 nav를 렌더하지 않는다.
   - `data-r7-mobile-nav` / `renderR7MobileNav()`는 제품 화면에서 제거한다.

2. 그린 스마트 운영 화면 카드 제거
   - `Green Smart 운영 화면` page header card를 제거한다.
   - 운영자는 이미 왼쪽 사이드바와 active domain content를 보고 있으므로 별도 설명 card가 필요 없다.

3. 현재 화면 카드 제거
   - domain shell의 `현재 화면` card를 제거한다.
   - 각 도메인 visual frame이 title/summary/sub-tabs를 직접 제공하므로 중복 header를 두지 않는다.

4. manual-first read-only domain 문서형 블록 제거
   - `manual-first read-only domain` 블록은 제품 화면에서 제거하고 문서/계약 evidence로만 유지한다.
   - manual-first read-only domain 블록은 제품 화면에서 제거하고 문서/계약 evidence로만 유지한다.
   - `Manual/Base`
   - `Rule/Schedule`
   - `AI Assist`
   - `Safety Final`
   - `Source freshness:`
   - `Zone scope:`
   - `Safety/interlock boundary:`
   - 위 블록은 제품 화면에서 제거하고 문서/계약 evidence로만 유지한다.

## Boundary

```text
No API route change in R7-026
No DB migration in R7-026
No HA service call in R7-026
No MQTT/device command in R7-026
No save/apply/execute control in R7-026
No approval/override release in R7-026
No SafetyGuard/Interlock runtime behavior change in R7-026
No physical device hookup in R7-026
```

## Acceptance

```text
Focused RED contract fails before implementation
Rendered HTML includes left sidebar navigation
Rendered HTML does not include top mobile nav
Rendered HTML does not include Green Smart 운영 화면 card
Rendered HTML does not include 현재 화면 card
Rendered HTML does not include manual-first read-only domain documentation block
Domain visual frame, sub-tabs, zone context remain visible
Focused contract passes
Full pytest passes
Prod served-source/render smoke passes
```
