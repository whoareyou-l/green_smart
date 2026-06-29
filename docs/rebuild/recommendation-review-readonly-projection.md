# RS-020 Recommendation Review Read-only Projection

> 기준 버전: `v1.12.77`
> Status: recommendation review read-only projection
> 목적: `currentCropAssignment + growthTargetProjection + environmentImpactProjection`을 기반으로 `추천·실행` 화면에 구역별 추천 검토 상태를 읽기 전용 projection으로 표시한다.

## 0. Boundary decision

```text
recommendationReviewProjection
currentCropAssignment + growthTargetProjection + environmentImpactProjection → recommendationReviewProjection
추천·실행
reviewState
reviewSummary
reviewInputs
approvalRequired
No production route removal in RS-020
No DB migration in RS-020
No write/mutation in RS-020
No real-device hookup in RS-020
```

RS-020은 추천 검토 상태 표시용 read-only projection slice다. 추천 승인, 저장, 실행, DB migration, 실제 장치 연결을 포함하지 않는다.

---

## 1. DTO shape

```json
{
  "recommendationReviewProjection": {
    "reviewState": "ready",
    "reviewSummary": "추천 검토 대기: 생육목표와 환경 영향 projection 확인 필요",
    "reviewInputs": {
      "assignment": { "assignmentState": "assigned" },
      "growthTargetProjection": { "targetFocus": "엽채 생장 균일화" },
      "environmentImpactProjection": { "impactFocus": "구역 장비와 데이터 신선도 기준 영향 확인" }
    },
    "approvalRequired": true,
    "readOnly": true,
    "executionEnabled": false
  }
}
```

---

## 2. UI markers

```text
data-recommendation-review-projection-card
data-recommendation-review-state
data-recommendation-review-summary
data-recommendation-review-approval-required
data-recommendation-review-readonly
data-recommendation-review-execution-enabled
```

`recommendationReviewProjection`은 `추천·실행` stage에서만 렌더링한다.

---

## 3. Non-goals

```text
No production route removal in RS-020
No DB migration in RS-020
No write/mutation in RS-020
No real-device hookup in RS-020
No recommendation approval/save/execute controls in RS-020
```

---

## 4. Completion criteria

- [x] Service mapper emits `recommendationReviewProjection` from assignment/growth/environment projections.
- [x] Frontend adapter normalizes `recommendationReviewProjection` from API or fallback context.
- [x] Rebuild panel renders the projection only in `추천·실행`.
- [x] No mutation/execution affordances are introduced.
