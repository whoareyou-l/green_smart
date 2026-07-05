from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-05-system-integration-actions-execution-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_122_system_action_api_views_and_routes_exist():
    views = _read(VIEWS)
    for marker in (
        "class RebuildSettingsSystemUpdateView",
        "class RebuildSettingsSystemErrorsView",
        "class RebuildSettingsSystemCenterConnectionView",
        'url = "/api/green_smart/rebuild/settings/system/update"',
        'url = "/api/green_smart/rebuild/settings/system/errors"',
        'url = "/api/green_smart/rebuild/settings/system/center-connection"',
        "system_update_response",
        "system_errors_response",
        "system_center_connection_response",
        "_discover_update_entities",
        "_center_connection_store",
        "async def get(self, request: web.Request) -> web.Response",
        "async def post(self, request: web.Request) -> web.Response",
    ):
        assert marker in views


def test_r7_122_system_action_views_are_registered_in_both_setup_paths():
    init = _read(INIT)
    for marker in (
        "RebuildSettingsSystemUpdateView",
        "RebuildSettingsSystemErrorsView",
        "RebuildSettingsSystemCenterConnectionView",
        "hass.http.register_view(RebuildSettingsSystemUpdateView())",
        "hass.http.register_view(RebuildSettingsSystemErrorsView())",
        "hass.http.register_view(RebuildSettingsSystemCenterConnectionView())",
    ):
        assert marker in init


def test_r7_122_update_api_is_bounded_to_gs_hacs_and_defers_ha_db():
    views = _read(VIEWS)
    for marker in (
        '"target": "gs"',
        '"target": "hacs"',
        '"target": "ha"',
        '"target": "db"',
        '"state": "deferred"',
        "homeassistant.update_entity",
        "update.install",
        "GS/HACS only",
    ):
        assert marker in views
    for forbidden in ("docker compose", "docker.sock", "subprocess.run", "os.system"):
        assert forbidden not in views


def test_r7_122_errors_api_exposes_sanitized_watchdog_actions():
    views = _read(VIEWS)
    for marker in (
        "refresh-watchdog",
        "inspect-center",
        "inspect-db",
        "inspect-edge",
        "centerConnectionStatus",
        "dbErrorCount",
        "edgeApiErrorCount",
        "hints",
        "system_errors_response",
    ):
        assert marker in views


def test_r7_122_center_connection_api_stores_redacted_config_and_validates():
    views = _read(VIEWS)
    for marker in (
        "green_smart_center_connection",
        "credentialState",
        "configured",
        "missing",
        "Authorization",
        "Bearer",
        "/health",
        "/status",
        "connectionStatus",
        "[REDACTED]",
    ):
        assert marker in views
    assert "rawSecret" not in views


def test_r7_122_frontend_wires_action_cards_to_system_action_apis():
    panel = _read(PANEL)
    for marker in (
        'REBUILD_SETTINGS_SYSTEM_UPDATE_API_PATH = "green_smart/rebuild/settings/system/update"',
        'REBUILD_SETTINGS_SYSTEM_ERRORS_API_PATH = "green_smart/rebuild/settings/system/errors"',
        'REBUILD_SETTINGS_SYSTEM_CENTER_CONNECTION_API_PATH = "green_smart/rebuild/settings/system/center-connection"',
        "_openSettingsSystemUpdateModal",
        "_openSettingsSystemErrorsModal",
        "_openSettingsSystemCenterConnectionModal",
        "_submitSettingsSystemUpdateAction",
        "_submitSettingsSystemErrorsAction",
        "_submitSettingsSystemCenterConnectionForm",
        "this.hass.callApi(\"GET\", REBUILD_SETTINGS_SYSTEM_UPDATE_API_PATH)",
        "this.hass.callApi(\"GET\", REBUILD_SETTINGS_SYSTEM_ERRORS_API_PATH)",
        "this.hass.callApi(\"GET\", REBUILD_SETTINGS_SYSTEM_CENTER_CONNECTION_API_PATH)",
    ):
        assert marker in panel


def test_r7_122_plan_document_exists_with_safety_boundaries():
    plan = _read(PLAN)
    for phrase in (
        "GS/HACS updates",
        "Do not update HA Docker, MariaDB",
        "DB/API 오류",
        "Center connection",
        "Secret/token values must never render",
    ):
        assert phrase in plan
