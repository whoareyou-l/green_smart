# v1.10.18 Integrated Crop Diagnosis Model

> Status: implemented and locally verifying.  
> Boundary: diagnosis/signals only. No direct work order, no pesticide instruction, no environment/irrigation setpoint calculation, no execution authority.

---

## 1. Scope

v1.10.18 adds the fourth crop model layer:

```text
Integrated Crop Diagnosis Model
```

It interprets already-produced numeric predictions:

```text
stagePrediction7d
growthStatePrediction
riskFactorPrediction
growth survey metrics
featureSnapshot summaries
```

---

## 2. Required diagnosis outputs

```text
integratedCropDiagnosis
```

Core groups:

```text
loadBalanceDiagnosis
sourceSinkDiagnosis
transitionDiagnosis
riskUrgencyInterpretation
reviewSignals
diagnosisReadiness
```

---

## 3. Numeric-first contract

Diagnosis may derive human-facing text later, but core payload uses numeric scores/codes:

```json
{
  "integratedCropDiagnosis": {
    "versionCode": 1,
    "modelFamilyCode": 4101,
    "modelTargetCode": 4201,
    "loadBalanceDiagnosis": {
      "fruitLoadScore": 0.62,
      "leafLoadScore": 0.48,
      "loadGapScore": 0.14,
      "loadGapDirectionCode": 1,
      "confidenceScore": 0.66
    },
    "sourceSinkDiagnosis": {
      "sourceCapacityScore": 0.54,
      "sinkDemandScore": 0.68,
      "sourceSinkGapScore": -0.14,
      "gapSeverityCode": 2
    },
    "transitionDiagnosis": {
      "vegetativeGenerativeBalanceScore": 0.32,
      "transitionNeedCode": 1,
      "environmentModelReviewCode": 1,
      "irrigationNutrientModelReviewCode": 1
    },
    "reviewSignals": {
      "lowerLeafRemovalReviewCode": 0,
      "fruitLoadAdjustmentReviewCode": 1,
      "environmentModelReviewCode": 1,
      "irrigationNutrientModelReviewCode": 1,
      "pestScoutingOrControlReviewCode": 1,
      "cropWorkReviewCode": 0
    }
  }
}
```

---

## 4. Review signal codes

| Code | Meaning |
|---:|---|
| `0` | no signal |
| `1` | review suggested |
| `2` | high priority review |
| `3` | urgent operator review |
| `9` | insufficient data |

---

## 5. Non-goals

```text
No final ADT/VPD/DIF/DLI/CO2/humidity setpoints
No final EC/pH/irrigation frequency/dry-back/drain targets
No pesticide/control instruction
No automatic work order
No execution authority
No safety/interlock bypass
```

---

## 6. Acceptance tests

```text
tests/test_crop_integrated_diagnosis_numeric_contract.py
```

Must verify:

```text
integratedCropDiagnosis exists
consumes stagePrediction7d/growthStatePrediction/riskFactorPrediction
load/source-sink/transition outputs are numeric
reviewSignals are code-only
both environment and irrigation/nutrient model review signals are possible
forbidden execution/setpoint/work-order fields absent
trainableBaseline exposes same diagnosis
panel exposes read-only diagnosis evidence markers
```
