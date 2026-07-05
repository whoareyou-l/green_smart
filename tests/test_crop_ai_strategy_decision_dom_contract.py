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


def _report_card() -> str:
    panel = _read(PANEL)
    return _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")


def test_v1989_ai_decision_dom_main_order():
    card = _report_card()
    markers = [
        "data-crop-ai-strategy-header",
        "data-crop-ai-readonly-boundary",
        "data-crop-ai-decision-summary",
        "data-crop-ai-safety-interlock-summary",
        "data-crop-ai-model-status-summary",
        "data-crop-ai-review-request-summary",
        "data-crop-ai-advanced-details",
    ]
    for marker in markers:
        assert marker in card
    assert [card.index(marker) for marker in markers] == sorted(card.index(marker) for marker in markers)


def test_v1989_ai_decision_summary_is_operator_facing_crop_state():
    card = _report_card()
    summary = _section(card, "data-crop-ai-decision-summary", "data-crop-ai-safety-interlock-summary")
    assert "data-crop-ai-primary-summary" in summary
    assert "작물 요약" in summary
    assert "data-crop-ai-primary-metric-grid" in summary
    for marker in (
        "data-crop-ai-primary-gl-index",
        "data-crop-ai-summary-stage",
        "data-crop-ai-summary-growth-state",
        "data-crop-ai-summary-environment-risk",
        "data-crop-ai-summary-irrigation-risk",
        "data-crop-ai-primary-pest-risk",
        "data-crop-ai-next-action",
    ):
        assert marker in summary
    for technical_status in ("입력 상태", "ML 준비도"):
        assert technical_status not in summary


def test_v1989_ai_decision_flow_removed_in_v1992():
    card = _report_card()
    assert "data-crop-ai-decision-flow" not in card
    assert "data-crop-ai-decision-flow-steps" not in card
    assert "data-crop-ai-flow-step" not in card
    assert "AI 판단 흐름" not in card


def test_v1989_ai_interlock_and_model_status_are_main_cards_not_detail_cards():
    card = _report_card()
    interlock = _section(card, "data-crop-ai-safety-interlock-summary", "data-crop-ai-model-status-summary")
    model_status = _section(card, "data-crop-ai-model-status-summary", "data-crop-ai-advanced-details")
    details = _section(card, "data-crop-ai-advanced-details", "</details>")

    assert "안전/인터록 상태 요약" in interlock
    assert "data-crop-interlock-card" in interlock
    assert "data-crop-interlock-approval-gate" in interlock
    assert "data-crop-ai-interlock-grid" in interlock
    assert "data-crop-ai-interlock-actions" in interlock

    assert "모델 상태 요약" in model_status
    for marker in (
        "data-crop-ai-input-status",
        "data-crop-ai-stage-status",
        "data-crop-ai-risk-status",
        "data-crop-ai-ml-readiness-status",
        "data-crop-ai-model-detail-toggle",
    ):
        assert marker in model_status
    for text in ("입력 상태", "ML 준비도", "상세 보기"):
        assert text in model_status

    assert "data-crop-ai-interlock-summary" not in details
    assert "data-crop-ai-model-status-summary" not in details


def test_v1989_ai_detail_order_is_top_models_submodels_center_reference():
    card = _report_card()
    details = _section(card, "data-crop-ai-advanced-details", "</details>")
    markers = [
        "data-crop-ai-technical-evidence-stack",
        "data-crop-ai-top-models",
        "data-crop-ai-stage-prediction-model",
        "data-crop-ai-reproductive-vegetative-model",
        "data-crop-ai-pest-prediction-model",
        "data-crop-ai-submodels",
        "data-crop-ai-submodel-evidence-section",
        "data-crop-environment-features-card",
        "data-crop-irrigation-nutrient-features-card",
        "data-crop-pest-control-features-card",
        "data-crop-model-feature-sources-card",
        "data-crop-ai-center-reference-summary",
    ]
    for marker in markers:
        assert marker in details
    assert [details.index(marker) for marker in markers] == sorted(details.index(marker) for marker in markers)
    for heading in ("상위 모델", "하위 모델 / 입력 근거", "센터 분석 참고"):
        assert heading in details


def test_v1989_versions_and_docs_record_decision_dom():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.14.76"' in manifest
    assert 'const VERSION = "1.14.76"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 AI Strategy decision-oriented DOM" in docs
    for marker in (
        "data-crop-ai-decision-summary",
        "data-crop-ai-primary-metric-grid",
        "data-crop-ai-crop-summary",
        "data-crop-ai-safety-interlock-summary",
        "data-crop-ai-model-pipeline-summary",
        "data-crop-ai-model-pipeline-step",
        "data-crop-ai-review-request-summary",
        "data-crop-ai-main-card",
        "data-crop-ai-main-card-header",
        "data-crop-ai-main-card-body",
        "data-crop-ai-main-card-chip-group",
        "data-crop-ai-top-models",
        "data-crop-ai-submodels",
        "data-crop-ai-technical-evidence-stack",
    ):
        assert marker in panel
        assert marker in docs
    for removed_marker in (
        "data-crop-ai-decision-flow",
        "data-crop-ai-decision-flow-steps",
        "data-crop-ai-flow-step",
    ):
        assert removed_marker not in panel
