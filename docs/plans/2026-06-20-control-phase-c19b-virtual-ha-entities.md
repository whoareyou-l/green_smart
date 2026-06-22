# Control Phase C19B — 가상 HA 엔티티 생성/제어 하네스

> 기준 버전: v1.9.22
> 상태: 완료
> 대상: `__init__.py`, `sensor.py`, `switch.py`, `cover.py`, `zone_control_views.py`, `green-smart-panel.js`

## 목표

C19에서 정의한 가상 entity ID를 실제 Home Assistant state machine에 생성해 Entity Mapping, Entity 상태 요약, Dry Run, SafetyGuard, Virtual Rehearsal을 실제 entity_id 기준으로 검증할 수 있게 한다.

## 핵심 원칙

```text
가상 HA 엔티티는 테스트용이다.
실제 장비 연결은 여전히 금지다.
```

## Platform contract

```text
PLATFORMS: ["sensor", "binary_sensor", "switch", "cover"]
green_smart virtual device mode: forwarding virtual entity platforms
sensor.py
binary_sensor.py
switch.py
cover.py
GreenSmartVirtualSensor
GreenSmartVirtualSwitch
GreenSmartVirtualCover
```

## Entity IDs

```text
sensor.green_smart_virtual_environment_wind_speed
sensor.green_smart_virtual_irrigation_temperature
binary_sensor.green_smart_virtual_device_rain
cover.green_smart_virtual_environment_ventilation
cover.green_smart_virtual_device_screen
switch.green_smart_virtual_environment_irrigation_pump
switch.green_smart_virtual_device_alarm_beacon
```

## Rehearsal state contract

```text
_set_virtual_rehearsal_entity_states
virtualEntityStatesApplied
hass.states.async_set
physicalDeviceConnectionAllowed: false
```

## 완료 기준

- Virtual mode config entry에서도 sensor/switch/cover platform이 forward된다.
- 가상 센서/스위치/커버 entity가 HA에 생성된다.
- Virtual rehearsal 실행 시 simulated sensor/device state가 state machine에 반영된다.
- 실제 장비 연결 gate는 닫힌 상태를 유지한다.
