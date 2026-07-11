from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
REPO = ROOT / "custom_components/green_smart/repositories/rebuild_crop_context_repo.py"
ZONE_ADAPTER = ROOT / "custom_components/green_smart/repositories/legacy_adapters/zones.py"
VIEW = ROOT / "custom_components/green_smart/rebuild_views.py"
DOC = ROOT / "docs/rebuild/r6-001-crop-cycle-readonly-adapter.md"
R5_BASELINE = ROOT / "docs/rebuild/r5-foundation-completion-baseline.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("r6_001_rebuild_crop_context_service", SERVICE)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_r6_001_version_surfaces_are_1_12_31():
    assert '"version": "1.15.37"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.37"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.37"' in _read(REBUILD_PANEL)
    for path in (DOC, PRODUCT_PLAN, TARGET_ARCH):
        assert "v1.15.37" in _read(path)


def test_r6_001_document_declares_scope_after_r5_foundation():
    text = _read(DOC)
    for marker in (
        "# R6-001 Crop Cycle Read-only Adapter",
        "Status: R6-001 complete",
        "R5 foundation complete before runtime adapters",
        "R6-001 is the first read-only adapter after R5 foundation closure",
        "legacy physical crop_seasons rows → product-facing crop_cycle/currentCrop DTO",
        "zone parent + currentCrop attached",
        "existing RS-013/RS-014 adapter is re-baselined as R6-001",
    ):
        assert marker in text


def test_r6_001_service_exposes_explicit_adapter_markers_and_shape():
    service_text = _read(SERVICE)
    for marker in (
        "R6-001 Crop cycle read-only adapter",
        "R6_001_ADAPTER_NAME",
        "legacy physical crop_seasons rows → product-facing crop_cycle/currentCrop DTO",
        "zone parent + currentCrop attached",
        "legacy-physical-readonly-adapter",
    ):
        assert marker in service_text

    module = _load_service()
    dto = module.crop_cycle_row_to_zone_context(
        {
            "zone_id": 2,
            "zone_name": "2구역",
            "crop_cycle_id": 10,
            "compatibility_crop_season_id": 10,
            "crop_type": "lettuce",
            "variety": "버터헤드",
            "growth_stage": "엽채 생육 관찰",
            "plant_date": "2026-06-01",
            "updated_at": "2026-06-29T01:00:00",
        }
    )
    assert dto["r6_001_adapter"] is True
    assert dto["currentCrop"]["crop_cycle_id"] == 10
    assert dto["currentCrop"]["crop_label_ko"] == "상추"
    assert dto["currentCropAssignment"]["zone_id"] == 2
    assert dto["currentCropAssignment"]["currentCrop"] == dto["currentCrop"]
    assert dto["dataAvailability"]["source"] == "legacy_physical_readonly_adapter"
    assert dto["dataAvailability"]["adapterSource"] == "legacy-physical-readonly-adapter"
    assert dto["readOnly"] is True
    assert dto["executionEnabled"] is False


def test_r6_001_repo_is_readonly_and_uses_aliases_without_migration_or_writes():
    text = _read(REPO)
    zone_adapter = _read(ZONE_ADAPTER)
    for marker in (
        "async def list_current_crop_cycle_rows",
        "s.id AS crop_cycle_id",
        "s.id AS compatibility_crop_season_id",
        "s.zone_id AS zone_id",
        "FROM crop_seasons s",
        "REBUILD_CROP_CONTEXT_ZONE_LEFT_JOIN",
    ):
        assert marker in text
    assert "LEFT JOIN zones z" in zone_adapter
    forbidden = ("INSERT ", "UPDATE ", "DELETE ", "ALTER ", "CREATE TABLE", "DROP ", "hass.services", "async_call", "call_service")
    for marker in forbidden:
        assert marker not in text


def test_r6_001_api_remains_readonly_and_execution_disabled():
    text = _read(VIEW)
    for marker in (
        "GET /api/green_smart/rebuild/home/context",
        "requires_auth = True",
        "get_rebuild_home_context_from_legacy_db",
        "legacy-physical-readonly-adapter",
    ):
        assert marker in text
    forbidden = ("post(", "put(", "delete(", "hass.services", "async_call", "call_service", "execute")
    for marker in forbidden:
        assert marker not in text


def test_r6_001_boundaries_are_linked_from_source_docs():
    for path in (R5_BASELINE, PRODUCT_PLAN, TARGET_ARCH):
        text = _read(path)
        assert "R6-001 Crop Cycle Read-only Adapter" in text
        assert "docs/rebuild/r6-001-crop-cycle-readonly-adapter.md" in text
        assert "No write/mutation in R6-001" in text
        assert "No execution decision change in R6-001" in text
        assert "question gates must use clarify tool" in text
