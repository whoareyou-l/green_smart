# R7-046A Crop Operations Product Card Redesign Plan

> **For Hermes:** Do not implement from vague card names. Use this document as the design contract before touching UI code.

**Status:** corrective detailed plan after user review
**Target version:** v1.15.21 corrective slice
**Scope:** Crop Operations subtabs only
**Primary correction:** Do not wrap `기록·작업` inside another visible title like `기록·작업 운영 화면`. The subtab already provides the screen context. Inside each subtab, render the actual product cards/sections directly.

---

## 0. What went wrong in v1.15.21

The previous implementation made a generic `ProductScreen` wrapper and then rendered duplicate labels such as:

```text
기록·작업 tab
└─ 기록·작업 운영 화면
   └─ 오늘의 기록 작업
```

This is poor product UX because:

1. The subtab title already says `기록·작업`.
2. The inner `운영 화면` heading adds no decision value.
3. It hides the real design problem: what data goes into each record/work card?
4. It treats old card contents as labels rather than redesigning operator workflows.

### Corrective rule

Do **not** render generic duplicate headings:

```text
상태 요약 운영 화면
작기 운영 화면
생육목표 운영 화면
기록·작업 운영 화면
모델·추천 운영 화면
추세·근거 운영 화면
```

Instead, each subtab should directly render its actual cards:

```text
기록·작업
├─ 오늘 할 일
├─ 최근 생육조사
├─ 최근 예찰
├─ 최근 방제
└─ 누락/주의
```

---

## 1. Design target

The visible UI should be **subtab → product cards**, not **subtab → product screen → cards**.

### Required hierarchy

```text
Crop Operations Domain
└─ Subtab selected by top nav
   ├─ lightweight subtab context strip, optional
   ├─ product card 1
   ├─ product card 2
   ├─ product card 3
   └─ navigation/evidence actions
```

### Shared card grammar

Each card should follow this compact grammar:

```text
ProductCard
├─ label: short noun phrase, not repeated tab title
├─ primary: the value/operator decision
├─ secondary: one-line explanation
├─ evidence: chips from DTO fields
├─ state: fresh / attention / stale / empty / blocked
└─ actions: navigation-only, not execute/save
```

### Shared states

| State | When | Visual intent |
|---|---|---|
| `fresh` | DTO has recent/usable values | normal green/sage |
| `attention` | warning, required review, stale pest scouting, missing items | amber |
| `stale` | known but too old, if future DTO exposes age | muted amber/gray |
| `empty` | no row/data | dashed empty state |
| `blocked` | unavailable due to missing crop cycle/permission | red/gray, no action except navigation |

---

## 2. Available data sources and exact field mapping

### Zone/crop context

Source object in panel:

```js
selectedZone
selectedZone.currentCrop
selectedZone.currentCropAssignment
selectedZone.dataAvailability
```

Fields:

| UI value | DTO field | Fallback |
|---|---|---|
| zone name | `selectedZone.name` | `_r7ZoneName(selectedZone)` |
| crop cycle ID | `currentCrop.crop_cycle_id` | `selectedZone.activeCropCycleId`, then `unassigned` |
| crop label | `currentCrop.crop_label_ko` | `selectedZone.crop`, then `작물 미지정` |
| crop type | `currentCrop.crop_type` | `other` |
| growth stage | `currentCrop.growth_stage` | `selectedZone.state`, then `작기 정보 없음` |
| variety | `currentCrop.variety` | `품종 미등록` |
| plant date | `currentCrop.plant_date` | `정식일 미등록` |
| demolish date | `currentCrop.demolish_date` | `철거일 없음` |
| assignment state | `currentCropAssignment.assignmentState` | crop cycle exists → `assigned`, else `unassigned` |
| source row | `currentCropAssignment.sourceRowId` | crop cycle ID |
| freshness | `currentCropAssignment.dataAvailability.state/source` | `selectedZone.dataAvailability.state/source` |

### Growth target context

Source object:

```js
selectedZone.growthTargetProjection
```

Fields:

| UI value | DTO field | Fallback |
|---|---|---|
| target stage | `growthTargetProjection.targetStageLabel` | current growth stage |
| target focus | `growthTargetProjection.targetFocus` | `생육 균형 유지` |
| target gap text | computed `${growthStage} → ${targetStage}` | same stage if missing |

### Record/work context

Source object:

```js
selectedZone.cropRecordSummary
```

Produced by:

```py
normalize_crop_operations_record_summary()
```

Exact DTO fields:

