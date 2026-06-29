from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
SCAFFOLD = ROOT / "custom_components/green_smart/realtime_monitoring_scaffold.py"
RBAC_POLICY = ROOT / "custom_components/green_smart/rbac_policy.py"
DOC = ROOT / "docs/rebuild/vs-n003-realtime-monitoring-readonly-scaffold.md"
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


def test_vs_n003_version_surfaces_are_aligned_to_1_12_28():
    assert '"version": "1.12.64"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.64"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.64"' in _read(REBUILD_PANEL)
    for path in (DOC, PRODUCT_PLAN, EXEC_PLAN, TARGET_ARCH, MASTER_UI, INTERFACE_SPEC, DB_SPEC, WORKFLOW_SPEC, LOGIC_SPEC):
        assert "v1.12.64" in _read(path)


def test_vs_n003_document_records_scope_and_non_goals():
    text = _read(DOC)
    for marker in (
        "# VS-N003 Real-time Monitoring Read-only Scaffold",
        "Status: R5 real-time monitoring read-only scaffold",
        "Real-time monitoring read-only slice",
        "realtimeMonitoringReadOnlyScaffold",
        "monitoring/read-only DTO boundary",
        "sensor state freshness boundary",
        "backend permission enforcement before UI-only hiding",
        "No DB migration in VS-N003",
        "No sensor_readings query adapter in VS-N003",
        "No HA entity read API in VS-N003",
        "No sensor collection/scheduler in VS-N003",
        "No panel monitoring card in VS-N003",
        "No write/mutation in VS-N003",
        "No MQTT/device command in VS-N003",
        "monitoringMode = scaffold_only",
        "runtimeReadAdapterEnabled = false",
        "sensorCollectionEnabled = false",
        "dbMigrationEnabled = false",
    ):
        assert marker in text


def test_pure_realtime_monitoring_scaffold_module_has_no_runtime_or_ha_dependencies():
    source = _read(SCAFFOLD)
    for marker in (
        "REALTIME_MONITORING_DTO_FIELDS",
        "REALTIME_MONITORING_PERMISSION_BOUNDARY",
        "REALTIME_MONITORING_NON_GOALS",
        "realtimeMonitoringReadOnlyScaffold",
        "normalize_realtime_monitoring_readonly_scaffold",
        "monitoringMode",
        "scaffold_only",
        "runtimeReadAdapterEnabled",
        "sensorCollectionEnabled",
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
        "sensor_readings",
        "hass.states",
        "call_service",
        "mqtt",
    ):
        assert forbidden not in source


def test_realtime_monitoring_scaffold_behavior_and_permission_boundary():
    module = _load_module(SCAFFOLD, "vs_n003_realtime_monitoring_scaffold")
    result = module.normalize_realtime_monitoring_readonly_scaffold(
        actor_role="farm_staff",
        zone_id=1,
        crop_cycle_id=7,
        sensor_snapshot={"temperature_c": 24.5, "humidity_pct": 68, "co2_ppm": 420},
    )
    assert result["realtimeMonitoringReadOnlyScaffold"] is True
    assert result["monitoringMode"] == "scaffold_only"
    assert result["dtoBoundary"] == "monitoring/read-only"
    assert result["requiredPermission"] == "monitoring.read"
    assert result["actorRole"] == "farm_staff"
    assert result["canViewMonitoringScaffold"] is True
    assert result["zone_id"] == 1
    assert result["crop_cycle_id"] == 7
    assert result["sensorSnapshot"]["temperature_c"] == 24.5
    assert result["dataFreshnessState"] == "source_not_connected"
    assert result["freshnessBoundary"] == "sensor state freshness boundary"
    assert result["readOnly"] is True
    assert result["writeEnabled"] is False
    assert result["runtimeReadAdapterEnabled"] is False
    assert result["sensorCollectionEnabled"] is False
    assert result["dbMigrationEnabled"] is False
    assert result["existingSensorBehaviorChanged"] is False
    assert result["compatibilityRoutePreserved"] is True
    assert result["executionEnabled"] is False


def test_rbac_policy_exposes_monitoring_read_permission_boundary():
    rbac = _load_module(RBAC_POLICY, "vs_n003_rbac_policy")
    assert "monitoring.read" in rbac.RBAC_PERMISSION_ALIASES
    for role in ("admin", "farm_owner", "farm_staff"):
        assert rbac.has_permission(rbac.permissions_for_role(role), "monitoring.read") is True
    assert "view_monitoring" in rbac.RBAC_PERMISSION_BUCKETS["조회"]


def test_docs_link_vs_n003_after_crop_cycle_and_before_safety():
    product_plan = _read(PRODUCT_PLAN)
    exec_plan = _read(EXEC_PLAN)
    target = _read(TARGET_ARCH)
    for text in (product_plan, exec_plan, target):
        assert "VS-N003 Real-time monitoring read-only scaffold" in text
        assert "RBAC/Admin ownership scaffold → Crop cycle recording scaffold → Real-time monitoring read-only slice → Interlock/Safety core scaffold" in text
        assert "No DB migration in VS-N003" in text
        assert "No sensor collection/scheduler in VS-N003" in text
    assert "Third selected slice: VS-N003 Real-time monitoring read-only scaffold" in exec_plan


def test_master_specs_record_realtime_monitoring_readonly_boundary():
    ui = _read(MASTER_UI)
    interface = _read(INTERFACE_SPEC)
    db = _read(DB_SPEC)
    workflow = _read(WORKFLOW_SPEC)
    logic = _read(LOGIC_SPEC)
    for marker in ("VS-N003 Real-time monitoring read-only scaffold", "realtimeMonitoringReadOnlyScaffold", "monitoringMode = scaffold_only"):
        assert marker in ui
    for marker in ("monitoring/read-only DTO boundary", "No HA entity read API in VS-N003", "runtimeReadAdapterEnabled = false"):
        assert marker in interface
    for marker in ("No DB migration in VS-N003", "No sensor_readings query adapter in VS-N003", "dbMigrationEnabled = false"):
        assert marker in db
    for marker in ("sensor state freshness boundary", "No sensor collection/scheduler in VS-N003"):
        assert marker in workflow
    for marker in ("read-only monitoring evidence only", "No MQTT/device command in VS-N003", "executionEnabled = false"):
        assert marker in logic
