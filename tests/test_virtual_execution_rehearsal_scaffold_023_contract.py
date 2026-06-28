from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/virtual-execution-rehearsal-scaffold.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
WORKFLOW_SPEC = ROOT / "docs/master/04-workflow-diagrams.md"
FAILSAFE_SPEC = ROOT / "docs/master/05-ml-interlock-failsafe-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs023_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs023_version_surfaces_are_aligned_to_1_12_22():
    assert '"version": "1.12.33"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.33"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.33"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, WORKFLOW_SPEC, FAILSAFE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.12.33" in _read(path)


def test_rs023_document_records_virtual_rehearsal_boundary_and_scenarios():
    text = _read(DOC)
    for marker in (
        "# RS-023 Virtual Execution Rehearsal Scaffold",
        "Status: virtual execution rehearsal scaffold",
        "virtualExecutionRehearsalScaffold",
        "safetyInterlockPreflightProjection → virtualExecutionRehearsalScaffold",
        "가상 실행 리허설",
        "normal",
        "strong_wind",
        "rain",
        "low_temperature",
        "sensor_fault",
        "blocked",
        "fail_safe",
        "recovery",
        "No production route removal in RS-023",
        "No DB migration in RS-023",
        "No write/mutation in RS-023",
        "No real-device hookup in RS-023",
        "No MQTT/device command in RS-023",
    ):
        assert marker in text


def test_service_maps_preflight_to_virtual_execution_rehearsal_scaffold():
    service = _load_service()
    zone = service.crop_cycle_row_to_zone_context({"zone_id": 2, "zone_name": "B구역", "crop_cycle_id": 18, "compatibility_crop_season_id": 18, "crop_type": "lettuce", "growth_stage": "엽채 생육 관찰"})
    scaffold = zone["virtualExecutionRehearsalScaffold"]
    assert scaffold["rehearsalState"] == "blocked_until_virtual_rehearsal"
    assert scaffold["scenarioSet"] == ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"]
    assert scaffold["currentScenario"] == "blocked"
    assert scaffold["readinessSummary"] == "가상 실행 리허설 전: Safety/Interlock/Fail Safe 사전검증 필요"
    assert scaffold["sourcePreflight"] == zone["safetyInterlockPreflightProjection"]
    assert scaffold["readOnly"] is True
    assert scaffold["executionEnabled"] is False
    assert scaffold["deviceCommandEnabled"] is False
    assert scaffold["mqttEnabled"] is False


def test_frontend_adapter_normalizes_virtual_execution_rehearsal_scaffold():
    source = _read(ADAPTER)
    for marker in ("normalizeVirtualExecutionRehearsalScaffold", "virtualExecutionRehearsalScaffold", "rehearsalState", "scenarioSet", "currentScenario", "readinessSummary", "sourcePreflight", "deviceCommandEnabled", "mqttEnabled", "readOnly: true", "executionEnabled: false"):
        assert marker in source
    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{ zones: [{{ safetyInterlockPreflightProjection: {{ preflightState: 'blocked_until_review', readOnly: true, executionEnabled: false }}, virtualExecutionRehearsalScaffold: {{ rehearsalState: 'blocked_until_virtual_rehearsal', scenarioSet: ['normal','blocked'], currentScenario: 'blocked', readinessSummary: '가상 실행 리허설 전', readOnly: true, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }});
      const scaffold = ctx.zones[0].virtualExecutionRehearsalScaffold;
      if (scaffold.rehearsalState !== 'blocked_until_virtual_rehearsal') process.exit(1);
      if (!scaffold.scenarioSet.includes('normal') || !scaffold.scenarioSet.includes('blocked')) process.exit(2);
      if (scaffold.sourcePreflight.preflightState !== 'blocked_until_review') process.exit(3);
      if (scaffold.deviceCommandEnabled !== false || scaffold.mqttEnabled !== false) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_virtual_rehearsal_only_for_recommendation_stage_without_execution():
    source = _read(REBUILD_PANEL)
    for marker in ("RS-023 virtual execution rehearsal scaffold", "renderVirtualExecutionRehearsalScaffold(zone, stageKey)", "data-virtual-execution-rehearsal-card", "data-virtual-rehearsal-state", "data-virtual-rehearsal-current-scenario", "data-virtual-rehearsal-scenarios", "data-virtual-rehearsal-readonly", "data-virtual-rehearsal-execution-enabled", "data-virtual-rehearsal-device-command-enabled", "data-virtual-rehearsal-mqtt-enabled", "가상 실행 리허설"):
        assert marker in source
    assert '["recommendation-execution"].includes(stageKey)' in source
    for forbidden in ("data-virtual-execution-run-button", "data-device-command-button", "hass.callService", "executeFinalTargets", "mqtt.publish", "POST", "PUT", "DELETE"):
        assert forbidden not in source


def test_rebuild_panel_virtual_rehearsal_node_smoke():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ zones: [{{ id: 'zone-2', name: 'B구역', virtualExecutionRehearsalScaffold: {{ rehearsalState: 'blocked_until_virtual_rehearsal', scenarioSet: ['normal','strong_wind','rain','low_temperature','sensor_fault','blocked','fail_safe','recovery'], currentScenario: 'blocked', readinessSummary: '가상 실행 리허설 전', readOnly: true, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderVirtualExecutionRehearsalScaffold(panel._homeContext.zones[0], 'recommendation-execution');
      const hidden = panel.renderVirtualExecutionRehearsalScaffold(panel._homeContext.zones[0], 'growth-goal');
      if (!html.includes('data-virtual-execution-rehearsal-card')) process.exit(1);
      if (!html.includes('blocked_until_virtual_rehearsal')) process.exit(2);
      if (!html.includes('가상 실행 리허설')) process.exit(3);
      if (!html.includes('strong_wind') || !html.includes('fail_safe')) process.exit(4);
      if (hidden !== '') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs023_and_next_step():
    spec = _read(INTERFACE_SPEC)
    workflow = _read(WORKFLOW_SPEC)
    failsafe = _read(FAILSAFE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in ("Virtual execution rehearsal scaffold", "virtualExecutionRehearsalScaffold", "safetyInterlockPreflightProjection → virtualExecutionRehearsalScaffold", "가상 실행 리허설", "No MQTT/device command in RS-023"):
        assert marker in spec
    for marker in ("normal → strong_wind → rain → low_temperature → sensor_fault → blocked → fail_safe → recovery", "read-only rehearsal", "No real-device hookup in RS-023"):
        assert marker in workflow
    for marker in ("Safety/Interlock/Fail Safe preflight remains source", "virtual rehearsal does not release interlock", "No device command in RS-023"):
        assert marker in failsafe
    for marker in ("Phase R4.19 — Virtual execution rehearsal scaffold", "Status:** `v1.12.33`에서 Virtual execution rehearsal scaffold 완료", "No production route removal in RS-023", "No DB migration in RS-023", "No write/mutation in RS-023"):
        assert marker in plan
    assert "RS-023" in inventory
    assert "Virtual execution rehearsal scaffold completed" in inventory
    assert "RS-024" in inventory
    assert "Rehearsal result review projection" in inventory
