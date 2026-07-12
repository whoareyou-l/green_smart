# RS-024 Rehearsal Result Review Projection

> 기준 버전: `v1.15.46`
> Status: rehearsal result review projection
> 목적: `가상 실행 리허설` 다음 단계로 `추천·실행` 화면에 리허설 결과 검토 상태를 read-only projection으로 표시한다.

## 0. Boundary decision

```text
rehearsalResultReviewProjection
virtualExecutionRehearsalScaffold → rehearsalResultReviewProjection
리허설 결과 검토
reviewState
resultSummary
scenarioResults
normal
strong_wind
rain
low_temperature
sensor_fault
blocked
fail_safe
recovery
No production route removal in RS-024
No DB migration in RS-024
No write/mutation in RS-024
No real-device hookup in RS-024
No MQTT/device command in RS-024
No approval/execution release in RS-024
```

RS-024는 실제 virtual runner가 아니다. 시나리오별 결과는 `not_run` 상태로 표시하며, 승인 해제·실행·MQTT·장치 명령은 제공하지 않는다.
