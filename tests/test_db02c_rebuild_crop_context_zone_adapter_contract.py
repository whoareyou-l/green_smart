from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
REBUILD_CROP_CONTEXT_REPO = ROOT / "custom_components/green_smart/repositories/rebuild_crop_context_repo.py"
ZONE_ADAPTER = ROOT / "custom_components/green_smart/repositories/legacy_adapters/zones.py"
MANIFEST_DOC = ROOT / "docs/design/db-legacy-usage-manifest.md"
DOC = ROOT / "docs/design/current-db-rationalization.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_db02c_version_surfaces_are_1_14_35():
    assert '"version": "1.14.43"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.43"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.43"' in _read(REBUILD_PANEL)


def test_db02c_zone_adapter_owns_rebuild_crop_context_join_fragments():
    source = _read(ZONE_ADAPTER)
    assert "REBUILD_CROP_CONTEXT_ZONE_NAME_SELECT" in source
    assert "REBUILD_CROP_CONTEXT_ZONE_LEFT_JOIN" in source
    assert "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zone_name" in source
    assert "LEFT JOIN zones z ON z.id = s.zone_id" in source
    assert "LEGACY_TABLE_ZONES = \"zones\"" in source


def test_db02c_rebuild_crop_context_repo_uses_zone_adapter_not_direct_zones_join():
    source = _read(REBUILD_CROP_CONTEXT_REPO)
    assert "from .legacy_adapters.zones import" in source
    assert "REBUILD_CROP_CONTEXT_ZONE_NAME_SELECT" in source
    assert "REBUILD_CROP_CONTEXT_ZONE_LEFT_JOIN" in source
    assert "LEFT JOIN zones z ON z.id = s.zone_id" not in source
    assert "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zone_name" not in source


def test_db02c_manifest_moves_rebuild_crop_context_zone_debt_to_adapter():
    manifest = _read(MANIFEST_DOC)
    assert "`repositories/rebuild_crop_context_repo.py` -> `zones`" not in manifest
    assert "`repositories/legacy_adapters/zones.py` -> `zones`" in manifest
    assert "DB-02C rebuild crop context zone adapter migration" in manifest


def test_db02c_rationalization_doc_records_rebuild_crop_context_zone_slice():
    doc = _read(DOC)
    assert "DB-02C" in doc
    assert "rebuild_crop_context_repo.py no longer embeds `LEFT JOIN zones`" in doc
    assert "REBUILD_CROP_CONTEXT_ZONE_LEFT_JOIN" in doc
    assert "운영 DB 구조 변경 없음" in doc
