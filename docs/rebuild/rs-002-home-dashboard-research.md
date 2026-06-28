# RS-002 Home Dashboard Research — Environment-Control Product Patterns

> Purpose: choose the first real from-scratch Green Smart home dashboard direction without copying the legacy Green Smart UI.

## Products / references surveyed

- Priva / Priva One
- Hoogendoorn IIVO / Ready Set Grow
- Ridder Climate / Hortimax Pro descriptions
- Argus Controls
- Climate Control Systems / Climate Manager
- Netafim GrowSphere
- Korean Nongsaro smart-farm facility-horticulture cases

## Common patterns

### 1. Crop-centered control is stronger than function-tab control

Priva positions Priva One as a single crop-focused system for climate, irrigation, and processes. Hoogendoorn IIVO also emphasizes crop-specific insights and determining the crop's needs.

Implication for Green Smart:

```text
Do not start from old function tabs like Crop / Environment / Irrigation / Device.
Start from crop status and crop goals, then show how climate/irrigation/device decisions affect the crop.
```

### 2. The best systems explain decisions, not only show values

IIVO describes a tool/coach/guide model and explains why automated decisions are made. Netafim uses monitoring → recommendation → action.

Implication:

```text
Green Smart home should expose recommendation/decision reasons before execution.
```

### 3. Monitoring and action should be connected but gated

Ridder and Netafim both connect real-time monitoring to actions, while Green Smart must keep operator approval/safety gates before execution.

Implication:

```text
Show recommendation/execution as a safe next step, not direct uncontrolled automation.
```

### 4. Domestic greenhouse cases are facility/crop-type dependent

Nongsaro cases show that control level depends on crop, facility type, grower skill level, and available channels. Basic/optional modules include ventilation, insulation, growth imaging, irrigation, heating, and safety.

Implication:

```text
Home should not assume every farm has every device. It should start with crop status and show missing/unknown data honestly.
```

## Chosen direction

The first real home dashboard direction is:

```text
Crop-centered OS: 작물상태 → 생육목표 → 환경/관수/장치 영향 → 추천/실행
```

Important refinement from user feedback:

```text
The main frame remains crop-centered, but detail must be zone-scoped.
Each greenhouse zone may have a different crop, crop state, equipment set, and data availability.
```

Therefore the home dashboard should read as:

```text
Crop-centered OS with zone-scoped detail inside each main operating step.
```

This does **not** mean adding a standalone `구역별 작물 운영` section/card. Zone scope belongs inside each crop-centered step:

```text
작물상태: 전체 / A구역 / B구역 tabs or detail modal
생육목표: 전체 / A구역 / B구역 tabs or detail modal
환경/관수/장치 영향: 전체 / A구역 / B구역 tabs or detail modal
추천/실행: 전체 / A구역 / B구역 tabs or detail modal
```

## RS-003 zone tab interaction decision

User correction: 구역 탭이 있으면 모든 구역 내용을 펼쳐 스크롤바를 만들지 않는다.

Decision:

```text
selected zone panel only
modal is optional detail, not primary navigation
horizontal scroll is not the primary zone navigation
CBA: COM-ZoneTabs → COM-ZonePanel → COM-ZoneDetailModal → MOD-CropStageZoneDetail → PAGE-CropCenteredHome
```

Implementation implication:

- Each crop-centered step owns one `MOD-CropStageZoneDetail`.
- `COM-ZoneTabs` selects `전체/A구역/B구역`.
- `COM-ZonePanel` displays only the active zone panel with `hidden` for inactive panels.
- `COM-ZoneDetailModal` provides optional detail and must use modal scroll/body lock behavior.
- Do not use a persistent horizontal card rail for zone navigation.

## RS-004 visual layout correction

User correction:

```text
Modal opens centered with explicit display:flex.
Stage cards are one per row.
avoid crowded multi-card grid.
```

Implementation implication:

- Opening `COM-ZoneDetailModal` must set `modal.hidden = false` and `modal.style.display = "flex"` so fixed overlay content is centered by `align-items:center` and `justify-content:center`.
- Closing the modal must set `modal.hidden = true` and `modal.style.display = "none"`.
- `PAGE-CropCenteredHome` uses `data-cba-layout="single-column-stage-flow"` and `grid-template-columns:1fr` for the four stage cards.
- Each stage card uses `data-stage-card-shell` and appears one per row to reduce visual crowding.

## RS-005 state grammar vertical slice

Scope: keep the rebuild home read-only, but make zone panels communicate real product data states before API hookup.

State grammar:

```text
loading / empty / partial / stale / error / ok
```

Decision:

```text
read-only 상태 문법
실행 버튼 금지
COM-StateBadge + COM-DataFreshnessPill + COM-EmptyState + COM-LoadingSkeleton
```

Implementation implication:

- Every selected zone panel shows a state badge and data freshness pill.
- Loading zones show a contextual skeleton, not developer text.
- Empty/error zones show an operator-facing empty state.
- Recommendation/action copy remains read-only; no execute/apply/service-call control is introduced in RS-005.

## RS-006 context source vertical slice

Scope: define the home context source shape before backend/API hookup.

Decision:

```text
zone parent + currentCrop attached
contextSource = static-fixture-before-api
normalizeRebuildHomeContext
read-only context adapter
no fetch/API/service execution in RS-006
```

Context shape:

```text
REBUILD_HOME_CONTEXT
  contextSource
  greenhouseId / greenhouseName / generatedAt
  zones[]
    id / name
    currentCrop: cropSeasonId, cropType, cropLabelKo, growthStage
    equipmentProfile: labels[]
    dataAvailability: state, freshnessMinutes, note
```

Implementation implication:

- Rendering reads zones through `getRebuildHomeContext()` and `normalizeRebuildHomeContext()`.
- The current fixture is explicitly marked `static-fixture-before-api`.
- No direct `fetch`, HA API call, service call, or execution control is introduced.
- The next slice may replace the fixture source with a read-only API adapter without changing panel DOM contracts.

## RS-007 read-only home context API shell

Confirmed decisions:

```text
GET /api/green_smart/rebuild/home/context
summary + zones
static-fixture-before-api
readOnly: true
executionEnabled: false
DB 연결 없음
서비스 실행 없음
```

Scope:

- Add a HomeAssistantView route shell that returns the same context shape defined in RS-006.
- Keep the response fixture-backed and read-only.
- Do not connect DB tables in RS-007.
- Do not expose Dry Run, apply, execute, or HA service execution controls.

## Developer-only transition notes

The following points are development/release guidance only and must remain in docs/tests, not in rendered frontend copy:

```text
레거시를 참고하되, 작물 중심으로 다시 시작합니다.
기존 UI/기능은 참고 자료입니다.
새 메인 화면은 기능 탭이 아니라 작물 운영 흐름으로 설계합니다.
Legacy UI/features are reference only.
Start from blank page/scaffold.
No legacy panel module imports.
No production cutover without explicit approval.
```

Operator-facing UI should describe the current product behavior only, for example crop operation flow, zone detail tabs/scroll, approval, and safety checks.

## Forbidden direction

The first real home must not look like the old Green Smart legacy layout:

```text
Home / Crop / Environment / Irrigation / Device / Admin as the main conceptual frame is too legacy-like.
```

Those domains may exist later as implementation modules, but the operator-facing home starts from the crop and its operating goal.
