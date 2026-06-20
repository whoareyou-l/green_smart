# Phase 2A — SafetyGuard Decision Layer Baseline

> 기준 버전: v1.9.13
> 대상: `zone_control_views.py`, execution log summary, panel execution log card

## 목적

Phase 1에서 만든 인터록 설정/Rule Builder를 실제 실행 경로 앞단의 독립 판단 계층으로 연결한다.

이번 Phase 2A는 강풍/저온/VWC/EC 등 모든 센서 규칙을 완성하지 않는다. 먼저 아래 baseline을 고정한다.

```text
final target execution
→ control mode gate
→ entity mapping / pre-state snapshot
→ SafetyGuard decision
→ blocked / failsafe / clear result schema
→ HA service call or block
→ audit log + panel summary
```

## 추가된 helper

```text
_safety_guard_policy(final_target, interlock_settings)
_safety_guard_rule_matches(rule, mapping, pre_state, call)
_safety_guard_result_schema(...)
_safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state)
```

기존 helper는 legacy wrapper로 유지한다.

```text
_interlock_failsafe_decision(...)
```

## 정책 merge

SafetyGuard policy는 두 source를 병합한다.

```text
zone_interlock_settings.settings_json
+ zone_final_control_targets.targets._safety
```

즉 Phase 1E rule builder에서 저장한 `settings_json.rules[]`가 실행 전 판단에 반영된다.

## Result schema

```json
{
  "status": "clear | blocked | failsafe",
  "blocked": false,
  "failSafeRequired": false,
  "reasons": [],
  "ruleResults": [],
  "safeStateCall": null
}
```

Execution response/log에도 `safetyGuard` summary를 포함한다.

## 지원 조건 baseline

이번 slice에서 rule matcher가 다루는 조건:

```text
unavailable
unknown
above
below
equals
```

아직 도메인별 센서 의미론은 최소 baseline이다. 강풍/저온/고온/VWC/EC별 운영 rule preset은 Phase 2B 이후 확장한다.

## Audit action

새 action marker:

```text
safety_guard_blocked
```

기존 static contract 호환을 위해 legacy marker `interlock_blocked`는 코드에 보존한다.

## Panel

실행/안전 로그 카드에 SafetyGuard 요약을 표시한다.

```text
SafetyGuard 안전 판단
ruleResults count
```

## 검증

```text
pytest -q
→ 104 passed

python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/db.py custom_components/green_smart/__init__.py
→ pass

node --check custom_components/green_smart/panel/green-smart-panel.js
→ pass
```

## 다음 단계

Phase 2B 후보:

```text
SafetyGuard rule preset / semantic rules
- 강풍
- 저온
- 고온
- 센서 무결성
- VWC
- EC
- 1분 fallback 검사
```
