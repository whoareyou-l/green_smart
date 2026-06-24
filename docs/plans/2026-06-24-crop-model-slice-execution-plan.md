# Crop Model Slice Execution Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the current crop model baseline into a real, auditable model-development track by documenting each implementation slice before coding and then executing only the documented slice.

**Architecture:** Green Smart remains a Home Assistant custom integration. Crop model work is Edge-local and read-only with respect to execution; Environment/Irrigation/Device active control remains out of scope. The model pipeline persists crop-specific growth survey metrics, feature-source snapshots, 7-day predictions, next-survey validation labels, input completeness, and future ML readiness.

**Tech Stack:** Home Assistant `HomeAssistantView`, Python, MariaDB via `aiomysql`, Vanilla JS Web Component panel, pytest contract tests, Docker prod HA/MariaDB verification, GitHub tags/releases.

---

## 0. Non-negotiable workflow

Every future crop-model implementation must follow this order:

```text
1. Update this plan or a focused design doc.
2. Define the exact slice acceptance criteria.
3. Add RED contract tests.
4. Run targeted tests and confirm expected failure.
5. Implement backend/API/DB/panel/docs.
6. Run targeted tests.
7. Run full verification.
8. Sync to prod only after local verification.
9. Commit/tag/release.
```

Do **not** implement a crop model slice directly from chat context. If the work is not written here or in a linked design doc, write it first.

---

## 1. Current baseline as of v1.9.58

| Area | Current state | Gap |
|---|---|---|
| Crop-specific survey metrics | Tomato G-Index metrics and lettuce L-Index metrics are separated; `metrics_json` is source of truth | Need quality/disorder fields, stage label validation, and survey form guidance |
| Feature source snapshots | `crop_model_feature_snapshots` exists and links to training rows via `feature_snapshot_id` | Need richer environment/irrigation feature calculations and stale-data logic |
| 7-day prediction baseline | `hybrid_rule_score_v1` predicts `predictedStage7d` and `transitionWindow` | Need actual next-survey validation and error scoring |
| Input completeness | `inputCompleteness` and `sourceStatus` exist | Need per-feature missing ratios and time-series readiness thresholds based on actual data |
| Panel | Read-only trainable baseline and model input source cards exist | Need validation status, data collection guidance, and operator next actions |
| Prod | v1.9.58 deployed and DB schema verified | Future slices must keep prod verification mandatory |

---

## 2. Vertical slice map

A **Slice** is not a layer-by-layer task. Every slice is a vertical, feature-complete increment. A slice is incomplete unless it covers all required layers for that feature:

```text
DB/schema + backend helper/model logic + HTTP API + Panel UI + contract tests + docs + local verification + prod verification + tag/release
```

| Slice | Version | Feature capability | DB | Backend/API | Panel UI | Tests/docs | Must not do |
|---|---:|---|---|---|---|---|---|
| Slice 1 | v1.9.59 | Prediction → actual validation loop | validation index/fields | validation helper + API | validation status card/run action | RED contract + plan update | Do not train ML yet |
| Slice 2 | v1.9.61 | Crop quality/disorder survey inputs | metrics_json only | normalization/model feature wiring | crop-specific form fields | contract + docs | Do not overload legacy columns |
| Slice 3 | v1.9.62 | Rich environment feature engineering | no active-control schema | VPD/DIF/ADT/stale summaries API | read-only source evidence | contract + docs | Do not control environment devices |
| Slice 4 | v1.9.63 | Rich irrigation/nutrient feature engineering | no execution schema | EC/pH/drain/dryback feature API | read-only source evidence | contract + docs | Do not execute irrigation control |
| Slice 5 | v1.9.64 | Pest/control/PHI/REI feature depth | PHI/REI if missing | risk/freshness feature API | review guidance | contract + docs | Do not bypass Safety/Interlock |
| Slice 6 | v1.9.65 | Transparent stage prediction score | score snapshot if needed | score components | score explanation | contract + docs | Do not hide formula in opaque code |
| Slice 7 | v1.9.66 | Dataset export/readiness | reuse snapshots | training dataset API | export/readiness evidence | contract + docs | Do not auto-replace production model |
| Slice 8 | v1.9.67 | Panel operator workflow | no unnecessary schema | existing APIs | next-action workflow UI | contract + docs | Do not add execution authority |