```js
cropRecordSummary = {
  recordSummarySource,
  growthSurvey: {
    count,
    latest,
    latestLabel,
    staleState
  },
  pestScouting: {
    count,
    latest,
    latestLabel,
    staleState
  },
  controlTreatment: {
    count,
    latest,
    latestLabel,
    staleState
  },
  workQueue: {
    nextAction,
    missingItems
  },
  readOnly,
  executionEnabled,
  writeEnabled,
  deviceCommandEnabled,
  mqttEnabled
}
```

Current normalization rules:

| Field | How value is built |
|---|---|
| `growthSurvey.latestLabel` | `date · 초장 {height}cm · 엽수 {leafCount}` |
| `pestScouting.latestLabel` | `date · pest type · severity` |
| `controlTreatment.latestLabel` | `date · pesticide name · PLS 적합/확인 필요` |
| `workQueue.missingItems` | `생육조사 없음`, `병해충 예찰 없음`, `방제 기록 없음` when each list is empty |
| `workQueue.nextAction` | `누락 기록 확인` if missing items exist; otherwise `최근 기록 검토 완료` |

### Environment/influence context

Source object:

```js
selectedZone.environmentImpactProjection
```

Fields:

| UI value | DTO field | Fallback |
|---|---|---|
| impact state | `impactState` | `unknown` |
| impact focus | `impactFocus` | `환경·관수·장치 영향 근거 없음` |
| impact factors | `impactFactors[]` | `freshnessLabel`, then `영향 factor 없음` |

### Recommendation context

Source object:

```js
selectedZone.recommendationReviewProjection
```

Fields:

| UI value | DTO field | Fallback |
|---|---|---|
| review state | `reviewState` | `unknown` |
| review summary | `reviewSummary` | `추천 검토 근거 없음` |
| approval required | `approvalRequired === true` | false |

---

## 3. Subtab-by-subtab redesign

## 3.1 상태 요약

### User question

```text
지금 이 구역 작물에서 먼저 봐야 할 것은 무엇인가?
```

### Remove from visible UI

- `상태 요약 운영 화면`
- generic wrapper heading
- duplicated description of subtab itself

### New visible cards

#### Card A — `현재 작물`

Purpose: identify the crop context quickly.

| Slot | Value |
|---|---|
| label | `현재 작물` |
| primary | `${cropLabel} · ${growthStage}` |
| secondary | `${variety} · ${cropType}` |
| evidence chips | `작기 ${cropCycleId}`, `정식일 ${plantDate}`, freshness |
| state | `fresh` if assigned, `empty/attention` if unassigned |
| actions | `작기 보기`, `생육목표` navigation |

#### Card B — `우선 확인`

Purpose: tell the operator what to check first.

| Slot | Value |
|---|---|
| label | `우선 확인` |
| primary | `workQueue.nextAction` |
| secondary | if missing: `누락 {n}건`, else `최근 기록 검토 완료` |
| evidence chips | each item in `workQueue.missingItems` |
| state | `attention` if missing items, else `fresh` |
| actions | `기록·작업`, `추세·근거` navigation |

#### Card C — `기록 상태`

Purpose: summarize latest records without making the operator open records first.

| Slot | Value |
|---|---|
| label | `기록 상태` |
| primary | `growthSurvey.latestLabel` or best recent label |
| secondary | `생육 {count} · 예찰 {count} · 방제 {count}` |
| evidence chips | latest labels for growth/pest/control |
| state | max severity among stale states |
| actions | `기록·작업` navigation |

#### Card D — `영향 요인`

Purpose: show climate/irrigation/device factors affecting crop decisions.

| Slot | Value |
|---|---|
| label | `영향 요인` |
| primary | `environmentImpactProjection.impactFocus` |
| secondary | `impactState` |
| evidence chips | `impactFactors[]` |
| state | `impactState` |
| actions | `환경`, `관수`, `장치` domain navigation |

#### Card E — `추천 검토`

Purpose: show assistive recommendation without execution authority.

| Slot | Value |
|---|---|
| label | `추천 검토` |
| primary | `recommendationReviewProjection.reviewSummary` |
| secondary | `승인 검토 필요` or `승인 대기 없음` |
| evidence chips | `실행 없음`, review state, approval state |
| state | `attention` if approval required, else review state |
| actions | `모델·추천` navigation |

---

## 3.2 작기·현재작물

### User question

```text
이 구역에 어떤 작기가 붙어 있고, 운영 경계가 유효한가?
```

### Remove from visible UI

