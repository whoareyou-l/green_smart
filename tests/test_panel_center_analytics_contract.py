from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CENTRAL_API = ROOT / "custom_components" / "green_smart" / "central_api.py"
CENTRAL_VIEWS = ROOT / "custom_components" / "green_smart" / "central_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-safety-interlock-real-use-design.md"
BACKEND_DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"


def _source(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_edge_central_analytics_readonly_api_contract():
    central_api = _source(CENTRAL_API)
    central_views = _source(CENTRAL_VIEWS)
    init_source = _source(INIT)

    for marker in (
        "CROP_INTERLOCK_ANALYTICS_SUMMARY_PATH",
        "async def get_crop_interlock_analytics_summary",
        '"/analytics/crop-interlock/summary"',
        'params={"farm_id": farm_id, "season_id": season_id}',
        '"Authorization": f"Bearer {access_token}"',
    ):
        assert marker in central_api

    for marker in (
        "class CentralCropInterlockAnalyticsSummaryView",
        'url = "/api/green_smart/central/crop/interlock-analytics/summary"',
        "get_crop_interlock_analytics_summary",
        "analytics/reporting only",
        "not real-time safety decision",
        "farm_id",
        "season_id",
    ):
        assert marker in central_views

    assert "CentralCropInterlockAnalyticsSummaryView" in init_source
    assert "hass.http.register_view(CentralCropInterlockAnalyticsSummaryView())" in init_source


def test_panel_center_analytics_readonly_card_contract():
    source = _source(PANEL)
    for marker in (
        "_centerCropInterlockAnalyticsData",
        "_fetchCenterCropInterlockAnalytics",
        "_renderCenterCropInterlockAnalyticsCard",
        'green_smart/central/crop/interlock-analytics/summary',
        "data-center-crop-interlock-analytics-card",
        "data-center-crop-interlock-analytics-refresh",
        "센터 분석 참고",
        "실시간 제어 판단은 현장 Edge가 수행합니다",
        "reason_counts",
        "approval_gate_counts",
        "approval_type_counts",
        "harvest_safety_unknown_count",
        "stage_index_problem_count",
        "stage_index_hard_block_count",
    ):
        assert marker in source

    assert "data-center-crop-interlock-analytics-execute" not in source
    assert "centerAnalyticsAllowExecution" not in source


def test_center_analytics_readonly_docs_contract():
    combined = _source(DESIGN) + "\n" + _source(BACKEND_DOC)
    for marker in (
        "POST /api/green_smart/central/crop/interlock-snapshot/sync",
        "GET /api/green_smart/central/crop/interlock-analytics/summary",
        "센터 분석 참고",
        "실시간 제어 판단은 현장 Edge가 수행합니다",
        "읽기 전용 카드",
    ):
        assert marker in combined
