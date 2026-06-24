# Crop Settings UI/UX Slice Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Rebuild the Crop Settings page into clean, farm-owner/staff-friendly subpages by treating each subpage as one vertical UI/UX slice instead of continuously adding disconnected cards.

**Architecture:** Green Smart remains a Home Assistant custom panel implemented in `custom_components/green_smart/panel/green-smart-panel.js`. This track is UI/UX-first but still follows vertical-slice discipline: each subpage slice must update IA/docs, panel rendering, event binding if needed, contract tests, responsive/mobile+PC behavior, local verification, prod sync, version bump, commit/tag/release. Backend/API changes are allowed only when the subpage needs cleaner data boundaries; otherwise reuse existing APIs.

**Tech Stack:** Home Assistant Web Component, Vanilla JS template rendering, CSS inline/component helpers, Python pytest string/contract tests, Docker HA prod verification, GitHub release.

---

## 0. Why this plan exists

The current Crop Settings page has accumulated many cards over time. The user explicitly reported that the state is poor because prior work treated UI as “just generate cards.” From now on:

```text
**하위페이지 1개 = 슬라이스 1개**. One Crop Settings subpage = one slice = one polished workflow.
```

A slice is not complete just because a card was added. It is complete only when the subpage feels coherent for non-specialist farm owners/staff and passes contract/prod verification.

---

## 1. Current state discovered from code/docs

### Source files

- Main panel: `custom_components/green_smart/panel/green-smart-panel.js`
- Current UI docs: `docs/design/current-ui-design-and-navigation.md`
- API docs: `docs/design/api-spec.md`
- Existing crop backend/API: `custom_components/green_smart/crop_views.py`

### Current Crop Settings render structure

`_renderCropSettingsPage()` currently defines 5 sub-tabs:

| key | Current label | Current render function | Current problem |
|---|---|---|---|
| `basic` | 작기 설정 | `_renderCropBasicTab()` + `_renderCropSeasonsList()` | List cards are functional but not a clear “selected season overview + actions” workflow. Edit/demolish/delete actions compete visually. |
| `growth` | 생육조사 | `_renderCropGrowthTab()` | Raw row list + add/export controls. Needs operator summary, latest survey state, cleaner metric grouping, and clearer empty state. |
| `ai` | AI 전략 | `_renderCropAiStrategyTab()` + `_renderGrowthReportCard()` | Too many technical cards accumulated: model, policy, interlock, training, dataset, operator workflow, analytics. Needs merge/delete/collapse and farm-owner first summary. |
| `pest` | 병해충 예찰 | `_renderCropPestTab()` | Simple rows only. Needs severity summary, unresolved risk view, and connection to 방제 기록 without duplicating cards. |
| `control` | 방제 기록 | `_renderCropControlTab()` | Simple rows with PLS chips. Needs PHI/REI/PLS safety summary, latest treatment state, and cleaner pesticide grouping. |

### Documentation mismatch

`docs/design/current-ui-design-and-navigation.md` still describes only four tabs (`basic/growth/pest/control`) and says the growth report card is in `growth`, but current code has an `ai` tab. Slice 0 must update this IA reference before UI cleanup work.

---

## 2. Non-negotiable UI/UX rules

1. **농장주/농장직원 first:** top of each subpage must answer “지금 무엇을 보면 되고, 다음 행동은 무엇인가?” in Korean.
2. **No disconnected card dumping:** new cards are forbidden unless one of these happens in the same slice. 즉, 매 슬라이스는 `카드 병합/삭제/추가/접기` 결정을 먼저 문서화한다:
   - merge an older card into a summary,
   - delete a redundant card,
   - collapse technical detail under a clearly labeled advanced section,
   - move the card to a more appropriate subpage.
3. **Action hierarchy:** primary action = one green filled button; secondary actions = outline; destructive actions = separated and less visually dominant, with confirmation.
4. **모바일 + PC 반응형:** every slice must include `repeat(auto-fit,minmax(...))`, wrapping action bars, and readable 360px mobile layout.
5. **Stable markers:** each slice adds/updates `data-crop-ui-*` markers so tests can verify structure without fragile styling assertions.
6. **RBAC visible states:** farm_owner/farm_staff/admin states must be considered. Staff should not see confusing admin/system diagnostics by default.
7. **Read-only safety boundary:** AI/model/interlock/policy cards do not gain device execution authority during this UI cleanup track. Forbidden markers/behaviors: `data-crop-ui-execute-device`, `data-crop-ui-train-production-model`, `cropSettingsAllowExecution`.
8. **Version discipline:** each completed slice bumps patch version and releases. Current baseline is `v1.9.67`; first UI cleanup slice is `v1.9.68`.

