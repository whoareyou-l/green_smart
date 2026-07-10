from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components/green_smart/db.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
API = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_version_surfaces_are_1_14_37():
    assert '"version": "1.15.10"' in _read(MANIFEST)
    assert 'REBUILD_VERSION = "1.15.10"' in _read(PANEL)
    assert 'const VERSION = "1.15.10"' in _read(LEGACY_PANEL)


def test_db_pool_targets_dedicated_green_smart_schema_not_homeassistant_db_name():
    db = _read(DB)
    assert "GREEN_SMART_DB_NAME" in db
    assert 'os.environ.get("GREEN_SMART_DB_NAME", "green_smart")' in db
    assert 'os.environ.get("DB_NAME", "green_smart")' not in db
    assert '"db":       _green_smart_db_name()' in db or '"db": _green_smart_db_name()' in db


def test_minimal_settings_schema_creates_green_smart_modal_tables_only():
    db = _read(DB)
    assert "async def ensure_settings_schema" in db
    assert "CREATE DATABASE IF NOT EXISTS `green_smart`" in db
    assert "USE `green_smart`" in db
    assert "CREATE TABLE IF NOT EXISTS green_smart_settings_greenhouses" in db
    for column in (
        "operating_status VARCHAR(32) NOT NULL DEFAULT '운영중'",
        "timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul'",
        "creation_reason TEXT NULL",
    ):
        assert column in db
    assert "CREATE TABLE IF NOT EXISTS green_smart_settings_zones" in db
    assert "CREATE TABLE IF NOT EXISTS green_smart_settings_device_sensor_mappings" in db


def test_setup_registers_settings_api_with_minimal_schema_when_full_bootstrap_off():
    source = _read(INIT)
    assert "from .db import ensure_schema, ensure_settings_schema" in source
    assert "await ensure_settings_schema(hass)" in source
    assert "green_smart settings schema bootstrap completed" in source
    assert "RebuildSettingsSnapshotView" in source
    assert "RebuildSettingsGreenhouseCreateView" in source
    settings_schema_pos = source.index("await ensure_settings_schema(hass)")
    view_pos = source.index("hass.http.register_view(RebuildSettingsGreenhouseCreateView())")
    assert settings_schema_pos < view_pos
    assert "green_smart heavy DB-backed HTTP views skipped" in source


def test_greenhouse_modal_api_persists_all_visible_fields_to_green_smart_schema():
    api = _read(API)
    assert "operating_status" in api
    assert "timezone" in api
    assert "creation_reason" in api
    assert "operatingStatus" in api
    assert "creationReason" in api
    assert "Asia/Seoul" in api
    assert "FROM green_smart_settings_greenhouses" in api
    assert "INSERT INTO green_smart_settings_greenhouses" in api
    assert "settingsSnapshot" in api


def test_greenhouse_create_form_submits_visible_modal_fields():
    panel = _read(PANEL)
    for marker in (
        '_r7SettingsCreateField("name", "온실명"',
        '_r7SettingsCreateField("location", "위치"',
        '_r7SettingsCreateSelect("operatingStatus", "운영상태"',
        '_r7SettingsCreateSelect("installType", "설치유형"',
        '_r7SettingsCreateSelect("timezone", "기본 시간대"',
        '_r7SettingsCreateTextarea("note", "생성 사유"',
        "REBUILD_SETTINGS_GREENHOUSE_CREATE_API_PATH",
    ):
        assert marker in panel
