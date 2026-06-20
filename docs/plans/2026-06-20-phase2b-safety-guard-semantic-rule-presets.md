# Phase 2B — SafetyGuard Semantic Rule Presets

> 기준 버전: v1.9.16
> 대상: SafetyGuard matcher, interlock rule builder UI, execution log contract

## 목적

Phase 2A에서 만든 SafetyGuard decision layer 위에 농장 운영 의미가 분명한 rule preset baseline을 붙인다.

이번 단계는 DB/API shape를 바꾸지 않는다.

```text
zone_interlock_settings.settings_json.rules[]
```

안에 저장되는 `condition`, `threshold`, `reasonCode`를 의미 있는 안전 규칙으로 표준화한다.

## 추가된 preset

```text
wind_speed_above      강풍 초과
temperature_below     저온 미만
temperature_above     고온 초과
vwc_below             VWC 미만
vwc_above             VWC 초과
ec_below              EC 미만
ec_above              EC 초과
sensor_integrity      센서 무결성
```

## Backend markers

```text
SAFETY_GUARD_RULE_PRESETS
_safety_guard_numeric_value(pre_state, rule)
_safety_guard_reason_code(rule, default_code)
```

## Numeric extraction

SafetyGuard는 rule condition/preset에 따라 아래 후보에서 actual value를 찾는다.

```text
rule.attribute
rule.attributeName
preset.attribute
value
temperature
current_temperature
wind_speed
windSpeed
vwc
ec
current_position
state fallback
```

## Matcher semantics

```text
unavailable             available=false 또는 state=unavailable
unknown                 state=unknown
sensor_integrity        unavailable/unknown/none/nan/empty
above 계열              actualValue > threshold
below 계열              actualValue < threshold
equals                  state == threshold/value
```

above 계열:

```text
above
wind_speed_above
temperature_above
vwc_above
ec_above
```

below 계열:

```text
below
temperature_below
vwc_below
ec_below
```

## Result detail

`ruleResults[]`는 다음 필드를 포함한다.

```text
matched
condition
state
reason
reasonCode
actualValue
threshold
rule
call
```

`reasons[]`는 matched rule의 `reasonCode`를 우선 사용한다.

## Panel

Rule Builder 조건 option에 semantic preset을 추가했다.

```text
강풍 초과
저온 미만
고온 초과
VWC 미만
VWC 초과
EC 미만
EC 초과
센서 무결성
```

또한 rule row에 `reasonCode` 입력 필드를 추가했다.

## 검증

```text
pytest -q
→ 105 passed

python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/db.py custom_components/green_smart/__init__.py
→ pass

node --check custom_components/green_smart/panel/green-smart-panel.js
→ pass
```

## 다음 단계

Phase 2C 후보:

```text
1분 fallback checker / watchdog
HA persistent notification critical safety event
sensor stale threshold
SafetyGuard event log/detail panel
```
