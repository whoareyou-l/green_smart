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
    assert '"version": "1.10.7"' in _read(MANIFEST)
    assert 'const VERSION = "1.10.7"' in panel
    assert 'v1.10.7' in panel[:200]
    plan = _read(PLAN)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert "Status: implemented in `v1.10.7`" in plan
    assert "v1.10.7 Environment Control final QA" in docs


def test_environment_final_qa_covers_all_seven_tabs():
    panel = _read(PANEL)
    for key in ["ai", "overview", "interlock", "safety", "ai-settings", "operations", "devices", "logs"]:
        assert f'key: "{key}"' in panel
    assert 'if (tab === "overview")' in panel
    assert 'if (tab === "interlock")' in panel
    assert 'if (tab === "safety")' in panel
    assert 'if (tab === "ai-settings")' in panel
    assert 'if (tab === "operations")' in panel
    assert 'if (tab === "devices")' in panel
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
