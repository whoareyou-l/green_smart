# v1.10.19 Crop Action Recommendation Model

> Status: implemented and locally verifying.  
> Boundary: converts integrated diagnosis review signals into human work/model-request recommendations only. No final target values, no pesticide instruction, no automatic work order, no execution authority.

---

## Scope

Adds the fifth crop model layer:

```text
Crop Action Recommendation Model
```

Input:

```text
integratedCropDiagnosis.reviewSignals
integratedCropDiagnosis.sourceSinkDiagnosis
integratedCropDiagnosis.transitionDiagnosis
integratedCropDiagnosis.riskUrgencyInterpretation
```

Output:

```text
cropActionRecommendation
```

---

## Core output groups

```text
workReviewRequests
modelReviewRequests
operatorReviewQueue
recommendationReadiness
```

---

## Numeric/code contract

Core requests use codes/scores only. Human labels are derived by UI.

```json
{
  "cropActionRecommendation": {
    "versionCode": 1,
    "modelFamilyCode": 5101,
    "modelTargetCode": 5201,
    "inputRefs": { "integratedCropDiagnosis": true },
    "workReviewRequests": {
      "lowerLeafRemoval": { "requestCode": 101, "priorityCode": 1, "confidenceScore": 0.66 },
      "fruitLoadAdjustment": { "requestCode": 102, "priorityCode": 2, "confidenceScore": 0.66 },
      "pestScoutingOrControlReview": { "requestCode": 103, "priorityCode": 1, "confidenceScore": 0.66 },
      "cropWorkReview": { "requestCode": 104, "priorityCode": 0, "confidenceScore": 0.66 }
    },
    "modelReviewRequests": {
      "environmentModelReview": { "requestCode": 201, "priorityCode": 1, "targetCandidateAuthorityCode": 0 },
      "irrigationNutrientModelReview": { "requestCode": 301, "priorityCode": 1, "targetCandidateAuthorityCode": 0 }
    },
    "operatorReviewQueue": []
  }
}
```

---

## Priority codes

| priorityCode | Meaning |
|---:|---|
| `0` | no request |
| `1` | review suggested |
| `2` | high priority review |
| `3` | urgent operator review |
| `9` | insufficient data |

---

## Non-goals

```text
No final ADT/VPD/DIF/DLI/CO2/humidity target values
No final EC/pH/irrigation frequency/dry-back/drain target values
No pesticide/control instruction
No automatic work order
No device/environment/irrigation command
No safety/interlock bypass
```
