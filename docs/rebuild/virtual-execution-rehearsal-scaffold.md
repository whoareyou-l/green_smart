# RS-023 Virtual Execution Rehearsal Scaffold

> 기준 버전: `v1.15.36`
> Status: virtual execution rehearsal scaffold
> 목적: `Safety / Interlock / Fail Safe 사전검증` 다음 단계로 `추천·실행` 화면에 가상 실행 리허설 상태를 read-only scaffold로 표시한다.

## 0. Boundary decision

```text
virtualExecutionRehearsalScaffold
safetyInterlockPreflightProjection → virtualExecutionRehearsalScaffold
가상 실행 리허설
normal
strong_wind
rain
low_temperature
sensor_fault
blocked
fail_safe
recovery
No production route removal in RS-023
No DB migration in RS-023
No write/mutation in RS-023
No real-device hookup in RS-023
No MQTT/device command in RS-023
```

RS-023은 실제 실행을 만들지 않는다. 정상, 강풍, 비, 저온, 센서 장애, blocked, Fail Safe, 복구 상황을 read-only 리허설 세트로 보여주는 단계다.
