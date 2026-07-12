from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
FRONTEND_PANEL = ROOT / "custom_components/green_smart/frontend_panel.py"


def source() -> str:
    return PANEL.read_text()


def test_v1_15_30_settings_entry_has_capture_safety_net_before_click_hash():
    text = source()
    assert 'const REBUILD_VERSION = "1.15.40"' in text
    assert 'this._r7SettingsEntryCaptureHandler = (event) => this._routeR7SettingsEntryEvent(event);' in text
    assert 'this._bindR7SettingsEntryCaptureListeners();' in text
    assert 'this._unbindR7SettingsEntryCaptureListeners();' in text
    block = text[text.index('_bindR7SettingsEntryCaptureListeners()'):text.index('_handleR7SettingsHashRoute(source = "hashchange")')]
    assert '["pointerdown", "touchstart", "click"]' in block
    assert 'capture: true' in block
    assert 'passive: false' in block
    assert '_routeR7SettingsEntryEvent(event)' in text
    assert 'data-r7-settings-entry-capture-last' in text
    assert 'return this._openR7SettingsDomainFromCache(`capture-${event?.type || "event"}`);' in text


def test_v1_15_30_settings_entry_target_finds_all_mobile_pc_hash_buttons():
    text = source()
    start = text.index('  _eventR7SettingsEntryTarget(event)')
    block = text[start:text.index('  _routeR7SettingsEntryEvent(event)', start)]
    assert 'composedPath' in block
    assert '[data-r7-sidebar-target="settings-admin"]' in block
    assert '[data-r7-mobile-settings-action="open-settings-domain"]' in block
    assert 'a[href="#settings-admin"]' in block
    assert 'target?.closest?.' in block


def test_v1_15_30_frontend_panel_re_registers_when_component_or_module_changes():
    text = FRONTEND_PANEL.read_text()
    assert '_panel_registered_module_url' in text
    assert '_panel_registered_component' in text
    assert 'registered_url == panel_js_url and registered_component == panel_component' in text
    setup = text[text.index('async def async_setup_panel'):text.index('async def _register_static_path')]
    assert 'await _register_static_path(hass)' in setup
    assert 'panel_js_url = await hass.async_add_executor_job(_get_panel_js_url)' in setup
    assert 'panel_component = await hass.async_add_executor_job(_get_panel_component_name)' in setup
    assert setup.index('panel_js_url = await hass.async_add_executor_job(_get_panel_js_url)') < setup.index('if domain_data.get("_panel_registered")')


def test_v1_15_30_settings_entry_still_cache_only_with_hash_and_prewarm():
    text = source()
    assert 'settings-full-render-fallback' not in text
    assert 'href="#settings-admin"' in text
    assert '_handleR7SettingsHashRoute("connected")' in text
    assert '_scheduleR7SettingsCachePrewarm("connected-idle")' in text
    assert 'hit-prewarmed' in text
