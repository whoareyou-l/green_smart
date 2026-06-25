# Crop Stage Model Sequential Implementation Plan

> Working target: next patch after `v1.10.14`
> Method: each step must finish `design → implementation → verification` before the next step starts.
> Boundary: read-only model/training data. No environment, irrigation, device, PID, physical execution, automatic ML training, or automatic deployment authority.

## Confirmed workflow

The five steps are not implemented as one bundle. They are handled in this order:

```text
1단계 생육단계 예측 모델
2단계 작물별 stage rule
3단계 feature snapshot
4단계 prediction row 저장
5단계 정확히 7일 차 validation loop
```

If any model policy, formula, tolerance, fallback, or crop-specific interpretation is unknown, implementation pauses and asks one question via `clarify`.

---

# Step 1 — 생육단계 예측 모델

## Design status

Status: implemented and verified.

Verification result:

```text
pytest -q tests/test_crop_stage_model_step1_prediction_contract.py
5 passed
```

Implemented output fields:

- `modelStage: step_1_stage_prediction_model`
- `predictionHorizonDays: 7`
- `readOnly: true`
- `executionAuthority/trainingAuthority/deploymentAuthority: none`
- `predictionInputs`
- `modelDecision`
- `modelLimitations`

## Objective

Turn the current 7-day prediction helper into a clearer read-only model payload, without borrowing unresolved Step 2 responsibilities.

Step 1 does **not** decide new crop-specific stage sequences by itself. It consumes the current `stageDiagnosis`, `growthIndex`, `growth_rows`, and optional feature summaries, then produces a transparent 7-day prediction model output.

## Inputs

```text
stageDiagnosis
- current stage id/label/confidence
- missing evidence
- index band

growthIndex
- G-Index/L-Index value
- missing growth-index inputs

growth_rows
- survey count
- current/previous weekly survey data

featureSources
- inputCompleteness
- kmaWeatherStress7d
- environment/irrigation/pest/safety summaries when available
```

## Output contract

`stagePrediction7d` must include:

```json
{
  "version": "crop_stage_prediction_score_v1",
  "modelFamily": "hybrid_rule_score_v1",
  "modelTarget": "growth_stage_prediction_7d",
  "modelStage": "step_1_stage_prediction_model",
  "predictionHorizonDays": 7,
  "readOnly": true,
  "executionAuthority": "none",
  "score": {
    "scoreComponents": {},
    "rawScore": 0.0,
    "probability": 0.0,
    "confidenceScore": 0.0,
    "confidencePercent": 0,
    "explanation": []
  },
  "currentStage": {},
  "predictedStage7d": {},
  "transitionWindow": {},
  "predictionInputs": {},
  "modelDecision": {},
  "modelLimitations": []
}
```

## Decision rules

- The model is a transparent hybrid baseline, not an ML black box.
- `probability` is the transition probability from current stage toward a next-stage candidate.
- `confidenceScore` is separate from `probability` and reflects input reliability/completeness.
- If evidence is missing, `missingInputs` and `modelLimitations` must say so directly.
- Step 1 must not create control authority.
- Step 1 must not claim automatic ML training or deployment.
- Step 1 must not silently depend on a crop-specific next-stage sequence; that belongs to Step 2.

## Implementation tasks

- Add explicit model metadata to `_crop_stage_prediction_7d()`.
- Add `predictionInputs` summary.
- Add `modelDecision` summary.
- Add `modelLimitations` summary.
- Add contract tests that fail if Step 1 is just a minimal marker payload.

## Verification

Targeted:

```bash
pytest -q tests/test_crop_stage_model_step1_prediction_contract.py
```

Step 1 is complete only when this targeted contract passes.

---

# Step 2 — 작물별 stage rule

## Design status

Status: implemented and verified.

Verification result:

```bash
pytest -q tests/test_crop_stage_model_step2_stage_rules_contract.py
4 passed
```

Implemented behavior:

