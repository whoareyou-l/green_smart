from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "custom_components/green_smart/frontend_panel.py"
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def test_v1_15_26_frontend_registers_versioned_webcomponent_name_to_bust_mobile_webview_class_cache():
    text = FRONTEND.read_text()
    assert '_PANEL_COMPONENT_BASE = "green-smart-rebuild-panel"' in text
    assert 'def _get_panel_component_name(version: str | None = None) -> str:' in text
    assert 'return f"{_PANEL_COMPONENT_BASE}-v{safe_version}"' in text
    assert 'panel_component = await hass.async_add_executor_job(_get_panel_component_name)' in text
    assert 'await _register_panel(hass, panel_js_url, panel_component)' in text
    assert 'webcomponent_name=component_name' in text


def test_v1_15_26_js_defines_base_and_versioned_custom_elements():
    text = PANEL.read_text()
    assert 'const REBUILD_VERSION = "1.15.36"' in text
    assert 'const REBUILD_ELEMENT_NAME = "green-smart-rebuild-panel";' in text
    assert 'const REBUILD_VERSIONED_ELEMENT_NAME = `${REBUILD_ELEMENT_NAME}-v${REBUILD_VERSION.replace(/[^a-zA-Z0-9]+/g, "-")}`;' in text
    assert 'customElements.define(REBUILD_ELEMENT_NAME, GreenSmartRebuildPanel);' in text
    assert 'class GreenSmartRebuildPanelVersioned extends GreenSmartRebuildPanel {}' in text
    assert 'customElements.define(REBUILD_VERSIONED_ELEMENT_NAME, GreenSmartRebuildPanelVersioned);' in text
    assert 'customElements.define(REBUILD_VERSIONED_ELEMENT_NAME, GreenSmartRebuildPanel);' not in text
    assert 'GreenSmartRebuildPanelVersioned' in text.split('export {', 1)[1]
    assert 'REBUILD_VERSIONED_ELEMENT_NAME' in text.split('export {', 1)[1]
