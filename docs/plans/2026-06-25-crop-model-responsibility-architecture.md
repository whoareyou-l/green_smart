# Crop Model Responsibility Architecture — 2026-06-25

> Status: confirmed design draft from user discussion.  
> Scope: Crop model architecture and responsibility boundaries.  
> Boundary: This document defines model responsibilities only. It does **not** authorize environment, irrigation, device, PID, physical execution, automatic ML training, or automatic deployment.

---

## 1. Core principle

Green Smart crop intelligence is separated into prediction, diagnosis, recommendation, target-calculation, safety, and execution layers.

```text
Prediction models create measured/forecast values.
Diagnosis model interprets the meaning of those values in crop/stage/environment context.
Recommendation model converts diagnosis signals into work/model requests.
Environment/irrigation models calculate target candidates from those requests.
Safety/Interlock/Approval decides whether target candidates may execute.
Execution layer only executes approved commands.
```

Important correction:

```text
생육부진, 생육정상, 회복 가능, 상태 악화 가능성, 스트레스 누적
```

are **not** direct outputs of the crop state prediction model. They belong to the integrated diagnosis model.

---

## 2. High-level crop intelligence pipeline

```text
[1] Growth Stage Prediction Model
    current/7-day growth stage prediction

[2] Growth State Prediction Model
    vegetative/generative balance direction prediction from all relevant data

[3] Risk Factor Prediction Model
    environment, irrigation/nutrient, pest/disease, operation risk prediction

[4] Integrated Crop Diagnosis Model
    crop/stage/environment-aware interpretation, source-sink diagnosis,
    fruit load, leaf load, assimilate production/demand, transition logic

[5] Crop Action Recommendation Model
    converts diagnosis signals into work recommendations and model requests

[6] Environment / Irrigation / Nutrient / Device Models
    calculate target candidates such as ADT, VPD, DIF, EC, pH, irrigation strategy

[7] Safety / Interlock / Approval Layer
    allow/block/approval-required decision

[8] Execution Layer
    executes only approved actions
```

---

## 3. Detailed responsibility matrix

| Layer | Korean name | Core question | Primary inputs | Primary outputs | Must not do |
|---|---|---|---|---|---|
| 1 | 생육단계 예측 모델 | 지금 어느 생육단계이고 7일 뒤 어느 단계일까? | 작기, 생육조사, G/L index, feature snapshot | `currentStage`, `predictedStage7d`, `transitionWindow`, confidence | 생육부진/회복/악화 진단, 조치 추천, 제어 |
| 2 | 생육상태 예측 모델 | 영양/생식 균형에 영향을 주는 모든 데이터를 보면 현재와 미래 방향은 어디인가? | 생육조사, 단계 예측, 환경, 관수 제어, 작업, 병해충, safety/interlock | `balanceScore`, `directionCode`, `magnitudeBandCode`, `driverContributions`, numeric confidence | 과실부하/잎부하 최종 진단, 하엽작업 지시, 환경값 계산 |
| 3 | 위험요소 예측 모델 | 구체 위험요소별 스트레스/위험 강도는 얼마인가? | 환경, 양액, 병해충, 작업, 센서/인터락 | 고온/저온/급격한 온도변화/VPD/습도/CO2/광량/EC/pH/병해충/작업 위험의 수치 score와 trend | 원인 확정, 조치 결정, 실행 차단 |
| 4 | 통합 작물 진단 모델 | 단계/상태/위험/생육조사/환경/병해충을 종합하면 어떤 문제 흐름이고 어떤 signal이 필요한가? | stage prediction, state prediction, detailed risk predictions, crop, stage, environment, growth survey, pest/disease/control history | fruit load, leaf load, assimilate production/demand, source-sink balance, pest/disease diagnosis candidate, environment/nutrient/control/work action signals | 직접 제어, 직접 ADT/VPD 계산, 직접 방제 실행, safety 우회 |
| 5 | 조치 추천 모델 | 진단 signal을 어떤 작업/모델 요청으로 바꿀 것인가? | integrated diagnosis, policy, work history, operator role | work recommendation, environment model request, irrigation model request | 직접 실행, 직접 target 계산, interlock 우회 |
| 6 | 환경/관수 제어/장치 모델 | 요청된 crop effect를 만족할 목표 후보는 무엇인가? | action request, current environment, irrigation/nutrient state, constraints | ADT/VPD/DIF/DLI/CO2, EC/pH/irrigation target candidates | 승인 없는 실행, crop diagnosis 대체 |
| 7 | Safety / Interlock / Approval | 목표 후보가 안전하고 실행 가능한가? | target candidates, sensor/device state, policies, approvals | allow/block/approval_required, reasons, audit | 예측/진단 생성 |
| 8 | 실행 계층 | 승인된 명령을 실제 반영할 것인가? | approved command | execution result, failure log, audit | 승인 없는 실행, 모델 판단 직접 실행 |

