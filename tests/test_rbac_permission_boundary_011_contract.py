from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
RBAC_POLICY = ROOT / "custom_components/green_smart/rbac_policy.py"
CROP_SERVICE = ROOT / "custom_components/green_smart/services/crop_service.py"
DB_SCHEMA = ROOT / "docs/master/03-database-schema.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
RBAC_BOUNDARY = ROOT / "docs/rebuild/rbac-permission-boundary.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs011_version_surfaces_are_aligned_to_1_12_10():
    assert '"version": "1.12.71"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.71"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.71"' in _read(REBUILD_PANEL)
    for path in (DB_SCHEMA, LEGACY_INVENTORY, PRODUCT_PLAN, RBAC_BOUNDARY):
        assert "v1.12.71" in _read(path)


def test_rbac_permission_boundary_document_declares_alias_vs_target_names():
    text = _read(RBAC_BOUNDARY)
    required = (
        "# RS-011 RBAC Permission Naming Boundary",
        "Status: active boundary contract",
        "Compatibility permission labels are adapter-only",
        "Product-facing permission names use gs_permissions target codes",
        "No role table migration in RS-011",
        "No production permission removal in RS-011",
        "manage_crop_seasons -> crop_cycle.write",
        "edit_crop_records -> growth_observation.write",
        "run_dry_run -> execution.dry_run",
        "execute_final_targets -> execution.command",
        "manual_device_control -> execution.command",
        "manage_users_roles -> rbac.manage",
        "manage_farm_staff_roles -> rbac.manage",
        "system_settings -> settings.manage",
        "view_audit_logs -> audit.read",
        "compatibilityAliases.permissions",
    )
    for marker in required:
        assert marker in text


def test_rbac_policy_exposes_target_permission_alias_helpers():
    module = _load_module(RBAC_POLICY, "green_smart_rbac_policy_rs011")
    assert hasattr(module, "RBAC_PERMISSION_ALIASES")
    assert hasattr(module, "normalize_permission_aliases")
    assert hasattr(module, "has_permission")

    normalized = module.normalize_permission_aliases((
        "manage_crop_seasons",
        "edit_crop_records",
        "run_dry_run",
        "execute_final_targets",
        "manage_users_roles",
        "system_settings",
    ))
    for permission in (
        "crop_cycle.write",
        "growth_observation.write",
        "execution.dry_run",
        "execution.command",
        "rbac.manage",
        "settings.manage",
    ):
        assert permission in normalized

    assert module.has_permission(("manage_crop_seasons",), "crop_cycle.write") is True
    assert module.has_permission(("crop_cycle.write",), "manage_crop_seasons") is True
    assert module.has_permission(("farm_staff",), "rbac.manage") is False


def test_crop_service_uses_target_permissions_through_alias_boundary():
    text = _read(CROP_SERVICE)
    required = (
        "from ..rbac_policy import has_permission",
        'has_permission(actor.permissions or (), "crop_cycle.read")',
        'has_permission(actor.permissions or (), "growth_observation.write")',
        'has_permission(actor.permissions or (), "crop_cycle.write")',
        'has_permission(actor.permissions or (), "crop_cycle.delete")',
    )
    for marker in required:
        assert marker in text
    assert '"edit_crop_records" not in set(actor.permissions or ())' not in text
    assert '"manage_crop_seasons" not in permissions' not in text


def test_master_schema_documents_permission_alias_map_without_promoting_legacy_names():
    text = _read(DB_SCHEMA)
    required = (
        "RBAC permission naming boundary",
        "Target permission seed remains `gs_permissions.code`",
        "Compatibility permission aliases are adapter-only",
        "manage_crop_seasons -> crop_cycle.write",
        "edit_crop_records -> growth_observation.write",
        "run_dry_run -> execution.dry_run",
        "execute_final_targets -> execution.command",
        "manage_users_roles -> rbac.manage",
        "system_settings -> settings.manage",
    )
    for marker in required:
        assert marker in text


def test_legacy_inventory_and_product_plan_promote_rs011_next_step_completion():
    inventory = _read(LEGACY_INVENTORY)
    plan = _read(PRODUCT_PLAN)
    assert "RS-011" in inventory
    assert "RBAC permission naming boundary completed" in inventory
    assert "Compatibility permissions stay adapter-only" in inventory
    assert "RS-012" in inventory
    assert "Rebuild frontend activeCropCycle/currentCrop service adapter" in inventory

    required_plan = (
        "Phase R4.7 — RBAC permission naming boundary",
        "Status:** `v1.12.71`에서 target gs_permissions permission naming boundary 완료",
        "No role table migration in RS-011",
        "No production permission removal in RS-011",
        "legacy permission strings = compatibility aliases",
        "gs_permissions target codes = product-facing permission names",
    )
    for marker in required_plan:
        assert marker in plan


def test_rebuild_frontend_does_not_render_legacy_permission_copy():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "manage_crop_seasons",
        "edit_crop_records",
        "run_dry_run",
        "execute_final_targets",
        "manage_users_roles",
    )
    for marker in forbidden:
        assert marker not in text
    # R7-004 settings/admin read-only detail may display target policy evidence,
    # but only inside its explicit read-only RBAC/Admin evidence section.
    assert "system_settings" in text
    assert "data-r7-settings-admin-detail" in text
    assert "data-r7-settings-admin-readonly-boundary=\"true\"" in text
