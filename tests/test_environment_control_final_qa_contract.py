from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1998_environment_final_qa_versions_and_docs():
    panel = _read(PANEL)
    assert '"version": "1.12.26"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.26"' in panel
    assert 'v1.12.26' in panel[:200]
    plan = _read(PLAN)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert "Status: implemented in `v1.10.9`" in plan
    assert "v1.10.9 Environment Control final QA" in docs


def test_environment_final_qa_covers_six_visible_tabs_and_settings_device_mapping():
    panel = _read(PANEL)
    env_tabs = panel.split('  _envStrategyTabs() {', 1)[1].split('  _renderEnvStrategyTabBar() {', 1)[0]
    settings = panel.split('  _settingsTabs() {', 1)[1].split('  // ── Shared renderers', 1)[0]
    for key in ["ai", "interlock", "safety", "ai-settings", "operations", "logs"]:
        assert f'key: "{key}"' in env_tabs
    assert 'key: "devices"' not in env_tabs
    assert 'key: "device-mapping"' in settings
    assert 'data-settings-device-mapping-tab' in settings
    assert 'if (tab === "interlock")' in panel
    assert 'if (tab === "safety")' in panel
    assert 'if (tab === "ai-settings")' in panel
    assert 'if (tab === "operations")' in panel
    assert 'if (tab === "device-mapping")' in panel
    assert 'if (tab === "logs")' in panel


def test_environment_final_qa_keeps_tab_type_grammar():
    panel = _read(PANEL)
    required = [
        'data-env-subtab-main-format',
        'data-env-status-card',
        'data-env-setvalue-polish',
        'data-env-setvalue-row-main',
        'data-env-setvalue-row-meta',
        'data-env-setvalue-save',
        'data-env-operations-polish',
        'data-env-devices-polish',
        'data-env-logs-polish',
        'data-env-status-operator-summary',
        'data-env-status-safety-boundary',
        'data-env-subtab-record-actions',
    ]
    for marker in required:
        assert marker in panel


def test_environment_final_qa_save_and_reset_bindings_exist():
    panel = _read(PANEL)
    assert 'root.querySelectorAll("[data-env-setvalue-save]")' in panel
    assert 'btn.addEventListener("click", () => this._saveControlStrategy())' in panel
    assert 'root.querySelectorAll("[data-env-setvalue-reset]")' in panel
    assert 'btn.addEventListener("click", () => {' in panel
    assert '_setScopedControlState("environment"' in panel
    assert '_saveScopedControlStateToApi("environment"' in panel


def test_environment_final_qa_forbidden_direct_execution_markers_absent():
    panel = _read(PANEL)
    forbidden = [
        'data-env-setvalue-direct-execute',
        'environmentSetValueAllowDirectExecution',
        'data-env-operations-direct-execute',
        'data-env-devices-manual-execute',
        'environmentStatusTabsAllowDirectExecution',
        'data-env-control-bypass-safety',
    ]
    for marker in forbidden:
        assert marker not in panel
