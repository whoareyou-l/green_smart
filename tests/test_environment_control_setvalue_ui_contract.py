from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"
CURRENT_UI = ROOT / "docs/design/current-ui-design-and-navigation.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def _env_tabs_section() -> str:
    panel = _read(PANEL)
    return _section(panel, "  _envStrategyTabs()", "  _renderEnvStrategyTabBar()")


def _env_content_section() -> str:
    panel = _read(PANEL)
    return _section(panel, "  _renderEnvStrategyTabContent", "  _loadControlScope()")


def test_v1995_environment_tabs_are_restructured_to_vertical_slice_targets():
    tabs = _env_tabs_section()
    expected = ["ai", "interlock", "safety", "ai-settings", "operations", "logs"]
    for key in expected:
        assert f'key: "{key}"' in tabs or f'key:"{key}"' in tabs
    for old_key in ("mode", "overview", "temperature", "humidity", "co2", "aiOps", "safetyOps", "deviceMap"):
        assert f'key: "{old_key}"' not in tabs
        assert f'key:"{old_key}"' not in tabs
    assert "this._envStrategyTab = \"ai\"" in _read(PANEL)


def test_v1995_environment_old_tab_keys_are_preserved_as_hidden_compatibility_markers():
    panel = _read(PANEL)
    for old_key in ("mode", "overview", "temperature", "humidity", "co2", "aiOps", "safetyOps", "deviceMap"):
        assert f'data-env-legacy-tab="{old_key}"' in panel


def test_v1995_environment_setvalue_dom_shell_and_inputs_exist():
    panel = _read(PANEL)
    content = _env_content_section()
    for marker in (
        "data-env-setvalue-subtab",
        "data-env-setvalue-summary-card",
        "data-env-setvalue-section",
        "data-env-setvalue-card",
        "data-env-setvalue-card-header",
        "data-env-setvalue-card-body",
        "data-env-setvalue-row",
        "data-env-setvalue-label",
        "data-env-setvalue-control",
        "data-env-setvalue-current",
        "data-env-setvalue-recommended",
        "data-env-setvalue-input",
        "data-env-setvalue-unit",
        "data-env-setvalue-help",
        "data-env-setvalue-safety-boundary",
        "data-env-setvalue-action-row",
        "data-env-setvalue-save",
        "data-env-setvalue-audit-note",
    ):
        assert marker in panel
    # Save compatibility markers must stay on inputs.
    for marker in ("data-control-field", "data-control-group", "data-control-key"):
        assert marker in panel
    for tab in ("interlock", "safety", "ai-settings"):
        assert f'tab === "{tab}"' in content


def test_v1995_environment_setvalue_save_buttons_are_bound_to_existing_save_flow():
    panel = _read(PANEL)
    assert 'root.querySelector("#control-strategy-save")?.addEventListener("click", () => this._saveControlStrategy())' in panel
    assert 'root.querySelectorAll("[data-env-setvalue-save]")' in panel
    assert 'btn.addEventListener("click", () => this._saveControlStrategy())' in panel
    assert 'root.querySelectorAll("[data-env-setvalue-reset]")' in panel


def test_v1995_environment_status_record_tabs_have_non_setvalue_shells():
    panel = _read(PANEL)
    for marker in (
        "data-env-subtab-main-format",
        "data-env-subtab-summary-card",
        "data-env-status-card",
        "data-env-status-metric-grid",
        "data-env-status-metric",
        "data-env-subtab-list-header",
        "data-env-subtab-record-list",
        "data-env-subtab-record-row",
    ):
        assert marker in panel
    for tab in ("operations", "devices", "logs"):
        assert f'tab === "{tab}"' in _env_content_section()


def test_v1995_environment_versions_docs_and_forbidden_markers():
    panel = _read(PANEL)
    docs = _read(PLAN) + "\n" + _read(CURRENT_UI)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    assert '"version": "1.13.7"' in manifest
    assert 'const VERSION = "1.13.7"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.10.9" in docs
    for forbidden in (
        "data-env-setvalue-direct-execute",
        "environmentSetValueAllowDirectExecution",
        "data-env-control-bypass-safety",
    ):
        assert forbidden in docs
        assert forbidden not in panel
