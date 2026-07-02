# R7-049 Records Workflow Product Layout Redo Plan

> **For Hermes:** This plan supersedes the shallow R7-048 records-workflow value-card slice. Do not implement by simply displaying DTO values. First decide what each record/work element needs: write CTA, history view, edit affordance, settings, safety/approval boundary, or read-only source summary.

**Target version:** v1.14.37
**Scope:** `작물 운영 > 기록·작업` subtab only
**Redo required:** Yes. The previous `v1.14.37` implementation must be treated as baseline evidence, not as the final product layout.

---

## 0. Why redo is required

R7-048 improved `records-workflow` from a generic card dump into direct cards:

```text
오늘 할 일
생육조사
병해충 예찰
방제
누락/주의
기록 원천
```

But it still mostly does this:

```text
DTO value -> card display
```

That is not enough for a product UI. The correct flow is:

```text
existing content / operation context inventory
→ decide the job of each element
→ decide if it needs write CTA / history / edit / settings / approval / read-only source
→ design the layout around those decisions
→ add RED contracts
→ implement the layout and affordances
```

Therefore `v1.14.37` must be redone as `v1.14.37` with a real product workflow layout.

---

## 1. Slice boundary

### In scope

Only this subtab:

```text
작물 운영 > 기록·작업
```

### Out of scope

Do not redesign these subtabs in this slice:

```text
상태 요약
작기·현재작물
생육목표
모델·추천
추세·근거
```

Do not implement backend writes in this slice:

```text
DB migration 없음
새 write API 없음
실제 저장/수정/삭제 없음
HA service call 없음
MQTT/device command 없음
자동 apply/execute 없음
```

### Allowed in this slice

UI affordances only:

```text
작성 버튼 UI
히스토리 보기 버튼 UI
최근 기록 수정 버튼 UI, disabled/pending 가능
PLS 확인 버튼 UI, disabled/pending 가능
방제 기록으로 연결 버튼 UI, navigation-only 가능
관리자용 source/details disclosure UI
```

Buttons must be explicit about their state:

```text
available-ui-only
pending-api
read-only
navigation-only
admin-detail
```

---

## 2. Existing data inventory

Current source object:

```js
selectedZone.cropRecordSummary
```

Shape:

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
  writeEnabled,
  executionEnabled,
  deviceCommandEnabled,
  mqttEnabled
}
```

Current backend source:

```py
normalize_crop_operations_record_summary()
```

Current label rules:

| Field | Current label shape |
|---|---|
| `growthSurvey.latestLabel` | `date · 초장 {height}cm · 엽수 {leafCount}` |
| `pestScouting.latestLabel` | `date · type · severity` |
| `controlTreatment.latestLabel` | `date · pesticide name · PLS 적합/확인 필요` |
| `workQueue.nextAction` | `누락 기록 확인` or `최근 기록 검토 완료` |
| `workQueue.missingItems` | `생육조사 없음`, `병해충 예찰 없음`, `방제 기록 없음`, etc. |

---

## 3. Product judgment matrix

Each layout element must be designed from this judgment table.

| Element | Show latest value | Write CTA | History | Edit recent | Settings | Safety/approval | Notes |
|---|---:|---:|---:|---:|---:|---:|---|
| 오늘 할 일 | yes | conditional | yes | no | no | no | Work queue should point to the next missing/attention action. |
| 생육조사 | yes | yes | yes | yes, pending API | no | no | Repeated field input; needs write and history affordances. |
| 병해충 예찰 | yes | yes | yes | yes, pending API | no | optional handoff to 방제 | Severity should drive attention. |
| 방제 | yes | yes | yes | yes, pending API | no | PLS required | Never auto-execute treatment. Record only. |
| 누락/주의 | aggregate | conditional per missing item | no | no | no | no | Should expose direct CTAs for missing record types. |
| 기록 원천 | compact | no | no | no | no | read-only/admin | Source details should be collapsed/admin-oriented. |

---

## 4. Target layout

The subtab title remains `기록·작업`; do not render `기록·작업 운영 화면`.

Target layout:

```text
[오늘 할 일 / action queue]                         full-width priority band

[생육조사]                  [병해충 예찰]            [방제]
latest + state              latest + severity       latest + PLS
작성                         작성                    작성
히스토리                     히스토리                히스토리
최근 기록 수정               방제 기록으로 연결       PLS 확인

