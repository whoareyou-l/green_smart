from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
PLAN = ROOT / "docs/design/environment-control-ui-dom-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _env_content() -> str:
    panel = _read(PANEL)
    return panel.split("  _renderEnvStrategyTabContent", 1)[1].split("  _loadControlScope()", 1)[0]


def test_v1996_environment_setvalue_polish_version_and_docs():
    panel = _read(PANEL)
    assert '"version": "1.9.99"' in _read(MANIFEST)
    assert 'const VERSION = "1.9.99"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in _read(CENTRAL)
    plan = _read(PLAN)
    assert "Status: implemented in `v1.9.99`" in plan
    assert "setValue 하위탭 세부 polish" in plan


def test_v1996_environment_setvalue_visual_grammar_markers_exist():
    panel = _read(PANEL)
    for marker in (
        "data-env-setvalue-polish",
        "data-env-setvalue-operator-summary",
        "data-env-setvalue-summary-metric-grid",
        "data-env-setvalue-summary-metric",
        "data-env-setvalue-group",
        "data-env-setvalue-group-header",
        "data-env-setvalue-group-title",
        "data-env-setvalue-group-subtitle",
        "data-env-setvalue-grid",
        "data-env-setvalue-row-main",
        "data-env-setvalue-row-meta",
        "data-env-setvalue-card-footer",
        "data-env-setvalue-preview-card",
    ):
        assert marker in panel


def test_v1996_environment_setvalue_tabs_have_summary_group_footer_grammar():
    content = _env_content()
    slices = {
        "setpoints": content.split('if (tab === "setpoints")', 1)[1].split('if (tab === "rules")', 1)[0],
        "rules": content.split('if (tab === "rules")', 1)[1].split('if (tab === "ai")', 1)[0],
        "ai": content.split('if (tab === "ai")', 1)[1].split('if (tab === "operations")', 1)[0],
    }
    for tab, block in slices.items():
        assert "data-env-setvalue-polish" in block
        assert "summary([[" in block
        assert "group(" in block
        assert "setValueFooter" in block
        assert "data-env-setvalue-action-row" in content
        assert "data-env-setvalue-save" in content
    assert slices["setpoints"].count("group(") >= 3
    assert slices["rules"].count("group(") >= 4
    assert slices["ai"].count("group(") >= 2
    assert "data-env-setvalue-preview-card" in slices["ai"]


def test_v1996_environment_setvalue_rows_preserve_save_markers_and_forbid_direct_execution():
    panel = _read(PANEL)
    assert "data-env-setvalue-input data-control-field data-control-group" in panel
    assert "root.querySelectorAll(\"[data-env-setvalue-save]\")" in panel
    for forbidden in (
        "data-env-setvalue-direct-execute",
        "environmentSetValueAllowDirectExecution",
        "data-env-control-bypass-safety",
    ):
        assert forbidden not in panel
