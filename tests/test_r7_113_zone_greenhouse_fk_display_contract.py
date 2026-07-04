from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_113_version_surfaces_are_1_14_44():
    assert '"version": "1.14.70"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.70"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.70"' in _read(REBUILD_PANEL)


def test_r7_113_zone_api_joins_greenhouse_name_and_orders_by_stable_ids():
    views = _read(VIEWS)
    assert "LEFT JOIN green_smart_settings_greenhouses gh" in views
    assert "gh.name AS greenhouse_name" in views
    assert '"greenhouseName": row.get("greenhouse_name")' in views
    greenhouse_list = views[views.index("async def list_settings_greenhouses"):views.index("async def create_settings_greenhouse")]
    zone_list = views[views.index("async def list_settings_zones"):views.index("async def create_settings_zone")]
    assert "ORDER BY id ASC" in greenhouse_list
    assert "ORDER BY z.id ASC" in zone_list
    assert "ORDER BY updated_at DESC" not in greenhouse_list
    assert "ORDER BY updated_at DESC" not in zone_list


def test_r7_113_frontend_zone_normalizer_resolves_greenhouse_name_from_fk_snapshot():
    panel = _read(REBUILD_PANEL)
    body = panel[panel.index("normalizeR7SettingsZoneEntityRows"):panel.index("normalizeR7SettingsEquipmentEntityRows")]
    assert "greenhouseById" in body
    assert "this.r7SettingsGreenhouseZoneData().greenhouses" in body
    assert "String(item.id || item.greenhouseId) === String(zone.greenhouseId" in body
    assert "greenhouse?.name" in body


def test_r7_113_zone_create_greenhouse_display_number_is_stable_id_order_not_api_updated_order():
    panel = _read(REBUILD_PANEL)
    body = panel[panel.index("renderR7SettingsZoneCreateModal"):panel.index("renderR7SettingsDeviceSensorMappingModal")]
    assert "sort((a, b) => Number(a.id || a.greenhouseId || 0) - Number(b.id || b.greenhouseId || 0))" in body
    assert "displayNumber: greenhouse.displayNumber || greenhouse.display_number || index + 1" in body
