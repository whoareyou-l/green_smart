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


def _details() -> str:
    panel = _read(PANEL)
    report = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    return _section(report, "data-crop-ai-advanced-details", "</details>")


def test_v1991_operator_workflow_uses_evidence_card_and_is_not_in_top_models():
    details = _details()
    top = _section(details, 'data-crop-ai-evidence-section="top-models"', 'data-crop-ai-evidence-section="submodels"')
    ops = _section(details, 'data-crop-ai-evidence-section="model-operations"', 'data-crop-ai-evidence-section="center-reference"')
    assert "data-crop-operator-workflow-card" not in top
    assert 'data-crop-ai-evidence-card="operator-workflow"' in ops
    assert "data-crop-operator-workflow-card" in ops
    assert "이번 주 작물 모델 작업 안내" in ops
    assert "data-crop-ai-evidence-card-header" in ops
    assert "data-crop-ai-evidence-card-body" in ops
    assert "data-crop-ai-evidence-chip-group" in ops


def test_v1991_historical_support_cards_are_classified_as_model_operations_not_submodels():
    details = _details()
    sub = _section(details, 'data-crop-ai-evidence-section="submodels"', 'data-crop-ai-evidence-section="model-operations"')
    ops = _section(details, 'data-crop-ai-evidence-section="model-operations"', 'data-crop-ai-evidence-section="center-reference"')
    stale_support_markers = (
        "data-crop-quality-disorder-summary-card",
        "data-crop-prediction-validation-card",
        "data-crop-training-dataset-export-card",
    )
    for marker in stale_support_markers:
        assert marker not in sub
        assert marker in ops
    for card in (
        'data-crop-ai-evidence-card="operator-workflow"',
        'data-crop-ai-evidence-card="quality-disorder"',
        'data-crop-ai-evidence-card="prediction-validation"',
        'data-crop-ai-evidence-card="training-dataset-export"',
    ):
        assert card in ops
    assert ops.count("data-crop-ai-evidence-card-header") >= 4
    assert ops.count("data-crop-ai-evidence-card-body") >= 4
    assert ops.count("data-crop-ai-evidence-chip-group") >= 4


def test_v1991_detail_section_order_and_center_reference_order_are_clean():
    details = _details()
    sections = [
        'data-crop-ai-evidence-section="top-models"',
        'data-crop-ai-evidence-section="submodels"',
        'data-crop-ai-evidence-section="model-operations"',
        'data-crop-ai-evidence-section="center-reference"',
    ]
    for section in sections:
        assert section in details
    assert [details.index(section) for section in sections] == sorted(details.index(section) for section in sections)

    center = _section(details, 'data-crop-ai-evidence-section="center-reference"', "</section>")
    assert "센터 분석 참고" in center
    assert "_renderCenterCropInterlockAnalyticsCard" in center
    assert "data-center-crop-policy-card" in center
    assert center.index("_renderCenterCropInterlockAnalyticsCard") < center.index("data-center-crop-policy-card")


def test_v1991_only_real_submodels_remain_in_submodel_section():
    details = _details()
    sub = _section(details, 'data-crop-ai-evidence-section="submodels"', 'data-crop-ai-evidence-section="model-operations"')
    expected_cards = [
        'data-crop-ai-evidence-card="kma-weather-stress"',
        'data-crop-ai-evidence-card="environment-features"',
        'data-crop-ai-evidence-card="irrigation-nutrient-features"',
        'data-crop-ai-evidence-card="pest-control-features"',
        'data-crop-ai-evidence-card="model-feature-sources"',
    ]
    for card in expected_cards:
        assert card in sub
    assert sub.count("data-crop-ai-evidence-card=") == len(expected_cards)


def test_v1991_versions_and_docs_record_detail_cleanup():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.12.84"' in manifest
    assert 'const VERSION = "1.12.84"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 AI detail cleanup" in docs
    for marker in (
        'data-crop-ai-evidence-section="model-operations"',
        'data-crop-ai-evidence-card="operator-workflow"',
        'data-crop-ai-evidence-card="quality-disorder"',
        'data-crop-ai-evidence-card="prediction-validation"',
        'data-crop-ai-evidence-card="training-dataset-export"',
    ):
        assert marker in panel
        assert marker in docs
