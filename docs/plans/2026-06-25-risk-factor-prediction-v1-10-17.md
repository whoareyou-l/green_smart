# v1.10.17 Risk Factor Prediction Model

> Status: implemented and locally verifying.  
> Boundary: numeric-first risk/stress factor prediction only. No diagnosis, no action recommendation, no pesticide/control instruction, no environment/irrigation setpoint calculation, no execution authority.

---

## 1. Scope

v1.10.17 adds the third crop model layer:

```text
Risk Factor Prediction Model
```

The model outputs detailed numeric risk factors. It must not collapse all risk into vague aggregate strings such as `environmentRisk: medium`.

---

## 2. Required factor groups

```text
environmentStress
irrigationNutrientStress
pestDiseaseRisk
operationDataQualityRisk
```

Required items:

```text
highTemperatureStress
lowTemperatureStress
temperatureSwingStress
vpdStress
humidityStress
co2Stress
lightDliStress
ecStress
phStress
dryBackStress
drainImbalanceRisk
pestPressure
diseasePressure
controlFreshnessRisk
operationFreshnessRisk
sensorInterlockDataQualityRisk
```

---

## 3. Numeric item contract

Each risk item must expose numeric fields:

```json
{
  "riskCode": 1001,
  "score": 0.72,
  "bandCode": 4,
  "trendCode": 1,
  "confidenceScore": 0.73,
  "evidenceScore": 0.68
}
```

No string labels are core values. Korean/operator labels are derived later by diagnosis or UI.

---

## 4. Band code table

| bandCode | Score range | Meaning for diagnosis |
|---:|---:|---|
| `1` | `0.00–0.19` | 매우 약함 |
| `2` | `0.20–0.44` | 약함 |
| `3` | `0.45–0.69` | 중간 |
| `4` | `0.70–0.84` | 심각 |
| `5` | `0.85–1.00` | 바로 대처 |
| `9` | n/a | 데이터 부족 |

Trend code:

| trendCode | Meaning |
|---:|---|
| `-1` | decreasing |
| `0` | stable/unknown |
| `1` | increasing |
| `2` | rapidly increasing |
| `9` | insufficient data |

---

## 5. Non-goals

```text
No cause diagnosis
No pest/control work order
No pesticide instruction
No environment setpoint
No irrigation/nutrient setpoint
No execution authority
No Safety/Interlock override
```

---

## 6. Acceptance tests

```text
tests/test_crop_risk_factor_prediction_numeric_contract.py
```

Must verify:

```text
riskFactorPrediction exists
required groups/items exist
all items are numeric-first
bandCode/trendCode are valid
string severity labels are absent from core payload
trainableBaseline exposes the same riskFactorPrediction
panel has read-only numeric evidence markers
forbidden execution markers are absent
```
