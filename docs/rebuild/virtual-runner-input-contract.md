# RS-025 Virtual Runner Input Contract

> 기준 버전: `v1.12.37`
> Status: virtual runner input contract
> 목적: `리허설 결과 검토` 다음 단계로, 향후 실제 virtual runner가 사용할 입력 shape를 read-only 계약으로 고정한다.

## 0. Boundary decision

```text
virtualRunnerInputContract
rehearsalResultReviewProjection → virtualRunnerInputContract
가상 러너 입력 계약
inputState
runnerMode
inputScenarios
sourceReview
executionCandidate
normal
strong_wind
rain
low_temperature
sensor_fault
blocked
fail_safe
recovery
No production route removal in RS-025
No DB migration in RS-025
No write/mutation in RS-025
No real-device hookup in RS-025
No MQTT/device command in RS-025
No virtual runner execution in RS-025
No approval/execution release in RS-025
```

RS-025는 실제 virtual runner가 아니다. 리허설 결과 검토 projection에서 input scenario shape만 넘겨받아 `contract_ready_not_executable` 상태로 표시한다.
