# Green Smart Phase 1A Interlock Settings Implementation Plan

> **For Hermes:** Use test-driven-development skill for each code slice.

**Goal:** Add the first Phase 1 foundation: zone/domain scoped interlock settings storage, API, registration, and panel card entry point without changing existing execution semantics.

**Architecture:** Keep the Home Assistant custom integration/HACS structure. Add a new MariaDB table and `HomeAssistantView` route under `zone_control_views.py`; add a lightweight panel card/helper/cache to surface settings. Do not migrate existing final-target execution logic yet.

**Tech Stack:** Home Assistant custom integration, Python, MariaDB/aiomysql, Vanilla JS Web Component, pytest contract tests.

---

## Assumptions

- Use current `farm_id + crop_season_id + zone_id + domain` scope.
- Do not add `customer_id/site_id/edge_id` columns yet.
- Interlock settings are stored as JSON to avoid premature schema churn.
- Existing `_safety` final-target behavior remains compatible.
- SafetyGuard execution integration will be Phase 2; this slice is configuration foundation.

## Task 1: Add RED contract for interlock settings foundation

**Files:**
- Modify: `tests/test_zone_control_api_contract.py`

**Checks:**
- DB has `zone_interlock_settings` table.
- Backend defines `ZoneInterlockSettingsView` with route `/api/green_smart/zones/interlock-settings`.
- `__init__.py` imports/registers the view.
- Panel has `_zoneInterlockSettingsCache`, `_fetchZoneInterlockSettings`, `_saveZoneInterlockSettings`, `_renderZoneInterlockSettingsCard`, and Korean labels.

## Task 2: Implement DB table

**Files:**
- Modify: `custom_components/green_smart/db.py`

**Table:**
- `zone_interlock_settings`
- scope: `farm_id`, `crop_season_id`, `zone_id`, `domain`
- JSON column: `settings_json`
- enabled flag, actor, timestamps
- unique scope key

## Task 3: Implement API view

**Files:**
- Modify: `custom_components/green_smart/zone_control_views.py`
- Modify: `custom_components/green_smart/__init__.py`

**Routes:**
- `GET /api/green_smart/zones/interlock-settings`
- `POST /api/green_smart/zones/interlock-settings`

**Response:**
- `found`, `enabled`, `settings`, `updatedAt`, scope fields.

**Audit:**
- `interlock_settings_saved` into `zone_control_logs`.

## Task 4: Implement panel card skeleton

**Files:**
- Modify: `custom_components/green_smart/panel/green-smart-panel.js`

**UI:**
- Add interlock settings card below Scope Bar and above AI/final-target card on environment/irrigation/device pages.
- Provide refresh/save buttons and JSON textarea for first slice.
- Include Korean labels: `인터록 설정`, `안전 기준`, `인터록 저장`, `저장 완료`.

## Task 5: Verification

Run:

```bash
pytest tests/test_zone_control_api_contract.py::test_phase1_interlock_settings_api_and_panel_contract -q
pytest -q
node --check custom_components/green_smart/panel/green-smart-panel.js
python3 -m py_compile custom_components/green_smart/db.py custom_components/green_smart/zone_control_views.py custom_components/green_smart/__init__.py
```

Expected:

```text
1 passed for targeted test
all tests passed
node --check exit 0
py_compile exit 0
```

## Task 6: Update docs and release hygiene

**Files:**
- Update: `docs/PROJECT_MASTER_PLAN.md`
- Update if needed: `docs/design/api-spec.md`, `docs/design/data-model.md`, `docs/design/control-engine-contracts.md`

Commit after verification.
