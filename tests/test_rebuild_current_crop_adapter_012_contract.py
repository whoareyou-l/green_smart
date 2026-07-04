from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
ADAPTER_DOC = ROOT / "docs/rebuild/rebuild-current-crop-adapter.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs012_version_surfaces_are_aligned_to_1_12_11():
    assert '"version": "1.14.71"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.71"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.71"' in _read(REBUILD_PANEL)
    for path in (INTERFACE_SPEC, LEGACY_INVENTORY, PRODUCT_PLAN, ADAPTER_DOC):
        assert "v1.14.71" in _read(path)


def test_current_crop_adapter_module_exists_and_exports_product_dto_helpers():
    text = _read(ADAPTER)
    required = (
        "RS-012 currentCrop/crop_cycle adapter",
        "export function normalizeCurrentCrop",
        "export function normalizeRebuildZoneContext",
        "export function normalizeRebuildHomeContext",
        "export function getRebuildHomeContext",
        "crop_cycle_id",
        "activeCropCycleId",
        "currentCrop",
        "compatibilityAliases",
        "cropSeasonId",
        "Product-facing DTO names are crop_cycle/currentCrop",
    )
    for marker in required:
        assert marker in text


def test_current_crop_adapter_normalizes_legacy_fixture_to_product_dto():
    script = f"""
import {{ normalizeRebuildHomeContext }} from {json.dumps(ADAPTER.as_uri())};
const result = normalizeRebuildHomeContext({{
  contextSource: 'legacy-fixture',
  greenhouseId: 'gh-1',
  zones: [{{
    id: 'zone-a',
    name: 'A구역',
    currentCrop: {{ cropSeasonId: 'season-7', cropType: 'tomato', cropLabelKo: '토마토', growthStage: '착과' }},
    equipmentProfile: {{ labels: ['천창'] }},
    dataAvailability: {{ state: 'ok', freshnessMinutes: 3 }}
  }}]
}});
console.log(JSON.stringify(result));
"""
    completed = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True, check=True)
    data = json.loads(completed.stdout)
    zone = data["zones"][0]
    assert zone["currentCrop"]["crop_cycle_id"] == "season-7"
    assert zone["activeCropCycleId"] == "season-7"
    assert zone["crop_cycle"] == "season-7"
    assert zone["currentCrop"]["crop_type"] == "tomato"
    assert zone["currentCrop"]["crop_label_ko"] == "토마토"
    assert zone["currentCrop"]["growth_stage"] == "착과"
    assert zone["compatibilityAliases"]["cropSeasonId"] == "season-7"
    assert zone["crop"] == "토마토"
    assert zone["state"] == "착과"


def test_rebuild_panel_uses_adapter_instead_of_inline_normalization():
    text = _read(REBUILD_PANEL)
    required = (
        'from "./current-crop-adapter.js"',
        "getRebuildHomeContext",
        "REBUILD_HOME_CONTEXT",
        "normalizeRebuildHomeContext",
    )
    for marker in required:
        assert marker in text
    assert "function normalizeRebuildHomeContext(context)" not in text
    assert "cropSeasonId || null" not in text


def test_adapter_boundary_document_and_master_interface_spec_are_updated():
    doc = _read(ADAPTER_DOC)
    for marker in (
        "# RS-012 Rebuild currentCrop/crop_cycle Adapter",
        "Status: active frontend adapter boundary",
        "legacy fixture shape may contain cropSeasonId",
        "product-facing rebuild DTO uses crop_cycle/currentCrop",
        "No production route removal in RS-012",
        "No DB migration in RS-012",
        "compatibilityAliases.cropSeasonId",
    ):
        assert marker in doc

    spec = _read(INTERFACE_SPEC)
    for marker in (
        "Rebuild currentCrop adapter boundary",
        "normalizeRebuildHomeContext",
        "currentCrop.crop_cycle_id",
        "compatibilityAliases.cropSeasonId",
        "legacy fixture shape may contain cropSeasonId but rendered rebuild DTO uses crop_cycle/currentCrop",
    ):
        assert marker in spec


def test_legacy_inventory_and_product_plan_promote_rs012_completion():
    inventory = _read(LEGACY_INVENTORY)
    plan = _read(PRODUCT_PLAN)
    assert "RS-012" in inventory
    assert "Rebuild frontend activeCropCycle/currentCrop service adapter completed" in inventory
    assert "Compatibility aliases remain adapter-only" in inventory
    assert "RS-013" in inventory
    assert "Read-only DB adapter from legacy physical source to target DTO" in inventory

    for marker in (
        "Phase R4.8 — Rebuild currentCrop/crop_cycle adapter",
        "Status:** `v1.14.71`에서 rebuild currentCrop/crop_cycle service adapter 완료",
        "legacy fixture shape may contain cropSeasonId",
        "product-facing rebuild DTO uses crop_cycle/currentCrop",
        "No production route removal in RS-012",
        "No DB migration in RS-012",
    ):
        assert marker in plan


def test_rebuild_frontend_still_does_not_render_legacy_route_or_permission_copy():
    text = _read(REBUILD_PANEL)
    for marker in (
        "crop/seasons",
        "manage_crop_seasons",
        "edit_crop_records",
        "run_dry_run",
        "execute_final_targets",
    ):
        assert marker not in text