---

## 3. Shared design language

Use a clean SaaS dashboard style, closer to **Linear/Vercel/Notion** than dense admin tables:

- Background: soft green/white surfaces already used by Green Smart.
- Top summary: 1 large calm card with 3–4 KPI chips.
- Lists: compact timeline/list cards, not bulky repeated panels.
- Advanced details: collapsed/secondary section with small labels.
- Dangerous actions: muted red outline, never next to primary add action without spacing.
- Empty states: friendly Korean instruction + one primary action.

Shared component patterns to introduce gradually:

| Pattern | Purpose | Suggested marker |
|---|---|---|
| Crop settings shell | Wrap the whole Crop Settings page contract | `data-crop-ui-shell` |
| Tab bar | Verify 5-subpage IA without brittle styling | `data-crop-ui-tab-bar` |
| Subpage header summary | Explain selected season and next action | `data-crop-ui-subpage-summary` |
| KPI chip grid | Count/latest/status summary | `data-crop-ui-kpi-grid` |
| Primary action bar | Add/export/refresh without clutter | `data-crop-ui-action-bar` |
| Polished list | Unified row/card style for records | `data-crop-ui-record-list` |
| Advanced detail group | Collapse technical cards | `data-crop-ui-advanced-details` |
| Empty state | Helpful no-data UX | `data-crop-ui-empty-state` |

---

## 4. Slice map

Each row below is a complete patch release, not a partial UI change.

| Slice | Version | Subpage | Main cleanup | Must merge/delete/add |
|---:|---:|---|---|---|
| UI Slice 0 | v1.9.68 | Crop Settings IA shell | Update plan/docs and page shell contract | Add shared IA contract; do not change behavior heavily |
| UI Slice 1 | v1.9.69 | 작기 설정 | Make selected season overview and lifecycle actions clear | Merge selector/list duplication; separate edit/철거/delete hierarchy; add clean empty state |
| UI Foundation | v1.9.70 | 공통 메인 포맷 + 작물 아이콘 탭 | Apply common main page format and align Crop tab style with Environment tabs | Add shared page shell helper; add icon+text Crop tabs; shift later slice versions |
| UI Slice 2 | v1.9.71 | 생육조사 | Make weekly survey workflow clean | Add latest survey summary; merge metric chips; improve add/export/delete layout |
| UI Correction | v1.9.72 | 작기 설정 공통 포맷 재적용 | Re-apply the post-foundation common subpage workflow to the earlier Basic slice | Add summary alias, latest-season marker, compact record row markers, full CSV label, and shift AI/pest/control versions |
| UI Hotfix | v1.9.73 | 작물 설정 시각/표기/수정 UX 보정 | Fix issues found in the actual rendered screen before continuing AI strategy | Add Basic tab emoji fallback, Korean crop labels in latest growth survey, and growth row edit action |
| UI Slice 3 | v1.9.74 | AI 전략 | Reduce card sprawl drastically | Merge operator workflow + key model status into primary summary; collapse technical details; remove duplicate standalone evidence where redundant |
| UI Slice 4 | v1.9.75 | 병해충 예찰 | Make scouting/risk workflow clear | Add severity summary; group unresolved observations; link next action to 방제 기록 without duplicating 방제 UI |
| UI Slice 5 | v1.9.76 | 방제 기록 | Make PLS/PHI/REI safety readable | Add safety summary; group pesticide chips; make delete/export/add hierarchy clean |
| UI Slice 6 | v1.9.77 | Cross-subpage consistency pass | Final consistency pass | Normalize spacing, buttons, mobile, RBAC text, docs/screenshots if needed |

---

## 5. Slice details

## UI Slice 0 — v1.9.68 Crop Settings IA Shell Plan/Contract

### Objective

Create the durable IA contract for Crop Settings and align docs/tests with the actual 5-subpage structure before visual changes.

### Files

