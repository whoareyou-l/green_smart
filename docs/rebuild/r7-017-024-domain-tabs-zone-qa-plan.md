# R7-017~R7-024 Domain Tabs, Zone Context, and Browser QA Plan

> 기준 버전: after `v1.12.52`
> Status: corrected forward plan
> Purpose: User-corrected R7 direction after R7-016. Domain visual rewrites must not become long one-page documents, and detailed work must be zone-scoped even though the main IA remains crop-centered.

## 1. User-corrected rules

These rules override any earlier R7 domain-page visual plan that would produce long text-heavy pages.

```text
Main IA remains crop-centered.
Detailed work is zone-scoped.
Domain pages must use sub-tabs.
Do not stack all domain content on one long page.
R7-024 Browser QA is allowed and expected to modify visual components based on the actual rendered screen.
```

## 2. Required domain-page pattern for R7-017~R7-023

Each domain page from 작물 운영 through 설정·관리 must be implemented as:

```text
Domain shell
→ sub-tab navigation
→ selected sub-tab content only
→ zone selector / zone context summary when the tab has zone-specific meaning
→ visual cards/metrics/alerts/trends
→ secondary evidence/help/details
```

Forbidden pattern:

```text
Domain shell
→ every section rendered vertically in one long page
→ repeated explanatory paragraphs before status/metrics
→ marker-only cards that do not improve visual scanning
```

## 3. Zone-scoped detail rule

The product home can be crop-centered, but detail pages must answer:

```text
Which crop/crop cycle is active?
Which zone is being inspected?
What is this zone's status, target, deviation, freshness, and safety state?
What action/evidence is relevant to this zone?
```

Required markers for zone-aware domains:

```text
data-r7-zone-context-bar
data-r7-zone-selector
data-r7-zone-card
data-r7-active-zone
```

If a domain section is global/admin-only and not zone-specific, it must explicitly mark that boundary:

```text
data-r7-global-admin-context
```

## 4. Required sub-tab markers

Every R7-017~R7-023 domain visual rewrite must include:

```text
data-r7-domain-subtabs
data-r7-domain-subtab
data-r7-domain-subtab-active="true"
data-r7-domain-subtab-panel
```

Implementation note: keep only the active tab's primary content visually dominant. Static contracts may allow inactive tab labels/metadata, but the page must not read as one long vertical document.

## 5. Planned sequence

| R7 slice | Domain | Required sub-tabs | Zone rule |
|---|---|---|---|
| R7-017 | 환경 제어 | 상태 요약 / 설정값 / 인터록·차단 / 추세·근거 | zone-scoped required |
| R7-018 | 관수·양액 | 상태 요약 / 관수 목표 / EC·pH·VWC / 이벤트·근거 | zone-scoped required |
| R7-019 | 장치 제어 | 장치 상태 / 응답 지연 / 차단·인터록 / 매핑·근거 | zone-scoped required |
| R7-020 | 작물 운영 | 작기 요약 / 생육목표 / 생육조사 / 병해충·방제 | zone-scoped required |
| R7-021 | 추천·자동화 | 추천 요약 / 수동 기준 / 기본 자동제어 / AI 보조·fallback | zone-scoped required |
| R7-022 | 안전·이력 | 현재 차단 / 인터록 / Fail Safe / 이벤트 이력 | zone-scoped required where event belongs to zone |
| R7-023 | 설정·관리 | 구역·작물 / 권한 / 시스템 / 고급 설정 | zone-scoped for 구역·작물, global-admin for system/admin |
| R7-024 | Browser QA + visual component correction | N/A | verify actual zone-centered detail flow in browser |

## 6. R7-024 Browser QA correction rule

R7-024 is not just a passive smoke test. It must include a correction loop:

```text
Open actual HA panel in browser
Inspect operations home and each domain page
Capture console errors and visual issues
Identify cramped, text-heavy, unclear, or non-zone-scoped areas
Modify shared visual components if needed
Re-run contracts and browser smoke
```

Allowed in R7-024:

```text
visual spacing tweaks
card hierarchy changes
badge colors/labels
sub-tab usability fixes
zone selector/card layout fixes
shared visual component refinements
```

Still forbidden unless separately approved:

```text
API route changes
DB migration
HA service call
MQTT/device command
save/apply/execute control
approval/override release
SafetyGuard/Interlock runtime behavior change
physical device hookup
```

## 7. Acceptance criteria for each R7-017~R7-023 slice

```text
Focused RED contract fails before implementation
Domain page includes sub-tab navigation markers
Domain page includes zone context markers where applicable
Only selected tab content is primary/dominant
Long one-page stacked content is not introduced
Existing R7-014 routing still passes
Existing R7-015/R7-016 visual system markers remain compatible
node --check passes
pytest targeted + full suite pass
Prod static marker smoke passes if released
```

## 8. Correction to previous summary

The previous next-step summary that listed domain visual rewrites without explicitly requiring sub-tabs and zone-scoped detail was incomplete. The corrected direction is:

```text
Domain visual rewrite = visual dashboard + sub-tabs + zone context, not a longer single domain page.
```
