from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CONTROL_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-control-modal.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _section(panel: str, start: str, end: str) -> str:
    return panel.split(start, 1)[1].split(end, 1)[0]


def test_v1985_subtabs_show_icon_and_label_only_no_duplicate_emoji():
    panel = _read(PANEL)
    settings = _section(panel, "  _renderCropSettingsPage()", "  _renderSeasonSelector()")
    assert "data-crop-ui-icon-tab" in settings
    assert "data-crop-tab-icon" in settings
    assert "data-crop-tab-label" in settings
    assert "data-crop-tab-emoji" not in panel
    assert "${t.emoji}" not in panel
    assert "이모티콘 + 하위탭명만 표시" in settings


def test_v1985_all_crop_record_rows_share_edit_delete_actions_and_demolish_only_basic():
    panel = _read(PANEL)
    basic = _section(panel, "  _renderCropBasicTab()", "  _renderGrowthReportCard()")
    growth = _section(panel, "  _renderCropGrowthTab()", "  _renderCropAiStrategyTab()")
    pest = _section(panel, "  _renderCropPestTab()", "  _renderCropControlTab()")
    control = _section(panel, "  _renderCropControlTab()", "  // ── Crop 팝업")

    assert "_cropRecordActionGroup(marker, secondaryHtml = \"\", dangerHtml = \"\")" in panel
    assert "data-crop-record-action-group" in panel
    assert "data-crop-record-secondary-actions" in panel
    assert "data-crop-record-danger-actions" in panel

    for section, marker, edit_marker, delete_marker in (
        (basic, "data-crop-basic-record-actions", "data-season-edit", "data-season-delete"),
        (growth, "data-crop-growth-record-actions", "data-growth-edit", "data-growth-del"),
        (pest, "data-crop-pest-record-actions", "data-pest-edit", "data-pest-del"),
        (control, "data-crop-control-record-actions", "data-control-edit", "data-control-del"),
    ):
        assert marker in section
        assert edit_marker in section
        assert delete_marker in section
        assert "mdi:pencil" in section
        assert "mdi:trash-can-outline" in section

    assert "data-season-demolish" in basic
    assert "data-season-demolish" not in growth
    assert "data-season-demolish" not in pest
    assert "data-season-demolish" not in control


def test_v1985_ai_strategy_has_single_summary_then_collapsed_technical_evidence():
    panel = _read(PANEL)
    ai = _section(panel, "  _renderCropAiStrategyTab()", "  _renderCropPestTab()")
    report = _section(panel, "  _renderGrowthReportCard()", "  async _fetchGrowthReport")

    assert "data-crop-ai-summary-card" in ai
    assert "data-crop-ai-primary-summary" in report
    assert "data-crop-ai-advanced-details" in report
    assert ai.count("data-crop-ai-summary-card") == 1
    assert "data-crop-growth-report-card" not in ai
    assert "data-crop-ai-duplicate-card-guard" in ai


def test_v1985_pest_and_control_follow_summary_action_record_order_with_common_aliases():
    panel = _read(PANEL)
    pest = _section(panel, "  _renderCropPestTab()", "  _renderCropControlTab()")
    control = _section(panel, "  _renderCropControlTab()", "  // ── Crop 팝업")

    for section, summary, action, records in (
        (pest, "data-crop-pest-summary-card", "data-crop-pest-action-row", "data-crop-pest-record-list"),
        (control, "data-crop-control-summary-card", "data-crop-control-action-row", "data-crop-control-record-list"),
    ):
        assert summary in section
        assert action in section
        assert records in section
        assert section.index(summary) < section.index(action) < section.index(records)
        assert "요약 카드 다음에 액션 줄과 기록 목록" in section


def test_v1985_control_modal_places_chemical_and_water_usage_side_by_side():
    panel = _read(PANEL)
    popup = _section(panel, "  _openControlAddPopup()", "  _openControlEditPopup") + "\n" + _read(CONTROL_MODAL)

    assert "data-control-dose-grid" in popup
    assert "data-control-usage-row" in popup
    assert "data-chemical-amount-input" in popup
    assert "data-water-amount-input" in popup
    assert popup.index("data-chemical-amount-input") < popup.index("data-water-amount-input")
    usage_row = popup.split("data-control-usage-row", 1)[1].split("data-dil-input", 1)[0]
    assert "grid-template-columns:repeat(2,minmax(0,1fr))" in usage_row
    assert "약제 사용량" in usage_row
    assert "물 사용량" in usage_row


def test_v1985_versions_and_docs_record_five_corrections():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.11.17"' in manifest
    assert 'const VERSION = "1.11.17"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.99 five requested Crop Settings UI corrections" in docs