- Modify: `docs/design/current-ui-design-and-navigation.md`
- Modify: `docs/plans/2026-06-24-crop-settings-ui-slice-plan.md`
- Create: `tests/test_crop_settings_ui_ia_contract.py`
- Modify lightly if needed: `custom_components/green_smart/panel/green-smart-panel.js`
- Bump: `manifest.json`, panel `VERSION`, `central_views.py`

### Acceptance criteria

- Docs list 5 subpages: `basic`, `growth`, `ai`, `pest`, `control`.
- Contract test verifies tab labels and render-function mapping.
- Contract test verifies shared marker policy names are documented.
- No major UI behavior change yet.
- Version markers become `1.9.68`.

### Verification

```bash
pytest -q tests/test_crop_settings_ui_ia_contract.py
pytest -q
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 -m py_compile custom_components/green_smart/crop_views.py custom_components/green_smart/central_views.py
```

---

## UI Slice 1 — v1.9.69 작기 설정 Subpage Polish

### Objective

Turn the Basic tab into a clean season lifecycle page: selected season overview, concise active/ended season list, and clear primary/secondary/destructive actions.

### Current issues

- Season selector and season list repeat similar information.
- Edit, 철거, delete actions compete in the same row.
- Empty state is too minimal.
- Mobile action layout can feel cramped.

### Planned card operations

| Operation | Target |
|---|---|
| Merge | Season selector + list status into a selected-season overview at top |
| Delete/Reduce | Remove duplicated crop/zone/date emphasis from repeated cards where selector already shows it |
| Add | `data-crop-basic-overview-card`, lifecycle KPI chips, clean empty state |
| Split | Destructive delete into a separated danger action area or menu-like secondary row |

### Required markers

```text
data-crop-basic-overview-card
data-crop-basic-selected-season
data-crop-basic-next-action
data-crop-basic-lifecycle-kpis
data-crop-basic-lifecycle-actions
data-crop-basic-primary-action
data-crop-basic-secondary-actions
data-crop-basic-danger-actions
data-crop-basic-season-list
data-crop-basic-empty-state
data-crop-ui-empty-state
```

### v1.9.69 implementation contract

- `data-crop-basic-overview-card` merges selected-season, zone, status, and cultivation method into one farmer/staff summary.
- `data-crop-basic-lifecycle-kpis` shows 전체 작기 / 재배 중 / 철거 완료 KPI chips.
- `data-crop-basic-lifecycle-actions` separates primary, secondary, and danger action zones.
- `data-crop-basic-season-list` becomes a compact lifecycle record list rather than another bulky summary card.
- `data-crop-basic-empty-state` uses Korean owner/staff guidance: 정식 등록으로 첫 작기를 추가하세요.
- The destructive delete action is isolated as a danger action, not visually competing with primary 정식 등록.

---

## UI Foundation — v1.9.70 공통 메인 포맷 + 작물 아이콘 탭

### Objective

Before continuing per-subpage Crop Settings cleanup, align the page-level frame used by 작물 설정 / 환경 제어 / 관수 제어 / 장치 제어 / Admin/System and make Crop sub-tabs visually consistent with Environment/Control tabs.

### Scope

- Add `_renderCommonMainPageShell(...)` as the common page entry wrapper.
- Apply `data-common-main-page`, `data-common-main-hero`, and `data-common-main-body` to the five main pages.
- Keep existing page-specific content and behavior unchanged.
- Change Crop Settings tab bar from text-only to Environment-style icon + text tabs.
- Shift later Crop Settings slice versions by one patch.

### Common main format contract

```text
hero + scope/status summary + content card
```

```text
data-common-main-page
data-common-main-hero
data-common-main-body
data-common-main-page="crop"
data-common-main-page="environment"
data-common-main-page="irrigation"
data-common-main-page="device"
data-common-main-page="admin-system"
```

Target pages:

| page key | page |
|---|---|
| `crop` | 작물 설정 |
| `environment` | 환경 제어 |
| `irrigation` | 관수 제어 |
| `device` | 장치 제어 |
| `admin-system` | Admin/System |

### Crop icon tab contract

```text
data-crop-ui-icon-tab
data-crop-tab-icon
data-crop-tab-emoji
data-crop-tab-label
```

| tab | icon | emoji fallback |
|---|---|---|
| 작기 설정 | `mdi:sprout` | `🌱` |
| 생육조사 | `mdi:clipboard-pulse-outline` | `📋` |
| AI 전략 | `mdi:brain` | `🧠` |
| 병해충 예찰 | `mdi:bug-outline` | `🐛` |
| 방제 기록 | `mdi:spray` | `💧` |

