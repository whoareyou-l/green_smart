# Phase 1E — Interlock Rule Builder UI

> 기준 버전: v1.9.22
> 대상: Home Assistant side panel interlock settings card

## 목적

Phase 2 SafetyGuard 실행 연결 전에 운영자가 JSON textarea만 편집하지 않고, 세부 인터록 규칙을 구조화 UI로 입력할 수 있게 한다.

이번 Phase 1E는 DB/API를 새로 만들지 않는다. 기존 저장소를 그대로 사용한다.

```text
zone_interlock_settings.settings_json
```

## 유지되는 저장 구조

```json
{
  "emergency_stop": false,
  "block_on_unavailable": true,
  "apply_safe_state_on_block": true,
  "rules": [
    {
      "control_role": "ventilation",
      "condition": "unavailable",
      "threshold": "",
      "action": "block",
      "message": "환기 장치 상태 확인 필요",
      "block": true
    }
  ]
}
```

## Panel helper

추가된 helper:

```text
_defaultZoneInterlockSettings()
_normalizeZoneInterlockSettings(settings)
_readZoneInterlockSettingsFromCard(domain)
_addZoneInterlockRule(domain)
_deleteZoneInterlockRule(domain, index)
_renderZoneInterlockRuleBuilder(domain, settings)
```

## UI marker

```text
data-zone-interlock-rule-builder
data-zone-interlock-rule-row
data-zone-interlock-rule-role
data-zone-interlock-rule-condition
data-zone-interlock-rule-threshold
data-zone-interlock-rule-action
data-zone-interlock-rule-message
data-zone-interlock-rule-add
data-zone-interlock-rule-delete
```

## 운영자 입력 항목

```text
긴급 정지
unavailable 차단
Fail Safe 적용
제어 역할
조건
임계값
차단 동작
운영자 메시지
```

## 호환성

기존 `data-zone-interlock-json` textarea는 `settings_json 미리보기`로 유지한다.

하지만 저장 시에는 더 이상 JSON.parse textarea에 의존하지 않고, 구조화 입력값을 `_readZoneInterlockSettingsFromCard(domain)`로 읽어서 기존 API에 POST한다.

## 검증

```text
pytest -q
→ 103 passed

node --check custom_components/green_smart/panel/green-smart-panel.js
→ pass

python3 -m py_compile custom_components/green_smart/zone_control_views.py custom_components/green_smart/db.py custom_components/green_smart/__init__.py
→ pass
```

## 다음 단계

이제 Phase 1 기반은 운영자가 볼 수 있는 형태까지 완료됐다. 다음은 Phase 2A에서 SafetyGuard 독립 계층을 시작하는 것이 자연스럽다.