- `작기 운영 화면`
- `작기 ID` as a standalone dumb card if it only repeats ID

### New visible cards

#### Card A — `작기 연결`

| Slot | Value |
|---|---|
| label | `작기 연결` |
| primary | `cropCycleId` |
| secondary | `assignmentState · sourceRowId` |
| evidence chips | freshness, source row, read-only |
| state | assigned → fresh, unassigned → attention |
| actions | none or `기록 보기` |

#### Card B — `작물 프로필`

| Slot | Value |
|---|---|
| label | `작물 프로필` |
| primary | `${cropLabel} · ${variety}` |
| secondary | `${cropType} · ${growthStage}` |
| evidence chips | crop type, stage, zone |
| state | fresh if crop exists, empty if missing |
| actions | `생육목표` |

#### Card C — `운영 경계`

| Slot | Value |
|---|---|
| label | `운영 경계` |
| primary | `${plantDate} ~ ${demolishDate}` |
| secondary | `정식일/철거일 기준으로 기록과 추세를 해석` |
| evidence chips | plant date, demolish date |
| state | attention if plant date missing |
| actions | `추세·근거` |

#### Card D — `구역 배정 근거`

| Slot | Value |
|---|---|
| label | `구역 배정 근거` |
| primary | `_r7ZoneName(selectedZone)` |
| secondary | `currentCropAssignment.dataAvailability.source` |
| evidence chips | assignment state, data source |
| state | dataAvailability.state |
| actions | none |

---

## 3.3 생육목표

### User question

```text
현재 생육 단계와 목표 단계의 차이는 무엇이고, 무엇을 관찰해야 하는가?
```

### Remove from visible UI

- `생육목표 운영 화면`
- `목표 단계` as an isolated label with no context

### New visible cards

#### Card A — `현재 → 목표`

| Slot | Value |
|---|---|
| label | `현재 → 목표` |
| primary | `${growthStage} → ${targetStage}` |
| secondary | `targetFocus` |
| evidence chips | crop label, variety, stage |
| state | attention if target equals fallback/missing |
| actions | `기록·작업` |

#### Card B — `관찰 포인트`

| Slot | Value |
|---|---|
| label | `관찰 포인트` |
| primary | `targetFocus` |
| secondary | derived from crop/growth stage; no fake AI text |
| evidence chips | growth target source, freshness |
| state | ready/fresh |
| actions | none |

#### Card C — `환경 영향`

| Slot | Value |
|---|---|
| label | `환경 영향` |
| primary | `environmentImpactFocus` |
| secondary | `impactState` |
| evidence chips | impact factors |
| state | impactState |
| actions | `환경 보기`, `관수 보기` |

#### Card D — `기록 확인`

| Slot | Value |
|---|---|
| label | `기록 확인` |
| primary | latest growth survey label |
| secondary | `생육조사 {count}건` |
| evidence chips | missingItems if growth missing |
| state | growthSurvey.staleState |
| actions | `기록·작업` |

---

## 3.4 기록·작업

### User question

```text
오늘 어떤 기록을 확인/입력해야 하고, 최신 기록의 상태는 어떤가?
```

### Remove from visible UI

- `기록·작업 운영 화면`
- `오늘의 기록 작업` wrapper if it only repeats workQueue

### New visible cards

#### Card A — `오늘 할 일`

This should be the first card. It uses `workQueue`, not a made-up task.

| Slot | Value |
|---|---|
| label | `오늘 할 일` |
| primary | `cropRecordSummary.workQueue.nextAction` |
| secondary | if missing items exist: `${missingItems.length}개 기록 확인 필요`; else `누락 없음` |
| evidence chips | every item in `workQueue.missingItems` |
| state | `attention` if missing items exist, else `fresh` |
| actions | navigation to the relevant record card anchor/modal later; for now no save/execute |

Empty case:

```text
primary: 누락 기록 확인
chips: 생육조사 없음 / 병해충 예찰 없음 / 방제 기록 없음
state: attention
```

Complete case:

```text
primary: 최근 기록 검토 완료
secondary: 누락 없음
state: fresh
```

#### Card B — `생육조사`

| Slot | Value |
|---|---|
| label | `생육조사` |
| primary | `growthSurvey.latestLabel` |
| secondary | `최근 ${growthSurvey.count}건 · ${growthSurvey.staleState}` |
| evidence chips | from `growthSurvey.latest`: date, height, leafCount if available |
| state | `growthSurvey.staleState` |
| actions | `생육조사 기록 보기` navigation/modal later; no write in this slice |

