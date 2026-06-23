# Safety, Interlock, Model Order Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Reorder Green Smart’s AI/control roadmap so every crop/environment/irrigation/device feature is built as Safety Rules first, Interlock second, Model/AI third.

**Architecture:** A model output is never the first source of truth. Each domain must define deterministic safety rules, then interlock/fail-safe behavior, and only then allow AI/model outputs to suggest candidate targets. The first implementation slice is 작물 안전 → 작물 인터록 → 작기/작물 모델 because crop state is the upstream reference for environment, irrigation, and device decisions.

**Tech Stack:** Home Assistant custom integration, Python `HomeAssistantView`, MariaDB/aiomysql, Vanilla JS Web Component, pytest contract tests, `node --check`.

---

## Corrected relationship baseline

Previous model-track docs said:

```text
작기 모델 → 환경 전략 모델 → 관수 전략 모델 → 장치 운영 모델 → SafetyGuard/Interlock
```

That ordering is insufficient for real greenhouse operation. The corrected operating order is:

```text
작물 안전 룰(Crop Safety Rules)
→ 작물 인터록(Crop Interlock/Fallback Rules)
→ 작기/작물 모델(Crop Season Model)
→ 환경 안전 룰(Environment Safety Rules)
→ 환경 인터록(Environment Interlock)
→ 환경 전략 모델(Environment Strategy Model)
→ 관수 안전 룰(Irrigation Safety Rules)
→ 관수 인터록(Irrigation Interlock)
→ 관수 전략 모델(Irrigation Strategy Model)
→ 장치 안전 룰(Device Safety Rules / Fail Safe)
→ 장치 인터록(Device Interlock)
→ 장치 운영 모델(Device Operation Model)
→ Control Mode / Limited Auto / Operator Confirmation
→ HA service call / post-state verification / logs
```

Short form:

```text
For each domain: Safety → Interlock → Model(AI)
Domain reference order: Crop → Environment → Irrigation → Device
```

## Non-negotiable rules

1. **Safety rules are deterministic.** They must be explainable without AI/model inference.
2. **Interlock is the fallback/permission layer.** If model/AI is absent, failed, uncertain, or contradictory, interlock keeps operation bounded.
3. **Model/AI is advisory until promoted.** Model output may suggest candidate targets only after safety and interlock contracts exist.
4. **No physical device connection before virtual verification.** C20 remains blocked until Safety/Interlock/Model chain evidence passes in virtual HA rehearsal.
5. **Crop comes first.** Environment, irrigation, and device rules must know which crop/season/growth stage they are protecting.
6. **No vague “SafetyGuard 우선” marker is enough.** Each domain must list exact block/fallback rules, thresholds, reason codes, and log fields.

---

## Current status after v1.9.48

Completed:

- M0: user-facing MVP terminology cleaned up.
- M1: `_crop_model_snapshot(hass, season_id)` baseline exists.
- C-S1/C-S1B: crop safety rules include crop season, crop type, growth freshness, pest risk, PLS/mix risk, G-Index lower/upper bounds, and growth metric anomalies.
- C-S2: `_crop_interlock_decision(cropSafety)` maps crop safety reasons to block/fallback/confirmation actions and exposes `cropInterlock` in crop model snapshots.

Paused:

- M2~M8 model expansion is paused until safety/interlock rules are explicit.

Problem found:

- M2~M8 model expansion must stay paused until each domain has explicit safety/interlock contracts.
- Next work is C-S3: reinforce model snapshots/consumers so downstream strategy targets cannot bypass `cropSafety`/`cropInterlock`.

---

## Phase S0: Roadmap correction contract

**Objective:** Prevent future agents from continuing model phases before Safety/Interlock contracts.

**Files:**
- Modify: `docs/PROJECT_MASTER_PLAN.md`
- Modify: `docs/design/current-backend-api-db-ha-contract.md`
- Modify: `docs/design/zone-control-roadmap-and-data-model.md`
- Modify: `docs/plans/2026-06-23-integrated-crop-environment-irrigation-device-models.md`
- Modify: `tests/test_integrated_model_docs_contract.py`

**Acceptance markers:**

```text
Safety → Interlock → Model(AI)
작물 안전 룰
작물 인터록
M2~M8 paused until safety/interlock contracts
No vague SafetyGuard 우선 marker is enough
```

**Verification:**

```bash
pytest tests/test_integrated_model_docs_contract.py -q
```

---

## Phase C-S1: Crop Safety Rules contract

**Objective:** Define deterministic crop safety rules before any additional crop/environment/irrigation/device model work.

