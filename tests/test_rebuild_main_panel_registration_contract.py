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


def test_legacy_sidebar_is_not_registered_as_a_second_product():
    source = _read(FRONTEND_PANEL)
    forbidden = (
        '_LEGACY_PANEL_COMPONENT = "green-smart-panel"',
        '_LEGACY_PANEL_URL_PATH = "green_smart_legacy"',
        '_LEGACY_PANEL_TITLE = "Green Smart Legacy"',
        'return f"/green_smart_panel/green-smart-panel.js?v={version}"',
        "_register_legacy_panel",
        "webcomponent_name=_LEGACY_PANEL_COMPONENT",
        "frontend_url_path=_LEGACY_PANEL_URL_PATH",
        "sidebar_title=_LEGACY_PANEL_TITLE",
    )
    for marker in forbidden:
        assert marker not in source


def test_setup_registers_only_main_product_panel():
    source = _read(FRONTEND_PANEL)
    setup_section = source.split("async def async_setup_panel", 1)[1].split("async def _register_static_path", 1)[0]
    assert "panel_js_url = await hass.async_add_executor_job(_get_panel_js_url)" in setup_section
    assert "await _register_panel(hass, panel_js_url)" in setup_section
    assert "legacy_panel_js_url" not in setup_section
    assert "await _register_legacy_panel" not in setup_section


def test_rebuild_panel_is_now_the_main_product_surface():
    source = _read(REBUILD_PANEL)
    assert "green-smart-rebuild-panel" in source
    assert "data-rebuild-root" in source
    assert "data-r7-sidebar" in source
    assert "data-r7-page-workspace" in source
    assert "data-r7-domain-visual-frame" in source
    assert "Start from blank page/scaffold." not in source
    assert "No legacy panel module imports." not in source


def test_legacy_doc_records_asset_reference_and_main_surface_rule():
    doc = _read(LEGACY_DOC)
    for marker in (
        "green-smart-rebuild-panel is the main product surface",
        "green-smart-panel remains legacy reference/runtime only",
        "Start from blank page/scaffold.",
        "No legacy panel module imports.",
    ):
        assert marker in doc
    assert "must not be registered as a second sidebar product" in doc
    assert "Green Smart -> /green_smart -> green-smart-rebuild-panel" in doc
    assert "Green Smart Legacy -> /green_smart_legacy" not in doc