---

## UI Slice 2 — v1.9.71 생육조사 Subpage Polish

### Objective

Make weekly growth survey entry understandable at a glance: latest survey status, missing fields, add action, and compact history.

### Planned card operations

| Operation | Target |
|---|---|
| Merge | Metric chips into grouped “핵심 생육값 / 품질·장해값” display |
| Delete/Reduce | Avoid showing every metric with equal visual weight in list rows |
| Add | Latest survey summary + next survey hint |
| Keep | CSV export and add survey, but action hierarchy must be cleaner |

### Required markers

```text
data-crop-growth-summary-card
data-crop-growth-latest-survey
data-crop-growth-next-action
data-crop-growth-kpi-grid
data-crop-ui-kpi-grid
data-crop-ui-action-bar
data-crop-growth-primary-action
data-crop-growth-secondary-actions
data-crop-growth-record-list
data-crop-ui-record-list
data-crop-growth-record-row
data-crop-growth-core-metrics
data-crop-growth-quality-metrics
data-crop-growth-note
data-crop-growth-delete-action
data-crop-ui-empty-state
```

### v1.9.71 implementation contract

- `data-crop-growth-summary-card` explains the latest survey and next survey action in owner/staff Korean wording.
- `data-crop-growth-kpi-grid` keeps latest survey, core metric count, and quality/disorder count in responsive `repeat(auto-fit,minmax(...))` tiles.
- `data-crop-ui-action-bar` separates primary add action from secondary CSV export.
- `data-crop-growth-record-list` becomes a compact date-first list.
- Each row groups `핵심 생육값` and `품질·장해값` instead of giving every metric equal visual weight.
- Empty state tells staff to start the first weekly survey.
- No execution/device/model-training authority is added.

---

## UI Correction — v1.9.72 작기 설정 공통 포맷 재적용

### Objective

`작기 설정` was completed before the v1.9.70 common main/subpage format foundation and therefore needs a compatibility pass so the Basic tab uses the same summary/action/list workflow language as later Crop Settings slices.

### Scope

- Keep the v1.9.69 Basic tab behavior and bindings.
- Add `data-crop-basic-summary-card` and `data-crop-basic-latest-season` aliases so the top card matches the post-foundation summary contract.
- Keep `data-crop-basic-overview-card` for backward compatibility.
- Make the action bar wording match the common pattern: full `CSV 내보내기` label and primary `+ 정식 등록`.
- Mark each season row as a compact record row with summary/meta/actions sections.
- Preserve destructive delete separation under `data-crop-basic-danger-actions`.

### Required markers

```text
data-crop-basic-summary-card
data-crop-basic-latest-season
data-crop-basic-kpi-grid
data-crop-basic-record-row
data-crop-basic-record-summary
data-crop-basic-record-meta
data-crop-basic-record-actions
```

---

## UI Hotfix — v1.9.73 작물 설정 시각/표기/수정 UX 보정

### Objective

Fix issues found on the actual rendered Crop Settings screen before continuing AI Strategy work.

### Fixes

- Basic tab icon: use `icon: "mdi:sprout"` and explicit `emoji: "🌱"` fallback rendered through `data-crop-tab-emoji` / `${t.emoji}` so the tab never appears blank.
- Latest growth survey crop name: translate raw crop keys with `_cropLabelForDisplay(` and `const latestCropLabel = this._cropLabelForDisplay(` so `lettuce` renders as `상추`, with `토마토`, `파프리카`, `오이`, `허브` labels preserved.
- Growth record row actions: add `data-growth-edit`, `data-growth-edit="${i}"` / `data-crop-growth-edit-action`, open `_openGrowthEditPopup(`, prefill the existing record, and save through `PUT", `green_smart/crop/growth/${id}``.

### Required markers

```text
data-crop-tab-emoji
data-growth-edit
data-crop-growth-edit-action
_cropLabelForDisplay(
```

---

## UI Slice 3 — v1.9.74 AI 전략 Subpage Polish

### Objective

Fix the worst card-sprawl area. AI Strategy must start with a farmer-readable decision summary, while detailed technical cards become collapsed or secondary evidence.

### Planned card operations

