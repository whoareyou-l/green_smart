from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components/green_smart/db.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
WRITE_VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_118_version_surfaces_are_1_14_80():
    assert '"version": "1.14.95"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.95"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.95"' in _read(PANEL)


def test_r7_118_db_has_real_device_and_group_tables():
    db = _read(DB)
    for literal in (
        "CREATE TABLE IF NOT EXISTS green_smart_settings_devices",
        "CREATE TABLE IF NOT EXISTS green_smart_settings_device_groups",
        "UNIQUE KEY uniq_settings_device_entity (farm_id, entity_id)",
        "UNIQUE KEY uniq_settings_device_group_zone_name (farm_id, zone_id, group_name)",
    ):
        assert literal in db


def test_r7_118_backend_exposes_device_and_group_create_apis():
    views = _read(WRITE_VIEWS)
    for literal in (
        'url = "/api/green_smart/rebuild/settings/devices"',
        'url = "/api/green_smart/rebuild/settings/device-groups"',
        "create_settings_device",
        "create_settings_device_group",
        "list_settings_devices",
        "list_settings_device_groups",
        "green_smart_settings_devices",
        "green_smart_settings_device_groups",
        '"devices": devices',
        '"deviceGroups": device_groups',
    ):
        assert literal in views


def test_r7_118_frontend_saves_device_and_group_with_real_api_not_uionly():
    source = _read(PANEL)
    for literal in (
        'const REBUILD_SETTINGS_DEVICE_CREATE_API_PATH = "green_smart/rebuild/settings/devices";',
        'const REBUILD_SETTINGS_DEVICE_GROUP_CREATE_API_PATH = "green_smart/rebuild/settings/device-groups";',
        'this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_DEVICE_CREATE_API_PATH, payload)',
        'this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_DEVICE_GROUP_CREATE_API_PATH, payload)',
    ):
        assert literal in source
    assert "uiOnly: true" not in source


def test_r7_118_views_are_registered_even_when_schema_bootstrap_is_off():
    init = _read(INIT)
    for view in (
        "RebuildSettingsDeviceCreateView",
        "RebuildSettingsDeviceGroupCreateView",
    ):
        assert view in init
        assert f"hass.http.register_view({view}())" in init
