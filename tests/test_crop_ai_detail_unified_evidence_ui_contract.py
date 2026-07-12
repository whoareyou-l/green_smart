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


def test_v1990_details_sections_share_evidence_section_shells():
    details = _details()
    for marker in (
        'data-crop-ai-evidence-section="top-models"',
        'data-crop-ai-evidence-section="submodels"',
        'data-crop-ai-evidence-section="center-reference"',
    ):
        assert marker in details
    assert details.index('data-crop-ai-evidence-section="top-models"') < details.index('data-crop-ai-evidence-section="submodels"') < details.index('data-crop-ai-evidence-section="center-reference"')


def test_v1990_top_and_submodel_cards_use_shared_card_contract():
    details = _details()
    top = _section(details, 'data-crop-ai-evidence-section="top-models"', 'data-crop-ai-evidence-section="submodels"')
    sub = _section(details, 'data-crop-ai-evidence-section="submodels"', 'data-crop-ai-evidence-section="center-reference"')

    # Top models should no longer start with a raw metric grid; each model is a card.
    top_card_markers = (
        'data-crop-ai-evidence-card="stage-prediction"',
        'data-crop-ai-evidence-card="reproductive-vegetative"',
        'data-crop-ai-evidence-card="pest-prediction"',
    )
    sub_card_markers = (
        'data-crop-ai-evidence-card="kma-weather-stress"',
        'data-crop-ai-evidence-card="environment-features"',
        'data-crop-ai-evidence-card="irrigation-nutrient-features"',
        'data-crop-ai-evidence-card="pest-control-features"',
        'data-crop-ai-evidence-card="model-feature-sources"',
    )
    for marker in top_card_markers:
        assert marker in top
    for marker in sub_card_markers:
        assert marker in sub

    # The same structural submarkers must be present in both groups.
    assert top.count("data-crop-ai-evidence-card-header") >= 3
    assert top.count("data-crop-ai-evidence-card-body") >= 3
    assert top.count("data-crop-ai-evidence-chip-group") >= 3
    assert sub.count("data-crop-ai-evidence-card-header") >= 5
    assert sub.count("data-crop-ai-evidence-card-body") >= 5
    assert sub.count("data-crop-ai-evidence-chip-group") >= 5


def test_v1990_details_have_consistent_section_summaries_and_no_raw_metric_overview_first_card():
    details = _details()
    top = _section(details, 'data-crop-ai-evidence-section="top-models"', 'data-crop-ai-evidence-section="submodels"')
    sub = _section(details, 'data-crop-ai-evidence-section="submodels"', 'data-crop-ai-evidence-section="center-reference"')
    for text in (
        "상위 모델",
        "주요 예측 모델 3개를 같은 카드 포맷으로 정리합니다.",
        "하위 모델 / 입력 근거",
        "상위 모델이 참고한 입력 근거를 같은 카드 포맷으로 정리합니다.",
    ):
        assert text in details
    assert 'data-crop-ai-evidence-card="stage-prediction"' in top
    assert top.index('data-crop-ai-evidence-card="stage-prediction"') < top.index('data-crop-ai-metric-overview')
    assert top.index('data-crop-ai-evidence-card="stage-prediction"') < top.index('data-crop-ai-evidence-card="reproductive-vegetative"') < top.index('data-crop-ai-evidence-card="pest-prediction"')
    assert sub.index('data-crop-ai-evidence-card="kma-weather-stress"') < sub.index('data-crop-ai-evidence-card="environment-features"') < sub.index('data-crop-ai-evidence-card="model-feature-sources"')


def test_v1990_versions_and_docs_record_unified_detail_ui():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.15.47"' in manifest
    assert 'const VERSION = "1.15.47"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 AI detail unified evidence UI" in docs
    for marker in (
        "data-crop-ai-evidence-section",
        "data-crop-ai-evidence-card",
        "data-crop-ai-evidence-card-header",
        "data-crop-ai-evidence-card-body",
        "data-crop-ai-evidence-chip-group",
    ):
        assert marker in panel
        assert marker in docs