[누락/주의]                                           [기록 원천]
missing item CTAs                                      compact source + admin details
```

Required container marker:

```text
data-r7-records-workflow-product-layout="write-history-review"
```

Do not use generic equal-card layout as the primary layout. `오늘 할 일` must be visually first and full-width.

---

## 5. Element-specific design

## 5.1 오늘 할 일

### Purpose

Answer:

```text
지금 기록 업무에서 바로 할 일은 무엇인가?
```

### Data

```js
workQueue.nextAction
workQueue.missingItems
```

### Layout

```text
오늘 할 일
├─ nextAction primary text
├─ missing item chips
├─ CTA row generated from missing item types
└─ secondary: 전체 기록 보기
```

### CTA judgment

| Missing item includes | Primary CTA |
|---|---|
| `생육조사` | `생육조사 작성` |
| `병해충` or `예찰` | `예찰 작성` |
| `방제` | `방제 기록 작성` |
| none | `전체 기록 보기` |

### Markers

```text
data-r7-record-action-queue
 data-r7-record-action-primary="growth-survey-write"
 data-r7-record-action-primary="pest-scouting-write"
 data-r7-record-action-primary="control-treatment-write"
 data-r7-record-action-secondary="record-history"
```

### Button state

Because this slice does not implement write APIs yet:

```text
data-r7-record-action-state="pending-api"
```

History can be navigation-only until a detailed history UI is implemented:

```text
data-r7-record-action-state="navigation-only"
```

---

## 5.2 생육조사

### Purpose

Field staff need to enter and review growth observations repeatedly.

### Data

```js
growthSurvey.latestLabel
growthSurvey.count
growthSurvey.staleState
growthSurvey.latest.date
growthSurvey.latest.height
growthSurvey.latest.leafCount
```

### Layout

```text
생육조사
├─ latestLabel
├─ key facts: 초장 / 엽수 / date
├─ state: fresh/empty/attention
├─ CTA: 생육조사 작성
├─ CTA: 생육 히스토리
└─ CTA: 최근 기록 수정
```

### Required actions

| Action | Required? | State |
|---|---:|---|
| 생육조사 작성 | yes | `pending-api` |
| 생육 히스토리 | yes | `navigation-only` |
| 최근 기록 수정 | yes if count > 0 | `pending-api` |

### Markers

```text
data-r7-record-section="growth-survey"
data-r7-record-write-target="growth-survey"
data-r7-record-history-target="growth-survey"
data-r7-record-edit-target="growth-survey-latest"
```

---

## 5.3 병해충 예찰

### Purpose

Field staff need to record scouting observations and review severity/history. It may connect to 방제, but must not execute treatment.

### Data

```js
pestScouting.latestLabel
pestScouting.count
pestScouting.staleState
pestScouting.latest.date
pestScouting.latest.type
pestScouting.latest.severity
```

### Layout

```text
병해충 예찰
├─ latestLabel
├─ severity badge
├─ pest type / date
├─ CTA: 예찰 작성
├─ CTA: 예찰 히스토리
└─ conditional CTA: 방제 기록으로 연결
```

### Severity judgment

| Severity | Visual state |
|---|---|
| empty | empty/attention |
| low | fresh/ready |
| medium/mid | attention |
| high/severe | attention/red |

### Required actions

| Action | Required? | State |
|---|---:|---|
| 예찰 작성 | yes | `pending-api` |
| 예찰 히스토리 | yes | `navigation-only` |
| 방제 기록으로 연결 | yes when pest record exists or severity attention | `pending-api` |

### Markers

```text
data-r7-record-section="pest-scouting"
data-r7-record-write-target="pest-scouting"
data-r7-record-history-target="pest-scouting"
data-r7-record-link-target="control-treatment"
```

---

## 5.4 방제

### Purpose

Record treatment actions and surface PLS compliance. This is **recording/review only**, never execution.

### Data

```js
controlTreatment.latestLabel
controlTreatment.count
controlTreatment.staleState
controlTreatment.latest.date
controlTreatment.latest.pesticides[0].name
controlTreatment.latest.pesticides[0].pls
```

### Layout

```text
방제
├─ latestLabel
├─ pesticide / date / PLS status
├─ CTA: 방제 기록 작성
├─ CTA: 방제 히스토리
├─ conditional CTA: PLS 확인
└─ boundary label: 실행 아님 / 기록 전용
```

### PLS judgment

| PLS | State | CTA |
|---|---|---|
| true | fresh | no PLS warning CTA |
| false | attention | `PLS 확인` required |
| missing | attention | `PLS 확인` required |

### Required actions

| Action | Required? | State |
|---|---:|---|
| 방제 기록 작성 | yes | `pending-api` |
| 방제 히스토리 | yes | `navigation-only` |
| PLS 확인 | conditional | `pending-api` |

### Markers

```text
data-r7-record-section="control-treatment"
data-r7-record-write-target="control-treatment"
data-r7-record-history-target="control-treatment"
data-r7-record-check-target="pls"
data-r7-record-boundary="record-only-no-execution"
```

Forbidden:

```text
data-r7-crop-direct-execute
data-r7-crop-ha-service-call
data-r7-crop-mqtt-command
data-r7-crop-auto-apply
data-r7-crop-device-command
```

---

## 5.5 누락/주의

### Purpose

Aggregate missing items and warnings and provide direct affordances for the operator.

### Data

```js
workQueue.missingItems
growthSurvey.staleState
pestScouting.staleState
controlTreatment.staleState
controlTreatment.latestLabel includes PLS 확인 필요
```

### Layout

```text
누락/주의
├─ attention count
├─ missing/warning chips
├─ per-missing CTA buttons
└─ no global complete button in this slice
```

### Markers

```text
data-r7-record-section="missing-attention"
data-r7-record-missing-count
 data-r7-record-missing-action="growth-survey-write"
 data-r7-record-missing-action="pest-scouting-write"
 data-r7-record-missing-action="control-treatment-write"
