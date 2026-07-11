from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
CROP_SERVICE = ROOT / "custom_components" / "green_smart" / "services" / "crop_service.py"
CROP_REPO = ROOT / "custom_components" / "green_smart" / "repositories" / "crop_repo.py"
ZONE_ADAPTER = ROOT / "custom_components" / "green_smart" / "repositories" / "legacy_adapters" / "zones.py"
BACKEND_PLAN = ROOT / "docs" / "rebuild" / "backend-api-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb006a_version_surfaces_are_v1118():
    assert '"version": "1.15.31"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.31"' in _read(PANEL)
    assert "v1.15.31" in _read(BACKEND_PLAN)


def test_rb006a_repository_exists_and_preserves_crop_seasons_select_helper():
    assert CROP_REPO.exists()
    repo = _read(CROP_REPO)
    zone_adapter = _read(ZONE_ADAPTER)
    for marker in (
        "async def list_crop_seasons",
        "FROM crop_seasons s",
        "CROP_SEASON_ZONE_LEFT_JOIN",
        "CROP_SEASON_ZONE_NAME_SELECT",
        "WHERE s.deleted_at IS NULL",
        "ORDER BY s.plant_date DESC",
        "cropType",
        "demolishDate",
    ):
        assert marker in repo
    assert "LEFT JOIN zones z ON z.id = s.zone_id" in zone_adapter
    assert "zoneName" in zone_adapter
    assert "zoneId" in zone_adapter
    list_section = repo.split("async def list_crop_seasons", 1)[1].split("async def get_crop_season", 1)[0]
    for forbidden in (
        "INSERT INTO crop_seasons",
        "UPDATE crop_seasons",
        "DELETE FROM crop_seasons",
        "request.app",
        "HomeAssistantView",
        "web.Response",
    ):
        assert forbidden not in list_section


def test_rb006a_service_exists_enforces_read_permission_and_preserves_shape():
    assert CROP_SERVICE.exists()
    service = _read(CROP_SERVICE)
    for marker in (
        "async def list_crop_seasons",
        "CropReadActor",
        "view_crop_records",
        "PermissionError",
        "crop_repo.list_crop_seasons",
        "return rows",
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


def test_rb006a_crop_get_route_delegates_to_service_while_post_stays_in_view():
    crop = _read(CROP_VIEWS)
    assert "from .services.crop_service import (" in crop
    assert "CropReadActor" in crop
    assert "list_crop_seasons" in crop
    assert "from .rbac import _ha_user_from_request" in crop
    get_section = crop.split("class CropSeasonsView", 1)[1].split("    async def post", 1)[0]
    post_section = crop.split("    async def post", 1)[1].split("class CropSeasonDemolishView", 1)[0]
    for marker in (
        "CropReadActor",
        "list_crop_seasons(hass, actor)",
        "view_crop_records",
        "request.app[\"hass\"]",
        "return _json(rows)",
    ):
        assert marker in get_section
    assert "SELECT" not in get_section
    assert "FROM crop_seasons" not in get_section
    assert "create_crop_season(hass, actor, body)" in post_section
    assert "INSERT INTO crop_seasons" not in post_section
    assert "UPDATE crop_seasons" not in get_section
    assert "DELETE FROM crop_seasons" not in get_section


def test_rb006a_route_path_and_write_routes_are_unchanged():
    crop = _read(CROP_VIEWS)
    for marker in (
        'url  = "/api/green_smart/crop/seasons"',
        'name = "api:green_smart:crop:seasons"',
        'url  = "/api/green_smart/crop/seasons/{season_id}/demolish"',
        'url  = "/api/green_smart/crop/seasons/{season_id}"',
        "class CropSeasonDemolishView(HomeAssistantView)",
        "class CropSeasonDeleteView(HomeAssistantView)",
    ):
        assert marker in crop


def test_rb006a_docs_record_backend_boundary_and_forbidden_scope():
    backend = _read(BACKEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    for marker in (
        "RB-006A Crop read-only service/repo boundary",
        "v1.15.31",
        "services/crop_service.py",
        "repositories/crop_repo.py",
        "GET /api/green_smart/crop/seasons",
        "RB-006C Crop season write service/repo boundary",
        "route path 변경 없음",
        "response shape 변경 없음",
        "DB migration 없음",
    ):
        assert marker in backend
        assert marker in master
    assert "custom_components/green_smart/services/crop_service.py" in project
    assert "custom_components/green_smart/repositories/crop_repo.py" in project
