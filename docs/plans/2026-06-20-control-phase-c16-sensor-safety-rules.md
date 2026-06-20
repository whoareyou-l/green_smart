# Control Phase C16 — 실시간 Sensor 기반 Safety Rule

> 기준 버전: v1.9.18
> 상태: 완료
> 대상: `zone_control_views.py`, `green-smart-panel.js`, `zone_control_logs`

## 목표

풍속/강우/저온/탱크수위/펌프 fault 등 HA sensor 기반 차단 rule을 SafetyGuard 실행 경로에 연결한다.

## Backend contract

```text
SENSOR_SAFETY_RULE_OPERATORS
_sensor_safety_rule_snapshot
_sensor_safety_rule_value
_sensor_safety_rule_matches
_sensor_safety_rule_results
sensor_entity_id
sensorEntityId
sensorAttribute
sensorOperator
sensorActualValue
sensorThreshold
sensorRuleMatched
sensorSafetyStatus
sensorSafetyResults
sensor_safety_rule_blocked
```

## Rule 예시

```json
{
  "control_role": "ventilation",
  "sensor_entity_id": "sensor.wind_speed",
  "sensor_attribute": "wind_speed",
  "sensor_operator": "above",
  "threshold": 8,
  "reasonCode": "wind_speed_above",
  "action": "block",
  "block": true
}
```

## Panel contract

```text
data-zone-interlock-rule-sensor-entity
data-zone-interlock-rule-sensor-attribute
data-zone-interlock-rule-sensor-operator
실시간 Sensor 기반 Safety Rule
센서 entity
센서 속성
센서 연산자
풍속
강우
저온
탱크수위
펌프 fault
```

## 완료 기준

- Sensor rule이 `_safety_guard_decision` 안에서 평가된다.
- 매칭된 sensor rule은 `sensor_safety_rule_blocked` 로그 action 또는 response의 `sensorSafetyStatus`/`sensorSafetyResults`에 남는다.
- 기존 dry run/failsafe/state verification 경로와 호환된다.
- C14~C16 완료로 제한적 현장 운영 테스트 가능 기준에 도달한다.
