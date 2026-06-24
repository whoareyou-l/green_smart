from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_v1109_versions_and_docs_for_settings_env_like_shell():
    panel = _read(PANEL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER) + "\n" + _read(PLAN)
    assert '"version": "1.10.9"' in _read(MANIFEST)
    assert 'const VERSION = "1.10.9"' in panel
    assert 'v1.10.9' in panel[:200]
    assert "v1.10.9 Settings page environment-control style shell" in docs


def test_settings_page_has_environment_control_style_single_card_and_tabs():
    panel = _read(PANEL)
    settings = _section(panel, '  _settingsTabs() {', '  // ── Shared renderers')
    assert 'data-settings-env-like-shell' in settings
    assert 'data-settings-unified-tab-card' in settings
    assert '_renderSettingsTabBar()' in settings
    assert 'data-settings-content' in settings
    assert '<ha-card>' not in settings
    tabs = _section(panel, '  _settingsTabs() {', '  _renderSettingsTabBar() {')
    expected = [
        '{ key: "connection", label: "연결 설정"',
        '{ key: "zones", label: "구역 설정"',
        '{ key: "weather", label: "날씨 설정"',
        '{ key: "central", label: "중앙 연동"',
    ]
    positions = [tabs.index(marker) for marker in expected]
    assert positions == sorted(positions)


def test_settings_page_preserves_existing_only_fields_and_actions():
    panel = _read(PANEL)
    settings = _section(panel, '  _settingsTabs() {', '  // ── Shared renderers')
    for marker in (
        'id="host"', 'id="port"', 'id="unit_id"',
        'id="greenhouse_zones"', 'id="nutrient_zones"', 'id="stevenson_screens"',
        'id="weatherflow_prefix"', 'id="greenhouse_address"', 'id="weather_location_match"',
        'id="nx"', 'id="ny"', 'id="weather_mid_land_reg_id"', 'id="weather_mid_ta_reg_id"',
        'id="central_base_url"', 'id="activation_code"',
        'id="weather-api-key"', 'id="weather-mid-api-key"', 'id="weather-key-save"',
        'id="weather-key-validate"', 'id="weather-mid-key-validate"', 'id="weather-key-delete"',
        'id="cancel"', 'id="save"',
    ):
        assert marker in settings
    for forbidden in (
        'data-settings-new-feature',
        'data-env-control-bypass-safety',
        'manual_device_control',
        'execute_final_targets',
    ):
        assert forbidden not in settings


def test_settings_binding_supports_tab_clicks_without_removing_existing_bindings():
    panel = _read(PANEL)
    bind = _section(panel, '  _bindSettings(root) {', '  _bindLogin(root) {')
    assert 'data-settings-tab' in bind
    assert 'this._settingsSubTab = btn.dataset.settingsTab' in bind
    for marker in (
        'this._bindInputs(root)',
        'querySelector("#cancel")',
        'querySelector("#save")',
        '_saveSettings()',
        '#weather_location_match',
        '#greenhouse_address',
        '#weather-key-save',
        '#weather-key-validate',
        '#weather-mid-key-validate',
        '#weather-key-delete',
    ):
        assert marker in bind
