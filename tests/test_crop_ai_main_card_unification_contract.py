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


def test_v1992_ai_main_cards_share_common_shell_and_order_without_decision_flow():
    report = _report()
    assert "data-crop-ai-decision-flow" not in report
    assert "data-crop-ai-decision-flow-steps" not in report
    assert "data-crop-ai-flow-step" not in report
    markers = [
        "data-crop-ai-decision-summary",
        "data-crop-ai-interlock-summary",
        "data-crop-ai-model-status-summary",
        "data-crop-ai-advanced-details",
    ]
    assert [report.index(m) for m in markers] == sorted(report.index(m) for m in markers)
    assert report.count("data-crop-ai-main-card") >= 3
    assert report.count("data-crop-ai-main-card-header") >= 3
    assert report.count("data-crop-ai-main-card-body") >= 3
    assert report.count("data-crop-ai-main-card-chip-group") >= 2


def test_v1992_crop_interlock_model_cards_have_same_main_card_contract():
    report = _report()
    crop = _section(report, "data-crop-ai-decision-summary", "data-crop-ai-interlock-summary")
    interlock = _section(report, "data-crop-ai-interlock-summary", "data-crop-ai-model-status-summary")
    model = _section(report, "data-crop-ai-model-status-summary", "data-crop-ai-advanced-details")
    for section in (crop, interlock, model):
        assert "data-crop-ai-main-card" in section
        assert "data-crop-ai-main-card-header" in section
        assert "data-crop-ai-main-card-body" in section
        assert "border-radius:16px" in section
        assert "box-shadow:0 6px 18px rgba(64,117,78,0.08)" in section
    assert "data-crop-ai-main-card-chip-group" not in crop
    assert "data-crop-ai-main-card-chip-group" in interlock
    assert "data-crop-ai-main-card-chip-group" in model


def test_v1992_versions_and_docs_record_main_card_cleanup():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.15.55"' in manifest
    assert 'const VERSION = "1.15.55"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 AI main card unification" in docs
    for marker in (
        "data-crop-ai-main-card",
        "data-crop-ai-main-card-header",
        "data-crop-ai-main-card-body",
        "data-crop-ai-main-card-chip-group",
    ):
        assert marker in panel
        assert marker in docs
