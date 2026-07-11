from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
INIT = ROOT / "custom_components/green_smart/__init__.py"
ADAPTER = ROOT / "custom_components/green_smart/repositories/legacy_adapters/environment_telemetry.py"
ADAPTER_INIT = ROOT / "custom_components/green_smart/repositories/legacy_adapters/__init__.py"
MANIFEST_DOC = ROOT / "docs/design/db-legacy-usage-manifest.md"
DOC = ROOT / "docs/design/current-db-rationalization.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_db02_version_surfaces_are_1_14_33():
    assert '"version": "1.15.17"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.17"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.17"' in _read(REBUILD_PANEL)


def test_db02_legacy_adapter_package_exists_for_environment_telemetry_zone_lookup():
    source = _read(ADAPTER)
    assert _read(ADAPTER_INIT).strip()
    assert "LEGACY_TABLE_SENSOR_READINGS = \"sensor_readings\"" in source
    assert "async def list_recent_environment_telemetry_zone_ids" in source
    assert "SELECT DISTINCT COALESCE(zone_id, 1) AS zone_id" in source
    assert "FROM sensor_readings" in source
    assert "captured_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)" in source
    assert "LIMIT 20" in source


def test_db02_scheduler_uses_legacy_adapter_instead_of_direct_sensor_readings_sql():
    source = _read(INIT)
    tick_body = source.split("async def _run_edge_environment_telemetry_sync_tick", 1)[1].split("def _setup_edge_environment_telemetry_sync_scheduler", 1)[0]
    assert "list_recent_environment_telemetry_zone_ids" in tick_body
    assert "from .repositories.legacy_adapters.environment_telemetry import" in tick_body
    assert "FROM sensor_readings" not in tick_body
    assert "SELECT DISTINCT COALESCE(zone_id, 1) AS zone_id" not in tick_body
    assert "from .db import fetchall" not in tick_body


def test_db02_manifest_removes_init_sensor_readings_debt_and_tracks_adapter():
    manifest = _read(MANIFEST_DOC)
    assert "`__init__.py` -> `sensor_readings`" not in manifest
    assert "`repositories/legacy_adapters/environment_telemetry.py` -> `sensor_readings`" in manifest
    assert "DB-02 adapter migration" in manifest


def test_db02_rationalization_doc_records_first_adapter_slice():
    doc = _read(DOC)
    assert "DB-02" in doc
    assert "legacy_adapters" in doc
    assert "environment_telemetry.py" in doc
    assert "`__init__.py` scheduler no longer queries `sensor_readings` directly" in doc
