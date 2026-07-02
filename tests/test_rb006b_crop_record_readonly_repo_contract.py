from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
CROP_SERVICE = ROOT / "custom_components" / "green_smart" / "services" / "crop_service.py"
CROP_REPO = ROOT / "custom_components" / "green_smart" / "repositories" / "crop_repo.py"
BACKEND_PLAN = ROOT / "docs" / "rebuild" / "backend-api-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _class_section(source: str, class_name: str, next_marker: str) -> str:
    return source.split(f"class {class_name}", 1)[1].split(next_marker, 1)[0]


def test_rb006b_version_surfaces_are_v1119():
    assert '"version": "1.14.31"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.31"' in _read(PANEL)
    assert "v1.14.31" in _read(BACKEND_PLAN)


def test_rb006b_repository_preserves_growth_pest_control_read_helpers():
    repo = _read(CROP_REPO)
    for marker in (
        "async def list_growth_records",
        "async def list_pest_records",
        "async def list_control_records",
        "FROM growth_surveys",
        "FROM pest_surveys",
        "FROM control_records r",
        "LEFT JOIN control_pesticides p ON p.control_id = r.id",
        "ORDER BY survey_date DESC",
        "ORDER BY r.control_date DESC, p.sort_order ASC",
        "metricsJson",
        "mixCheckStatus",
        "phiDays",
        "reiHours",
    ):
        assert marker in repo
    read_section = repo.split("async def list_growth_records", 1)[1]
    for forbidden in (
        "INSERT INTO growth_surveys",
        "INSERT INTO pest_surveys",
        "INSERT INTO control_records",
        "UPDATE growth_surveys",
        "UPDATE pest_surveys",
        "UPDATE control_records",
        "HomeAssistantView",
        "web.Request",
    ):
        assert forbidden not in read_section


def test_rb006b_service_exposes_record_read_methods_with_permission_smoke():
    service = _read(CROP_SERVICE)
    for marker in (
        "async def list_growth_records",
        "async def list_pest_records",
        "async def list_control_records",
        "_require_crop_read",
        "view_crop_records",
        "crop_repo.list_growth_records",
        "crop_repo.list_pest_records",
        "crop_repo.list_control_records",
        "return rows",
    ):
        assert marker in service
    for forbidden in (
        "INSERT INTO",
        "UPDATE ",
        "DELETE FROM",
        "HomeAssistantView",
        "web.Request",
    ):
        assert forbidden not in service


def test_rb006b_growth_pest_control_get_routes_delegate_and_writes_stay_in_views():
    crop = _read(CROP_VIEWS)
    for name in ("list_growth_records", "list_pest_records", "list_control_records"):
        assert name in crop

    growth = _class_section(crop, "CropGrowthListView", "def _growth_metric_value")
    pest = _class_section(crop, "CropPestListView", "class CropPestDeleteView")
    control = _class_section(crop, "CropControlListView", "class CropControlDeleteView")

    for section, service_call in (
        (growth, "list_growth_records(hass, actor, int(season_id))"),
        (pest, "list_pest_records(hass, actor, int(season_id))"),
        (control, "list_control_records(hass, actor, int(season_id))"),
    ):
        get_section = section.split("    async def get", 1)[1].split("    async def post", 1)[0]
        assert "CropReadActor" in get_section
        assert "view_crop_records" in get_section
        assert service_call in get_section
        assert "return _json(rows)" in get_section
        assert "SELECT" not in get_section
        assert "FROM " not in get_section
        assert "INSERT INTO" not in get_section
        assert "UPDATE " not in get_section
        assert "DELETE FROM" not in get_section

    assert "INSERT INTO growth_surveys" in growth.split("    async def post", 1)[1]
    assert "INSERT INTO pest_surveys" in pest.split("    async def post", 1)[1]
    assert "INSERT INTO control_records" in control.split("    async def post", 1)[1]
    assert "INSERT INTO control_pesticides" in control.split("    async def post", 1)[1]


def test_rb006b_route_paths_and_delete_views_are_unchanged():
    crop = _read(CROP_VIEWS)
    for marker in (
        'url  = "/api/green_smart/crop/seasons/{season_id}/growth"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/pest"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/control"',
        'url  = "/api/green_smart/crop/growth/{record_id}"',
        'url  = "/api/green_smart/crop/pest/{record_id}"',
        'url  = "/api/green_smart/crop/control/{record_id}"',
        "class CropGrowthDeleteView(HomeAssistantView)",
        "class CropPestDeleteView(HomeAssistantView)",
        "class CropControlDeleteView(HomeAssistantView)",
    ):
        assert marker in crop


def test_rb006b_docs_record_record_readonly_boundary_and_forbidden_scope():
    backend = _read(BACKEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    for marker in (
        "RB-006B Crop record read-only repositories",
        "v1.14.31",
        "growth/pest/control read GET helpers",
        "list_growth_records",
        "list_pest_records",
        "list_control_records",
        "RB-006C Crop season write service/repo boundary",
        "route path 변경 없음",
        "response shape 변경 없음",
        "DB migration 없음",
    ):
        assert marker in backend
        assert marker in master
    assert "custom_components/green_smart/repositories/crop_repo.py" in project
    assert "custom_components/green_smart/services/crop_service.py" in project
