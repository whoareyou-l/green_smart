from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
REPO = ROOT / "custom_components/green_smart/repositories/rebuild_crop_context_repo.py"
VIEW = ROOT / "custom_components/green_smart/rebuild_views.py"
SCAFFOLD = ROOT / "custom_components/green_smart/realtime_monitoring_scaffold.py"
DOC = ROOT / "docs/rebuild/r6-002-monitoring-readonly-adapter.md"
R6_001_DOC = ROOT / "docs/rebuild/r6-001-crop-cycle-readonly-adapter.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
TARGET_ARCH = ROOT / "docs/rebuild/target-architecture.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("r6_002_rebuild_crop_context_service", SERVICE)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_r6_002_version_surfaces_are_1_12_32():
    assert '"version": "1.14.59"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.59"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.59"' in _read(REBUILD_PANEL)
    for path in (DOC, PRODUCT_PLAN, TARGET_ARCH):
        assert "v1.14.59" in _read(path)


def test_r6_002_document_declares_scope_after_crop_cycle_adapter():
    text = _read(DOC)
    for marker in (
        "# R6-002 Monitoring Read-only Adapter",
        "Status: R6-002 complete",
        "R6-001 Crop Cycle Read-only Adapter → R6-002 Monitoring Read-only Adapter",
        "monitoring read-only adapter attaches to each zone context",
        "dataAvailability + equipmentProfile → monitoringReadOnlyAdapter",
        "runtimeReadAdapterEnabled = true",
        "sensorCollectionEnabled = false",
        "No sensor collection/scheduler in R6-002",
        "No MQTT/device command in R6-002",
        "No panel redesign in R6-002",
    ):
        assert marker in text


def test_r6_002_service_adds_monitoring_adapter_without_execution_authority():
    service_text = _read(SERVICE)
    for marker in (
        "R6-002 Monitoring read-only adapter",
        "R6_002_ADAPTER_NAME",
        "dataAvailability + equipmentProfile → monitoringReadOnlyAdapter",
        "normalize_monitoring_readonly_adapter",
        "monitoringReadOnlyAdapter",
    ):
        assert marker in service_text

    module = _load_service()
    zone = module.crop_cycle_row_to_zone_context(
        {
            "zone_id": 3,
            "zone_name": "3구역",
            "crop_cycle_id": 21,
            "compatibility_crop_season_id": 21,
            "crop_type": "tomato",
            "variety": "대추방울",
            "growth_stage": "착과·비대 관찰",
            "plant_date": "2026-06-02",
            "updated_at": "2026-06-29T01:30:00",
        }
    )
    adapter = zone["monitoringReadOnlyAdapter"]
    assert adapter["r6_002_adapter"] is True
    assert adapter["adapterName"] == "R6-002 Monitoring read-only adapter"
    assert adapter["sourceDataAvailability"] == zone["dataAvailability"]
    assert adapter["sourceEquipmentProfile"] == zone["equipmentProfile"]
    assert adapter["dataFreshnessState"] == "ok"
    assert adapter["runtimeReadAdapterEnabled"] is True
    assert adapter["readOnly"] is True
    assert adapter["writeEnabled"] is False
    assert adapter["sensorCollectionEnabled"] is False
    assert adapter["executionEnabled"] is False
    assert adapter["deviceCommandEnabled"] is False
    assert adapter["mqttEnabled"] is False


def test_r6_002_empty_zone_monitoring_state_is_empty_not_executable():
    module = _load_service()
    zone = module.crop_cycle_row_to_zone_context({"zone_id": 9, "zone_name": "9구역"})
    adapter = zone["monitoringReadOnlyAdapter"]
    assert adapter["dataFreshnessState"] == "empty"
    assert adapter["monitoringSummary"] == "현재 작기 연결 전: 모니터링 근거 없음"
    assert adapter["executionEnabled"] is False
    assert zone["environmentImpactProjection"]["sourceMonitoringReadOnlyAdapter"] == adapter


def test_r6_002_preserves_runtime_boundaries_and_scaffold_compatibility():
    service_text = _read(SERVICE)
    repo_text = _read(REPO)
    view_text = _read(VIEW)
    scaffold_text = _read(SCAFFOLD)
    assert "realtimeMonitoringReadOnlyScaffold" in scaffold_text
    assert '"runtimeReadAdapterEnabled": False' in scaffold_text
    assert "R6-002 Monitoring read-only adapter" in service_text
    forbidden_service = ("hass.states", "hass.services", "async_call", "call_service", "publish", "deviceCommandEnabled\": True", "mqttEnabled\": True")
    for marker in forbidden_service:
        assert marker not in service_text
    forbidden_repo = ("INSERT ", "UPDATE ", "DELETE ", "ALTER ", "CREATE TABLE", "DROP ", "hass.services", "async_call", "call_service")
    for marker in forbidden_repo:
        assert marker not in repo_text
    assert "GET /api/green_smart/rebuild/home/context" in view_text
    assert "requires_auth = True" in view_text
    assert "post(" not in view_text


def test_r6_002_boundaries_are_linked_from_source_docs():
    for path in (R6_001_DOC, PRODUCT_PLAN, TARGET_ARCH):
        text = _read(path)
        assert "R6-002 Monitoring Read-only Adapter" in text
        assert "docs/rebuild/r6-002-monitoring-readonly-adapter.md" in text
        assert "No write/mutation in R6-002" in text
        assert "No execution decision change in R6-002" in text
        assert "question gates must use clarify tool" in text
