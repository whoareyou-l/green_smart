from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"


def _panel() -> str:
    return PANEL.read_text(encoding="utf-8")


def _section(text: str, start: str, end: str) -> str:
    return text.split(start, 1)[1].split(end, 1)[0]


def test_crop_settings_final_no_stale_selected_season_helper_call():
    panel = _panel()
    assert "_activeSeason()" in panel
    assert "_selectedSeason()" not in panel


def test_crop_settings_final_ai_forbidden_flow_markers_absent():
    panel = _panel()
    report = _section(panel, "  _renderGrowthReportCard()", "  _renderCenterCropInterlockAnalyticsCard")
    for marker in (
        "data-crop-ai-decision-flow",
        "data-crop-ai-decision-flow-steps",
        "data-crop-ai-flow-step",
        "data-crop-ai-list-header",
        "data-crop-ai-evidence-list",
    ):
        assert marker not in report


def test_crop_settings_final_control_area_unit_is_not_double_appended():
    panel = _panel()
    assert "areaLabel" in panel
    assert "${r.area}㎡" not in panel


def test_crop_settings_final_five_subtabs_have_render_methods_and_markers():
    panel = _panel()
    for marker in (
        "_renderCropBasicTab()",
        "_renderCropGrowthTab()",
        "_renderCropAiStrategyTab()",
        "_renderCropPestTab()",
        "_renderCropControlTab()",
        "작기 설정",
        "생육조사",
        "AI 전략",
        "병해충 예찰",
        "방제 기록",
    ):
        assert marker in panel