---

## 4. Layer 1 — Growth Stage Prediction Model

### Responsibility

Predict the current and 7-day growth stage.

### Current implemented baseline

The v1.10.15 stage model is implemented as a read-only hybrid rule/score baseline:

```text
growth survey + crop-specific index + feature snapshot
→ current stage diagnosis
→ 7-day stage prediction
→ prediction row persistence
→ exact 7-day survey validation
```

### Output boundary

The stage model may say:

```text
현재 stage = lettuce_leaf_expansion_main
7일 뒤 stage = lettuce_harvest_ready 가능성
transition window = 5~7일
```

It must not say:

```text
생육부진이다
하엽작업이 필요하다
VPD를 조정하라
```

---

## 5. Layer 2 — Growth State Prediction Model

### Corrected responsibility

The state model is **not** a slow/normal/recovery diagnosis model.

It predicts vegetative/generative balance direction using every data group that can influence that balance.

```text
State model input = all data affecting vegetative/generative balance.
State model output = numeric current/future balance scores, numeric movement scores, numeric driver contributions, and confidence.
Diagnosis model output = semantic meaning and required response.
```

Important: the state model contract must be **numeric-first**. Strings such as `generative`, `vegetative`, `medium`, or `high` are too ambiguous as model values. If UI labels are ever needed, they must be derived outside the core model contract from numeric codes/scores.

### Required input groups

| Input group | Examples | Why it matters |
|---|---|---|
| Growth survey | plant height, leaf count, stem diameter, node count, truss/cluster count, leaf length/width, fresh weight, weekly deltas | direct crop body signal |
| Stage prediction | currentStage, predictedStage7d, transitionWindow | stage-specific expected balance context |
| Crop-specific index | G-Index, L-Index, weekly index delta | summarized crop growth axis |
| Environment | ADT, DIF, VPD, DLI/light, temperature, humidity, CO2 | vegetative/generative steering pressure |
| Irrigation/nutrient | EC, pH, dry-back, feed/drain, irrigation frequency/duration | stress and steering pressure |
| Operation history | lower-leaf work, pruning, fruit thinning, harvest, leaf removal, training, pesticide/control | changes source/sink and canopy |
| Pest/disease/disorder | pest survey, disease severity, physiological disorder | stress or growth distortion |
| Safety/interlock | sensor fault, blocked status, approval status | reliability/limitation signals |

### Numeric output shape

The core state model output must use numeric fields. Semantic strings are not part of the core state value contract.

```json
{
  "growthStatePrediction": {
    "versionCode": 1,
    "modelFamilyCode": 2101,
    "modelTargetCode": 2201,

    "axis": {
      "axisCode": 1,
      "negativePoleCode": -1,
      "neutralCode": 0,
      "positivePoleCode": 1,
      "minScore": -1.0,
      "maxScore": 1.0
    },

    "currentBalance": {
      "balanceScore": 0.32,
      "balancePercent": 32,
      "directionCode": 1,
      "magnitudeScore": 0.32,
      "magnitudeBandCode": 2,
      "confidenceScore": 0.71,
      "confidenceBandCode": 4
    },

    "predictedBalance7d": {
      "balanceScore": 0.62,
      "balancePercent": 62,
      "directionCode": 1,
      "magnitudeScore": 0.62,
      "magnitudeBandCode": 3,
      "probabilityScore": 0.58,
      "confidenceScore": 0.58,
      "confidenceBandCode": 3
    },

    "balanceMovement": {
      "movementScore7d": 0.30,
      "movementDirectionCode7d": 1,
      "movementMagnitudeBandCode7d": 2,
      "velocityScore": 0.30,
      "accelerationScore": 0.04,
      "stabilityScore": 0.73,
      "volatilityScore": 0.27
    },

    "driverContributions": {
      "growthSurveySignal": {
        "driverCode": 101,
        "directionCode": 1,
        "rawScore": 0.41,
        "weight": 0.35,
        "contributionScore": 0.1435,
        "confidenceScore": 0.80
      },
      "environmentSteering": {
        "driverCode": 201,
        "directionCode": 1,
        "rawScore": 0.52,
        "weight": 0.25,
        "contributionScore": 0.13,
        "confidenceScore": 0.76
      },
      "irrigationNutrientSteering": {
        "driverCode": 301,
        "directionCode": 1,
        "rawScore": 0.36,
        "weight": 0.20,
        "contributionScore": 0.072,
        "confidenceScore": 0.70
      },
      "operationSignal": {
        "driverCode": 401,
        "directionCode": 0,
        "rawScore": 0.0,
        "weight": 0.10,
        "contributionScore": 0.0,
        "confidenceScore": 0.20
      },
      "riskSignal": {
        "driverCode": 501,
        "directionCode": 1,
        "rawScore": 0.28,
        "weight": 0.10,
        "contributionScore": 0.028,
        "confidenceScore": 0.65
      }
    },

    "inputCompletenessScore": 0.74,
    "modelLimitationCodes": [40101],
    "readOnly": true,
    "executionAuthorityCode": 0,
    "trainingAuthorityCode": 0,
    "deploymentAuthorityCode": 0
  }
}
```