Vertical-slice implementation rule:

```text
Do not mark any slice complete because only DB, only API, or only UI exists. The user-facing feature must be usable end-to-end in the panel and backed by persisted data/API/tests.
```

---

# Slice 1 — v1.9.59 Prediction Validation Loop

## v1.10.14 Ordered Crop Stage Model steps correction

This correction release follows the user-requested order instead of treating steps 1~5 as one bundle:

```text
1단계 생육단계 예측 모델
2단계 작물별 stage rule
3단계 feature snapshot
4단계 prediction row 저장
5단계 정확히 7일 차 validation loop
```

Required implementation evidence:

- `trainableBaseline.pipelineSteps` exposes steps `[1, 2, 3, 4, 5]` in that exact order.
- Step 1 output is the real `stagePrediction7d` payload.
- Step 2 uses crop-specific stage defaults when no DB calibration override exists.
- Step 3 confirms feature snapshot groups are connected to the prediction evidence.
- Step 4 declares `crop_model_training_snapshots` persistence fields before validation.
- Step 5 keeps exact 7-day survey validation, nearest survey fallback 금지, and `exact_7_day_survey_missing` review status.
- 생육상태 진단, 리스크 예측, 수확량 예측 본체는 this correction release 범위가 아니다.

## Objective

When a new weekly growth survey is entered, previous pending 7-day prediction rows should be matched against the actual survey and updated with validation labels.

## Product behavior

```text
1. Operator records weekly growth survey.
2. System finds pending crop_model_training_snapshots whose predicted_for_date is due.
3. System validates a 7-day prediction only against the 7-day-after growth survey data.
4. System derives actual stage from that 7-day-after survey/stage diagnosis.
5. System writes actual_validation_json.
6. validation_status changes from pending to validated or validation_needs_review according to a documented validation policy.
7. Panel shows prediction validation status read-only.
```

Confirmed validation cadence:

```text
Growth surveys are intended once per week; the 7-day model exists because validation should use the 7-day-after survey.
```

Open validation-policy point resolved:

```text
If the exact 7-day-after survey is missing, do not choose nearest survey.
Set validation_status to validation_needs_review and store reviewReason exact_7_day_survey_missing.
```

## Files

