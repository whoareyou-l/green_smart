# Crop Model Design Decisions — 2026-06-23

## Scope

Current implementation scope is **Crop only**. Environment, irrigation, device control, PID application, and physical execution are out of scope until the crop model design is confirmed and virtually verified.

## Confirmed decision 1 — model objective order

The crop model must be designed in this order:

1. **생육단계 예측** — predict current/next growth stage and stage transition timing.
2. **생육상태 진단** — diagnose whether the crop state is normal, vegetative, reproductive, stressed, weak, overgrown, etc.
3. **리스크 예측** — predict disease, physiological disorder, quality degradation, stale-data, and safety/interlock risks.
4. **수확량 예측** — predict harvest potential/yield after the above layers are reliable.

## Confirmed decision 2 — growth stage prediction horizon

The first model target, **생육단계 예측**, uses a **1-week prediction horizon**.

Reason:

- Growth surveys are normally performed once per week.
- A 1-week prediction can be checked against the next actual survey.
- This creates a measurable feedback loop: prediction → next survey → correct/incorrect → calibration.

Expected model behavior:

```text
latest growth survey + recent history
→ current stage diagnosis
→ 7-day stage transition probability / expected next stage
→ next weekly survey validates the prediction
```

## Implementation implication

Do not continue notification, alert resolution, or policy-delivery phases as the next major work. The next major work must define and implement the crop model input/output contract and formulas/algorithm plan for the objective order above.

Because the horizon is 1 week, the first model should support weekly validation records and should not start as an unbounded 작기 전체 forecast. Time-series techniques can be considered only if enough sequential weekly data exists; otherwise begin with a transparent hybrid rule/score model that can later feed LSTM or other sequence models.

## Confirmed decision 3 — crop input scope for 1-week growth stage prediction

For both tomato and lettuce, the 1-week growth stage prediction model uses **all crop-related history** as candidate inputs.

Input groups:

1. Growth survey inputs
   - Tomato: plant height, leaf count, stem diameter, flower cluster number, fruit set node/evidence, weekly deltas.
   - Lettuce: leaf length, leaf width, leaf count, fresh weight, plant height, weekly deltas.

2. Environment summary inputs
   - temperature summary
   - humidity summary
   - CO2 summary
   - radiation/light summary
   - VPD / ADT / DIF where available

3. Irrigation/nutrient solution inputs
   - feed EC / drain EC
   - feed pH / drain pH
   - irrigation amount
   - drain amount / drain rate
   - dryback

4. Pest/control/safety inputs
   - pest survey history
   - disease/pest severity trend
   - pesticide/control record freshness
   - PLS/mix/PHI/REI status where relevant

5. Quality/disorder inputs
   - Tomato: fruit set, cracking, blossom-end rot, vigor/status notes where available.
   - Lettuce: tipburn, bolting signs, leaf color/SPAD, harvest quality notes where available.

6. Prediction feedback inputs
   - previous weekly prediction
   - next survey actual result
   - prediction correct/incorrect label
   - calibration notes

Boundary:

- These are **model inputs only**.
- This decision does not authorize environment/irrigation/device control or PID execution.
- Edge Safety/Interlock remains the execution authority.

## Confirmed decision 4 — growth stage prediction output shape

The growth stage prediction output uses:

```text
7-day single prediction + transition window
```

The model does **not** start with daily day1~day7 stage labels. It predicts the most likely stage after 7 days and provides the expected transition window.

Required output fields:

```json
{
  "modelTarget": "growth_stage_prediction_7d",
  "currentStage": {
    "stageId": "...",
    "stageLabel": "...",
    "confidenceScore": 0.0,
    "confidencePercent": 0,
    "progressScore": 0.0
  },
  "predictedStage7d": {
    "stageId": "...",
    "stageLabel": "...",
    "probability": 0.0,
    "confidenceScore": 0.0,
    "confidencePercent": 0
  },
  "transitionWindow": {
    "earliestDay": 0,
    "latestDay": 7,
    "probability": 0.0,
    "label": "..."
  },
  "stageEvidence": {},
  "missingInputs": [],
  "nextSurveyNeeded": [],
  "modelReason": "..."
}
```