### Numeric code tables

#### Direction code

| Code | Meaning |
|---:|---|
| `-1` | negative-axis movement, i.e. toward vegetative pole on axis code `1` |
| `0` | neutral / no meaningful direction |
| `1` | positive-axis movement, i.e. toward generative pole on axis code `1` |
| `9` | insufficient data |

#### Magnitude band code

Magnitude is based on `abs(balanceScore)` or `abs(movementScore)`.

| Code | Score range | Meaning |
|---:|---:|---|
| `0` | `0.00–0.09` | negligible |
| `1` | `0.10–0.24` | weak |
| `2` | `0.25–0.44` | low-medium |
| `3` | `0.45–0.69` | medium-high |
| `4` | `0.70–0.84` | strong |
| `5` | `0.85–1.00` | very strong |
| `9` | n/a | insufficient data |

#### Confidence band code

| Code | Score range | Meaning |
|---:|---:|---|
| `1` | `0.00–0.29` | very low confidence |
| `2` | `0.30–0.49` | low confidence |
| `3` | `0.50–0.69` | medium confidence |
| `4` | `0.70–0.84` | high confidence |
| `5` | `0.85–1.00` | very high confidence |
| `9` | n/a | insufficient data |

#### Driver code baseline

| Code | Driver |
|---:|---|
| `101` | growth survey signal |
| `201` | environment steering signal |
| `301` | irrigation/nutrient steering signal |
| `401` | operation/work-history signal |
| `501` | risk/stress signal |
| `601` | stage-context signal |

### Balance score axis

```text
-1.0 = strongly vegetative direction
 0.0 = neutral / balanced / maintaining
+1.0 = strongly generative direction
```

Important: this axis is a **state prediction value**, not the final diagnosis.

Examples:

| Numeric state output | Later diagnosis interpretation example |
|---|---|
| `axisCode: 1`, `balanceScore: +0.60`, `directionCode: 1`, `magnitudeBandCode: 3` in tomato fruiting stage | diagnosis may interpret as generative pressure or fruit-load direction |
| `axisCode: 1`, `balanceScore: +0.60`, `directionCode: 1`, `magnitudeBandCode: 3` in lettuce near harvest under heat | diagnosis may interpret as bolting/generative-transition risk |
| `axisCode: 1`, `balanceScore: -0.40`, `directionCode: -1`, `magnitudeBandCode: 2` in early tomato | diagnosis may interpret as vegetative establishment direction |
| `axisCode: 1`, `balanceScore: 0.00`, `directionCode: 0`, `magnitudeBandCode: 0` in lettuce leaf-growth stage | diagnosis may interpret as acceptable vegetative maintenance |

The state model outputs only the numeric values. The diagnosis model chooses the semantic interpretation.

---

## 6. Layer 3 — Risk Factor Prediction Model

### Responsibility

Predict **specific risk/stress factors as numeric values and trends**. This model must not collapse everything into a vague `environmentRisk: medium` summary.

It should quantify at least:

```text
high-temperature stress
low-temperature stress
rapid temperature-change stress
VPD stress
humidity stress
CO2 insufficiency/excess risk
low-light / DLI deficit risk
radiation/light excess risk
EC stress
pH stress
dry-back / drain imbalance risk
pest/disease risk by observed/predicted family
operation/freshness risk
sensor/interlock data-quality risk
```

### Output example

```json
{
  "riskFactorPrediction": {
    "version": "crop_risk_factor_prediction_v1",
    "modelTarget": "specific_crop_risk_factor_prediction",

    "environmentStress": {
      "highTemperatureStress": {
        "score": 0.72,
        "level": "high",
        "trend": "increasing",
        "evidence": { "adt": 27.8, "hoursAboveThreshold": 6 }
      },
      "lowTemperatureStress": {
        "score": 0.08,
        "level": "low",
        "trend": "stable"
      },
      "temperatureSwingStress": {
        "score": 0.61,
        "level": "medium_high",
        "trend": "increasing",
        "evidence": { "maxDelta24h": 8.4 }
      },
      "vpdStress": {
        "score": 0.54,
        "level": "medium",
        "trend": "stable"
      },
      "humidityStress": {
        "score": 0.36,
        "level": "low_medium",
        "trend": "stable"
      },
      "co2Stress": {
        "score": 0.22,
        "level": "low",
        "trend": "stable"
      },
      "lightDliStress": {
        "score": 0.47,
        "level": "medium",
        "trend": "slightly_increasing"
      }
    },

    "irrigationNutrientStress": {
      "ecStress": { "score": 0.44, "level": "medium", "trend": "stable" },
      "phStress": { "score": 0.21, "level": "low", "trend": "stable" },
      "dryBackStress": { "score": 0.63, "level": "medium_high", "trend": "increasing" },
      "drainImbalanceRisk": { "score": 0.40, "level": "medium", "trend": "stable" }
    },

    "pestDiseaseRisk": {
      "pestPressure": { "score": 0.31, "level": "low_medium", "trend": "stable" },
      "diseasePressure": { "score": 0.52, "level": "medium", "trend": "increasing" },
      "controlFreshnessRisk": { "score": 0.66, "level": "medium_high", "trend": "increasing" }
    },

    "operationRisk": {
      "missingSurveyRisk": { "score": 0.20, "level": "low" },
      "missingWorkRecordRisk": { "score": 0.42, "level": "medium" }
    },

    "readOnly": true,
    "executionAuthority": "none"
  }
}
```

### Risk severity bands required for diagnosis

The risk model must expose numeric scores, and later diagnosis interprets those scores through explicit severity bands. The operator-facing band names below are stable explanations for numeric `bandCode`; the risk model core payload uses numeric fields only: `score`, `bandCode`, `trendCode`, `confidenceScore`, and `evidenceScore`.

Recommended baseline bands:

| bandCode | Band meaning | Korean label | Score range | Diagnosis meaning | Typical response class |
|---:|---|---|---:|---|---|
| `5` | `immediate_action` | 바로 대처 | `0.85–1.00` | current or near-term crop damage/loss risk is high enough that operator review/action is urgent | urgent work/model request, approval flow likely |
| `4` | `severe` | 심각 | `0.70–0.84` | strong stress/risk; likely to affect crop balance, disease pressure, quality, or yield if not addressed | high-priority review/action request |
| `3` | `moderate` | 중간 | `0.45–0.69` | meaningful risk; should influence diagnosis and may create model/work review signals | normal-priority review request |
| `2` | `weak` | 약함 | `0.20–0.44` | weak signal; keep as evidence and trend monitoring | monitor / low-priority observation |
| `1` | `very_weak` | 매우 약함 | `0.00–0.19` | negligible signal under current evidence | record only |
| `9` | insufficient data | 데이터 부족 | n/a | not enough evidence | record limitation |

Each detailed risk item should carry both score and band:

```json
{
  "highTemperatureStress": {
    "riskCode": 1001,
    "score": 0.72,
    "bandCode": 4,
    "trendCode": 1,
    "confidenceScore": 0.73,
    "evidenceScore": 0.68
  }
}
```

The default score ranges are baselines. Crop/stage-specific calibration may later adjust thresholds, but the operator labels must remain clear and comparable.

### Boundary

Risk prediction provides detailed numeric risk signals and risk bands. It does not decide the final cause, pesticide/control work, climate setpoints, irrigation/nutrient setpoints, or execution authority.


---

## 7. Layer 4 — Integrated Crop Diagnosis Model

### Responsibility

