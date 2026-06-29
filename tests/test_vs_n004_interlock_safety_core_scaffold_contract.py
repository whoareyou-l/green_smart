from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
SCAFFOLD = ROOT / "custom_components/green_smart/interlock_safety_scaffold.py"
RBAC_POLICY = ROOT / "custom_components/green_smart/rbac_policy.py"
DOC = ROOT / "docs/rebuild/vs-n004-interlock-safety-core-scaffold.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
EXEC_PLAN = ROOT / "docs/plans/2026-06-28-from-scratch-rebuild-execution-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"
MASTER_UI = ROOT / "docs/master/01-cba-ui-ux-spec.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
DB_SPEC = ROOT / "docs/master/03-database-schema.md"
WORKFLOW_SPEC = ROOT / "docs/master/04-workflow-diagrams.md"
LOGIC_SPEC = ROOT / "docs/master/05-ml-interlock-failsafe-spec.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_vs_n004_version_surfaces_are_aligned_to_1_12_29():
    assert '"version": "1.12.69"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.69"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.69"' in _read(REBUILD_PANEL)
    for path in (DOC, PRODUCT_PLAN, EXEC_PLAN, TARGET_ARCH, MASTER_UI, INTERFACE_SPEC, DB_SPEC, WORKFLOW_SPEC, LOGIC_SPEC):
        assert "v1.12.69" in _read(path)


def test_vs_n004_document_records_scope_and_non_goals():
    text = _read(DOC)
    for marker in (
        "# VS-N004 Interlock/Safety Core Scaffold",
        "Status: R5 interlock/safety core scaffold",
        "Interlock/Safety core scaffold",
        "interlockSafetyCoreScaffold",
        "safety/interlock read-only DTO boundary",
        "safety state gate boundary",
        "backend permission enforcement before UI-only hiding",
        "No DB migration in VS-N004",
        "No existing SafetyGuard runtime behavior change in VS-N004",
        "No existing Interlock runtime behavior change in VS-N004",
        "No execution decision change in VS-N004",
        "No approval/override release in VS-N004",
        "No MQTT/device command in VS-N004",
        "No panel safety card in VS-N004",
        "safetyMode = scaffold_only",
        "runtimeSafetyAdapterEnabled = false",
        "executionDecisionEnabled = false",
        "approvalOverrideEnabled = false",
        "dbMigrationEnabled = false",
    ):
        assert marker in text


def test_pure_interlock_safety_scaffold_module_has_no_runtime_or_ha_dependencies():
    source = _read(SCAFFOLD)
    for marker in (
        "INTERLOCK_SAFETY_DTO_FIELDS",
        "INTERLOCK_SAFETY_PERMISSION_BOUNDARY",
        "INTERLOCK_SAFETY_NON_GOALS",
        "interlockSafetyCoreScaffold",
        "normalize_interlock_safety_core_scaffold",
        "safetyMode",
        "scaffold_only",
        "runtimeSafetyAdapterEnabled",
        "executionDecisionEnabled",
        "approvalOverrideEnabled",
        "dbMigrationEnabled",
    ):
        assert marker in source
    for forbidden in (
        "homeassistant",
        "aiohttp",
        "aiomysql",
        "SELECT ",
        "INSERT ",
        "UPDATE ",
        "DELETE ",
        "hass.states",
        "call_service",
        "mqtt",
        "execute_final_targets",
        "manual_device_control",
    ):
        assert forbidden not in source


def test_interlock_safety_scaffold_behavior_and_authority_boundary():
    module = _load_module(SCAFFOLD, "vs_n004_interlock_safety_scaffold")
    result = module.normalize_interlock_safety_core_scaffold(
        actor_role="farm_owner",
        zone_id=1,
        crop_cycle_id=7,
        monitoring_state={"dataFreshnessState": "source_not_connected"},
    )
    assert result["interlockSafetyCoreScaffold"] is True
    assert result["safetyMode"] == "scaffold_only"
    assert result["dtoBoundary"] == "safety/interlock read-only"
    assert result["requiredPermission"] == "safety.core.read"
    assert result["actorRole"] == "farm_owner"
    assert result["canViewSafetyScaffold"] is True
    assert result["zone_id"] == 1
    assert result["crop_cycle_id"] == 7
    assert result["monitoringState"]["dataFreshnessState"] == "source_not_connected"
    assert result["safetyStateGateBoundary"] == "safety state gate boundary"
    assert result["readOnly"] is True
    assert result["writeEnabled"] is False
    assert result["runtimeSafetyAdapterEnabled"] is False
    assert result["executionDecisionEnabled"] is False
    assert result["approvalOverrideEnabled"] is False
    assert result["dbMigrationEnabled"] is False
    assert result["existingSafetyGuardBehaviorChanged"] is False
    assert result["existingInterlockBehaviorChanged"] is False
    assert result["compatibilityRoutePreserved"] is True
    assert result["deviceCommandEnabled"] is False


def test_rbac_policy_exposes_safety_core_read_permission_boundary():
    rbac = _load_module(RBAC_POLICY, "vs_n004_rbac_policy")
    assert "safety.core.read" in rbac.RBAC_PERMISSION_ALIASES
    for role in ("admin", "farm_owner", "farm_staff"):
        assert rbac.has_permission(rbac.permissions_for_role(role), "safety.core.read") is True
    assert "view_safety_status" in rbac.RBAC_PERMISSION_BUCKETS["안전"]


def test_docs_link_vs_n004_after_monitoring_as_r5_foundation_sequence_end():
    product_plan = _read(PRODUCT_PLAN)
    exec_plan = _read(EXEC_PLAN)
    target = _read(TARGET_ARCH)
    for text in (product_plan, exec_plan, target):
        assert "VS-N004 Interlock/Safety core scaffold" in text
        assert "RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold" in text
        assert "No execution decision change in VS-N004" in text
        assert "No approval/override release in VS-N004" in text
    assert "Fourth selected slice: VS-N004 Interlock/Safety core scaffold" in exec_plan


def test_master_specs_record_interlock_safety_scaffold_boundary():
    ui = _read(MASTER_UI)
    interface = _read(INTERFACE_SPEC)
    db = _read(DB_SPEC)
    workflow = _read(WORKFLOW_SPEC)
    logic = _read(LOGIC_SPEC)
    for marker in ("VS-N004 Interlock/Safety core scaffold", "interlockSafetyCoreScaffold", "safetyMode = scaffold_only"):
        assert marker in ui
    for marker in ("safety/interlock read-only DTO boundary", "runtimeSafetyAdapterEnabled = false", "No existing SafetyGuard runtime behavior change in VS-N004"):
        assert marker in interface
    for marker in ("No DB migration in VS-N004", "dbMigrationEnabled = false"):
        assert marker in db
    for marker in ("safety state gate boundary", "No approval/override release in VS-N004"):
        assert marker in workflow
    for marker in ("read-only safety evidence only", "No execution decision change in VS-N004", "executionDecisionEnabled = false"):
        assert marker in logic
