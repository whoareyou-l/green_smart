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


def test_v1986_record_type_crop_subtabs_use_summary_list_header_record_list_order():
    panel = _read(PANEL)
    sections = {
        "basic": _section(panel, "  _renderCropBasicOverviewCard()", "  _renderCropSeasonsList()"),
        "growth": _section(panel, "  _renderCropGrowthTab()", "  _growthMetricGroups"),
        "pest": _section(panel, "  _renderCropPestTab()", "  _renderCropControlTab()"),
        "control": _section(panel, "  _renderCropControlTab()", "  // ── Crop 팝업"),
    }
    required = {
        "basic": ("data-crop-basic-summary-card", "data-crop-basic-list-header", "data-crop-basic-season-list"),
        "growth": ("data-crop-growth-summary-card", "data-crop-growth-list-header", "data-crop-growth-record-list"),
        "pest": ("data-crop-pest-summary-card", "data-crop-pest-list-header", "data-crop-pest-record-list"),
        "control": ("data-crop-control-summary-card", "data-crop-control-list-header", "data-crop-control-record-list"),
    }
    for tab, section in sections.items():
        summary, header, records = required[tab]
        assert "data-crop-subtab-main-format" in section
        assert "data-crop-subtab-summary-card" in section
        assert "data-crop-subtab-list-header" in section
        assert "data-crop-subtab-record-list" in section
        assert summary in section
        assert header in section
        assert records in section
        assert section.index(summary) < section.index(header) < section.rfind(records)
        assert "data-crop-list-title" in section
        assert "data-crop-list-description" in section
        assert "data-crop-list-count" in section
        assert "data-crop-list-actions" in section


def test_v1987_ai_subtab_is_strategy_panel_not_record_list():
    panel = _read(PANEL)
    ai = _section(panel, "  _renderCropAiStrategyTab()", "  _renderCropPestTab()")
    report = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    assert "data-crop-subtab-main-format" in ai
    assert "data-crop-ai-strategy-panel" in ai
    assert "data-crop-ai-strategy-header" in report
    assert "data-crop-ai-evidence-panel" in report
    assert "data-crop-ai-primary-summary" in report
    assert "data-crop-ai-advanced-details" in report
    assert "data-crop-ai-list-header" not in ai
    assert "data-crop-ai-evidence-list" not in ai
    assert "data-crop-subtab-record-list" not in ai
    assert "data-crop-list-count" not in ai


def test_v1986_pest_and_control_do_not_put_record_title_above_summary():
    panel = _read(PANEL)
    pest = _section(panel, "  _renderCropPestTab()", "  _renderCropControlTab()")
    control = _section(panel, "  _renderCropControlTab()", "  // ── Crop 팝업")
    assert "data-crop-pest-top-heading" not in pest
    assert "data-crop-control-top-heading" not in control
    assert pest.index("data-crop-pest-summary-card") < pest.index("data-crop-pest-list-header")
    assert control.index("data-crop-control-summary-card") < control.index("data-crop-control-list-header")


def test_v1986_list_header_contract_versions_and_docs():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    docs = _read(UI_DOC) + "\n" + _read(MASTER)
    assert '"version": "1.11.17"' in manifest
    assert 'const VERSION = "1.11.17"' in panel
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "v1.9.86 Crop Settings unified subtab list layout" in docs
    assert "v1.9.99 AI Strategy panel-type layout" in docs
    for marker in (
        "data-crop-subtab-main-format",
        "data-crop-subtab-summary-card",
        "data-crop-subtab-list-header",
        "data-crop-subtab-record-list",
        "data-crop-ai-strategy-panel",
    ):
        assert marker in panel
        assert marker in docs
