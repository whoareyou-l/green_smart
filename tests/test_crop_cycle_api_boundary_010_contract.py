from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
DB_SCHEMA = ROOT / "docs/master/03-database-schema.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
API_BOUNDARY = ROOT / "docs/rebuild/crop-cycle-api-boundary.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs010_version_surfaces_are_aligned_to_1_12_9():
    assert '"version": "1.14.70"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.70"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.70"' in _read(REBUILD_PANEL)
    for path in (INTERFACE_SPEC, DB_SCHEMA, LEGACY_INVENTORY, PRODUCT_PLAN, API_BOUNDARY):
        assert "v1.14.70" in _read(path)


def test_crop_cycle_api_boundary_document_declares_adapter_vs_product_names():
    text = _read(API_BOUNDARY)
    required = (
        "# RS-010 Crop Cycle API Naming Boundary",
        "Status: active boundary contract",
        "Compatibility route names are adapter-only",
        "Product-facing DTO names are crop_cycle/currentCrop",
        "No production route removal in RS-010",
        "No DB migration in RS-010",
        "legacy route: /api/green_smart/crop/seasons",
        "product route direction: /api/green_smart/crop/cycles",
        "product route direction: /api/green_smart/crop/current",
        "season_id -> crop_cycle_id",
        "crop_season_id -> crop_cycle_id",
        "cropSeasons -> cropCycles",
        "activeSeasonId -> activeCropCycleId",
        "currentCrop",
        "adapter response may include legacy aliases only under compatibilityAliases",
    )
    for marker in required:
        assert marker in text


def test_master_interface_spec_uses_crop_cycle_as_target_and_quarantines_crop_seasons():
    text = _read(INTERFACE_SPEC)
    required = (
        "Crop Cycle API boundary",
        "Target product API",
        "GET /api/green_smart/crop/cycles",
        "GET /api/green_smart/crop/current",
        "POST /api/green_smart/crop/cycles",
        "crop_cycle_id",
        "currentCrop",
        "compatibility adapter only: /api/green_smart/crop/seasons",
        "Do not document crop/seasons as new product direction",
    )
    for marker in required:
        assert marker in text


def test_legacy_inventory_promotes_rs010_and_next_steps_move_forward():
    text = _read(LEGACY_INVENTORY)
    assert "RS-010" in text
    assert "Crop Cycle API naming boundary completed" in text
    assert "Compatibility routes stay adapter-only" in text
    assert "RS-011" in text
    assert "RBAC permission naming cleanup" in text


def test_product_plan_mentions_rs010_without_route_migration():
    text = _read(PRODUCT_PLAN)
    required = (
        "Phase R4.6 — Crop Cycle API naming boundary",
        "Status:** `v1.14.70`에서 crop_cycle/currentCrop API naming boundary 완료",
        "No production route removal in RS-010",
        "No DB migration in RS-010",
        "crop/seasons = compatibility adapter",
        "crop_cycle/currentCrop = product-facing target",
    )
    for marker in required:
        assert marker in text


def test_rebuild_frontend_does_not_use_legacy_crop_season_product_state():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "crop/seasons",
        "_cropSeasons",
        "_activeSeasonId",
        "crop_season_id",
        "season_id",
    )
    for marker in forbidden:
        assert marker not in text
    assert "currentCrop" in text
    assert "crop_cycle" in text


def test_legacy_panel_is_explicitly_allowed_as_compatibility_surface():
    text = _read(LEGACY_PANEL)
    assert "Green Smart Legacy panel" in text[:600]
    assert "compatibility surface" in text[:600]
    assert "crop/seasons" in text
