from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(panel: str, start: str, end: str) -> str:
    return panel.split(start, 1)[1].split(end, 1)[0]


def test_v1987_ai_strategy_uses_strategy_panel_not_record_list_contract():
    panel = _read(PANEL)
    ai = _section(panel, "  _renderCropAiStrategyTab()", "  _renderCropPestTab()")
    card = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    ai_render_source = ai + "\n" + card
    assert "data-crop-subtab-main-format" in ai
    assert "data-crop-ai-strategy-panel" in ai
    assert "data-crop-ai-strategy-header" in ai_render_source
    assert "data-crop-ai-evidence-panel" in ai_render_source
    assert "data-crop-ai-advanced-details" in ai_render_source
    assert "data-crop-ai-primary-summary" in ai_render_source
    assert "data-crop-ai-next-action" in ai_render_source

    # AI 전략은 병해충/방제처럼 record list가 아니므로 list/list-count/list-actions marker를 쓰지 않는다.
    assert "data-crop-ai-list-header" not in ai
    assert "data-crop-ai-evidence-list" not in ai
    assert "data-crop-subtab-record-list" not in ai
    assert "data-crop-ui-record-list" not in ai
    assert "data-crop-list-title" not in ai
    assert "data-crop-list-count" not in ai
    assert "data-crop-list-actions" not in ai


def test_v1987_ai_strategy_visible_summary_is_not_duplicated_and_technical_cards_are_collapsed():
    panel = _read(PANEL)
    card = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    assert card.count("이번 주 모델을 통해서 출력된 작물 상태의 요약입니다.") == 1
    assert card.index("data-crop-ai-primary-summary") < card.index("data-crop-ai-advanced-details")
    details_start = card.index("data-crop-ai-advanced-details")
    for marker in (
        "data-crop-ai-metric-overview",
        "data-crop-ai-yield-model-card",
        "data-crop-ai-pest-risk-model-card",
        "data-stage-diagnosis-card",
        "data-crop-operator-workflow-card",
        "data-crop-trainable-baseline-card",
        "data-crop-stage-prediction-score-card",
    ):
        assert marker in card
        assert card.index(marker) > details_start


def test_v1987_ai_strategy_versions_and_docs():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.14.66"' in manifest
    assert 'const VERSION = "1.14.66"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 AI Strategy panel-type layout" in docs
    for marker in (
        "data-crop-ai-strategy-panel",
        "data-crop-ai-strategy-header",
        "data-crop-ai-evidence-panel",
        "data-crop-ai-primary-summary",
        "data-crop-ai-advanced-details",
    ):
        assert marker in panel
        assert marker in docs
