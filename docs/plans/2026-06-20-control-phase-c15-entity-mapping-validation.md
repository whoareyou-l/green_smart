# Control Phase C15 — Entity Mapping 검증 / Setup Assistant

> 기준 버전: v1.9.22
> 상태: 완료
> 대상: `zone_control_views.py`, `green-smart-panel.js`, `zone_device_entity_mappings`

## 목표

실제 실행 전에 entity_id 존재 여부, domain/service 호환성, safe_state 유효성, final target 대비 mapping 누락을 운영자가 확인할 수 있게 한다.

## Backend contract

```text
ENTITY_MAPPING_VALIDATION_SERVICE_DOMAINS
_entity_mapping_expected_service_domain
_validate_entity_mapping_item
_validate_entity_mapping_response
ZoneEntityMappingValidationView
GET /api/green_smart/zones/entity-mapping-validation
entity_mapping_validation_checked
```

Validation fields:

```text
entityExists
serviceCompatible
safeStateValid
missingSafeState
mappingValidationStatus
validationIssues
unmappedTargetKeys
```

## Panel contract

```text
_zoneEntityMappingValidationCache
_fetchZoneEntityMappingValidation(domain)
_renderZoneEntityMappingValidationCard(domain)
_bindZoneEntityMappingValidationInputs(root)
data-zone-entity-validation-card
data-zone-entity-validation-refresh
data-zone-entity-validation-row
data-zone-entity-validation-status
data-zone-entity-validation-issue
Entity Mapping 검증
Setup Assistant
entity_id 존재
domain/service 호환성
safe_state 유효성
위험 장비 mapping 누락
검증 실행
```

## 다음 단계

Control Phase C16 — 실시간 Sensor 기반 Safety Rule.
