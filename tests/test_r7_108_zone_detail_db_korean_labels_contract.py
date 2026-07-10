from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DB = ROOT / "custom_components/green_smart/db.py"
VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_108_version_surfaces_are_1_14_39():
    assert '"version": "1.15.00"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.00"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.00"' in _read(REBUILD_PANEL)


def test_r7_108_zone_detail_matches_green_smart_settings_zones_db_fields():
    source = _read(REBUILD_PANEL)
    expected_order = '''const R7_SETTINGS_ZONE_DETAIL_FIELD_ORDER = Object.freeze([
  ["zoneName", "구역명"],
  ["greenhouseName", "온실"],
  ["purpose", "용도"],
  ["area", "면적"],
  ["bedCount", "베드 수"],
  ["status", "상태"],
  ["createdAt", "생성시각"],
  ["updatedAt", "수정시각"],
  ["note", "메모"],
]);'''
    assert expected_order in source
    zone_section = source[source.index("const R7_SETTINGS_ZONE_DETAIL_FIELD_ORDER"):source.index("const R7_SETTINGS_EQUIPMENT_LIST_COLUMNS")]
    assert "currentCrop" not in zone_section


def test_r7_108_zone_bed_and_status_are_korean_labels_not_english_tokens():
    source = _read(REBUILD_PANEL)
    views = _read(VIEWS)
    db = _read(DB)
    for marker in ["_r7ZoneBedLabel", "_r7ZoneStatusLabel", "정상", "비활성", "삭제됨"]:
        assert marker in source
    assert "`${bedCount} bed`" not in source
    zone_create_body = views[views.index("async def create_settings_zone"):views.index("async def list_settings_device_sensor_mappings")]
    assert "status = 'active'" not in zone_create_body
    assert "_zone_status_label(payload" in views
    assert "status VARCHAR(32) NOT NULL DEFAULT '정상'" in db
    assert "status IN ('active', 'inactive', 'deleted')" in db
    assert "CASE status WHEN 'active' THEN '정상'" in db
