# Control Phase C19 — 가상 장치 기반 리허설 테스트 하네스

> 기준 버전: v1.9.22
> 상태: 완료
> 대상: `zone_control_views.py`, `green-smart-panel.js`, `zone_control_logs`

## 목표

실제 장비를 물리기 전에 가상 장치/가상 센서로 인터록, 운영 알고리즘, UI/운영자 UX를 시뮬레이션 검증한다.

## 핵심 원칙

```text
실제 장비 연결 금지: 가상 장치/시뮬레이션 통과 전 physical device 연결 금지
```

## Backend contract

```text
POST /api/green_smart/zones/virtual-rehearsal
VIRTUAL_REHEARSAL_ENTITY_PREFIX
VIRTUAL_REHEARSAL_SCENARIO_IDS
_virtual_rehearsal_device_catalog
_virtual_rehearsal_scenario_plan
_virtual_rehearsal_run_response
ZoneVirtualRehearsalView
virtual_rehearsal_executed
virtualDeviceOnly
physicalDeviceGate
physicalDeviceConnectionAllowed: false
virtualRehearsalStatus
virtualScenarioResults
simulatedServiceCalls
simulatedSensorStates
```

## Scenario IDs

```text
normal_operation
strong_wind_block
rain_block
low_temperature_block
sensor_fault_block
failsafe_recovery
operator_recovery
```

## Panel contract

```text
_zoneVirtualRehearsalCache
_runZoneVirtualRehearsal(domain)
_renderZoneVirtualRehearsalCard(domain)
_bindZoneVirtualRehearsalInputs(root)
data-zone-virtual-rehearsal-card
data-zone-virtual-rehearsal-run
data-zone-virtual-rehearsal-scenario-row
data-zone-virtual-rehearsal-call-row
가상 장치
가상 센서
가상 리허설 실행
실제 장비 연결 금지
시뮬레이션
인터록
운영 알고리즘
UI/운영자 UX
```

## 완료 기준

- 가상 리허설 route는 실제 HA service call/physical device를 호출하지 않는다.
- normal/strong wind/rain/low temperature/sensor fault/Fail Safe/operator recovery 시나리오가 simulated result로 반환된다.
- `physicalDeviceConnectionAllowed`는 false로 유지된다.
- Panel에서 가상 장치 리허설 실행과 결과를 확인할 수 있다.
