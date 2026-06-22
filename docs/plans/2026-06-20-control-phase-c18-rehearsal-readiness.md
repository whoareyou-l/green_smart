# Control Phase C18 — 현장 리허설/시나리오 테스트 준비

> 기준 버전: v1.9.22
> 상태: 완료
> 대상: `zone_control_views.py`, `green-smart-panel.js`, `zone_control_logs`

## 목표

정상/강풍/강우/저온/센서 고장/차단/Fail Safe/복구 시나리오를 운영 테스트 체크리스트로 정리하고 smoke 가능한 절차를 만든다.

## Backend contract

```text
REHEARSAL_SCENARIO_IDS
_rehearsal_scenario_templates
_rehearsal_readiness_response
ZoneRehearsalReadinessView
GET /api/green_smart/zones/rehearsal-readiness
rehearsal_readiness_checked
scenarioReadinessStatus
scenarioChecklist
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
_zoneRehearsalReadinessCache
_fetchZoneRehearsalReadiness(domain)
_renderZoneRehearsalReadinessCard(domain)
_bindZoneRehearsalReadinessInputs(root)
data-zone-rehearsal-card
data-zone-rehearsal-refresh
data-zone-rehearsal-scenario-row
data-zone-rehearsal-check-row
현장 리허설
시나리오 테스트
리허설 준비도
```

## 완료 기준

- Rehearsal readiness API가 C14~C17의 dry run, mapping validation, SafetyGuard, sensor rule, safe_state, operator confirmation 준비 상태를 조합한다.
- Panel에서 정상/강풍/강우/저온/센서 고장/차단/Fail Safe/복구 체크리스트를 확인할 수 있다.
- 실제 장비를 움직이지 않는다.
