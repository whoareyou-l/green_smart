# RS-026 Virtual Runner Dry-run Result Adapter

> 기준 버전: `v1.15.38`
> Status: virtual runner dry-run result adapter
> 목적: `가상 러너 입력 계약` 다음 단계로, 향후 virtual runner 결과를 받을 UI/API shape를 read-only dry-run result adapter로 고정한다.

## 0. Boundary decision

```text
virtualRunnerDryRunResultAdapter
virtualRunnerInputContract → virtualRunnerDryRunResultAdapter
가상 dry-run 결과 어댑터
adapterState
dryRunMode
scenarioDryRunResults
sourceInputContract
resultAuthority
summaryState
normal
strong_wind
rain
low_temperature
sensor_fault
blocked
fail_safe
recovery
No production route removal in RS-026
No DB migration in RS-026
No write/mutation in RS-026
No real-device hookup in RS-026
No MQTT/device command in RS-026
No virtual runner execution in RS-026
No approval/execution release in RS-026
```

RS-026은 실제 virtual runner가 아니다. RS-025 입력 계약을 `simulated_not_executed` 결과 shape로 어댑트해 검토 가능하게 만드는 read-only 단계다.