- tomato stage diagnosis uses `G-Index`.
- lettuce stage diagnosis uses `L-Index`.
- unknown crop does not silently fall back to tomato rules.
- diagnosis output includes `stageRule`, `stageRuleSource`, `stageSequence`, `stageOrder`, `previousStageId`, and `nextStageId`.

## Objective

Stage diagnosis must use crop-specific rules and crop-specific index semantics:

```text
tomato → G-Index
lettuce → L-Index
```

Step 2 owns stage rule selection and stage-rule evidence. It must not be hidden behind generic G-Index-only logic.

## Inputs

```text
season.cropType
season.method / cultivationMethod
growth_rows latest metrics_json
CROP_STAGE_CALIBRATION_DEFAULTS or DB calibration response
```

## Output contract

`stageDiagnosis` must expose:

- `stageId`
- `stageLabel`
- `indexType`
- `indexValue`
- `indexBand`
- `stageRule`
- `stageRuleSource`
- `stageSequence`
- `stageOrder`
- `nextStageId`
- `previousStageId`

## Decision rules

- Tomato stage rules must use `G-Index`.
- Lettuce stage rules must use `L-Index`.
- Default calibration rules are used when DB calibration override is absent.
- Stage sequence metadata must be explicit so Step 1 does not fake next-stage selection.
- Unknown crop remains review/unknown instead of silently pretending crop-specific rules exist.

## Implementation tasks

- Add crop-specific stage sequence helper.
- Make `_crop_stage_diagnosis_from_parts()` use `_crop_growth_index()` instead of generic `_growth_g_index()`.
- Add `stageRule`, `stageRuleSource`, `stageSequence`, `stageOrder`, `nextStageId`, `previousStageId` to diagnosis output.
- Add targeted Step 2 contract tests.

## Verification

Targeted:

```bash
pytest -q tests/test_crop_stage_model_step2_stage_rules_contract.py
```

Step 2 is complete only when this targeted contract passes.

---

# Step 3 — feature snapshot

## Design status

Status: implemented and verified.

Verification result:

```bash
pytest -q tests/test_crop_stage_model_step3_feature_snapshot_contract.py
5 passed
```

Implemented behavior:

- `featureSnapshotStage: step_3_feature_snapshot`
- read-only/no authority boundary fields
- `requiredSourceGroups`
- `sourceCoverage`
- `featureSnapshotLimitations`
- first-class `cropSafety` and `cropInterlock` aliases

## Objective

Feature snapshot must be a first-class model input artifact, not a loose collection of optional dicts.

Step 3 owns input evidence packaging:

```text
growth survey
environment 7d
KMA/weather stress 7d
irrigation/nutrient 7d
pest/control 7d
operation history 7d
safety/interlock
input completeness/source status
```

## Output contract

`trainableBaseline.featureSnapshot` must expose:

- `featureSnapshotStage: step_3_feature_snapshot`
- `readOnly: true`
- `executionAuthority: none`
- `requiredSourceGroups`
- `sourceCoverage`
- `featureSnapshotLimitations`
- explicit source groups already used by the stage prediction model

## Decision rules

- Missing source groups must be visible, not hidden.
- `growthSurvey` is required and is ready only when at least one growth survey exists.
- `cropSafety` and `cropInterlock` must be first-class aliases as well as part of `safetyInterlockSummary`.
- Feature snapshot must not add execution/control authority.

## Implementation tasks

- Add source coverage summary helper.
- Add limitations for missing/stale/empty groups.
- Add read-only authority boundary fields.
- Add targeted Step 3 contract tests.

## Verification

Targeted:

```bash
pytest -q tests/test_crop_stage_model_step3_feature_snapshot_contract.py
```

Step 3 is complete only when this targeted contract passes.

---

# Step 4 — prediction row 저장

## Design status

Status: implemented and verified.

Verification result:

```bash
pytest -q tests/test_crop_stage_model_step4_prediction_persistence_contract.py
4 passed
```

