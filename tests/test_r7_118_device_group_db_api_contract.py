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
    assert '"version": "1.15.51"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.51"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.51"' in _read(PANEL)


def test_r7_118_db_has_real_device_and_group_tables():
    db = _read(DB)
    for literal in (
        "CREATE TABLE IF NOT EXISTS green_smart_settings_devices",
        "CREATE TABLE IF NOT EXISTS green_smart_settings_device_groups",
        "CREATE TABLE IF NOT EXISTS green_smart_settings_irrigation_groups",
        "ha_device_id VARCHAR(255) NOT NULL DEFAULT ''",
        "KEY idx_settings_device_ha_device_id (farm_id, ha_device_id)",
        "UNIQUE KEY uniq_settings_device_entity (farm_id, entity_id)",
        "UNIQUE KEY uniq_settings_device_group_zone_name (farm_id, zone_id, group_name)",
        "UNIQUE KEY uniq_settings_irrigation_group_zone_no (farm_id, zone_id, irrigation_group_no)",
        "irrigation_method_detail VARCHAR(64) NOT NULL",
        "circulation_type VARCHAR(64) NOT NULL DEFAULT '해당 없음'",
        "drainage_reuse VARCHAR(64) NOT NULL DEFAULT '배액 재활용 안함'",
        "outlet_count INT NOT NULL DEFAULT 0",
        "flow_rate_per_outlet DECIMAL(10,3) NOT NULL DEFAULT 0",
        "flow_rate_unit VARCHAR(16) NOT NULL DEFAULT 'L/h'",
        "bed_count INT NOT NULL DEFAULT 0",
    ):
        assert literal in db


def test_r7_118_backend_exposes_device_and_group_create_apis():
    views = _read(WRITE_VIEWS)
    for literal in (
        'url = "/api/green_smart/rebuild/settings/devices"',
        'url = "/api/green_smart/rebuild/settings/device-groups"',
        'url = "/api/green_smart/rebuild/settings/irrigation-groups"',
        "create_settings_device",
        "create_settings_device_group",
        "create_settings_irrigation_group",
        "_coerce_int_value",
        "bedCountRaw",
        "list_settings_devices",
        "list_ha_device_registry_summary",
        "ensure_settings_device_ha_device_fk_schema",
        "list_settings_device_groups",
        "list_settings_irrigation_groups",
        "ensure_settings_irrigation_group_schema",
        "circulation_type",
        "drainage_reuse",
        "green_smart_settings_devices",
        "green_smart_settings_device_groups",
        "green_smart_settings_irrigation_groups",
        '"haDevices": ha_devices',
        '"devices": devices',
        '"deviceGroups": device_groups',
        '"irrigationGroups": irrigation_groups',
    ):
        assert literal in views


def test_r7_118_frontend_saves_device_and_group_with_real_api_not_uionly():
    source = _read(PANEL)
    for literal in (
        'const REBUILD_SETTINGS_DEVICE_CREATE_API_PATH = "green_smart/rebuild/settings/devices";',
        'const REBUILD_SETTINGS_DEVICE_GROUP_CREATE_API_PATH = "green_smart/rebuild/settings/device-groups";',
        'const REBUILD_SETTINGS_IRRIGATION_GROUP_CREATE_API_PATH = "green_smart/rebuild/settings/irrigation-groups";',
        'this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_DEVICE_CREATE_API_PATH, payload)',
        'this.hass.callApi(["P", "OST"].join(""), REBUILD_SETTINGS_IRRIGATION_GROUP_CREATE_API_PATH, payload)',
    ):
        assert literal in source
    assert "uiOnly: true" not in source


def test_r7_118_views_are_registered_even_when_schema_bootstrap_is_off():
    init = _read(INIT)
    for view in (
        "RebuildSettingsDeviceCreateView",
        "RebuildSettingsDeviceGroupCreateView",
        "RebuildSettingsIrrigationGroupCreateView",
    ):
        assert view in init
        assert f"hass.http.register_view({view}())" in init



def test_r7_118_irrigation_group_dto_normalizes_decimal_for_json_response():
    import importlib.util
    import sys
    import types
    from decimal import Decimal

    pkg = types.ModuleType("custom_components.green_smart")
    pkg.__path__ = []
    sys.modules.setdefault("custom_components", types.ModuleType("custom_components"))
    sys.modules["custom_components.green_smart"] = pkg
    const_mod = types.ModuleType("custom_components.green_smart.const")
    const_mod.DOMAIN = "green_smart"
    sys.modules["custom_components.green_smart.const"] = const_mod
    db_mod = types.ModuleType("custom_components.green_smart.db")
    async def _stub(*args, **kwargs):
        return []
    db_mod.execute = _stub
    db_mod.fetchall = _stub
    db_mod.fetchone = _stub
    sys.modules["custom_components.green_smart.db"] = db_mod
    http_mod = types.ModuleType("homeassistant.components.http")
    http_mod.HomeAssistantView = object
    sys.modules.setdefault("homeassistant", types.ModuleType("homeassistant"))
    sys.modules.setdefault("homeassistant.components", types.ModuleType("homeassistant.components"))
    sys.modules["homeassistant.components.http"] = http_mod

    spec = importlib.util.spec_from_file_location("custom_components.green_smart.rebuild_settings_write_views", WRITE_VIEWS)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)

    dto = module._irrigation_group_dto({
        "id": 1,
        "farm_id": 1,
        "zone_id": "zone-a",
        "irrigation_group_no": 1,
        "irrigation_group_name": "A구역 관수그룹 1",
        "irrigation_method": "배지경",
        "irrigation_method_detail": "코코피트",
        "outlet_count": 3,
        "flow_rate_per_outlet": Decimal("3.000"),
        "flow_rate_unit": "L/h",
        "bed_count": 3,
    })
    assert dto["flowRatePerOutlet"] == 3
    assert not isinstance(dto["flowRatePerOutlet"], Decimal)
    assert dto["outletCount"] == 3
    assert dto["bedCount"] == 3
