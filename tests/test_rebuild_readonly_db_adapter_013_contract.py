from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
REPO = ROOT / "custom_components/green_smart/repositories/rebuild_crop_context_repo.py"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
DB_SCHEMA = ROOT / "docs/master/03-database-schema.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
DB_ADAPTER_DOC = ROOT / "docs/rebuild/read-only-db-adapter.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs013_version_surfaces_are_aligned_to_1_12_12():
    assert '"version": "1.14.34"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.34"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.34"' in _read(REBUILD_PANEL)
    for path in (INTERFACE_SPEC, DB_SCHEMA, LEGACY_INVENTORY, PRODUCT_PLAN, DB_ADAPTER_DOC):
        assert "v1.14.34" in _read(path)


def test_readonly_db_adapter_document_declares_legacy_physical_to_target_dto_boundary():
    text = _read(DB_ADAPTER_DOC)
    required = (
        "# RS-013 Read-only DB Adapter",
        "Status: active read-only backend adapter boundary",
        "legacy physical schema is adapter-only",
        "Product-facing DTO names are crop_cycle/currentCrop",
        "No production route removal in RS-013",
        "No DB migration in RS-013",
        "crop_seasons -> cropCycles",
        "crop_season_id -> crop_cycle_id",
        "season_id -> crop_cycle_id",
        "compatibilityAliases.cropSeasonId",
        "read-only adapter must not INSERT/UPDATE/DELETE",
    )
    for marker in required:
        assert marker in text


def test_repo_is_readonly_and_queries_legacy_physical_schema_with_target_aliases():
    text = _read(REPO)
    required = (
        "RS-013 read-only adapter repository",
        "async def list_current_crop_cycle_rows",
        "FROM crop_seasons s",
        "LEFT JOIN zones z",
        "s.id AS crop_cycle_id",
        "s.id AS compatibility_crop_season_id",
        "s.crop_type AS crop_type",
        "COALESCE(z.name",
        "WHERE s.deleted_at IS NULL",
        "ORDER BY s.plant_date DESC",
        "fetchall",
    )
    for marker in required:
        assert marker in text
    forbidden = ("INSERT ", "UPDATE ", "DELETE ", "execute(")
    for marker in forbidden:
        assert marker not in text


def test_service_mapper_converts_rows_to_product_home_context_dto():
    module = _load_module(SERVICE, "rebuild_crop_context_service_rs013")
    assert hasattr(module, "crop_cycle_row_to_zone_context")
    assert hasattr(module, "rebuild_home_context_from_rows")

    row = {
        "zone_id": 2,
        "zone_name": "B구역",
        "crop_cycle_id": 12,
        "compatibility_crop_season_id": 12,
        "crop_type": "tomato",
        "variety": "대추방울",
        "growth_stage": "착과",
        "plant_date": "2026-06-01",
        "demolish_date": None,
        "updated_at": "2026-06-28T12:30:00",
    }
    zone = module.crop_cycle_row_to_zone_context(row)
    assert zone["id"] == "zone-2"
    assert zone["zone_id"] == 2
    assert zone["currentCrop"]["crop_cycle_id"] == 12
    assert zone["currentCrop"]["crop_type"] == "tomato"
    assert zone["currentCrop"]["crop_label_ko"] == "토마토"
    assert zone["currentCrop"]["variety"] == "대추방울"
    assert zone["activeCropCycleId"] == 12
    assert zone["crop_cycle"] == 12
    assert zone["compatibilityAliases"]["cropSeasonId"] == 12
    assert zone["dataAvailability"]["source"] == "legacy_physical_readonly_adapter"
    assert zone["equipmentProfile"]["labels"] == ["구역 장비 요약 대기"]

    context = module.rebuild_home_context_from_rows([row], greenhouse_id="greenhouse-main")
    assert context["contextSource"] == "legacy-physical-readonly-adapter"
    assert context["readOnly"] is True
    assert context["executionEnabled"] is False
    assert context["greenhouseId"] == "greenhouse-main"
    assert context["zones"][0]["currentCrop"]["crop_cycle_id"] == 12


def test_service_exposes_async_readonly_home_context_boundary():
    text = _read(SERVICE)
    required = (
        "RS-013 read-only service boundary",
        "async def get_rebuild_home_context_from_legacy_db",
        "list_current_crop_cycle_rows",
        "rebuild_home_context_from_rows",
        "legacy-physical-readonly-adapter",
        '"readOnly": True',
        '"executionEnabled": False',
        "compatibilityAliases",
    )
    for marker in required:
        assert marker in text
    for marker in ("create_crop", "update_crop", "delete_crop", "execute("):
        assert marker not in text


def test_master_docs_inventory_and_plan_promote_rs013_completion():
    spec = _read(INTERFACE_SPEC)
    schema = _read(DB_SCHEMA)
    inventory = _read(LEGACY_INVENTORY)
    plan = _read(PRODUCT_PLAN)
    for marker in (
        "Read-only DB adapter boundary",
        "legacy-physical-readonly-adapter",
        "crop_seasons remains physical compatibility source",
        "product DTO exposes crop_cycle/currentCrop",
        "No DB migration in RS-013",
    ):
        assert marker in spec
    for marker in (
        "Read-only adapter from legacy physical schema to target DTO",
        "crop_seasons is read through adapter-only repository",
        "external DTO uses crop_cycle/currentCrop",
    ):
        assert marker in schema
    assert "RS-013" in inventory
    assert "Read-only DB adapter from legacy physical source to target DTO completed" in inventory
    assert "RS-014" in inventory
    assert "Rebuild home context API source adapter" in inventory
    for marker in (
        "Phase R4.9 — Read-only DB adapter",
        "Status:** `v1.14.34`에서 legacy physical DB → crop_cycle/currentCrop DTO read-only adapter 완료",
        "No production route removal in RS-013",
        "No DB migration in RS-013",
    ):
        assert marker in plan