Value example:

```text
2026-06-28 · 초장 18.4cm · 엽수 9
최근 2건 · fresh
```

#### Card C — `병해충 예찰`

| Slot | Value |
|---|---|
| label | `병해충 예찰` |
| primary | `pestScouting.latestLabel` |
| secondary | `최근 ${pestScouting.count}건 · ${pestScouting.staleState}` |
| evidence chips | from `pestScouting.latest`: date, type, severity if available |
| state | `pestScouting.staleState` |
| actions | `예찰 기록 보기` navigation/modal later |

Value example:

```text
2026-06-29 · 진딧물 · low
최근 1건 · attention
```

#### Card D — `방제`

| Slot | Value |
|---|---|
| label | `방제` |
| primary | `controlTreatment.latestLabel` |
| secondary | `최근 ${controlTreatment.count}건 · ${controlTreatment.staleState}` |
| evidence chips | date, pesticide name, PLS status |
| state | `controlTreatment.staleState`, or attention when PLS 확인 필요 |
| actions | `방제 기록 보기` navigation/modal later |

Value example:

```text
2026-06-29 · 친환경유제 · PLS 적합
최근 1건 · fresh
```

#### Card E — `기록 원천`

| Slot | Value |
|---|---|
| label | `기록 원천` |
| primary | `recordSummarySource` |
| secondary | `read-only · write/execute disabled` |
| evidence chips | readOnly, writeEnabled=false, executionEnabled=false |
| state | ready |
| actions | none |

### 기록·작업 layout

Use priority ordering, not equal card dump:

```text
[오늘 할 일]              full-width, top
[생육조사] [병해충 예찰] [방제]
[기록 원천]              compact footer/evidence
```

### 기록·작업 implementation note

Do not show another header saying `기록·작업 운영 화면`. The subtab title already gives that context. The first visible title inside the panel must be `오늘 할 일`.

---

## 3.5 모델·추천

### User question

```text
모델/추천은 어떤 근거로 무엇을 검토하라고 하는가?
```

### Remove from visible UI

- `모델·추천 운영 화면`
- generic `추천 검토` card if it lacks approval/source/fallback context

### New visible cards

#### Card A — `추천 요약`

| Slot | Value |
|---|---|
| label | `추천 요약` |
| primary | `recommendationReviewSummary` |
| secondary | `reviewState` |
| evidence chips | approval required, review source |
| state | attention if approval required, else reviewState |
| actions | none |

#### Card B — `근거 요인`

| Slot | Value |
|---|---|
| label | `근거 요인` |
| primary | `environmentImpactFocus` |
| secondary | `impactState` |
| evidence chips | impactFactors[] |
| state | impactState |
| actions | `환경`, `관수`, `장치` navigation |

#### Card C — `승인/실행 경계`

| Slot | Value |
|---|---|
| label | `승인/실행 경계` |
| primary | `승인 검토 필요` or `승인 대기 없음` |
| secondary | `작물 운영 화면에서는 실행하지 않음` |
| evidence chips | executionEnabled=false, deviceCommandEnabled=false, mqttEnabled=false |
| state | blocked/attention |
| actions | none |

---

## 3.6 추세·근거

### User question

```text
시즌 흐름과 데이터 근거가 판단에 충분한가?
```

### Remove from visible UI

- `추세·근거 운영 화면`
- fake mini trend charts unless backed by actual values

### New visible cards

#### Card A — `시즌 근거 요약`

| Slot | Value |
|---|---|
| label | `시즌 근거 요약` |
| primary | `${growthSurvey.count}회 생육조사 · ${pestScouting.count}회 예찰 · ${controlTreatment.count}회 방제` |
| secondary | crop + growth stage |
| evidence chips | recordSummarySource, freshness |
| state | attention if any count is 0 |
| actions | `기록·작업` |

#### Card B — `생육 흐름`

| Slot | Value |
|---|---|
| label | `생육 흐름` |
| primary | `growthSurvey.latestLabel` |
| secondary | `현재는 최신값 요약만 표시; 시계열 차트는 actual history DTO 추가 후` |
| evidence chips | count, staleState |
| state | growthSurvey.staleState |
| actions | none |

#### Card C — `영향 흐름`

| Slot | Value |
|---|---|
| label | `영향 흐름` |
| primary | `environmentImpactFocus` |
| secondary | `actual trend DTO 전까지는 factor summary만 표시` |
| evidence chips | impactFactors[] |
| state | environmentImpactState |
| actions | domain navigation |

