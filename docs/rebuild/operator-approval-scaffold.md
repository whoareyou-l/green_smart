# RS-021 Operator Approval Scaffold

> 기준 버전: `v1.13.3`
> Status: operator approval scaffold
> 목적: `recommendationReviewProjection` 다음 단계로 `추천·실행` 화면에 작업자 승인 필요 상태를 read-only/disabled scaffold로 표시한다.

## 0. Boundary decision

```text
operatorApprovalScaffold
recommendationReviewProjection → operatorApprovalScaffold
작업자 승인 필요
approvalState
approvalRequired
disabledReason
executionBlocked
No production route removal in RS-021
No DB migration in RS-021
No write/mutation in RS-021
No real-device hookup in RS-021
```

RS-021은 승인 상태를 저장하거나 실행하지 않는다. 작업자 승인과 안전/인터록 사전검증 전에는 실행이 차단된다는 제품 흐름을 표시한다.

## DTO shape

```json
{
  "operatorApprovalScaffold": {
    "approvalState": "required",
    "approvalRequired": true,
    "disabledReason": "작업자 승인과 안전/인터록 사전검증 전에는 실행할 수 없습니다.",
    "executionBlocked": true,
    "sourceRecommendationReview": { "reviewState": "ready" },
    "readOnly": true,
    "executionEnabled": false
  }
}
```

## UI markers

```text
data-operator-approval-scaffold-card
data-operator-approval-state
data-operator-approval-required
data-operator-approval-disabled-reason
data-operator-approval-execution-blocked
data-operator-approval-readonly
data-operator-approval-execution-enabled
```
