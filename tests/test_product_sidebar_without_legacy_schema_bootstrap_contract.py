from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INIT = ROOT / "custom_components/green_smart/__init__.py"
FRONTEND_PANEL = ROOT / "custom_components/green_smart/frontend_panel.py"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_version_surfaces_are_1_14_36():
    assert '"version": "1.14.43"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.43"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.43"' in _read(REBUILD_PANEL)


def test_schema_bootstrap_is_disabled_by_default_but_explicitly_opt_in():
    source = _read(INIT)
    assert "GREEN_SMART_SCHEMA_BOOTSTRAP" in source
    assert "def _schema_bootstrap_enabled" in source
    assert "os.environ.get(\"GREEN_SMART_SCHEMA_BOOTSTRAP\", \"0\")" in source
    assert "schema_bootstrap = _schema_bootstrap_enabled()" in source
    assert "if schema_bootstrap:" in source
    assert "await ensure_schema(hass)" in source
    assert "green_smart schema bootstrap skipped" in source
    assert "green_smart heavy DB-backed HTTP views skipped" in source
    assert "RebuildSettingsGreenhouseCreateView" in source.split("green_smart heavy DB-backed HTTP views skipped", 1)[0]
    assert "green_smart DB-backed schedulers skipped" in source
    assert "return True" in source.split("green_smart DB-backed schedulers skipped", 1)[1].split("await _setup_safety_guard_watchdog_scheduler", 1)[0]


def test_product_sidebar_only_registers_main_panel_not_legacy_sidebar():
    source = _read(FRONTEND_PANEL)
    assert "await _register_panel(hass, panel_js_url)" in source
    assert "Green Smart" in source
    assert "green_smart main rebuild panel registered successfully" in source
    assert "await _register_legacy_panel" not in source
    assert "green_smart legacy reference panel registered successfully" not in source
    assert "_LEGACY_PANEL_TITLE" not in source
    assert "Green Smart Legacy" not in source