Implemented behavior:

- `trainableBaseline.predictionPersistence` metadata added.
- `predictedForDate = predictionDate + 7 days` is explicit.
- `_persist_crop_model_training_snapshot()` refuses orphan rows without `sourceSurveyId`.
- Persisted row keeps `validation_status = pending` and null actual validation fields.

## Objective

Prediction row persistence must create a traceable training row from a real source growth survey. It must not create orphan prediction rows without `sourceSurveyId`.

## Inputs

```text
season_id
season
cropModel.trainableBaseline.featureSnapshot
cropModel.trainableBaseline.stagePrediction7d
cropModel.trainableBaseline.mlUpgradeReadiness
cropModel.latestMetrics.id/date
featureSnapshotId
```

## Output contract

The persisted row in `crop_model_training_snapshots` must carry:

- `season_id`
- `feature_snapshot_id`
- `zone_id`
- `crop_type`
- `model_family`
- `target_horizon_days = 7`
- `source_survey_id`
- `prediction_date`
- `predicted_for_date = prediction_date + 7 days`
- `feature_snapshot_json`
- `prediction_json`
- `readiness_json`
- `actual_validation_json = null`
- `actual_survey_id = null`
- `validation_status = pending`

## Decision rules

- If no prediction payload exists, do not persist.
- If no source growth survey id exists, do not persist.
- Persistence remains data-storage only; it does not validate, train, deploy, or execute controls.
- The stage prediction payload should expose `predictionPersistence` metadata before DB insert so operators/devs can audit what will be written.

## Implementation tasks

- Add prediction persistence metadata to trainable baseline.
- Make `_persist_crop_model_training_snapshot()` refuse orphan rows without `latestMetrics.id`.
- Add targeted Step 4 contract tests.

## Verification

Targeted:

```bash
pytest -q tests/test_crop_stage_model_step4_prediction_persistence_contract.py
```

Step 4 is complete only when this targeted contract passes.

---

# Step 5 — 정확히 7일 차 validation loop

## Design status

Status: implemented and verified.

Verification result:

```bash
pytest -q tests/test_crop_stage_model_step5_exact_validation_contract.py
3 passed
```

Implemented behavior:

- success and review validation rows include `validationStage`.
- success and review validation rows include `validationPolicy`.
- exact-date-only behavior is preserved.
- missing exact survey becomes `validation_needs_review` with `exact_7_day_survey_missing`.

## Objective

Validation loop must compare a pending 7-day prediction only with the exact `predicted_for_date` growth survey.

## Confirmed policy

```text
Growth surveys are intended once per week.
7-day predictions are validated only with the exact 7-day-after survey.
No nearest-survey fallback.
Missing exact survey → validation_needs_review + exact_7_day_survey_missing.
```

## Output contract

Each `actual_validation_json` must include:

- `validationStage: step_5_exact_7_day_validation_loop`
- `validationPolicy.cadence = weekly_exact_7_day_survey`
- `validationPolicy.nearestSurveyFallback = false`
- `validationPolicy.missingExactSurveyStatus = validation_needs_review`
- `validationPolicy.reviewReason = exact_7_day_survey_missing`
- `predictedForDate`
- `predictedStage7d`
- `actualStage`
- `stageMatched`
- `transitionTimingErrorDays`
- `validationStatus`

## Decision rules

- Exact date match only.
- Earlier survey is not valid.
- Later survey is not valid.
- Missing exact survey is not pending forever; it becomes review.
- Validation loop remains data-processing only. It cannot execute controls, train models, or deploy models.

## Implementation tasks

- Add validation policy metadata to success and review rows.
- Keep existing exact-date matching behavior.
- Add targeted Step 5 contract tests.

## Verification

Targeted:

```bash
pytest -q tests/test_crop_stage_model_step5_exact_validation_contract.py
```

Step 5 is complete only when this targeted contract passes.