| Operation | Target |
|---|---|
| Merge | `operatorWorkflow`, stage prediction, validation, readiness into one primary “이번 주 작물 판단 요약” |
| Collapse | training dataset, feature-source evidence, score components, center policy raw variables into advanced details |
| Delete/Reduce | Remove repeated “read-only/no execution” text if already shown in primary boundary banner |
| Add | Clear “다음 행동” section for owner/staff |

### Required markers

UI must include the visible Korean labels `이번 주 작물 판단 요약`, `다음 행동`, `상세 모델 근거`, `자동 실행 없음`, and `자동 학습/배포 없음`. Technical evidence must be collapsed with literal markers `<details data-crop-ai-advanced-details` and `<summary`.

```text
data-crop-ai-primary-summary
data-crop-ai-next-action
data-crop-ai-advanced-details
data-crop-ai-readonly-boundary
data-crop-ai-technical-evidence-grid
```

### Forbidden markers/behavior

```text
data-crop-ai-execute-device
data-crop-ai-train-production-model
centerPolicyAllowExecution
cropAiAllowExecution
autoDeployProductionModel
```

---

## UI Slice 4 — v1.9.75 병해충 예찰 Subpage Polish

### Objective

Make scouting records actionable: what was found, how serious it is, whether follow-up 방제 is needed.

### Planned card operations

| Operation | Target |
|---|---|
| Merge | Count/severity/latest observation into top summary |
| Add | Unresolved/high severity focus area |
| Reduce | Plain row list visual noise |
| Link | Next action points to 방제 기록 tab but does not duplicate 방제 form |

### Required markers

UI must include the visible Korean labels `병해충 예찰 요약`, `고위험/미해결`, `다음 행동`, and `방제 기록으로 이동`.

```text
data-crop-pest-summary-card
data-crop-pest-severity-overview
data-crop-pest-record-list
data-crop-pest-record-row
data-crop-pest-record-summary
data-crop-pest-record-meta
data-crop-pest-delete-action
data-pest-del
data-crop-pest-next-action
data-crop-pest-go-control
```

### Forbidden markers/behavior

```text
data-crop-pest-control-form
data-crop-pest-apply-treatment
data-crop-pest-execute-control
pestAllowPesticideExecution
```

---

## UI Slice 5 — v1.9.76 방제 기록 Subpage Polish

### Objective

Make pesticide/treatment history readable and safety-oriented: latest treatment, PLS/PHI/REI state, and what staff should check next.

### Planned card operations

| Operation | Target |
|---|---|
| Merge | pesticide chips + PLS state into readable treatment row |
| Add | Safety summary for PHI/REI/PLS freshness |
| Reduce | Dense row text and floating delete button |
| Keep | export/add/delete with better hierarchy |

### Required markers

UI must include visible Korean labels `방제 안전 요약`, `PLS 확인`, `PHI/REI 확인`, and `다음 점검`.

```text
data-crop-control-safety-summary
data-crop-control-pls-overview
data-crop-control-phi-rei-overview
data-crop-control-treatment-list
data-crop-control-treatment-row
data-crop-control-treatment-summary
data-crop-control-treatment-meta
data-crop-control-pesticide-chip-group
data-crop-control-delete-action
data-control-del
data-crop-control-next-check
```

### Forbidden markers/behavior

```text
data-crop-control-execute-spray
data-crop-control-auto-apply
controlAllowPesticideExecution
autoSchedulePesticideApplication
```

---

## UI Slice 6 — v1.9.77 Cross-subpage consistency pass

### Objective

Normalize the whole Crop Settings page after all subpages are individually cleaned.

### Scope

- Consistent spacing/radius/shadow/button hierarchy.
- Mobile 360px sanity checks through contract markers and browser verification if available.
- Farm owner/staff wording review.
- Update `docs/design/current-ui-design-and-navigation.md` final state.
- Verify no hidden duplicate cards remain.

### Required final markers

UI must include the visible Korean phrases `농장주/직원용 요약 우선` and `모바일 360px 기준`.

```text
data-crop-consistency-shell
data-crop-consistency-mobile-safe
data-crop-consistency-action-row
data-crop-consistency-card-radius
data-crop-consistency-final-pass
data-crop-basic-summary-card
data-crop-growth-workflow-card
data-crop-ai-primary-summary
data-crop-pest-summary-card
data-crop-control-safety-summary
```

