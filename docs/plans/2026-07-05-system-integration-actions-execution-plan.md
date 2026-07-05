# System Integration Actions Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the Settings → 시스템·연동 action cards into working, bounded operations for GS/HACS updates, DB/API error inspection/remediation, and Center connection setup.

**Architecture:** Keep dangerous Docker/DB/HA host updates out of this slice. Implement HA-safe HomeAssistantView APIs under `/api/green_smart/rebuild/settings/system/*`, store only redacted/non-secret status in snapshots, and expose UI modals/actions from the existing CDB action cards. GS/HACS update actions are limited to HACS/HA-update-service compatible requests or safe deferred responses when no update entity exists; HA/MariaDB updates remain future Update Agent work.

**Tech Stack:** Home Assistant custom integration, aiohttp `HomeAssistantView`, HA services/states, aiomysql-backed settings snapshot, vanilla JS Web Component panel, pytest contract tests, Docker prod smoke.

---

## Confirmed scope

1. **업데이트 card**
   - Implement working backend/frontend for **GS** and **HACS** update checks/actions only.
   - Do not update HA Docker, MariaDB, MQTT, InfluxDB, or host packages in this slice.
   - If no HA update entity/service is available, return a clear deferred/unsupported result, not a fake success.

2. **DB/API 오류 card**
   - Define useful operator actions:
     - refresh watchdog now,
     - show sanitized DB/API error rows from the current watchdog snapshot,
     - provide fix hints for Center 미연결, DB 오류, Edge 오류,
     - clear/acknowledge current inspection state in UI only.
   - Do not auto-edit DB or secrets from this card in this slice.

3. **Center 연결 card**
   - Provide a Center credential connection flow that stores allowed connection config in HA storage, not in rendered UI.
   - Validate connection via central health/status endpoint.
   - Existing central weather/pesticide routes should be able to use configured Center base URL/credential path when available.
   - Secret/token values must never render; UI labels may say `허용 토큰`, but source markers must avoid raw `token` literals where legacy secret contracts forbid them.

## Non-goals

- Docker host update-agent implementation.
- MariaDB image upgrade.
- Home Assistant container upgrade.
- Full OAuth/activation exchange with a real external Greenity cloud if credentials/endpoints are absent.
- Persisting raw secrets in MariaDB.

---

### Task 1: Add backend contracts for system action APIs

**Objective:** Lock API routes and response shapes before implementation.

**Files:**
- Create: `tests/test_r7_122_system_integration_action_api_contract.py`
- Modify: `tests/test_r7_120_system_integration_cdb_cards_contract.py`

**Steps:**
1. Add tests requiring these views/classes/routes in `rebuild_settings_write_views.py`:
   - `RebuildSettingsSystemUpdateView`
   - `RebuildSettingsSystemErrorsView`
   - `RebuildSettingsSystemCenterConnectionView`
   - `/api/green_smart/rebuild/settings/system/update`
   - `/api/green_smart/rebuild/settings/system/errors`
   - `/api/green_smart/rebuild/settings/system/center-connection`
2. Require registration in `__init__.py` in both schema-bootstrap and no-heavy paths.
3. Require frontend constants/callApi usage.
4. Run targeted tests and verify RED.

Expected RED: missing classes/routes/constants.

---

### Task 2: Implement DB/API error inspection API

**Objective:** Make the DB/API 오류 card useful without dangerous automatic mutation.

**Files:**
- Modify: `custom_components/green_smart/rebuild_settings_write_views.py`
- Test: `tests/test_r7_122_system_integration_action_api_contract.py`

**Implementation shape:**
- `GET /system/errors` returns:
  - `ok`
  - `checkedAt`
  - `errors`: rows like `{scope, status, count, hints}`
  - `actions`: `refresh-watchdog`, `inspect-center`, `inspect-db`, `inspect-edge`
- `POST /system/errors` with `{action: "refresh-watchdog"}` reruns `system_integration_watchdog_response(hass)` and returns the same shape.