```

---

## 5.6 기록 원천

### Purpose

Operators need a compact trust/source indicator; detailed source fields are admin/debug only.

### Data

```js
recordSummarySource
readOnly
writeEnabled
executionEnabled
deviceCommandEnabled
mqttEnabled
```

### Layout

```text
기록 원천
├─ compact: 최근 기록 요약 / read-only
├─ details disclosure: source flags
└─ admin/debug marker
```

### Markers

```text
data-r7-record-section="record-source"
data-r7-record-source-summary
 data-r7-record-source-detail="admin"
```

---

## 6. RED contract requirements

Create:

```text
tests/test_r7_049_records_workflow_product_layout_contract.py
```

Must verify:

1. Version surfaces are `1.14.37`.
2. This plan exists and says R7-048 must be redone.
3. `records-workflow` has product layout marker:
   - `data-r7-records-workflow-product-layout="write-history-review"`
4. `오늘 할 일` has missing-specific CTAs.
5. `생육조사` has write/history/edit affordances.
6. `병해충 예찰` has write/history/control-link affordances.
7. `방제` has write/history/PLS-check affordances and record-only boundary.
8. `누락/주의` has missing action affordances.
9. `기록 원천` has compact summary and admin detail marker.
10. Forbidden execution markers are absent.
11. Other subtabs are not redesigned in this slice.

---

## 7. Implementation target

Modify only the records-workflow rendering path in:

```text
custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
```

Expected helpers:

```js
r7RecordActionButton({ label, target, state, tone, icon })
r7RecordActionsForMissingItems(missingItems)
r7RecordPlsRequiresCheck(controlTreatment)
renderR7RecordsWorkflowProductLayout(ctx)
```

`renderR7CropRecordWorkCards(ctx)` should route to:

```js
return [this.renderR7RecordsWorkflowProductLayout(ctx)]
```

Existing R7-048 helpers may remain, but the primary visible layout should use the new product layout markers and action affordances.

---

## 8. Verification commands

```bash
pytest -q tests/test_r7_049_records_workflow_product_layout_contract.py
pytest -q tests/test_r7_049_records_workflow_product_layout_contract.py tests/test_r7_048_records_workflow_vertical_slice_contract.py tests/test_r7_047_crop_operations_direct_product_cards_contract.py
node --check custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
pytest -q
git diff --check
```

Prod verification:

```text
HA check_config
restart HA
served-source smoke: v1.14.37 + R7-049 markers
render smoke: records-workflow write/history/review affordances
recent HA log scan
```

---

## 9. Definition of done

This slice is complete only when:

- `기록·작업` is no longer only a value display.
- Each element has explicit job/affordance judgment.
- Write/history/edit/link/check buttons are visible with correct pending/navigation/read-only state markers.
- No backend write or execution is implied.
- Full tests and Prod smoke pass.
- GitHub release is published.
