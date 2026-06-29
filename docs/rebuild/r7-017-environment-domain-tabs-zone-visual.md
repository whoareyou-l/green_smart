# R7-017 Environment Domain Tabs + Zone Visual Rewrite

> 기준 버전: `v1.12.62`
> Status: R7-017 complete
> Purpose: Apply the corrected R7 rule to the first domain page: shared visual frame, sub-tabs, zone context, and no long one-page stack.

## 1. Scope

R7-017 rewrites only the `환경 제어` domain page visual structure.

```text
운영 홈 remains crop-centered.
환경 제어 detail work becomes zone-scoped.
환경 제어 uses sub-tabs.
환경 제어 follows the shared domain visual frame that R7-018~R7-023 must reuse.
```

## 2. Shared domain visual frame

Every R7 domain visual rewrite must follow this same high-level frame:

```text
Domain visual frame
→ domain hero
→ zone context bar
→ domain sub-tabs
→ active tab visual panel
→ secondary evidence
```

Required shared markers:

```text
data-r7-domain-visual-frame
data-r7-domain-visual-frame-version="1"
data-r7-domain-visual-hero
data-r7-domain-visual-summary-grid
data-r7-domain-subtabs
data-r7-domain-subtab
data-r7-domain-subtab-active="true"
data-r7-domain-subtab-panel
data-r7-zone-context-bar
data-r7-zone-selector
data-r7-zone-card
data-r7-active-zone
```

## 3. Environment sub-tabs

R7-017 environment page must define these tabs:

```text
상태 요약
설정값
인터록·차단
추세·근거
```

Required environment markers:

```text
data-r7-environment-zone-visual="true"
data-r7-environment-subtab="status-summary"
data-r7-environment-subtab="base-settings"
data-r7-environment-subtab="interlock-block"
data-r7-environment-subtab="trend-evidence"
data-r7-environment-zone-status-grid
data-r7-environment-zone-base-settings
data-r7-environment-zone-interlock-stack
data-r7-environment-zone-trend-evidence
```

## 4. Zone-scoped rule

The operator must see the selected zone before reading detailed environment metrics.

Required visible labels:

```text
환경 제어
구역별 환경 상태
현재 선택 구역
1구역 · 토마토
2구역 · 상추
상태 요약
설정값
인터록·차단
추세·근거
온도
습도
VPD
CO₂
광/DLI
환기 후보
Safety/Interlock 우선
센서 freshness
```

## 5. No long-page rule

R7-017 must not render every environment subsection as one long stack. It may keep legacy R7-008 markers for compatibility, but the primary page must use tab navigation and a visually dominant active tab panel.

```text
Primary visual frame: tabbed + zone context
Secondary compatibility: legacy read-only detail markers allowed only as evidence/compatibility
```

## 6. Runtime boundaries

```text
No API route change in R7-017
No DB migration in R7-017
No HA service call in R7-017
No MQTT/device command in R7-017
No save/apply/execute controls in R7-017
No approval/override release in R7-017
No SafetyGuard/Interlock runtime behavior change in R7-017
No physical device hookup in R7-017
```

## 7. Acceptance

```text
R7-017 contract passes
Corrected R7-017~024 plan contract passes
R7-014 routing still passes
R7-015 common visual system still passes
R7-016 operations home still passes
Full pytest passes
node --check passes for both panel files
Prod static smoke verifies v1.12.62 and R7-017 markers
```
