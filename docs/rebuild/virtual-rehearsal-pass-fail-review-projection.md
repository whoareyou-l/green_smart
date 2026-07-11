# RS-027 Virtual Rehearsal Pass/Fail Review Projection

> 기준 버전: `v1.15.30`
> Status: virtual rehearsal pass/fail review projection
> 목적: `가상 dry-run 결과 어댑터` 다음 단계로, 시나리오별 결과를 operator가 검토할 수 있는 pass/fail/review-needed projection으로 정리한다.

## 0. Boundary decision

```text
virtualRehearsalPassFailReviewProjection
virtualRunnerDryRunResultAdapter → virtualRehearsalPassFailReviewProjection
가상 리허설 pass/fail 검토 projection
reviewState
overallDecision
scenarioReviews
sourceDryRunResultAdapter
passFailAuthority
operatorReviewRequired
pass
fail
review_needed
normal
strong_wind
rain
low_temperature
sensor_fault
blocked
fail_safe
recovery
No production route removal in RS-027
No DB migration in RS-027
No write/mutation in RS-027
No real-device hookup in RS-027
No MQTT/device command in RS-027
No virtual runner execution in RS-027
No approval/execution release in RS-027
```

RS-027은 실제 virtual runner pass/fail 판정기가 아니다. RS-026 dry-run result adapter의 `simulated_not_executed` 결과를 operator 검토용 `review_needed` projection으로 표시한다.
