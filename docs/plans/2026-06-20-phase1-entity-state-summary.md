# Green Smart Phase 1B Entity State Summary Plan

> 기준 버전: v1.9.6에서 유지되는 Phase 1B 산출물
> 목표: Phase 2 SafetyGuard가 사용할 HA entity 현재 상태 조회 기반을 만든다.

## Scope

Phase 1B는 실제 차단 로직을 변경하지 않는다. `zone_device_entity_mappings`에 등록된 entity_id를 기준으로 Home Assistant state machine에서 현재 state/attributes/last_updated를 읽어 panel에 표시한다.

## 산출물

1. Contract test
   - `tests/test_zone_control_api_contract.py`
   - `test_phase1_entity_state_summary_api_and_panel_contract`

2. Backend API
   - `GET /api/green_smart/zones/entity-state-summary`
   - domain wrappers are not needed yet; the common zone route is enough.

3. API response contract

```json
{
  "ok": true,
  "farmId": 1,
  "cropSeasonId": 1,
  "zoneId": 1,
  "domain": "environment",
  "summary": {
    "totalCount": 2,
    "availableCount": 1,
    "unavailableCount": 1,
    "unknownCount": 0,
    "staleCount": 0,
    "hasBlockingState": true
  },
  "items": [
    {
      "mappingId": 1,
      "deviceType": "roof_window",
      "controlRole": "ventilation",
      "entityId": "cover.zone1_roof",
      "state": "open",
      "available": true,
      "unknown": false,
      "lastUpdated": "...",
      "attributes": {}
    }
  ]
}
```

4. Panel UI
   - `_zoneEntityStateSummaryCache`
   - `_fetchZoneEntityStateSummary(domain)`
   - `_renderZoneEntityStateSummaryCard(domain)`
   - `_bindZoneEntityStateSummaryInputs(root)`
   - 3개 제어 페이지에 카드 표시
   - Korean labels: `Entity 상태 요약`, `현재 상태`, `사용 가능`, `unavailable`, `unknown`, `상태 새로고침`

## Verification

```bash
pytest tests/test_zone_control_api_contract.py::test_phase1_entity_state_summary_api_and_panel_contract -q
pytest -q
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 -m py_compile custom_components/green_smart/db.py custom_components/green_smart/zone_control_views.py custom_components/green_smart/__init__.py
```

## Not in this slice

- 강풍/저온/고온/VWC/EC 차단 판단
- entity stale threshold 설정 UI
- 자동 실행 차단 변경
- persistent notification