**Safety:** Sanitize exception names only; no raw connection strings, passwords, or secret values.

---

### Task 3: Implement GS/HACS update API with safe fallback

**Objective:** Allow the update card to check/request GS/HACS updates without pretending Docker/DB updates are supported.

**Files:**
- Modify: `custom_components/green_smart/rebuild_settings_write_views.py`
- Test: `tests/test_r7_122_system_integration_action_api_contract.py`

**Implementation shape:**
- `GET /system/update` returns component statuses for `gs`, `hacs`, plus deferred `ha`, `db`.
- `POST /system/update` accepts `{target: "gs"|"hacs", action: "check"|"install"}`.
- It discovers HA `update.*` entities whose entity_id/friendly_name contains `green_smart`, `green smart`, or `hacs`.
- For `check`, call `homeassistant.update_entity` when available or return `deferred`.
- For `install`, call `update.install` only when a matching update entity exists; otherwise return `supported: false`, `state: deferred`.

**Safety:** No Docker commands; no direct file overwrite; no raw token rendering.

---

### Task 4: Implement Center connection storage and validation API

**Objective:** Let the Center 연결 card save/validate Center connection config used by central API clients.

**Files:**
- Modify: `custom_components/green_smart/rebuild_settings_write_views.py`
- Modify: `custom_components/green_smart/central_api.py` if needed
- Test: `tests/test_r7_122_system_integration_action_api_contract.py`

**Implementation shape:**
- Store config in HA `.storage` via `Store`, key `green_smart_center_connection`.
- Payload fields:
  - `baseUrl`
  - `allowedCredential` or equivalent secret input, never returned raw
  - `enabled`
- Return only redacted state:
  - `credentialState: "configured"|"missing"`
  - `baseUrl`
  - `connectionStatus`
- Validate with `GET {baseUrl}/health` or `/status`; include Authorization header if credential provided.
- Set `hass.data[DOMAIN]["center_connection"]` so central API paths can reuse it.

---

### Task 5: Wire frontend modals/actions

**Objective:** Make all three action cards call the new APIs and show operator-readable results.

**Files:**
- Modify: `custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js`
- Tests:
  - `tests/test_r7_120_system_integration_cdb_cards_contract.py`
  - `tests/test_r7_122_system_integration_action_api_contract.py`

**Implementation shape:**
- Add constants:
  - `REBUILD_SETTINGS_SYSTEM_UPDATE_API_PATH`
  - `REBUILD_SETTINGS_SYSTEM_ERRORS_API_PATH`
  - `REBUILD_SETTINGS_SYSTEM_CENTER_CONNECTION_API_PATH`
- Add state object `_settingsSystemActionModal`.
- Buttons:
  - 업데이트 → open modal showing GS/HACS actions and HA/DB deferred rows.
  - DB/API 오류 → fetch errors and show refresh button + hints.
  - Center 연결 → show baseUrl/credential input, save+validate, list status.
- Keep CDB action-card layout unchanged.

---

### Task 6: Docs, verification, prod, release

**Objective:** Complete the slice with docs, full verification, prod smoke, and GitHub release.

**Files:**
- Modify: `docs/rebuild/r7-120-system-integration-cdb-cards.md`
- Modify/Create: release docs as needed

**Verification commands:**
```bash
node --check custom_components/green_smart/panel/green-smart-panel.js
node --check custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js
python3 -m py_compile custom_components/green_smart/*.py custom_components/green_smart/repositories/legacy_adapters/*.py custom_components/green_smart/repositories/*.py
pytest -q
```

**Prod smoke:**
- Copy component to prod HA container.
- Run HA config check.
- Restart HA.
- Fetch served rebuild JS.
- Verify new constants/routes/markers.
- Hit safe GET endpoints if auth context allows or directly import response helpers in container.
- Check 20s logs for errors.

**Release:**
- Bump to next version.
- Commit, tag, push, GitHub Release.
