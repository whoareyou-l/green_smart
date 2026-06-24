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


def test_v1988_ai_main_area_order_is_crop_status_interlock_status_model_status_then_details():
    panel = _read(PANEL)
    card = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    markers = [
        "data-crop-ai-primary-summary",
        "data-crop-ai-interlock-summary",
        "data-crop-ai-model-status-summary",
        "data-crop-ai-advanced-details",
    ]
    for marker in markers:
        assert marker in card
    assert [card.index(marker) for marker in markers] == sorted(card.index(marker) for marker in markers)

    primary = _section(card, "data-crop-ai-primary-summary", "data-crop-ai-interlock-summary")
    assert "data-crop-ai-primary-gl-index" in primary
    assert "data-crop-ai-primary-yield-prediction" in primary
    assert "data-crop-ai-primary-pest-risk" in primary
    assert "G/L-Index" in primary or "G-Index" in primary
    assert "수확량 예측" in primary
    assert "병해 위험도" in primary
    for model_status_text in ("입력 상태", "생육단계/예측", "ML 준비도"):
        assert model_status_text not in primary

    interlock = _section(card, "data-crop-ai-interlock-summary", "data-crop-ai-model-status-summary")
    assert "작물 인터록" in interlock or "인터록 상태 요약" in interlock
    assert "data-crop-interlock-card" in interlock
    assert "data-crop-interlock-approval-gate" in interlock

    model_status = _section(card, "data-crop-ai-model-status-summary", "data-crop-ai-advanced-details")
    for text in ("입력 상태", "생육단계/예측", "리스크", "ML 준비도"):
        assert text in model_status


def test_v1988_ai_details_contain_only_model_hierarchy_top_models_then_submodels():
    panel = _read(PANEL)
    card = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    details = _section(card, "data-crop-ai-advanced-details", "</details>")
    markers = [
        "data-crop-ai-stage-prediction-model",
        "data-crop-ai-reproductive-vegetative-model",
        "data-crop-ai-pest-prediction-model",
        "data-crop-ai-submodel-evidence-section",
        "data-crop-kma-weather-stress-card",
    ]
    for marker in markers:
        assert marker in details
    assert [details.index(marker) for marker in markers] == sorted(details.index(marker) for marker in markers)
    assert "data-crop-ai-interlock-summary" not in details
    assert "data-crop-ai-model-status-summary" not in details


def test_v1988_ai_versions_and_docs_record_model_hierarchy():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.10.4"' in manifest
    assert 'const VERSION = "1.10.4"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 AI Strategy model hierarchy restructure" in docs
    for marker in (
        "data-crop-ai-primary-gl-index",
        "data-crop-ai-primary-yield-prediction",
        "data-crop-ai-primary-pest-risk",
        "data-crop-ai-interlock-summary",
        "data-crop-ai-model-status-summary",
        "data-crop-ai-stage-prediction-model",
        "data-crop-ai-reproductive-vegetative-model",
        "data-crop-ai-pest-prediction-model",
        "data-crop-ai-submodel-evidence-section",
    ):
        assert marker in panel
        assert marker in docs