The diagnosis model interprets prediction values using crop, stage, environment, and actual growth survey context.

It must calculate and integrate source/sink, environmental stress, irrigation/nutrient stress, pest/disease likelihood, and work/control needs that the prediction models do not finalize:

```text
fruit load
leaf load
assimilate production capacity
assimilate demand
source-sink gap
vegetative/generative transition need
load reduction need
pest/disease diagnosis candidate
pest scouting / control work need
environment adjustment need
irrigation/nutrient adjustment need
```

This model is not crop-only. It must also interpret environment, irrigation/nutrient, pest/disease, operation, and control-history context.

### Required diagnosis calculations

| Calculation | Meaning | Input examples |
|---|---|---|
| Fruit load | fruit/truss/cluster demand on the plant | truss count, fruit set, fruit size, cluster weight, harvest history |
| Leaf load | leaf/canopy burden and photosynthetic area proxy | leaf count, leaf length/width, lower-leaf/removal history, shading notes |
| Assimilate production | potential sugar/biomass production capacity | DLI, CO2, ADT, VPD, temperature, leaf area proxy |
| Assimilate demand | demand from fruit, new growth, leaves, roots | fruit load, stage, growth rate, crop type |
| Source-sink balance | whether production can cover demand | production score vs demand score |
| Transition logic | whether to support vegetative or generative direction | state prediction + source/sink + stage + risk bands |
| Risk band interpretation | whether each detailed risk needs immediate/severe/moderate/weak/very-weak response | detailed risk score, band, trend, crop/stage context |
| Work signal | whether to send lower-leaf/thinning/environment-review signal | diagnosis result and constraints |
| Pest/disease diagnosis candidate | whether detailed pest/disease risk and crop symptoms justify scouting/control review | pest survey, disease pressure, control freshness, crop symptoms, humidity/VPD/temperature stress |
| Environment adjustment signal | whether climate model review is needed | high/low temperature stress, rapid temperature change, VPD, humidity, DLI, CO2, diagnosis context |
| Irrigation/nutrient adjustment signal | whether irrigation/nutrient model review is needed | EC/pH stress, dry-back, drain imbalance, demand/production gap, diagnosis context |
| Control/work signal | whether human work such as scouting, pesticide/control review, lower-leaf work, thinning, harvest timing review is needed | diagnosis result, pest/control history, crop stage, safety constraints |

### Diagnosis severity response rule

The diagnosis model must not treat detailed risk scores as vague background evidence. It maps each risk item's score/band into a response class:

```text
바로 대처 / immediate_action
심각 / severe
중간 / moderate
약함 / weak
매우 약함 / very_weak
```

Recommended diagnosis response behavior:

| Risk band | Diagnosis behavior |
|---|---|
| `immediate_action` / 바로 대처 | create urgent action signal; require operator review and likely approval flow; surface prominently |
| `severe` / 심각 | create high-priority diagnosis factor and action/model review signal |
| `moderate` / 중간 | include as meaningful factor; create normal-priority model/work review when consistent with stage/state |
| `weak` / 약함 | keep as evidence/trend monitoring; no action unless multiple weak signals align |
| `very_weak` / 매우 약함 | record only; normally no action signal |

Trend can upgrade urgency. For example, a `moderate` risk with rapidly increasing trend may create the same review signal as `severe`, but it must record the reason.

### Vegetative/generative transition action routing

When the diagnosis model decides that vegetative/generative steering or transition support is needed, it must route requests to both possible control-model families as needed:

```text
environment model request
  - ADT
  - DIF
  - VPD
  - DLI/light
  - CO2
  - humidity strategy

irrigation/nutrient model request
  - EC
  - pH
  - irrigation frequency/duration
  - dry-back target
  - drain rate / drain balance
  - feed/drain nutrient strategy
```

The diagnosis model decides **which model families should review** the situation; it does not calculate final setpoints. The action model turns the diagnosis signal into requests, and the environment or irrigation/nutrient model calculates candidates.

### Output example