#### Card D — `데이터 충분성`

| Slot | Value |
|---|---|
| label | `데이터 충분성` |
| primary | computed summary: `충분`, `부분`, `부족` |
| secondary | based on counts and missingItems |
| evidence chips | missingItems, freshness |
| state | fresh/attention/empty |
| actions | `기록·작업` if 부족 |

---

## 4. Component design correction

### Keep

`renderR7ProductCard()` is useful.

### Add/adjust

Do not use one giant `ProductScreen` wrapper as visible UI. Instead create smaller helpers:

```js
renderR7CropProductCard({ kind, label, primary, secondary, state, evidence, actions, markers })
renderR7CropProductCardGrid({ tabKey, cards })
renderR7CropRecordWorkCards(ctx)
renderR7CropCycleCards(ctx)
renderR7CropGrowthTargetCards(ctx)
renderR7CropModelAssistCards(ctx)
renderR7CropTrendEvidenceCards(ctx)
```

### Panel rendering shape

```js
renderR7CropSubtabPanel(tabKey, selectedZone, activeTab) {
  const ctx = this.buildR7CropOperationContext(selectedZone);
  const body = this.renderR7CropProductCardsForSubtab(tabKey, ctx);
  return `<section ...>
    <header>subtab title + operator question only</header>
    <div data-r7-crop-product-card-grid>${body}</div>
  </section>`;
}
```

Header can show the subtab title once. The body must not repeat it as `운영 화면`.

---

## 5. Corrective implementation tasks

### Task 1 — Contract: duplicate wrapper headings are forbidden

Add focused test:

```py
for forbidden in [
    "상태 요약 운영 화면",
    "작기 운영 화면",
    "생육목표 운영 화면",
    "기록·작업 운영 화면",
    "모델·추천 운영 화면",
    "추세·근거 운영 화면",
]:
    assert forbidden not in rendered_html
```

### Task 2 — Contract: 기록·작업 card values are explicit

Render `records-workflow` with representative DTO and require:

```text
오늘 할 일
병해충 예찰 재확인 or 누락 기록 확인
생육조사 7일 경과
생육조사
2026-06-28 · 초장 18.4cm · 엽수 9
병해충 예찰
2026-06-29 · 진딧물 · low
방제
2026-06-29 · 친환경유제 · PLS 적합
기록 원천
crop_repo_recent_records_readonly
```

Also require field source markers:

```text
data-r7-crop-record-card-kind="today-work"
data-r7-crop-record-card-kind="growth-survey"
data-r7-crop-record-card-kind="pest-scouting"
data-r7-crop-record-card-kind="control-treatment"
data-r7-crop-record-card-kind="record-source"
```

### Task 3 — Implement shared crop product card helper

Replace visible `ProductScreen` wrapper with direct card grid helpers.

### Task 4 — Implement `records-workflow` first

Do `records-workflow` before other tabs because it exposes the key design issue: actual values and missing state.

### Task 5 — Implement remaining tabs with exact field mapping

Implement in this order:

1. 상태 요약
2. 작기·현재작물
3. 생육목표
4. 모델·추천
5. 추세·근거

### Task 6 — Verify

Run:

```bash
node --check custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
pytest -q tests/test_r7_047_crop_operations_corrective_product_cards_contract.py
pytest -q tests/test_r7_046_crop_operations_full_product_redesign_contract.py tests/test_r7_045_crop_status_product_ui_components_contract.py tests/test_r7_044_crop_operations_status_summary_functional_cards_contract.py tests/test_r7_043_crop_operations_real_context_binding_contract.py tests/test_r7_042_crop_operations_third_party_detail_contract.py tests/test_r7_023_crop_operations_detail_absorption_contract.py
pytest -q
```

---

## 6. Acceptance criteria for v1.15.21

- No visible duplicate `... 운영 화면` heading.
- `기록·작업` body starts with `오늘 할 일`, not `기록·작업 운영 화면`.
- `기록·작업` cards show exact values from `cropRecordSummary`.
- Each record card has its own kind marker and state.
- Empty/missing record states are represented by `workQueue.missingItems` and stale states, not invented copy.
- Other subtabs follow direct card grid structure.
- Compatibility markers remain, but old visible wrapper copy is gone.
- Full tests and Prod smoke pass before release.

---

## 7. Non-goals

- No DB migration.
- No new write API.
- No save/delete/demolish behavior change.
- No HA service calls.
- No MQTT/device command.
- No automatic recommendation apply.
- No fake charts until actual trend/history DTO exists.
