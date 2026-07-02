from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
SCAFFOLD = ROOT / "custom_components/green_smart/crop_cycle_scaffold.py"
RBAC_POLICY = ROOT / "custom_components/green_smart/rbac_policy.py"
DOC = ROOT / "docs/rebuild/vs-n002-crop-cycle-recording-scaffold.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
EXEC_PLAN = ROOT / "docs/plans/2026-06-28-from-scratch-rebuild-execution-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"
MASTER_UI = ROOT / "docs/master/01-cba-ui-ux-spec.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
DB_SPEC = ROOT / "docs/master/03-database-schema.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_vs_n002_version_surfaces_are_aligned_to_1_12_27():
    assert '"version": "1.14.49"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.49"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.49"' in _read(REBUILD_PANEL)
    for path in (DOC, PRODUCT_PLAN, EXEC_PLAN, TARGET_ARCH, MASTER_UI, INTERFACE_SPEC, DB_SPEC):
        assert "v1.14.49" in _read(path)


def test_vs_n002_document_records_scope_and_non_goals():
    text = _read(DOC)
    for marker in (
        "# VS-N002 Crop Cycle Recording Scaffold",
        "Status: R5 crop cycle recording scaffold",
        "Crop cycle recording scaffold",
        "cropCycleRecordingScaffold",
        "crop_cycle/currentCrop DTO boundary",
        "backend permission enforcement before UI-only hiding",
        "No DB migration in VS-N002",
        "No write/mutation in VS-N002",
        "No existing crop season save behavior change in VS-N002",
        "No production route removal in VS-N002",
        "No physical MQTT/device hookup in VS-N002",
        "No approval/execution release in VS-N002",
        "recordingMode = scaffold_only",
        "runtimeWriteAdapterEnabled = false",
        "dbMigrationEnabled = false",
    ):
        assert marker in text


def test_pure_crop_cycle_scaffold_module_has_no_runtime_or_ha_dependencies():
    source = _read(SCAFFOLD)
    for marker in (
        "CROP_CYCLE_RECORDING_DTO_FIELDS",
        "CROP_CYCLE_RECORDING_PERMISSION_BOUNDARY",
        "CROP_CYCLE_RECORDING_NON_GOALS",
        "cropCycleRecordingScaffold",
        "normalize_crop_cycle_recording_scaffold",
        "recordingMode",
        "scaffold_only",
        "runtimeWriteAdapterEnabled",
        "dbMigrationEnabled",
    ):
        assert marker in source
    for forbidden in (
        "homeassistant",
        "aiohttp",
        "aiomysql",
        "INSERT ",
        "UPDATE ",
        "DELETE ",
        "docker",
        "mqtt",
        "call_service",
    ):
        assert forbidden not in source


def test_crop_cycle_recording_scaffold_behavior_and_permission_boundary():
    module = _load_module(SCAFFOLD, "vs_n002_crop_cycle_scaffold")
    admin = module.normalize_crop_cycle_recording_scaffold(actor_role="admin", zone_id=1, current_crop={"crop_cycle_id": 7, "crop_type": "lettuce"})
    owner = module.normalize_crop_cycle_recording_scaffold(actor_role="farm_owner", zone_id=1, current_crop={"crop_cycle_id": 7})
    staff = module.normalize_crop_cycle_recording_scaffold(actor_role="farm_staff", zone_id=1, current_crop={"crop_cycle_id": 7})
    assert admin["cropCycleRecordingScaffold"] is True
    assert admin["recordingMode"] == "scaffold_only"
    assert admin["dtoBoundary"] == "crop_cycle/currentCrop"
    assert admin["requiredPermission"] == "crop_cycle.write"
    assert admin["canScaffoldRecord"] is True
    assert owner["canScaffoldRecord"] is True
    assert staff["canScaffoldRecord"] is False
    assert staff["denialReason"] == "crop_cycle_write_permission_required"
    for result in (admin, owner, staff):
        assert result["readOnly"] is True
        assert result["writeEnabled"] is False
        assert result["runtimeWriteAdapterEnabled"] is False
        assert result["dbMigrationEnabled"] is False
        assert result["existingSaveBehaviorChanged"] is False
        assert result["compatibilityRoutePreserved"] is True


def test_rbac_policy_exposes_crop_cycle_recording_permission_boundary():
    rbac = _load_module(RBAC_POLICY, "vs_n002_rbac_policy")
    assert "crop_cycle.write" in rbac.RBAC_PERMISSION_ALIASES
    assert rbac.has_permission(rbac.permissions_for_role("admin"), "crop_cycle.write") is True
    assert rbac.has_permission(rbac.permissions_for_role("farm_owner"), "crop_cycle.write") is True
    assert rbac.has_permission(rbac.permissions_for_role("farm_staff"), "crop_cycle.write") is False
    assert "manage_crop_seasons" in rbac.RBAC_PERMISSION_BUCKETS["기록"]


def test_docs_link_vs_n002_after_vs_n001_and_before_monitoring():
    product_plan = _read(PRODUCT_PLAN)
    exec_plan = _read(EXEC_PLAN)
    target = _read(TARGET_ARCH)
    for text in (product_plan, exec_plan, target):
        assert "VS-N002 Crop cycle recording scaffold" in text
        assert "RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice" in text
        assert "No write/mutation in VS-N002" in text
        assert "No DB migration in VS-N002" in text
    assert "First selected slice: VS-N001 RBAC/Admin ownership scaffold" in exec_plan
    assert "Second selected slice: VS-N002 Crop cycle recording scaffold" in exec_plan


def test_master_specs_record_crop_cycle_recording_scaffold_boundary():
    ui = _read(MASTER_UI)
    interface = _read(INTERFACE_SPEC)
    db = _read(DB_SPEC)
    for marker in ("VS-N002 Crop cycle recording scaffold", "cropCycleRecordingScaffold", "recordingMode = scaffold_only"):
        assert marker in ui
    for marker in ("crop_cycle/currentCrop DTO boundary", "No existing crop season save behavior change in VS-N002", "runtimeWriteAdapterEnabled = false"):
        assert marker in interface
    for marker in ("No DB migration in VS-N002", "legacy physical crop_seasons remains adapter-only", "dbMigrationEnabled = false"):
        assert marker in db