```json
{
  "integratedCropDiagnosis": {
    "diagnosisTarget": "source_sink_and_growth_balance_diagnosis",

    "vegetativeGenerativeInterpretation": {
      "statePredictionRef": {
        "axisCode": 1,
        "balanceScore": 0.62,
        "directionCode": 1,
        "magnitudeBandCode": 3,
        "confidenceScore": 0.73
      },
      "interpretation": "생식부하가 강해지는 방향",
      "confidenceScore": 0.73
    },

    "fruitLoad": {
      "loadLevel": "high",
      "fruitLoadScore": 0.78,
      "clusterCount": 6,
      "estimatedFruitDemand": 0.82
    },

    "leafLoad": {
      "leafLoadLevel": "excessive",
      "leafAreaProxy": 0.74,
      "shadingRisk": "medium",
      "lowerLeafWorkCandidate": true
    },

    "assimilateBalance": {
      "productionScore": 0.58,
      "demandScore": 0.81,
      "balanceStatus": "demand_exceeds_production",
      "sourceSinkGap": -0.23
    },

    "transitionLogic": {
      "needsVegetativeSteering": true,
      "needsGenerativeSteering": false,
      "needsLoadReduction": true,
      "needsEnvironmentModelReview": true,
      "needsIrrigationNutrientModelReview": true,
      "transitionReason": "과실부하와 잎부하가 동화산물 생산 가능량보다 크고, 고온/VPD/EC-dry-back stress가 함께 확인됨"
    },

    "riskSeverityInterpretation": {
      "highTemperatureStress": {
        "score": 0.72,
        "band": "severe",
        "label": "심각",
        "diagnosisResponse": "high_priority_environment_model_review"
      },
      "dryBackStress": {
        "score": 0.63,
        "band": "moderate",
        "label": "중간",
        "diagnosisResponse": "irrigation_nutrient_model_review"
      },
      "controlFreshnessRisk": {
        "score": 0.66,
        "band": "moderate",
        "label": "중간",
        "diagnosisResponse": "pest_scouting_or_control_review"
      }
    },

    "actionSignals": [
      {
        "signalType": "leaf_work",
        "actionHint": "lower_leaf_removal_review",
        "reason": "잎부하가 높고 동화산물 수요가 생산량보다 큼",
        "priority": "medium"
      },
      {
        "signalType": "environment_target_request",
        "actionHint": "request_environment_model_review",
        "targetVariables": ["ADT", "VPD", "DLI"],
        "reason": "동화산물 생산 개선 여지와 고온/VPD 스트레스 완화 검토"
      },
      {
        "signalType": "pest_disease_control_review",
        "actionHint": "pest_scouting_or_control_work_review",
        "suspectedRiskFamilies": ["disease_pressure", "control_freshness_risk"],
        "reason": "병해 압력과 방제 이력 신선도 위험이 함께 증가함",
        "priority": "medium"
      },
      {
        "signalType": "irrigation_nutrient_target_request",
        "actionHint": "request_irrigation_nutrient_model_review",
        "targetVariables": ["EC", "pH", "dryBack", "drainRate"],
        "reason": "EC/dry-back 스트레스가 source-sink 부담과 함께 증가함",
        "priority": "medium"
      }
    ],

    "readOnly": true,
    "executionAuthority": "none"
  }
}
```

### Important diagnosis rule

If:

```text
assimilate production < fruit load + leaf load + growth demand
```

then the diagnosis model may emit action signals such as:

```text
lower_leaf_removal_review
fruit_load_adjustment_review
environment_model_review
irrigation_nutrient_model_review
pest_scouting_or_control_work_review
pesticide_control_work_review
```

If detailed risk prediction shows high/rapidly increasing pest or disease pressure, stale control records, and compatible crop symptoms/environment, the diagnosis model may emit pest scouting or control-review signals. It still must not directly order pesticide execution; the action model turns this into a human-review work recommendation and Safety/Interlock/Approval remains required.

If high/low temperature, rapid temperature-change stress, VPD stress, humidity stress, CO2 stress, light/DLI stress, EC/pH/dry-back stress, or drain imbalance is involved, the diagnosis model may emit environment or irrigation/nutrient model-review signals. It must not calculate final setpoints itself.

But it must not directly execute those actions.

---

## 8. Layer 5 — Crop Action Recommendation Model

### Responsibility

Convert diagnosis signals into human-readable work recommendations or requests to other models.

### Lower-leaf work flow

```text
Diagnosis model:
  production < load
  leafLoad excessive
  lowerLeafWorkCandidate = true
  → actionSignal: lower_leaf_removal_review

Action recommendation model:
  creates operator-facing recommendation
  → "하엽작업 검토"
```

### Output example

