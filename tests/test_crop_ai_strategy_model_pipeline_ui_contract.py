from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PLAN = ROOT / "docs/plans/2026-06-25-crop-ai-strategy-model-pipeline-ui-v1-10-20.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def _report_card() -> str:
    panel = _read(PANEL)
    return _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")


def test_v11020_ai_strategy_keeps_completed_crop_model_pipeline_inside_model_status():
    card = _report_card()
    markers = [
        "data-crop-ai-strategy-header",
        "data-crop-ai-readonly-boundary",
        "data-crop-ai-crop-summary",
        "data-crop-ai-safety-interlock-summary",
        "data-crop-ai-model-status-summary",
        "data-crop-ai-model-pipeline-summary",
        "data-crop-ai-review-request-summary",
        "data-crop-ai-advanced-details",
    ]
    for marker in markers:
        assert marker in card
    assert [card.index(marker) for marker in markers] == sorted(card.index(marker) for marker in markers)

    pipeline = _section(card, "data-crop-ai-model-pipeline-summary", "data-crop-ai-review-request-summary")
    ordered_steps = [
        'data-crop-ai-model-pipeline-step="stage-prediction"',
        'data-crop-ai-model-pipeline-step="growth-state-prediction"',
        'data-crop-ai-model-pipeline-step="risk-factor-prediction"',
        'data-crop-ai-model-pipeline-step="integrated-diagnosis"',
        'data-crop-ai-model-pipeline-step="action-recommendation"',
    ]
    for marker in ordered_steps:
        assert marker in pipeline
    assert [pipeline.index(marker) for marker in ordered_steps] == sorted(pipeline.index(marker) for marker in ordered_steps)
    for text in (
        "생육단계 모델",
        "생육상태 모델",
        "위험요소 모델",
        "통합진단 모델",
        "조치추천 모델",
    ):
        assert text in pipeline


def test_v11020_review_request_summary_is_request_only_and_uses_action_model_output():
    card = _report_card()
    summary = _section(card, "data-crop-ai-review-request-summary", "data-crop-ai-advanced-details")
    assert "data-crop-action-work-request" in summary or "work request 없음" in summary
    assert "data-crop-action-model-request" in summary or "model request 없음" in summary
    assert "targetCandidateAuthorityCode" in summary or "model request 없음" in summary
    for forbidden in (
        "data-crop-action-execute",
        "cropActionAllowExecution",
        "data-crop-ai-final-setpoint",
        "data-crop-ai-work-order-create",
    ):
        assert forbidden not in card


def test_v11020_interlock_and_model_status_are_support_not_primary_strategy():
    card = _report_card()
    support = _section(card, "data-crop-ai-support-status-summary", "data-crop-ai-model-status-summary")
    model = _section(card, "data-crop-ai-model-status-summary", "data-crop-ai-advanced-details")
    assert "안전/인터록 상태 요약" in support
    assert "data-crop-interlock-card" in support
    assert "data-crop-interlock-approval-gate" in support
    assert "data-crop-ai-input-status" in model
    assert "data-crop-ai-ml-readiness-status" in model
    assert card.index("data-crop-ai-support-status-summary") < card.index("data-crop-ai-model-pipeline-summary")


def test_v11020_versions_and_docs_record_pipeline_ui():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    docs = _read(UI_DOC) + "\n" + _read(MASTER) + "\n" + _read(PLAN)
    assert '"version": "1.11.4"' in manifest
    assert 'const VERSION = "1.11.4"' in panel
    assert "v1.10.20 AI Strategy model pipeline UI" in docs
    for marker in (
        "data-crop-ai-model-pipeline-summary",
        "data-crop-ai-model-pipeline-step",
        "data-crop-ai-review-request-summary",
        "data-crop-ai-support-status-summary",
    ):
        assert marker in panel
        assert marker in docs
