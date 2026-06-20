from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"
VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def test_db_bootstrap_creates_zone_control_backend_tables():
    source = DB.read_text(encoding="utf-8")
    for table in (
        "zone_control_settings",
        "zone_final_control_targets",
        "zone_control_logs",
        "zone_control_copy_jobs",
        "ai_zone_control_outputs",
    ):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in source
    for key in (
        "uniq_zone_control_settings",
        "farm_id INT NOT NULL DEFAULT 1",
        "crop_season_id INT NOT NULL",
        "zone_id INT NOT NULL",
        "domain VARCHAR(32) NOT NULL",
        "settings_json JSON NOT NULL",
        "targets_json JSON NOT NULL",
        "source_ai_output_id BIGINT NULL",
    ):
        assert key in source


def test_zone_control_views_define_common_api_routes_and_register_in_init():
    assert VIEWS.exists()
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    for cls in (
        "ZoneControlSettingsView",
        "ZoneControlCopySettingsView",
        "ZoneControlFinalTargetsView",
        "ZoneControlLogsView",
        "EnvironmentControlSettingsView",
        "IrrigationControlSettingsView",
        "DeviceControlSettingsView",
    ):
        assert cls in source
        assert cls in init_source
    for route in (
        'url = "/api/green_smart/zones/control-settings"',
        'url = "/api/green_smart/zones/copy-control-settings"',
        'url = "/api/green_smart/zones/final-targets"',
        'url = "/api/green_smart/zones/control-logs"',
        'url = "/api/green_smart/environment/control-settings"',
        'url = "/api/green_smart/irrigation/control-settings"',
        'url = "/api/green_smart/devices/control-settings"',
    ):
        assert route in source
    for behavior in (
        "_validate_domain",
        "_settings_response",
        "json.dumps(settings, ensure_ascii=False)",
        "INSERT INTO zone_control_settings",
        "ON DUPLICATE KEY UPDATE",
        "INSERT INTO zone_control_logs",
        "INSERT INTO zone_control_copy_jobs",
        "zone_final_control_targets",
    ):
        assert behavior in source
    assert "hass.http.register_view(ZoneControlSettingsView())" in init_source
    assert "await ensure_schema(hass)" in init_source


def test_panel_has_zone_control_api_helpers_with_localstorage_fallback():
    source = PANEL.read_text(encoding="utf-8")
    for required in (
        "async _fetchScopedControlStateFromApi(domain)",
        "async _saveScopedControlStateToApi(domain, state)",
        "async _copyScopedControlSettingsViaApi(domain, fromZoneId, toZoneIds)",
        "_zoneControlApiPath(domain)",
        "green_smart/zones/control-settings",
        "green_smart/zones/copy-control-settings",
        "API 저장 실패 시 localStorage fallback",
        "this._apiScopedControlCache",
    ):
        assert required in source