```json
{
  "cropActionRecommendation": {
    "mode": "recommendation_only",
    "workRecommendations": [
      {
        "actionType": "lower_leaf_work",
        "label": "하엽작업 검토",
        "reason": "잎부하와 과실부하가 동화산물 생산 가능량보다 큼",
        "priority": "medium",
        "requiresHumanReview": true,
        "executionAuthority": "none"
      }
    ],
    "modelRequests": [
      {
        "targetModel": "environment_model",
        "requestType": "climate_target_review",
        "candidateVariables": ["ADT", "VPD", "DLI"],
        "reason": "동화산물 생산 개선 및 환경 스트레스 완화 검토"
      },
      {
        "targetModel": "irrigation_nutrient_model",
        "requestType": "irrigation_nutrient_target_review",
        "candidateVariables": ["EC", "pH", "dryBack", "drainRate"],
        "reason": "양액/배액 스트레스가 진단 결과에 영향을 줌"
      },
      {
        "targetModel": "pest_control_workflow",
        "requestType": "scouting_or_control_review",
        "candidateWorkTypes": ["pest_scouting", "disease_scouting", "pesticide_control_review"],
        "reason": "병해충 위험과 방제 이력 신선도 위험이 진단 signal로 확인됨",
        "requiresHumanReview": true
      }
    ]
  }
}
```

### Boundary

The action model does not calculate ADT/VPD/DIF/EC/pH targets itself.

---

## 9. Layer 6 — Environment / Irrigation / Nutrient models

### Responsibility

Future environment and irrigation models receive intent/request objects and calculate target candidates.

Example:

```json
{
  "environmentModelRequest": {
    "requestType": "climate_target_review",
    "reason": "assimilate_production_lower_than_load",
    "desiredCropEffect": {
      "steeringDirection": "toward_vegetative_support",
      "productionGoal": "increase_assimilate_production",
      "stressPolicy": "avoid_additional_generative_stress"
    },
    "candidateVariables": ["ADT", "DIF", "VPD", "DLI", "CO2"],
    "constraints": {
      "cropStage": "fruiting",
      "safetyRequired": true,
      "interlockRequired": true,
      "executionAuthority": "none"
    }
  }
}
```

The environment model may then calculate:

```text
ADT candidate
DIF candidate
VPD candidate
DLI/lighting candidate
CO2 candidate
```

The irrigation/nutrient model may calculate:

```text
EC candidate
pH candidate
irrigation frequency/duration candidate
dry-back target candidate
drain-rate candidate
```

Neither model executes directly.

---

## 10. Safety / Interlock / Approval and execution boundary

Every target candidate must pass safety/interlock/approval before execution.

```text
model request
→ target candidate
→ safety/interlock/approval
→ approved command
→ execution
```

Execution is forbidden unless all required approval and safety gates pass.

---

## 11. Confirmed non-goals

The following are explicitly out of scope for the prediction/diagnosis/recommendation layers:

```text
automatic environment control
automatic irrigation control
automatic device control
PID application
physical/MQTT device hookup
automatic ML training
automatic ML deployment
Safety/Interlock bypass
```

---

## 12. Suggested implementation order after v1.10.15

The already implemented v1.10.15 stage model remains the foundation.

Recommended next slices:

```text
v1.10.16 — Growth State Prediction Model
  - ingest all vegetative/generative influence data
  - output current/predicted balance and drivers only
  - no diagnosis/action

v1.10.17 — Risk Factor Prediction Model
  - environment/irrigation/pest/operation risk values and trends
  - no diagnosis/action

v1.10.18 — Integrated Crop Diagnosis Model
  - fruit load
  - leaf load
  - assimilate production/demand
  - source-sink balance
  - transition logic
  - action signals

v1.10.19 — Crop Action Recommendation Model
  - lower-leaf work recommendation
  - fruit-load adjustment review
  - environment/irrigation model requests
  - no direct target calculation

Future — Environment/Irrigation/Nutrient models
  - calculate ADT/VPD/DIF/EC/pH/irrigation target candidates from action requests
```

---

## 13. Current documentation correction

Earlier documentation used the wording:

```text
생육상태 진단
```

as the second crop objective. This is superseded by the confirmed responsibility split:

```text
2. 생육상태 예측 모델 — vegetative/generative balance direction prediction
3. 위험요소 예측 모델 — risk values/trends
4. 통합 작물 진단 모델 — diagnosis from stage/state/risk plus crop/stage/environment/growth survey context
5. 조치 추천 모델 — recommendations and requests to future environment/irrigation models
```
