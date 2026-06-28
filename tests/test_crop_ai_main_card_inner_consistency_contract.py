from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def _report() -> str:
    panel = _read(PANEL)
    return _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")


def _main_sections():
    report = _report()
    return {
        "crop": _section(report, "data-crop-ai-main-card=\"crop-status\"", "data-crop-ai-main-card=\"interlock-status\""),
        "interlock": _section(report, "data-crop-ai-main-card=\"interlock-status\"", "data-crop-ai-main-card=\"model-status\""),
        "model": _section(report, "data-crop-ai-main-card=\"model-status\"", "data-crop-ai-advanced-details"),
    }


def test_v1993_main_cards_share_inner_metric_action_note_contract():
    sections = _main_sections()
    for name, section in sections.items():
        assert "data-crop-ai-main-card-header" in section, name
        assert "data-crop-ai-main-card-body" in section, name
        assert "data-crop-ai-main-metric-grid" in section, name
        assert "data-crop-ai-main-metric" in section, name
        assert "data-crop-ai-main-metric-label" in section, name
        assert "data-crop-ai-main-metric-value" in section, name
        assert "data-crop-ai-main-metric-help" in section, name
        assert "data-crop-ai-main-note" in section, name
        if name != "crop":
            assert "data-crop-ai-main-action-row" in section, name
            assert "data-crop-ai-main-card-chip-group" in section, name
        assert section.count("data-crop-ai-main-metric") >= 3, name


def test_v1993_main_card_specific_content_is_preserved_inside_shared_contract():
    sections = _main_sections()
    crop = sections["crop"]
    interlock = sections["interlock"]
    model = sections["model"]

    for marker in (
        "data-crop-ai-primary-gl-index",
        "data-crop-ai-primary-yield-prediction",
        "data-crop-ai-primary-pest-risk",
        "data-crop-ai-next-action",
    ):
        assert marker in crop
    assert "data-crop-ai-main-action-row" not in crop
    assert "data-crop-ai-main-card-chip-group" not in crop

    for marker in (
        "data-crop-ai-interlock-status",
        "data-crop-ai-target-promotion-status",
        "data-crop-ai-auto-execution-status",
        "data-crop-interlock-approval-gate",
        "data-crop-ai-interlock-actions",
        "data-crop-interlock-approve",
    ):
        assert marker in interlock
    assert "data-crop-ai-main-note" in interlock

    for marker in (
        "data-crop-ai-input-status",
        "data-crop-ai-stage-status",
        "data-crop-ai-risk-status",
        "data-crop-ai-ml-readiness-status",
    ):
        assert marker in model
    assert "data-crop-ai-main-action-row" in model


def test_v1993_decision_flow_remains_removed_and_detail_area_untouched():
    report = _report()
    for removed in (
        "data-crop-ai-decision-flow",
        "data-crop-ai-decision-flow-steps",
        "data-crop-ai-flow-step",
    ):
        assert removed not in report
    details = _section(report, "data-crop-ai-advanced-details", "</details>")
    for marker in (
        'data-crop-ai-evidence-section="top-models"',
        'data-crop-ai-evidence-section="submodels"',
        'data-crop-ai-evidence-section="model-operations"',
        'data-crop-ai-evidence-section="center-reference"',
    ):
        assert marker in details


def test_v1993_versions_and_docs_record_inner_consistency():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.11.12"' in manifest
    assert 'const VERSION = "1.11.12"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 AI main card inner consistency" in docs
    for marker in (
        "data-crop-ai-main-metric-grid",
        "data-crop-ai-main-metric",
        "data-crop-ai-main-metric-label",
        "data-crop-ai-main-metric-value",
        "data-crop-ai-main-metric-help",
        "data-crop-ai-main-note",
        "data-crop-ai-main-action-row",
    ):
        assert marker in panel
        assert marker in docs
