from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
MASTER = ROOT / "docs/PROJECT_MASTER_PLAN.md"
PLAN = ROOT / "docs/plans/2026-06-25-crop-ai-strategy-top-summary-cards-v1-10-21.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def _report_card() -> str:
    panel = _read(PANEL)
    return _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")


def test_v11021_ai_strategy_top_order_is_crop_safety_model_details():
    card = _report_card()
    markers = [
        "data-crop-ai-strategy-header",
        "data-crop-ai-readonly-boundary",
        "data-crop-ai-crop-summary",
        "data-crop-ai-safety-interlock-summary",
        "data-crop-ai-model-status-summary",
        "data-crop-ai-model-detail-toggle",
        "data-crop-ai-advanced-details",
    ]
    for marker in markers:
        assert marker in card
    assert [card.index(marker) for marker in markers] == sorted(card.index(marker) for marker in markers)


def test_v11021_crop_summary_has_requested_five_operator_fields():
    card = _report_card()
    summary = _section(card, "data-crop-ai-crop-summary", "data-crop-ai-safety-interlock-summary")
    assert "작물 요약" in summary
    required = {
        "작물단계": "data-crop-ai-summary-stage",
        "작물상태": "data-crop-ai-summary-growth-state",
        "환경요약": "data-crop-ai-summary-environment-risk",
        "관수요약": "data-crop-ai-summary-irrigation-risk",
        "병충해요약": "data-crop-ai-summary-pest-risk",
    }
    for label, marker in required.items():
        assert label in summary
        assert marker in summary
    for text in ("작물 모델 파이프라인", "조치 추천 요청", "검토 요청 요약"):
        assert text not in summary


def test_v11021_safety_interlock_summary_has_safety_interlock_error_count():
    card = _report_card()
    summary = _section(card, "data-crop-ai-safety-interlock-summary", "data-crop-ai-model-status-summary")
    assert "안전/인터록 상태 요약" in summary
    required = {
        "안전상태": "data-crop-ai-summary-safety-status",
        "인터록 상태": "data-crop-ai-summary-interlock-status",
        "오류건수": "data-crop-ai-summary-error-count",
    }
    for label, marker in required.items():
        assert label in summary
        assert marker in summary
    assert "data-crop-interlock-approval-gate" in summary


def test_v11021_model_status_summary_has_detail_button_and_keeps_evidence_collapsed():
    card = _report_card()
    model = _section(card, "data-crop-ai-model-status-summary", "data-crop-ai-advanced-details")
    assert "모델 상태 요약" in model
    assert "data-crop-ai-model-detail-toggle" in model
    assert "상세" in model
    assert "data-crop-ai-model-pipeline-summary" in model
    assert "data-crop-ai-review-request-summary" in model
    details = _section(card, "data-crop-ai-advanced-details", "</details>")
    for marker in (
        "data-crop-ai-stage-prediction-model",
        "data-crop-ai-reproductive-vegetative-model",
        "data-crop-risk-factor-numeric-evidence",
        "data-crop-integrated-diagnosis-evidence",
        "data-crop-action-recommendation-evidence",
    ):
        assert marker in details


def test_v11021_versions_and_docs_record_top_summary_cards():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    docs = _read(UI_DOC) + "\n" + _read(MASTER) + "\n" + _read(PLAN)
    assert '"version": "1.15.11"' in manifest
    assert 'const VERSION = "1.15.11"' in panel
    assert "v1.10.21 AI Strategy top summary cards" in docs
    for marker in (
        "data-crop-ai-crop-summary",
        "data-crop-ai-safety-interlock-summary",
        "data-crop-ai-model-status-summary",
        "data-crop-ai-model-detail-toggle",
    ):
        assert marker in panel
        assert marker in docs