- Modify: `custom_components/green_smart/db.py`
- Modify: `custom_components/green_smart/crop_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `custom_components/green_smart/manifest.json`
- Modify: `custom_components/green_smart/central_views.py`
- Create: `tests/test_crop_prediction_validation_contract.py`
- Modify: `docs/plans/2026-06-23-crop-model-design-decisions.md`

## DB work

`crop_model_training_snapshots` already has:

```text
actual_validation_json
actual_survey_id
validation_status
predicted_for_date
```

Slice 1 must add helper/index support if missing:

```text
idx_crop_model_training_validation_due(predicted_for_date, validation_status, season_id)
```

If adding index is risky in `_ensure_column`, use table definition marker contract first and explicit prod verification.

## Backend API/helper work

Add/complete:

```python
_pending_crop_prediction_snapshots(...)
_actual_stage_label_from_growth_survey(...)
_validate_pending_crop_training_snapshots(...)
CropModelPredictionValidationView
```

API:

```http
GET  /api/green_smart/crop/seasons/{season_id}/prediction-validations
POST /api/green_smart/crop/seasons/{season_id}/prediction-validations/run
```

Response shape:

```json
{
  "ok": true,
  "seasonId": 1,
  "validatedCount": 0,
  "needsReviewCount": 0,
  "pendingCount": 0,
  "validationRows": [
    {
      "snapshotId": 1,
      "sourceSurveyId": 10,
      "actualSurveyId": 11,
      "predictedForDate": "2026-07-01",
      "predictedStage7d": {},
      "actualStage": {},
      "stageMatched": true,
      "transitionTimingErrorDays": 0,
      "validationStatus": "validated"
    }
  ]
}
```

## Panel work

Add read-only section under trainable baseline card:

```text
예측 검증 상태
pending / validated / needs review
최근 실제 조사와 비교 결과
```

Required markers:

```text
data-crop-prediction-validation-card
data-crop-prediction-validation-status
data-crop-prediction-validation-run
```

The run button is allowed only as a data-processing action; it must not execute devices or control environment/irrigation/device.

## Contract tests

Create `tests/test_crop_prediction_validation_contract.py` with tests for:

1. DB markers: `actual_validation_json`, `actual_survey_id`, `validation_status`, validation-due index.
2. Helper markers: `_pending_crop_prediction_snapshots`, `_actual_stage_label_from_growth_survey`, `_validate_pending_crop_training_snapshots`.
3. API markers: `CropModelPredictionValidationView`, route registration.
4. Panel markers: validation card/status/run button.
5. Version markers: `1.9.59`.

## Verification commands

Targeted:

```bash
pytest -q tests/test_crop_prediction_validation_contract.py -q
```

Full:

```bash
pytest -q
python3 -m py_compile custom_components/green_smart/db.py custom_components/green_smart/crop_views.py custom_components/green_smart/central_views.py custom_components/green_smart/zone_control_views.py
node --check custom_components/green_smart/panel/green-smart-panel.js
git diff --check
```

Prod:

```bash
docker cp /home/smartfarm/green_smart/custom_components/green_smart/. greenity-prod-homeassistant:/config/custom_components/green_smart/
docker exec greenity-prod-homeassistant python -m homeassistant --script check_config -c /config
docker restart greenity-prod-homeassistant
```

DB verification:

```sql
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA='homeassistant'
  AND TABLE_NAME='crop_model_training_snapshots'
  AND COLUMN_NAME IN ('actual_validation_json','actual_survey_id','validation_status');
```

## Definition of done

- `v1.9.59` version markers updated.
- Contract tests pass.
- Full local verification passes.
- Prod HA config check and restart pass.
- GitHub tag/release exists.

---

# Slice 2 — v1.9.61 Crop Quality/Disorder Survey Inputs

## Objective

Add crop-specific quality/disorder survey metrics so the crop model can diagnose crop state and risks beyond growth size.

## Tomato metrics

Add canonical `metrics_json` keys:

```text
fruitSetRate
fruitCrackingCount
blossomEndRotCount
leafCurlScore
vigorScore
spadValue
```

## Lettuce metrics

Add canonical `metrics_json` keys:

```text
tipburnScore
boltingRiskScore
leafColorScore
spadValue
marketableWeight
outerLeafDamageScore
```

## Vertical-slice scope

Slice 2 is feature-complete only when the operator can enter crop-specific quality/disorder metrics in the panel, the backend normalizes and stores those values in `growth_surveys.metrics_json`, the model feature snapshot exposes them as first-class quality/disorder evidence, contract tests cover the behavior, production HA is verified, and `v1.9.60` is released.

## Files

- Modify: `custom_components/green_smart/crop_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `custom_components/green_smart/manifest.json`
- Modify: `custom_components/green_smart/central_views.py`
- Create: `tests/test_crop_quality_disorder_metrics_contract.py`
- Modify: `docs/plans/2026-06-23-crop-model-design-decisions.md`

## DB/API/backend work

DB schema remains unchanged: quality/disorder metrics are stored only in `growth_surveys.metrics_json`.

Required backend markers:

```python
CROP_QUALITY_DISORDER_METRICS_VERSION = "crop_quality_disorder_metrics_v1"
CROP_QUALITY_DISORDER_METRIC_KEYS = {...}
_crop_quality_disorder_metrics_from_growth(...)
```

Required model feature shape:

```json
{
  "qualityDisorderSummary": {
    "version": "crop_quality_disorder_metrics_v1",
    "cropType": "tomato|lettuce",
    "metrics": {},
    "riskFlags": [],
    "missingMetrics": []
  }
}
```

This object must be included in:

```text
featureSnapshot.growthSurvey.qualityDisorderSummary
featureSnapshot.qualityDisorderSummary
trainableBaseline.qualityDisorderSummary
```

## Panel work

Panel must render crop-specific quality/disorder inputs only for supported crops.

Required UI markers:

```text
data-growth-quality-disorder-section
qualityDisorderSummary
fruitSetRate
blossomEndRotCount
tipburnScore
boltingRiskScore
marketableWeight
```

Tomato quality/disorder fields:

```text
fruitSetRate
fruitCrackingCount
blossomEndRotCount
leafCurlScore
vigorScore
spadValue
```

Lettuce quality/disorder fields:

```text
tipburnScore
boltingRiskScore
leafColorScore
spadValue
marketableWeight
outerLeafDamageScore
```

## Acceptance criteria

- New quality/disorder fields are rendered only for relevant crop type.
- Stored in `metrics_json` only.
- Not mapped into legacy columns: `height`, `leafCount`, `stemDia`, `truss`, or `node`.
- Included in `featureSnapshot.growthSurvey.qualityDisorderSummary`, `featureSnapshot.qualityDisorderSummary`, and `trainableBaseline.qualityDisorderSummary`.
- Risk flags are derived transparently from recorded metrics, e.g. tomato blossom-end rot/cracking and lettuce tipburn/bolting.
- `v1.9.61` version markers are updated and verified in local/prod.

---

# Slice 3 — v1.9.62 Rich Environment Feature Engineering

## Objective

Make environment feature sources useful for the crop model, not just count-based summaries.

## Vertical-slice scope

Slice 3 is feature-complete only when environment model inputs are enriched end-to-end: `sensor_readings` are summarized into crop-model-ready derived features, the feature-source API and growth report expose those features, the panel shows read-only environment feature evidence, contract tests cover the behavior, production HA is verified, and `v1.9.62` is released.

## Required features

```text
avg/min/max temperature
night/day temperature split if timestamps allow
humidity avg/min/max
CO2 avg/min/max
radiation/light sum and average
VPD avg/min/max where readings exist
ADT/DIF derived or marked missing
stale sensor flag
sample coverage ratio
```

## Files