**Rule categories:**

| Category | Example deterministic rule | Reason code |
|---|---|---|
| crop season validity | no active crop season for zone | `crop_season_missing` |
| crop identity confidence | crop type unknown/unsupported | `crop_type_unknown` |
| growth data freshness | latest growth survey older than configured days | `growth_survey_stale` |
| pest risk | pest risk high or rising | `crop_pest_risk_high` |
| yield/growth anomaly | G-Index drops sharply or impossible growth velocity | `crop_growth_anomaly` |
| pesticide/control freshness | last control record too old when pest risk medium/high | `crop_control_record_stale` |
| data confidence | crop model confidence low for automation | `crop_confidence_low` |

**Expected helper/API markers:**

```text
CROP_SAFETY_RULE_VERSION
CROP_SAFETY_RULE_DEFAULTS
_crop_safety_rule_snapshot(...)
cropSafetyStatus
cropSafetyBlocked
cropSafetyReasons
cropSafetyRules
cropSafetyRuleResults
pesticide_pls_noncompliant
pesticide_mix_forbidden
pesticide_mix_unknown
crop_metric_anomaly
minGIndex
maxMetricDeltaByKey
```

**Default thresholds:**

| Key | Default | Meaning |
|---|---:|---|
| `growthSurveyStaleDays` | 14 | latest growth survey stale threshold |
| `controlRecordStaleDays` | 21 | stale control/pesticide record threshold when pest risk is medium/high |
| `minGIndex` | 0.0 | G-Index lower anomaly threshold |
| `maxGIndex` | 120.0 | G-Index upper anomaly threshold |
| `maxWeeklyGrowthCm` | 80.0 | weekly growth anomaly threshold |
| `metricBoundsByKey` | height/leafCount/stemDia/truss/node | hard min/max bounds for growth survey metrics |
| `maxMetricDeltaByKey` | height 80, leafCount 30, stemDia 20, truss 10, node 30 | rapid-change threshold vs previous survey |
| `supportedCropTypes` | `tomato`, `lettuce` | crop-specific safety-supported crops |

**Files likely touched:**
- `custom_components/green_smart/crop_views.py`
- `custom_components/green_smart/zone_control_views.py`
- `tests/test_model_contract.py`
- `docs/design/current-backend-api-db-ha-contract.md`

**Verification:**

```bash
pytest tests/test_model_contract.py -q
```

---

## Phase C-S2: Crop Interlock/Fallback contract

**Objective:** Define what the system must do when crop safety is blocked or uncertain.

**Interlock decisions:**

| Crop safety result | Interlock action |
|---|---|
| missing crop season | block model-driven environment/irrigation/device target promotion |
| stale growth survey | allow read-only preview, block auto execution, require operator confirmation |
| high pest risk | block aggressive humidity/irrigation changes, require manager/admin approval |
| low crop confidence | fallback to conservative baseline settings |
| unknown crop type | use generic safe ranges only, no crop-specific optimization |

**Expected markers:**

```text
CROP_INTERLOCK_VERSION
_crop_interlock_decision(...)
cropInterlockStatus
cropInterlockBlocked
cropInterlockActions
fallbackToConservativeBaseline
operatorConfirmationRequired
managerApprovalRequired
adminApprovalRequired
blockTargetPromotion
blockAutoExecution
useGenericSafeRangesOnly
blockAggressiveClimateAndIrrigationChanges
crop_interlock_policy_v1
```

**Verification:**

```bash
pytest tests/test_model_contract.py tests/test_zone_control_api_contract.py -q
```

---

## Phase C-S3: Crop Model resumes after safety/interlock

**Objective:** Resume crop model work only after C-S1 and C-S2 are implemented.

**Allowed model behavior:**

- May calculate crop profile/growth stage/G-Index/yield/pest confidence.
- Must include cropSafety and cropInterlock summaries in model snapshot.
- Must not promote downstream strategy targets if crop safety/interlock blocks.

**Expected markers:**

```text
cropModel.cropSafety
cropModel.cropInterlock
cropModel.modelAllowed
modelBlockedBySafety
modelBlockedByInterlock
```

---

## Subsequent domain order

After crop safety/interlock/model is complete:

1. Environment Safety Rules
2. Environment Interlock
3. Environment Strategy Model
4. Irrigation Safety Rules
5. Irrigation Interlock
6. Irrigation Strategy Model
7. Device Safety Rules / Fail Safe
8. Device Interlock
9. Device Operation Model

Do not skip safety/interlock layers for a downstream domain just because the model helper already exists.
