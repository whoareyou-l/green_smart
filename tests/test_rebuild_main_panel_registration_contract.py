from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_PANEL = ROOT / "custom_components" / "green_smart" / "frontend_panel.py"
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
LEGACY_DOC = ROOT / "docs" / "rebuild" / "legacy-reference-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_main_sidebar_registers_rebuild_panel_not_legacy_panel():
    source = _read(FRONTEND_PANEL)
    assert '_PANEL_COMPONENT = "green-smart-rebuild-panel"' in source
    assert '_PANEL_URL_PATH = "green_smart"' in source
    assert '_PANEL_TITLE = "Green Smart"' in source
    assert 'return f"/green_smart_panel/rebuild/green-smart-rebuild-panel.js?v={version}"' in source
    register_section = source.split("async def _register_panel", 1)[1].split("def _register_ws_commands", 1)[0]
    assert "webcomponent_name=_PANEL_COMPONENT" in register_section
    assert "frontend_url_path=_PANEL_URL_PATH" in register_section


def test_legacy_sidebar_is_renamed_and_registered_separately():
    source = _read(FRONTEND_PANEL)
    for marker in (
        '_LEGACY_PANEL_COMPONENT = "green-smart-panel"',
        '_LEGACY_PANEL_URL_PATH = "green_smart_legacy"',
        '_LEGACY_PANEL_TITLE = "Green Smart Legacy"',
        'return f"/green_smart_panel/green-smart-panel.js?v={version}"',
        "_register_legacy_panel",
        "webcomponent_name=_LEGACY_PANEL_COMPONENT",
        "frontend_url_path=_LEGACY_PANEL_URL_PATH",
        "sidebar_title=_LEGACY_PANEL_TITLE",
    ):
        assert marker in source


def test_setup_registers_main_first_then_legacy_reference_panel():
    source = _read(FRONTEND_PANEL)
    setup_section = source.split("async def async_setup_panel", 1)[1].split("async def _register_static_path", 1)[0]
    assert "panel_js_url = await hass.async_add_executor_job(_get_panel_js_url)" in setup_section
    assert "legacy_panel_js_url = await hass.async_add_executor_job(_get_legacy_panel_js_url)" in setup_section
    assert "await _register_panel(hass, panel_js_url)" in setup_section
    assert "await _register_legacy_panel(hass, legacy_panel_js_url)" in setup_section
    assert setup_section.index("await _register_panel(hass, panel_js_url)") < setup_section.index("await _register_legacy_panel(hass, legacy_panel_js_url)")


def test_rebuild_panel_is_now_the_main_product_surface():
    source = _read(REBUILD_PANEL)
    assert "green-smart-rebuild-panel" in source
    assert "data-rebuild-root" in source
    assert "Start from blank page/scaffold." in source
    assert "No legacy panel module imports." in source


def test_legacy_doc_records_rename_and_main_surface_rule():
    doc = _read(LEGACY_DOC)
    for marker in (
        "Green Smart Legacy",
        "green_smart_legacy",
        "green-smart-rebuild-panel is the main product surface",
        "green-smart-panel remains legacy reference/runtime only",
    ):
        assert marker in doc
