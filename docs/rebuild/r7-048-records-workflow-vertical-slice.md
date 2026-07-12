# R7-048 Records Workflow Vertical Slice Plan

> **For Hermes:** Implement only the `작물 운영 > 기록·작업` subtab in this slice. Do not redesign the other Crop Operations subtabs here.

**Target version:** v1.15.39
**Scope:** `records-workflow` only
**Goal:** Turn `기록·작업` into a product-ready operator workflow surface with exact DTO values, state handling, and no generic wrapper headings.

---

## 1. Slice boundary

### In scope

Only this subtab:

```text
작물 운영 > 기록·작업
```

Visible cards:

```text
오늘 할 일
생육조사
병해충 예찰
방제
누락/주의
기록 원천
```

### Out of scope

Do not modify product UX of:

```text
상태 요약
작기·현재작물
생육목표
모델·추천
추세·근거
```

No DB migration, no save/delete/update, no HA service call, no MQTT/device command, no automatic apply.

---

## 2. Data source

The subtab reads only:

```js
selectedZone.cropRecordSummary
```

Shape:

```js
cropRecordSummary = {
  recordSummarySource,
  growthSurvey: { count, latest, latestLabel, staleState },
  pestScouting: { count, latest, latestLabel, staleState },
  controlTreatment: { count, latest, latestLabel, staleState },
  workQueue: { nextAction, missingItems },
  readOnly,
  writeEnabled,
  executionEnabled,
  deviceCommandEnabled,
  mqttEnabled
}
```

Produced by:

```py
normalize_crop_operations_record_summary()
```

---

## 3. Card design

## 3.1 `오늘 할 일`

Purpose: tells the operator what record-related check comes first.

| Slot | Value |
|---|---|
| marker | `data-r7-crop-record-card-kind="today-work"` |
| primary | `workQueue.nextAction` |
| secondary | if missing: `${missingItems.length}개 확인 필요`; else `누락 없음` |
| evidence | every `workQueue.missingItems[]` |
| state | `attention` if missing items, else `fresh` |
| layout | full-width top card |

Missing example:

```text
오늘 할 일
누락 기록 확인
생육조사 없음 / 병해충 예찰 없음 / 방제 기록 없음
```

Complete example:

```text
오늘 할 일
최근 기록 검토 완료
누락 없음
```

## 3.2 `생육조사`

| Slot | Value |
|---|---|
| marker | `data-r7-crop-record-card-kind="growth-survey"` |
| primary | `growthSurvey.latestLabel` |
| secondary | `최근 ${growthSurvey.count}건 · ${growthSurvey.staleState}` |
| evidence | `latest.date`, `latest.height`, `latest.leafCount` when present |
| state | `growthSurvey.staleState` |

Empty state:

```text
생육조사 기록 없음
최근 0건 · empty
```

## 3.3 `병해충 예찰`

| Slot | Value |
|---|---|
| marker | `data-r7-crop-record-card-kind="pest-scouting"` |
| primary | `pestScouting.latestLabel` |
| secondary | `최근 ${pestScouting.count}건 · ${pestScouting.staleState}` |
| evidence | `latest.date`, `latest.type`, `latest.severity` |
| state | `pestScouting.staleState` |

Severity rule:

- `empty` → empty/amber
- `attention` → amber
- any explicit high/severe string in label or latest severity → red attention
- otherwise green/fresh

## 3.4 `방제`

| Slot | Value |
|---|---|
| marker | `data-r7-crop-record-card-kind="control-treatment"` |
| primary | `controlTreatment.latestLabel` |
| secondary | `최근 ${controlTreatment.count}건 · ${controlTreatment.staleState}` |
| evidence | date, pesticide name, PLS state |
| state | `attention` if PLS 확인 필요, else `controlTreatment.staleState` |

PLS rule:

```text
PLS 적합      -> fresh/green
PLS 확인 필요 -> attention/amber
```

No automatic treatment execution appears in this card.

## 3.5 `누락/주의`

Purpose: separate missing/warning aggregation from `오늘 할 일` so the operator can see why attention exists.

| Slot | Value |
|---|---|
| marker | `data-r7-crop-record-card-kind="missing-attention"` |
| primary | if missing: `${missingItems.length}개 확인 필요`; else `누락 없음` |
| secondary | state summary of growth/pest/control |
| evidence | missing items plus stale states |
| state | attention if any missing/attention/PLS warning |

This card is required even when there is no missing item; then it shows `누락 없음`.

## 3.6 `기록 원천`

| Slot | Value |
|---|---|
| marker | `data-r7-crop-record-card-kind="record-source"` |
| primary | `recordSummarySource` |
| secondary | `read-only · write/execute disabled` |
| evidence | `readOnly`, `writeEnabled`, `executionEnabled`, `deviceCommandEnabled`, `mqttEnabled` |
| state | ready |

---

## 4. Layout

Use one records-specific layout, not the generic equal card grid:

```text
[오늘 할 일]                          full-width
[생육조사] [병해충 예찰] [방제]       three-column responsive
[누락/주의] [기록 원천]               lower evidence row
```

Required markers:

```text
data-r7-crop-record-workflow-vertical-slice="true"
data-r7-crop-record-workflow-layout="priority-records-source"
data-r7-crop-record-card-kind="today-work"
data-r7-crop-record-card-kind="growth-survey"
data-r7-crop-record-card-kind="pest-scouting"
data-r7-crop-record-card-kind="control-treatment"
data-r7-crop-record-card-kind="missing-attention"
data-r7-crop-record-card-kind="record-source"
```

---

## 5. Acceptance tests

Add `tests/test_r7_048_records_workflow_vertical_slice_contract.py`.

Must verify:

1. Version surfaces are `1.15.39`.
2. This plan exists and documents the exact fields.
3. `records-workflow` renders the six required cards.
4. A complete record DTO shows:
   - `최근 기록 검토 완료`
   - `누락 없음`
   - latest growth/pest/control labels
   - source flags
5. A missing/PLS-warning DTO shows:
   - `누락 기록 확인`
   - `생육조사 없음`
   - `병해충 예찰 없음`
   - `PLS 확인 필요`
   - attention state
6. No duplicate wrapper heading appears:
   - `기록·작업 운영 화면`
7. Read-only boundary remains.

---

## 6. Implementation target

Modify:

```text
custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
```

Keep the existing `renderR7CropRecordWorkCards(ctx)` entry point, but deepen it:

```js
renderR7CropRecordWorkCards(ctx) {
  return this.renderR7CropRecordWorkflowVerticalSlice(ctx);
}
```

Add helpers:

```js
r7RecordMissingItems(ctx)
r7RecordCardState(record, kind)
r7RecordEvidence(record, kind)
renderR7CropRecordWorkflowVerticalSlice(ctx)
```

Do not change other subtab card builders in this slice unless tests require compatibility only.