- Modify: `custom_components/green_smart/crop_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `custom_components/green_smart/manifest.json`
- Modify: `custom_components/green_smart/central_views.py`
- Create: `tests/test_crop_environment_features_contract.py`
- Modify: `docs/plans/2026-06-23-crop-model-design-decisions.md`

## Backend/API work

Required backend markers:

```python
CROP_ENVIRONMENT_FEATURES_VERSION = "crop_environment_features_v1"
_crop_environment_stats_by_type(...)
_crop_environment_vpd_from_temp_humidity(...)
_crop_environment_derived_features(...)
_environment_feature_summary(...)
```

Required `environmentSummary7d` shape:

```json
{
  "version": "crop_environment_features_v1",
  "sourceTables": ["sensor_readings"],
  "windowDays": 7,
  "features": {
    "temperature": {"avg": 0, "min": 0, "max": 0, "sampleCount": 0},
    "humidity": {"avg": 0, "min": 0, "max": 0, "sampleCount": 0},
    "co2": {"avg": 0, "min": 0, "max": 0, "sampleCount": 0},
    "radiation": {"avg": 0, "min": 0, "max": 0, "sum": 0, "sampleCount": 0},
    "vpd": {"avg": 0, "min": 0, "max": 0, "derived": true},
    "adt": {"value": 0, "derived": true},
    "dif": {"value": 0, "derived": true}
  },
  "derivedFeatures": {},
  "stale": false,
  "staleReasons": [],
  "sampleCoverageRatio": 0.0,
  "missing": [],
  "sourceStatus": "ready|partial|missing|stale"
}
```

No DB schema change is required for Slice 3; it reads existing `sensor_readings` only.

## Panel work

Panel must keep environment features read-only model evidence. Required UI markers/text:

```text
data-crop-environment-features-card
환경 feature
VPD
ADT
DIF
sampleCoverageRatio
staleReasons
```

## Acceptance criteria

- `environmentSummary7d` includes derived feature names and missing/stale reasons.
- VPD is read from `sensor_readings` when available or derived from temperature/humidity when possible.
- ADT uses average temperature; DIF uses day/night temperature split where timestamps allow, otherwise records a missing/stale reason.
- Sample coverage ratio is explicit and drives `ready|partial|missing|stale` source status.
- No environment device execution.
- Panel remains read-only.
- `v1.9.62` version markers are updated and verified in local/prod.

---

# Slice 4 — v1.9.63 Rich Irrigation/Nutrient Feature Engineering

## Objective

Make irrigation/nutrient feature source usable for crop growth-stage and stress prediction.

## Vertical-slice scope

Slice 4 is feature-complete only when irrigation/nutrient model inputs are enriched end-to-end: `irrigation_drain_feedback`, `irrigation_control_logs`, and `irrigation_settings` are summarized into model-ready EC/pH/drain/dryback features, the feature-source API and growth report expose those features, the panel shows read-only irrigation/nutrient feature evidence, contract tests cover the behavior, production HA is verified, and `v1.9.63` is released.

## Required features

```text
feedEcAvg
feedPhAvg
drainEcAvg
drainPhAvg
ecDeltaFeedDrain
phDeltaFeedDrain
irrigationAmountTotal
irrigationEventCount
drainRateAvg
drybackProxy
errorCount
staleDrainFeedback
```

## Files

- Modify: `custom_components/green_smart/crop_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `custom_components/green_smart/manifest.json`
- Modify: `custom_components/green_smart/central_views.py`
- Create: `tests/test_crop_irrigation_nutrient_features_contract.py`
- Modify: `docs/plans/2026-06-23-crop-model-design-decisions.md`

## Backend/API work

Required backend markers:

```python
CROP_IRRIGATION_NUTRIENT_FEATURES_VERSION = "crop_irrigation_nutrient_features_v1"
_crop_irrigation_number(...)
_crop_irrigation_nutrient_derived_features(...)
_irrigation_nutrient_feature_summary(...)
```

Required `irrigationNutrientSummary7d` shape:

```json
{
  "version": "crop_irrigation_nutrient_features_v1",
  "sourceTables": ["irrigation_drain_feedback", "irrigation_control_logs", "irrigation_settings"],
  "windowDays": 7,
  "features": {
    "feedEcAvg": 0,
    "feedPhAvg": 0,
    "drainEcAvg": 0,
    "drainPhAvg": 0,
    "ecDeltaFeedDrain": 0,
    "phDeltaFeedDrain": 0,
    "irrigationAmountTotal": 0,
    "irrigationEventCount": 0,
    "drainRateAvg": 0,
    "drybackProxy": 0,
    "errorCount": 0,
    "staleDrainFeedback": false
  },
  "derivedFeatures": {},
  "staleReasons": [],
  "missing": [],
  "sourceStatus": "ready|partial|missing|stale"
}
```

No DB schema change is required for Slice 4; it reads existing irrigation feedback/control/settings tables only.

## Panel work

Panel must keep irrigation/nutrient features read-only model evidence. Required UI markers/text:

```text
data-crop-irrigation-nutrient-features-card
관수/양액 feature
feedEcAvg
drainEcAvg
ecDeltaFeedDrain
phDeltaFeedDrain
drybackProxy
staleDrainFeedback
```

## Acceptance criteria

- Derived features are included in `irrigationNutrientSummary7d`.
- Feed/drain EC/pH deltas are explicit and null-safe.
- Irrigation amount, event count, drain rate, dryback proxy, error count, and stale drain feedback are explicit.
- No active irrigation control or PID execution.
- Panel remains read-only.
- `v1.9.63` version markers are updated and verified in local/prod.