Reason:

- Weekly growth surveys provide a natural validation point.
- A single 7-day prediction is easy to compare with the next survey.
- The transition window keeps useful timing information without pretending to have daily label accuracy.
- This can later be expanded into daily forecasts or LSTM/sequence models if enough labeled time-series data exists.

## Confirmed decision 5 — algorithm family and automatic upgrade path

The growth stage 1-week prediction model uses a **staged approach**:

```text
initial model: hybrid rule + score/probability model
future model: time-series ML such as LSTM/GRU/Transformer when readiness conditions are met
```

Important requirement:

The project must **not** rely on a vague future reminder to add LSTM/time-series modeling. The initial implementation must include automatic readiness checks and an explicit upgrade trigger.

Initial hybrid model:

- deterministic growth-stage rules
- crop-specific G-Index/L-Index
- weekly delta features
- environment summary features
- irrigation/nutrient summary features
- pest/control/quality risk features
- transparent score/probability calculation
- explanation/evidence output

Automatic time-series upgrade readiness conditions:

1. Enough sequential weekly labels
   - at least 8 consecutive weekly growth surveys for the same crop/zone/season as minimum candidate
   - 12+ weekly surveys preferred for stable training

2. Input completeness
   - growth survey core fields available for at least 80% of weeks
   - environment summaries available for at least 80% of weeks
   - irrigation/nutrient summaries available for at least 60% of weeks

3. Validation feedback exists
   - previous `predictedStage7d` can be compared with actual next survey stage
   - at least 5 prediction→actual validation pairs before suggesting ML training

4. Label quality
   - current/actual stage labels are not mostly `unknown`
   - missing critical inputs are below threshold

Required initial outputs for upgrade tracking:

```json
{
  "modelFamily": "hybrid_rule_score_v1",
  "mlUpgradeReadiness": {
    "ready": false,
    "candidateModelFamilies": ["lstm", "gru", "temporal_transformer"],
    "reasons": [],
    "requiredData": {},
    "currentData": {},
    "nextAction": "collect_more_weekly_surveys"
  }
}
```

When readiness becomes true:

- create an audit/backlog marker that time-series model training is available
- surface a read-only UI notice: `시계열 모델 확장 가능`
- do not automatically replace the production model without operator/admin approval
- Edge Safety/Interlock remains the execution authority

## Confirmed decision 6 — crop model separation strategy

Tomato and lettuce use a:

```text
common model framework + crop-specific formula/rule modules
```

Common framework:

- input collection pipeline
- 1-week prediction output shape
- confidence calculation structure
- prediction validation record
- ML/time-series readiness check
- Center/Edge boundary and read-only UI contract

Crop-specific modules:

- Tomato
  - G-Index formula
  - tomato growth-stage definitions
  - tomato stage transition rules
  - tomato evidence/missing input mapping

- Lettuce
  - L-Index formula
  - lettuce growth-stage definitions
  - lettuce stage transition rules
  - lettuce evidence/missing input mapping

Rejected alternatives:

- A single unified model with only `cropType` as a feature is too likely to hide crop-specific physiology.
- Completely separate implementations would duplicate infrastructure and make validation/upgrade tracking harder.

## Confirmed decision 7 — current historical data availability

Current historical data availability is:

```text
almost none; growth survey, environment, irrigation/nutrient data must be collected from now on
```

Implementation implications:

- Do not start with LSTM/GRU/Transformer training.
- The initial model must be a transparent hybrid rule/score baseline.
- The system must persist every weekly prediction so it can be validated against the next actual growth survey.
- Data collection must be treated as part of the model product, not an afterthought.
- ML/time-series readiness should remain false until enough weekly sequences and validation labels exist.

Required initial implementation pieces:

1. Growth survey crop-specific metrics
2. Environment summary capture for the matching weekly window
3. Irrigation/nutrient summary capture for the matching weekly window
4. 7-day growth stage prediction record
5. Next-survey actual stage validation
6. Readiness check for future time-series model expansion

## Confirmed decision 8 — true crop baseline is a trainable data baseline

The true Crop baseline is **not** just a rule-based preview. It must create the data foundation needed to train future models.

