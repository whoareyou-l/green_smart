# v1.10.16 Growth State Prediction Model

> Status: implemented and locally verified.  
> Confirmed horizon: `current + 7일만`.  
> Boundary: numeric-first crop state prediction only. No diagnosis, no action recommendation, no environment/irrigation setpoint calculation, no execution authority.
>
> Verification:
>
> ```bash
> pytest -q tests/test_crop_growth_state_prediction_numeric_contract.py
> 8 passed
> node --check custom_components/green_smart/panel/green-smart-panel.js
> exit 0
> ```

---

## 1. Confirmed model responsibility

The Growth State Prediction Model predicts the vegetative/generative balance direction from all data that can influence that balance.

It must not output semantic/string state values as core model values.

Forbidden as core state values:

```text
state: "generative"
state: "vegetative"
state: "slightly_generative"
strength: "medium"
direction: "toward_generative"
slow_growth
normal_growth
recovery_possible
deterioration_likely
```

Those meanings belong to UI/diagnosis layers, not the state model core contract.

---

## 2. Confirmed horizon

User confirmed:

```text
current + 7일만
```

Therefore v1.10.16 includes:

```text
currentBalance
predictedBalance7d
balanceMovement for current→7d
```

It excludes:

```text
predictedBalance1d
predictedBalance3d
```

---

## 3. Numeric-first output contract

### 3.1 Axis

```json
{
  "axis": {
    "axisCode": 1,
    "negativePoleCode": -1,
    "neutralCode": 0,
    "positivePoleCode": 1,
    "minScore": -1.0,
    "maxScore": 1.0
  }
}
```

Meaning:

```text
axisCode 1 = vegetative/generative balance axis
-1 = vegetative pole
 0 = neutral
+1 = generative pole
```

### 3.2 Current balance

```json
{
  "currentBalance": {
    "balanceScore": 0.32,
    "balancePercent": 32,
    "directionCode": 1,
    "magnitudeScore": 0.32,
    "magnitudeBandCode": 2,
    "confidenceScore": 0.71,
    "confidenceBandCode": 4
  }
}
```

### 3.3 Seven-day predicted balance

```json
{
  "predictedBalance7d": {
    "balanceScore": 0.62,
    "balancePercent": 62,
    "directionCode": 1,
    "magnitudeScore": 0.62,
    "magnitudeBandCode": 3,
    "probabilityScore": 0.58,
    "confidenceScore": 0.58,
    "confidenceBandCode": 3
  }
}
```

### 3.4 Current→7d movement

```json
{
  "balanceMovement": {
    "movementScore7d": 0.30,
    "movementDirectionCode7d": 1,
    "movementMagnitudeBandCode7d": 2,
    "velocityScore": 0.30,
    "accelerationScore": 0.0,
    "stabilityScore": 0.73,
    "volatilityScore": 0.27
  }
}
```

### 3.5 Driver contributions

Driver contributions must be numeric. Driver names may exist as object keys for readability, but each driver must expose numeric `driverCode`, `directionCode`, `rawScore`, `weight`, `contributionScore`, and `confidenceScore`.

```json
{
  "driverContributions": {
    "growthSurveySignal": {
      "driverCode": 101,
      "directionCode": 1,
      "rawScore": 0.41,
      "weight": 0.35,
      "contributionScore": 0.1435,
      "confidenceScore": 0.80
    }
  }
}
```

---

## 4. Numeric code tables

### 4.1 Direction code

| Code | Meaning |
|---:|---|
| `-1` | negative-axis movement; axis 1 means vegetative pole |
| `0` | neutral / no meaningful direction |
| `1` | positive-axis movement; axis 1 means generative pole |
| `9` | insufficient data |

### 4.2 Magnitude band code

| Code | Score range |
|---:|---:|
| `0` | `0.00–0.09` |
| `1` | `0.10–0.24` |
| `2` | `0.25–0.44` |
| `3` | `0.45–0.69` |
| `4` | `0.70–0.84` |
| `5` | `0.85–1.00` |
| `9` | insufficient data |

### 4.3 Confidence band code

| Code | Score range |
|---:|---:|
| `1` | `0.00–0.29` |
| `2` | `0.30–0.49` |
| `3` | `0.50–0.69` |
| `4` | `0.70–0.84` |
| `5` | `0.85–1.00` |
| `9` | insufficient data |

### 4.4 Driver code baseline

| Code | Driver |
|---:|---|
| `101` | growth survey signal |
| `201` | environment steering signal |
| `301` | irrigation/nutrient steering signal |
| `401` | operation/work-history signal |
| `501` | risk/stress signal |
| `601` | stage-context signal |

---

## 5. Initial driver weights

Initial hybrid baseline weights:

| Driver | Code | Weight |
|---|---:|---:|
| Growth survey signal | `101` | `0.35` |
| Environment steering signal | `201` | `0.25` |
| Irrigation/nutrient steering signal | `301` | `0.20` |
| Operation/work-history signal | `401` | `0.10` |
| Risk/stress signal | `501` | `0.05` |
| Stage-context signal | `601` | `0.05` |

Weights must sum to `1.0`.

---

## 6. Required source inputs

The state model must ingest all data groups that can affect vegetative/generative balance, when present:

```text
growth survey metrics and weekly deltas
stage prediction current/predicted 7d context
growth index and index delta
environment summary / ADT / DIF / VPD / DLI / CO2 / humidity / temperature
irrigation/nutrient summary / EC / pH / dry-back / feed-drain / drain rate
operation history / lower leaf / pruning / thinning / harvest / control work
pest/disease/disorder and risk signals
safety/interlock data quality signals
```

Missing groups must reduce confidence and appear as numeric limitation codes; missing data must not create string state labels.

---

## 7. Acceptance tests for v1.10.16

RED contract tests must verify:

```text
growthStatePrediction exists in cropModel and trainableBaseline
currentBalance is numeric-only
predictedBalance7d is numeric-only
predictedBalance3d is absent
state/strength/direction string fields are absent from core state objects
axisCode/directionCode/magnitudeBandCode/confidenceBandCode exist
driverContributions use driverCode/rawScore/weight/contributionScore
readOnly true and authority codes 0
no diagnosis/action fields are introduced
```

---

## 8. Implementation target

Expected implementation files:

```text
custom_components/green_smart/crop_views.py
tests/test_crop_growth_state_prediction_numeric_contract.py
docs/plans/2026-06-25-crop-model-responsibility-architecture.md
docs/plans/2026-06-23-crop-model-design-decisions.md
```

Potential helper names:

```text
_crop_growth_state_prediction(...)
_crop_growth_state_direction_code(score)
_crop_growth_state_magnitude_band_code(score)
_crop_growth_state_confidence_band_code(score)
_crop_growth_state_driver_contributions(...)
```

---

## 9. Verification plan

Targeted:

```bash
pytest -q tests/test_crop_growth_state_prediction_numeric_contract.py
```

Related:

```bash
pytest -q tests/test_model_contract.py tests/test_crop_stage_model_step1_prediction_contract.py tests/test_crop_stage_model_step3_feature_snapshot_contract.py
```

Final:

```bash
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 -m py_compile custom_components/green_smart/crop_views.py
pytest -q
git diff --check
```
