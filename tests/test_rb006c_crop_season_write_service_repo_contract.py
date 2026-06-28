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


def test_rb006c_version_surfaces_are_v11110():
    assert '"version": "1.11.11"' in _read(MANIFEST)
    assert 'const VERSION = "1.11.11"' in _read(PANEL)
    assert "v1.11.11" in _read(BACKEND_PLAN)


def test_rb006c_repository_owns_crop_season_write_sql_and_legacy_refetch_shape():
    repo = _read(CROP_REPO)
    for marker in (
        "async def create_crop_season",
        "async def update_crop_season",
        "async def demolish_crop_season",
        "async def hard_delete_crop_season",
        "async def get_crop_season",
        "INSERT INTO crop_seasons",
        "UPDATE crop_seasons",
        "DELETE cp FROM control_pesticides cp",
        "DELETE FROM control_records WHERE season_id = %s",
        "DELETE FROM pest_surveys WHERE season_id = %s",
        "DELETE FROM growth_surveys WHERE season_id = %s",
        "DELETE FROM crop_seasons WHERE id = %s",
        "LEFT JOIN zones z ON z.id = s.zone_id",
        "cropType",
        "demolishDate",
        "zoneName",
        "zoneId",
    ):
        assert marker in repo
    for forbidden in (
        "request.app",
        "HomeAssistantView",
        "web.Request",
        "web.Response",
    ):
        assert forbidden not in repo


def test_rb006c_service_exposes_write_actor_and_write_methods_with_permission_smoke():
    service = _read(CROP_SERVICE)
    for marker in (
        "class CropWriteActor",
        "edit_crop_records",
        "delete_crop_records",
        "_require_crop_write",
        "_require_crop_delete",
        "async def create_crop_season",
        "async def update_crop_season",
        "async def demolish_crop_season",
        "async def hard_delete_crop_season",
        "crop_repo.create_crop_season",
        "crop_repo.update_crop_season",
        "crop_repo.demolish_crop_season",
        "crop_repo.hard_delete_crop_season",
        "crop_repo.get_crop_season",
        "_vs003_lettuce_crop_cycle_payload",
    ):
        assert marker in service
    for forbidden in (
        "INSERT INTO crop_seasons",
        "UPDATE crop_seasons",
        "DELETE FROM crop_seasons",
        "HomeAssistantView",
        "web.Request",
    ):
        assert forbidden not in service


def test_rb006c_crop_season_write_routes_delegate_to_service_only():
    crop = _read(CROP_VIEWS)
    for marker in (
        "CropWriteActor",
        "create_crop_season",
        "update_crop_season",
        "demolish_crop_season",
        "hard_delete_crop_season",
    ):
        assert marker in crop

    seasons = _class_section(crop, "CropSeasonsView", "class CropSeasonDemolishView")
    demolish = _class_section(crop, "CropSeasonDemolishView", "class CropSeasonDeleteView")
    detail = _class_section(crop, "CropSeasonDeleteView", "def _normalize_growth_metrics")

    post_section = seasons.split("    async def post", 1)[1]
    patch_demolish = demolish.split("    async def patch", 1)[1]
    patch_detail = detail.split("    async def patch", 1)[1].split("    async def delete", 1)[0]
    delete_detail = detail.split("    async def delete", 1)[1]

    for section, service_call in (
        (post_section, "create_crop_season(hass, actor, body)"),
        (patch_detail, "update_crop_season(hass, actor, int(season_id), body)"),
        (patch_demolish, "demolish_crop_season(hass, actor, int(season_id), demolish_date)"),
        (delete_detail, "hard_delete_crop_season(hass, actor, sid)"),
    ):
        assert "CropWriteActor" in section
        assert service_call in section
        assert "return _json(" in section
        assert "INSERT INTO" not in section
        assert "UPDATE crop_seasons" not in section
        assert "DELETE FROM" not in section
        assert "fetchone(" not in section
        assert "execute(" not in section


def test_rb006c_route_paths_and_record_write_routes_are_unchanged():
    crop = _read(CROP_VIEWS)
    for marker in (
        'url  = "/api/green_smart/crop/seasons"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/demolish"',
        'url  = "/api/green_smart/crop/seasons/{season_id}"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/growth"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/pest"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/control"',
        "INSERT INTO growth_surveys",
        "INSERT INTO pest_surveys",
        "INSERT INTO control_records",
        "INSERT INTO control_pesticides",
    ):
        assert marker in crop


def test_rb006c_docs_record_write_boundary_and_forbidden_scope():
    backend = _read(BACKEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    for marker in (
        "RB-006C Crop season write service/repo boundary",
        "v1.11.11",
        "create/update/delete/demolish write helpers",
        "create_crop_season",
        "update_crop_season",
        "demolish_crop_season",
        "hard_delete_crop_season",
        "growth/pest/control write 경로 변경 없음",
        "route path 변경 없음",
        "response shape 변경 없음",
        "DB migration 없음",
    ):
        assert marker in backend
        assert marker in master
    assert "custom_components/green_smart/repositories/crop_repo.py" in project
    assert "custom_components/green_smart/services/crop_service.py" in project