Baseline definition:

```text
crop baseline = trainable dataset pipeline + transparent initial predictor + weekly validation loop
```

The initial baseline must persist:

1. **Feature snapshot**
   - growth survey features
   - G-Index/L-Index values
   - weekly deltas
   - environment 7-day summary
   - irrigation/nutrient 7-day summary
   - pest/control/quality/safety features

2. **Prediction label candidate**
   - current stage
   - predicted stage after 7 days
   - transition probability
   - transition window
   - numeric confidence score/percent
   - model reason/evidence

3. **Actual validation label**
   - next weekly survey date
   - actual stage from the next survey
   - whether the prediction was correct
   - transition timing error
   - notes/calibration feedback

4. **Training-readiness metadata**
   - sequence length per crop/zone/season
   - missing feature ratios
   - number of prediction→actual validation pairs
   - ML/time-series readiness status

Implementation implication:

- Even before LSTM/GRU/Transformer is available, every weekly prediction must become a row in a future training dataset.
- The hybrid rule/score model is the first label generator and benchmark baseline.
- Future ML models must be compared against this baseline, not replace it blindly.

## Open questions — ask one at a time

- Center vs Edge computation boundary.
- Fallback when inputs are missing/stale.

## Confirmed decision 9 — crop model feature sources must be first-class inputs

The crop model must not treat growth survey metrics as the only model input. Growth survey metrics are the primary weekly label/observation source, but the 1-week crop model also needs first-class feature sources from environment, irrigation/nutrient, pest/control, operation history, and Safety/Interlock/Approval state.

Implementation implication:

- Add `crop_model_feature_snapshots` as a dedicated model input snapshot table.
- Persist `environment_summary_json` from `sensor_readings`.
- Persist `irrigation_nutrient_summary_json` from `irrigation_drain_feedback`, `irrigation_control_logs`, and `irrigation_settings`.
- Persist `pest_control_summary_json` from `pest_surveys`, `control_records`, and `control_pesticides`.
- Persist `operation_history_summary_json` from `audit_logs` and operator/control history where available.
- Persist `safety_interlock_summary_json` from crop safety/interlock/approval state.
- Persist `input_completeness_json` so hybrid baseline and future time-series training know whether the feature set is usable.

API implication:

```text
GET/POST /api/green_smart/crop/seasons/{season_id}/model-feature-sources
```

Training implication:

`crop_model_training_snapshots.feature_snapshot_id` links each 7-day prediction candidate to the exact feature-source snapshot used to generate it. This prevents the model dataset from becoming a growth-survey-only dataset and makes prediction → actual validation auditable.

## Confirmed decision 10 — crop quality/disorder survey metrics

Crop model inputs must include crop-specific quality and physiological disorder metrics, not only growth-size metrics.

Tomato quality/disorder metrics stored in `metrics_json only`:

```text
fruitSetRate
fruitCrackingCount
blossomEndRotCount
leafCurlScore
vigorScore
spadValue
```

Lettuce quality/disorder metrics stored in `metrics_json only`:

```text
tipburnScore
boltingRiskScore
leafColorScore
spadValue
marketableWeight
outerLeafDamageScore
```

Implementation implication:

- Do not map these metrics into legacy columns (`height`, `leafCount`, `stemDia`, `truss`, `node`).
- Persist them only inside `growth_surveys.metrics_json`.
- Surface them as `qualityDisorderSummary` in the trainable feature snapshot.
- Use risk flags such as tomato blossom-end rot/cracking and lettuce tipburn/bolting as transparent model evidence, not as device execution authority.
- The panel must render the inputs only for crop types that define the corresponding quality/disorder metrics.

## Confirmed decision 11 — rich environment model features

Environment model inputs must be crop-model-ready derived features, not only raw sample counts.

Required `environmentSummary7d` features:

```text
temperature avg/min/max
humidity avg/min/max
CO2 avg/min/max
radiation/light avg/min/max/sum
VPD avg/min/max, read from sensor readings or derived from temperature/humidity
ADT derived from average temperature
DIF derived from day/night temperature split when timestamps allow
sampleCoverageRatio
stale/staleReasons
sourceStatus ready|partial|missing|stale
```

