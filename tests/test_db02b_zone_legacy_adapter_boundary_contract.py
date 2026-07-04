from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
CROP_REPO = ROOT / "custom_components/green_smart/repositories/crop_repo.py"
ZONE_ADAPTER = ROOT / "custom_components/green_smart/repositories/legacy_adapters/zones.py"
MANIFEST_DOC = ROOT / "docs/design/db-legacy-usage-manifest.md"
DOC = ROOT / "docs/design/current-db-rationalization.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_db02b_version_surfaces_are_1_14_34():
    assert '"version": "1.14.63"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.63"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.63"' in _read(REBUILD_PANEL)


def test_db02b_zone_adapter_owns_crop_season_legacy_join_fragments():
    source = _read(ZONE_ADAPTER)
    assert "LEGACY_TABLE_ZONES = \"zones\"" in source
    assert "CROP_SEASON_ZONE_NAME_SELECT" in source
    assert "CROP_SEASON_ZONE_LEFT_JOIN" in source
    assert "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName" in source
    assert "LEFT JOIN zones z ON z.id = s.zone_id" in source
    assert "compatibility bridge" in source


def test_db02b_crop_repo_uses_zone_adapter_not_direct_zones_join():
    source = _read(CROP_REPO)
    assert "from .legacy_adapters.zones import" in source
    assert "CROP_SEASON_ZONE_NAME_SELECT" in source
    assert "CROP_SEASON_ZONE_LEFT_JOIN" in source
    assert "LEFT JOIN zones z ON z.id = s.zone_id" not in source
    assert "FROM crop_seasons s LEFT JOIN zones" not in source
    assert "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName" not in source


def test_db02b_manifest_tracks_zone_adapter_boundary_and_stale_config_flow_marker_removed():
    manifest = _read(MANIFEST_DOC)
    assert "`config_flow.py` -> `zones`" not in manifest
    assert "`repositories/crop_repo.py` -> `zones`" not in manifest
    assert "`repositories/legacy_adapters/zones.py` -> `zones`" in manifest
    assert "DB-02B zone adapter migration" in manifest


def test_db02b_rationalization_doc_records_zone_adapter_slice():
    doc = _read(DOC)
    assert "DB-02B" in doc
    assert "zones.py" in doc
    assert "crop_repo.py no longer embeds `LEFT JOIN zones`" in doc
    assert "운영 DB 구조 변경 없음" in doc