---

# Slice 5 — v1.9.64 Pest/Control/PHI/REI Feature Depth

## Objective

Improve pest/control features so disease/risk prediction can use real safety and freshness signals.

## Vertical-slice scope

Slice 5 is feature-complete only when pest/control model inputs are enriched end-to-end: `pest_surveys`, `control_records`, and `control_pesticides` persist PHI/REI evidence, summarize disease/control freshness and safety risks, expose those features through feature-source API and growth report, show read-only panel evidence, verify production HA, and release `v1.9.64`.

## Required features

```text
recentPestSeverityTrend
maxSeverity7d
controlFreshnessDays
plsNonCompliantCount
mixForbiddenCount
mixUnknownCount
phiRiskFlag
reiRiskFlag
missingControlAfterHighRiskFlag
```

## Files

- Modify: `custom_components/green_smart/db.py` for PHI/REI columns.
- Modify: `custom_components/green_smart/crop_views.py`
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`
- Modify: `custom_components/green_smart/manifest.json`
- Modify: `custom_components/green_smart/central_views.py`
- Create: `tests/test_crop_pest_control_features_contract.py`
- Modify: `docs/plans/2026-06-23-crop-model-design-decisions.md`

## Backend/API work

Required DB columns:

```sql
control_pesticides.phi_days INT NULL
control_pesticides.rei_hours INT NULL
```

Required backend markers:

```python
CROP_PEST_CONTROL_FEATURES_VERSION = "crop_pest_control_features_v1"
_crop_pest_number(...)
_crop_pest_control_derived_features(...)
_pest_control_feature_summary(...)
```

Required `pestControlSummary7d` shape:

```json
{
  "version": "crop_pest_control_features_v1",
  "sourceTables": ["pest_surveys", "control_records", "control_pesticides"],
  "windowDays": 7,
  "features": {
    "recentPestSeverityTrend": 0,
    "maxSeverity7d": 0,
    "controlFreshnessDays": 0,
    "plsNonCompliantCount": 0,
    "mixForbiddenCount": 0,
    "mixUnknownCount": 0,
    "phiRiskFlag": false,
    "reiRiskFlag": false,
    "missingControlAfterHighRiskFlag": false
  },
  "riskFlags": {},
  "reviewGuidance": [],
  "staleReasons": [],
  "sourceStatus": "ready|partial|missing|stale"
}
```

## Panel work

Panel must keep pest/control features read-only model evidence. Required UI markers/text:

```text
data-crop-pest-control-features-card
병해/방제 feature
recentPestSeverityTrend
controlFreshnessDays
phiRiskFlag
reiRiskFlag
missingControlAfterHighRiskFlag
reviewGuidance
```

## Acceptance criteria

- PHI/REI are persisted on control pesticide entries and included in list/create responses.
- Derived features are included in `pestControlSummary7d`.
- High pest risk plus missing/stale control records surfaces review guidance.
- Edge Safety/Interlock remains authority; no pesticide/control execution is added.
- Panel remains read-only.
- `v1.9.64` version markers are updated and verified in local/prod.

---

# Slice 6 — v1.9.65 Transparent Stage Prediction Score + KMA Weather Stress Inputs

## Objective

Replace vague probability logic with transparent numeric score components, and include KMA 7-day weather stress inputs that were missing from crop model scoring.

## User-corrected requirements

- Do **not** output confidence as `low|medium|high`.
- Confidence must be numeric, e.g. `confidenceScore` in the `0.0..1.0` range and optionally `confidencePercent` for UI.
- KMA/기상청 7-day weather forecast stress must be first-class model input, not only weather-card UI data.
- Required weather-stress inputs:

```text
highTemperatureDays
lowTemperatureDays
highHumidityDays
lowHumidityDays
rapidTemperatureChangeDays
maxDailyTemperatureSwing
avgDailyTemperatureSwing
kmaForecastCoverageRatio
weatherStressReasons
```

## Required score components

```text
growthIndexBandScore
weeklyDeltaScore
environmentStressScore
kmaWeatherStressScore
irrigationNutrientStressScore
pestControlRiskPenalty
inputCompletenessPenalty
stageCalibrationScore
```

## Required KMA source integration

Use the existing KMA weather stack as input source where available:

```text
weather_api.py / weather_views.py
GET /api/green_smart/weather/weekly
POST /api/green_smart/central/weather/forecast
POST /api/green_smart/central/weather/mid
```

The crop model feature snapshot must expose a read-only weather stress payload, for example:

```json
{
  "kmaWeatherStress7d": {
    "source": "kma_short_mid_forecast",
    "windowDays": 7,
    "features": {
      "highTemperatureDays": 0,
      "lowTemperatureDays": 0,
      "highHumidityDays": 0,
      "lowHumidityDays": 0,
      "rapidTemperatureChangeDays": 0,
      "maxDailyTemperatureSwing": 0.0,
      "avgDailyTemperatureSwing": 0.0,
      "kmaForecastCoverageRatio": 0.0
    },
    "weatherStressReasons": [],
    "sourceStatus": "ready|partial|missing|stale"
  }
}
```

## Output shape

```json
{
  "scoreComponents": {},
  "rawScore": 0.0,
  "probability": 0.0,
  "confidenceScore": 0.0,
  "confidencePercent": 0,
  "explanation": []
}
```

## Acceptance criteria

- Every probability has visible components.
- No black-box model hidden behind a single number.
- Confidence is numeric only; no `low|medium|high` confidence output.
- KMA 7-day high/low temperature, high/low humidity, and rapid temperature-change signals are included in the score inputs.
- Missing KMA data lowers `confidenceScore` and adds explicit missing/stale reasons.
- Tests assert score component names and KMA weather stress feature names.

---

# Slice 7 — v1.9.66 Dataset Export and ML Readiness

## Objective

Expose auditable training dataset rows for offline/future ML work while keeping the production model unchanged.

## Product behavior

```text
1. Operator opens the crop growth report.
2. Panel shows training dataset export/readiness evidence read-only.
3. API exposes rows built from persisted feature_snapshot_id, feature snapshot JSON, prediction JSON, and actual_validation_json.
4. Readiness summarizes whether enough validated rows and feature coverage exist for offline model experimentation.
5. The system never trains, auto-deploys, or replaces the production hybrid model from this export.
```

## API

```http
GET /api/green_smart/crop/seasons/{season_id}/training-dataset
```

## Output

```json
{
  "ok": true,
  "seasonId": 1,
  "trainingDatasetVersion": "crop_training_dataset_export_v1",
  "rows": [],
  "featureColumns": [],
  "labelColumns": [],
  "readiness": {
    "ready": false,
    "validatedRows": 0,
    "minimumValidatedRows": 30,
    "featureCoverageRatio": 0.0,
    "reasons": ["readiness.reasons"]
  },
  "exportWarnings": ["no automatic ML deployment"]
}
```

## Backend/API work

Add/complete:

```python
CROP_TRAINING_DATASET_EXPORT_VERSION = "crop_training_dataset_export_v1"
_crop_training_dataset_feature_columns(...)
_crop_training_dataset_label_columns(...)
_crop_training_dataset_readiness(...)
_crop_training_dataset_rows(...)
_crop_training_dataset_response(...)
CropModelTrainingDatasetView
```

The SQL must include persisted links/evidence:

```sql
feature_snapshot_id AS featureSnapshotId
feature_snapshot_json AS featureSnapshot
prediction_json AS prediction
actual_validation_json AS actualValidation
validation_status AS validationStatus
```

## Panel work

Add read-only evidence under model development cards:

```text
data-crop-training-dataset-export-card
학습 데이터셋 내보내기 준비도
trainingDatasetVersion
featureColumns
labelColumns
exportWarnings
자동 학습/배포 없음
```

Forbidden markers / behavior:

```text
data-crop-training-dataset-train
autoDeployCropMlModel
replaceProductionModelFromDataset
```

## Acceptance criteria

- Does not train or deploy ML automatically.
- Exports feature snapshot + prediction + actual validation as rows.
- Shows readiness reasons (`readiness.reasons`).
- Rows are auditable back to `feature_snapshot_id` and validation labels.
- Tests assert API registration, backend export shape, panel read-only evidence, docs, and version markers.

---

# Slice 8 — v1.9.67 Panel Operator Workflow

## Objective

Make the model development state understandable to a non-technical farm owner/staff user without adding execution authority.

## Product behavior

```text
1. Operator opens the growth report.
2. A single read-only workflow card summarizes what is complete, what is missing, what to check next survey, what the previous validation says, and whether time-series expansion is possible.
3. The card uses Korean operational labels for farm owners/staff who are not crop-model or software specialists.
4. The workflow must not become one more disconnected technical card. It should be the primary operator summary and should reuse/summarize existing prediction, KMA, validation, dataset, and readiness cards as detailed evidence.
5. Existing technical cards may remain only as `상세 근거`/audit evidence, or may be removed if their content is fully absorbed into the operator workflow.
6. The UI must remain mobile and PC responsive: mobile should stack the operator steps vertically with large touch targets, while PC can use a compact multi-column summary grid.
7. The card does not provide environment/irrigation/device execution, model training, or production model replacement controls.
```

## Backend/API work

Add/complete:

```python
CROP_OPERATOR_WORKFLOW_VERSION = "crop_operator_workflow_v1"
_crop_operator_workflow_response(...)
CropModelOperatorWorkflowView
```

API:

```http
GET /api/green_smart/crop/seasons/{season_id}/operator-workflow
```

Response shape:

```json
{
  "ok": true,
  "seasonId": 1,
  "operatorWorkflowVersion": "crop_operator_workflow_v1",
  "weeklyInputStatus": {},
  "missingInputs": [],
  "nextSurveyChecklist": [],
  "lastValidationSummary": {},
  "timeSeriesReadiness": {},
  "operatorWarnings": ["read-only workflow; no device execution"]
}
```

## Panel UI sections

```text
1. 이번 주 입력 완료 여부
2. 부족한 입력
3. 다음 생육조사 때 확인할 것
4. 지난 예측 검증 결과
5. 시계열 모델 확장 가능 여부
```

Required markers:

```text
data-crop-operator-workflow-card
data-crop-operator-weekly-input-status
data-crop-operator-missing-inputs
data-crop-operator-next-survey-checklist
data-crop-operator-last-validation-summary
data-crop-operator-time-series-readiness
operatorWorkflowVersion
```

Forbidden markers / behavior:

```text
data-crop-operator-execute-device
data-crop-operator-train-model
data-crop-operator-replace-production-model
```

## Acceptance criteria

- Korean labels are operational, not developer jargon.
- Advanced technical JSON remains hidden or collapsed.
- Write/execute controls remain role-gated and non-device-executing.
- Operator workflow is exposed in the growth report response and via the read-only API.
- UI uses the existing mobile and PC responsive pattern (`display:grid; grid-template-columns:repeat(auto-fit,minmax(...))`) and avoids desktop-only layouts.
- Existing technical cards are not duplicated as another disconnected card; the operator workflow is the primary summary and technical cards remain only as detailed evidence.
- Tests assert docs, backend helper/API registration, panel markers, responsive UI markers, forbidden controls, and v1.9.67 version markers.

---

## 3. Work execution rule after this document

The next implementation must start with **Slice 1 / v1.9.59 Prediction Validation Loop**.

Do not proceed to Slice 2 until Slice 1 has:

```text
contract tests
implementation
full verification
prod verification
commit/tag/release
```

---

## 4. Current next action

Start Slice 1 now:

```text
v1.9.59 Prediction Validation Loop
```

First action:

```text
Create RED contract test: tests/test_crop_prediction_validation_contract.py
```
