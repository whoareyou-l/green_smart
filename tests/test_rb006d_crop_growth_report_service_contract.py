from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
CROP_SERVICE = ROOT / "custom_components" / "green_smart" / "services" / "crop_service.py"
BACKEND_PLAN = ROOT / "docs" / "rebuild" / "backend-api-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _class_section(source: str, class_name: str, next_marker: str) -> str:
    return source.split(f"class {class_name}", 1)[1].split(next_marker, 1)[0]


def test_rb006d_version_surfaces_are_v11111():
    assert '"version": "1.14.98"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.98"' in _read(PANEL)
    assert "v1.14.98" in _read(BACKEND_PLAN)


def test_rb006d_service_exposes_growth_report_boundary_without_sql_or_http():
    service = _read(CROP_SERVICE)
    for marker in (
        "async def growth_report_response",
        "CropReadActor",
        "_require_crop_read",
        "view_crop_records",
        "builder(hass, int(season_id))",
        "return report",
    ):
        assert marker in service
    boundary = service.split("async def growth_report_response", 1)[1]
    for forbidden in (
        "SELECT ",
        "FROM crop_model_training_snapshots",
        "FROM growth_surveys",
        "HomeAssistantView",
        "web.Request",
        "web.Response",
        "persistent_notification",
    ):
        assert forbidden not in boundary


def test_rb006d_growth_report_route_delegates_to_service_and_preserves_path():
    crop = _read(CROP_VIEWS)
    assert "growth_report_response" in crop
    section = _class_section(crop, "CropGrowthReportView", "class CropModelFeatureSourcesView")
    for marker in (
        'url  = "/api/green_smart/crop/seasons/{season_id}/growth-report"',
        'name = "api:green_smart:crop:growth_report"',
        "CropReadActor",
        "growth_report_response(hass, actor, int(season_id), builder=_growth_report_response)",
        "return _json(report)",
        "from .rbac import _ha_user_from_request",
    ):
        assert marker in section
    get_section = section.split("async def get", 1)[1]
    for forbidden in (
        "await _growth_report_response(request.app",
        "SELECT ",
        "FROM ",
        "fetchall(",
        "fetchone(",
        "execute(",
    ):
        assert forbidden not in get_section


def test_rb006d_other_growth_report_consumers_and_scheduler_are_unchanged():
    crop = _read(CROP_VIEWS)
    for marker in (
        "class CropGrowthReportNotifyView(HomeAssistantView)",
        "_maybe_send_growth_report_auto_notification",
        "_run_growth_report_notification_tick",
        "await _growth_report_response(hass, int(season_id))",
        "report = await _growth_report_response(hass, season_id)",
        "persistent_notification",
    ):
        assert marker in crop


def test_rb006d_docs_record_model_report_boundary_and_forbidden_scope():
    backend = _read(BACKEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    for marker in (
        "RB-006D Crop model/report service boundary",
        "v1.14.98",
        "growth-report GET service boundary",
        "growth_report_response",
        "Center sync scheduler 변경 없음",
        "route path 변경 없음",
        "response shape 변경 없음",
        "DB migration 없음",
    ):
        assert marker in backend
        assert marker in master
    assert "custom_components/green_smart/services/crop_service.py" in project