### Final forbidden markers/behavior

```text
data-crop-ai-execute-device
data-crop-ai-train-production-model
data-crop-pest-control-form
data-crop-pest-apply-treatment
data-crop-control-execute-spray
data-crop-control-auto-apply
centerPolicyAllowExecution
cropAiAllowExecution
pestAllowPesticideExecution
controlAllowPesticideExecution
autoSchedulePesticideApplication
```

---

## 6. Testing strategy

Each slice must include at least one focused contract test.

Suggested files:

```text
tests/test_crop_settings_ui_ia_contract.py
tests/test_crop_settings_basic_ui_contract.py
tests/test_crop_settings_growth_ui_contract.py
tests/test_crop_settings_ai_ui_contract.py
tests/test_crop_settings_pest_ui_contract.py
tests/test_crop_settings_control_ui_contract.py
tests/test_crop_settings_cross_ui_contract.py
```

Test categories:

1. Required marker exists.
2. Forbidden marker does not exist.
3. Mobile/PC responsive marker exists: `grid-template-columns:repeat(auto-fit,minmax(` and `flex-wrap:wrap`.
4. Korean owner/staff wording exists.
5. Old duplicated headings are absent or moved under advanced details when a slice says they are merged/collapsed.
6. Version markers match current patch.

---

## 7. Definition of done for every UI slice

```text
1. Plan/docs updated first.
2. RED contract test added and observed failing.
3. Panel UI implemented with merge/delete/add operations called out in docs.
4. Targeted test passes.
5. Full pytest passes.
6. node --check passes.
7. Version bumped across manifest/panel/central.
8. Prod HA check_config passes.
9. Prod HA restarted if panel code changed.
10. Commit/tag/push/GitHub release completed.
```

---

## 8. Current next action

Start with **UI Slice 0 — v1.9.68 Crop Settings IA Shell Plan/Contract**.

First concrete task:

```text
Create tests/test_crop_settings_ui_ia_contract.py to lock the 5-subpage structure and shared marker policy.
```

---

## Requested UI correction slice — v1.9.78

User-requested follow-up correction after cross-subpage final pass.

- 하위탭은 이모티콘 + 하위탭명만 표시한다. `data-crop-tab-icon`/label은 유지하고 `data-crop-tab-emoji`/`${t.emoji}`는 제거한다.
- 생육조사 기록, 병해충 예찰 기록, 방제 기록은 `_cropRecordActionGroup` 기반 기본 목록 action format을 공유한다.
- `data-season-demolish` / 철거 버튼은 작기 설정 작기 목록에만 존재한다.
- AI 전략은 `data-crop-ai-consolidated-layout`, `data-crop-ai-summary-stack`, `data-crop-ai-evidence-details`, `data-crop-ai-duplicate-card-guard` 기준으로 요약 1개 + 접힘 evidence로 정리한다.
- 병해충 예찰/방제 기록은 요약 카드 다음에 액션 줄과 기록 목록 순서를 따른다.
- 방제 기록 추가 modal은 `data-control-dose-grid`, `data-chemical-amount-input`, `data-water-amount-input`, `data-treatment-area-input`, `data-pyeong-amount-output`로 약제/물 사용량, 희석 배수, 사용 면적, 평당 사용량을 자동 계산한다.
- 계산 payload에는 `chemicalAmount`, `waterAmount`, `treatmentAreaM2`, `perPyeongUsage`, `cropModelNutritionHint`를 포함하되 실행 권한은 부여하지 않는다.

Required marker bundle:

```text
v1.9.78
이모티콘 + 하위탭명만 표시
_cropRecordActionGroup
data-crop-record-action-group
data-crop-record-secondary-actions
data-crop-record-danger-actions
data-crop-growth-record-actions
data-crop-pest-record-actions
data-crop-control-record-actions
data-crop-ai-consolidated-layout
data-crop-ai-summary-stack
data-crop-ai-evidence-details
data-crop-ai-duplicate-card-guard
data-control-dose-grid
data-chemical-amount-input
data-water-amount-input
data-dil-input
data-treatment-area-input
data-pyeong-amount-output
_calculateControlDilution
_calculateTreatmentAreaFromSeason
_calculatePyeongUsage
_syncControlDoseCalculations
chemicalAmount
waterAmount
treatmentAreaM2
perPyeongUsage
cropModelNutritionHint
```