Implementation implication:

- Use existing `sensor_readings` only; do not add active environment control or device execution.
- Surface derived environment features as read-only model evidence in the crop model feature snapshot and panel.
- If readings are absent or stale, return explicit missing/stale reasons instead of pretending the feature exists.
- VPD/ADT/DIF are model evidence for crop prediction readiness; they do not grant environment/irrigation/device execution authority.

## Confirmed decision 12 — rich irrigation/nutrient model features

Irrigation/nutrient model inputs must expose crop-stress features, not only raw feedback/log counts.

Required `irrigationNutrientSummary7d` features:

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
sourceStatus ready|partial|missing|stale
```

Implementation implication:

- Use existing `irrigation_drain_feedback`, `irrigation_control_logs`, and `irrigation_settings` only; do not add active irrigation control, PID, or pump/fertigation execution.
- Surface EC/pH deltas, drain rate, irrigation amount, dryback proxy, error count, and stale feedback as read-only model evidence.
- If feedback/logs are absent or stale, return explicit missing/stale reasons instead of treating the source as ready.
- These features inform crop growth/stress prediction readiness; Edge Safety/Interlock and operator-approved control flows remain the only execution authority.

## Confirmed decision 13 — pest/control PHI/REI feature depth

Pest/control model inputs must expose safety and freshness evidence, not only pest/control record presence.

Required `pestControlSummary7d` features:

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
reviewGuidance
sourceStatus ready|partial|missing|stale
```

Implementation implication:

- Persist PHI/REI on `control_pesticides` as `phi_days` and `rei_hours` so downstream model/interlock evidence is not transient UI-only state.
- Use existing `pest_surveys`, `control_records`, and `control_pesticides` as the source of truth.
- Surface high pest severity, stale/missing control, PLS non-compliance, mix forbidden/unknown, PHI risk, and REI risk as read-only model evidence.
- If high pest risk lacks recent control, return explicit review guidance and missing/stale reasons.
- These features do not grant pesticide/control execution authority; Edge Safety/Interlock and operator approval remain the authority.

## Confirmed decision 14 — numeric confidence and KMA 7-day weather-stress inputs

Crop model confidence must be numeric and auditable, not a string label.

Required confidence fields:

```text
confidenceScore        # float 0.0..1.0
confidencePercent      # integer 0..100 for UI display
confidenceReasons      # explicit evidence/missing/stale reasons
```

Rejected output:

```text
confidence = "low|medium|high"
```

KMA/기상청 7-day forecast stress must be a first-class crop model input, not only weather-card UI data.

Required `kmaWeatherStress7d` features:

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
sourceStatus ready|partial|missing|stale
```

Source integration:

```text
weather_api.py / weather_views.py
GET /api/green_smart/weather/weekly
POST /api/green_smart/central/weather/forecast
POST /api/green_smart/central/weather/mid
```

Implementation implication:

- Add `kmaWeatherStress7d` to the crop model feature snapshot and transparent score inputs.
- Add `kmaWeatherStressScore` to transparent stage prediction score components.
- Missing/stale/partial KMA forecast data must reduce `confidenceScore` and add explicit reasons, rather than silently becoming normal weather.
- This is read-only crop model evidence only; it does not authorize environment, irrigation, device, PID, or physical execution.

## Confirmed decision 15 — training dataset export remains offline/read-only

The crop training dataset export is an auditable offline data product, not an automatic model-training or production replacement mechanism.

Required export fields:

```text
trainingDatasetVersion
feature_snapshot_id
featureColumns
labelColumns
actual_validation_json
readiness.reasons
exportWarnings
```

Implementation implication:

- Export rows must join persisted feature snapshot evidence, prediction JSON, validation labels, and readiness metadata.
- The API may expose `GET /api/green_smart/crop/seasons/{season_id}/training-dataset` for offline analysis and future ML preparation.
- The panel may show export/readiness evidence, but must say `no automatic ML deployment` / `자동 학습/배포 없음`.
- This slice must not train a model, auto-deploy a model, or replace the production hybrid rule model from exported rows.
