from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
CONTROL_MODAL = ROOT / "custom_components/green_smart/panel/domains/crop/crop-control-modal.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(panel: str, start: str, end: str) -> str:
    return panel.split(start, 1)[1].split(end, 1)[0]


def test_v1978_crop_tab_bar_removes_duplicate_emoji_text():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    tab_section = _section(panel, "const tabBar =", "const content = this._renderCropTabContent")

    assert "emoji:" not in _section(panel, "const tabs = [", "];\n    const tabBar")
    assert "data-crop-tab-emoji" not in tab_section
    assert "${t.emoji}" not in tab_section
    assert "data-crop-tab-icon" in tab_section
    assert "data-crop-tab-label" in tab_section
    assert "이모티콘 + 하위탭명만 표시" in docs


def test_v1978_record_action_format_is_shared_without_demolish_leakage():
    panel = _read(PANEL)
    docs = _read(UI_DOC)

    for marker in (
        "_cropRecordActionGroup",
        "data-crop-record-action-group",
        "data-crop-record-secondary-actions",
        "data-crop-record-danger-actions",
        "data-crop-growth-record-actions",
        "data-crop-pest-record-actions",
        "data-crop-control-record-actions",
    ):
        assert marker in panel
        assert marker in docs

    growth = _section(panel, "  _renderCropGrowthTab()", "  _growthMetricGroups")
    pest = _section(panel, "  _renderCropPestTab()", "  _renderCropControlTab()")
    control = _section(panel, "  _renderCropControlTab()", "  // ── Crop 팝업")
    assert "data-season-demolish" in panel
    assert "data-season-demolish" not in growth
    assert "data-season-demolish" not in pest
    assert "data-season-demolish" not in control


def test_v1978_ai_strategy_has_single_summary_then_collapsed_evidence():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    ai = _section(panel, "  _renderCropAiStrategyTab()", "  _renderCropPestTab()")
    report = _section(panel, "  _renderGrowthReportCard()", "  _renderCropBasicList")

    for marker in (
        "data-crop-ai-consolidated-layout",
        "data-crop-ai-summary-stack",
        "data-crop-ai-evidence-details",
        "data-crop-ai-duplicate-card-guard",
    ):
        assert marker in panel
        assert marker in docs

    assert ai.count("_renderGrowthReportCard()") == 1
    assert report.count("data-crop-ai-primary-summary") == 1
    assert report.count("data-crop-ai-advanced-details") == 1
    assert "data-crop-ai-duplicate-card=\"true\"" not in report
    assert "data-crop-ai-hidden-duplicate-card" not in report


def test_v1978_pest_and_control_follow_summary_then_records_layout():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    pest = _section(panel, "  _renderCropPestTab()", "  _renderCropControlTab()")
    control = _section(panel, "  _renderCropControlTab()", "  // ── Crop 팝업")

    for section, summary, action_bar, records in (
        (pest, "data-crop-pest-summary-card", "data-crop-pest-action-row", "data-crop-pest-record-list"),
        (control, "data-crop-control-safety-summary", "data-crop-control-action-row", "data-crop-control-treatment-list"),
    ):
        assert section.index(summary) < section.index(action_bar) < section.index(records)

    assert "요약 카드 다음에 액션 줄과 기록 목록" in docs


def test_v1978_control_modal_auto_calculation_fields_and_payload():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    modal = _section(panel, "  _openControlAddPopup()", "  _openCropAddPopup()") + "\n" + _read(CONTROL_MODAL)

    for marker in (
        "data-control-dose-grid",
        "data-chemical-amount-input",
        "data-water-amount-input",
        "data-dil-input",
        "data-treatment-area-input",
        "data-pyeong-amount-output",
        "_calculateControlDilution",
        "_calculateTreatmentAreaFromSeason",
        "_calculatePyeongUsage",
        "_syncControlDoseCalculations",
        "chemicalAmount",
        "waterAmount",
        "treatmentAreaM2",
        "perPyeongUsage",
        "cropModelNutritionHint",
    ):
        assert marker in modal or marker in panel
        assert marker in docs

    assert "약제 사용량" in modal
    assert "물 사용량" in modal
    assert "희석 배수 자동 계산" in modal
    assert "평당 사용량 자동 계산" in modal


def test_v1978_version_markers():
    assert '"version": "1.15.42"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.42"' in _read(PANEL)
    assert 'v1.15.42' in _read(PANEL)[:200]
    assert 'EDGE_VERSION = "1.9.96"' in _read(CENTRAL)
    assert '기준 버전: `v1.15.42`' in _read(UI_DOC)
