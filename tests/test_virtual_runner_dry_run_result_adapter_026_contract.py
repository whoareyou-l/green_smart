from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/virtual-runner-dry-run-result-adapter.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
WORKFLOW_SPEC = ROOT / "docs/master/04-workflow-diagrams.md"
FAILSAFE_SPEC = ROOT / "docs/master/05-ml-interlock-failsafe-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs026_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs026_version_surfaces_are_aligned_to_1_12_25():
    assert '"version": "1.15.20"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.20"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.20"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, WORKFLOW_SPEC, FAILSAFE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.15.20" in _read(path)


def test_rs026_document_records_dry_run_result_adapter_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-026 Virtual Runner Dry-run Result Adapter",
        "Status: virtual runner dry-run result adapter",
        "virtualRunnerDryRunResultAdapter",
        "virtualRunnerInputContract → virtualRunnerDryRunResultAdapter",
        "가상 dry-run 결과 어댑터",
        "adapterState",
        "dryRunMode",
        "scenarioDryRunResults",
        "sourceInputContract",
        "resultAuthority",
        "summaryState",
        "normal",
        "strong_wind",
        "rain",
        "low_temperature",
        "sensor_fault",
        "blocked",
        "fail_safe",
        "recovery",
        "No production route removal in RS-026",
        "No DB migration in RS-026",
        "No write/mutation in RS-026",
        "No real-device hookup in RS-026",
        "No MQTT/device command in RS-026",
        "No virtual runner execution in RS-026",
        "No approval/execution release in RS-026",
    ):
        assert marker in text


def test_service_maps_input_contract_to_dry_run_result_adapter():
    service = _load_service()
    zone = service.crop_cycle_row_to_zone_context({"zone_id": 2, "zone_name": "B구역", "crop_cycle_id": 18, "compatibility_crop_season_id": 18, "crop_type": "lettuce", "growth_stage": "엽채 생육 관찰"})
    adapter = zone["virtualRunnerDryRunResultAdapter"]
    source = zone["virtualRunnerInputContract"]
    assert adapter["adapterState"] == "dry_run_results_adapted_not_executable"
    assert adapter["dryRunMode"] == "synthetic_read_only_adapter"
    assert adapter["sourceInputContract"] == source
    assert adapter["resultAuthority"] == "review_only"
    assert adapter["summaryState"] == "pending_operator_review"
    assert [item["scenario"] for item in adapter["scenarioDryRunResults"]] == ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"]
    assert all(item["dryRunResult"] == "simulated_not_executed" for item in adapter["scenarioDryRunResults"])
    assert all(item["executionAllowed"] is False for item in adapter["scenarioDryRunResults"])
    assert adapter["readOnly"] is True
    assert adapter["executionEnabled"] is False
    assert adapter["runnerExecutionEnabled"] is False
    assert adapter["approvalReleaseEnabled"] is False
    assert adapter["deviceCommandEnabled"] is False
    assert adapter["mqttEnabled"] is False


def test_frontend_adapter_normalizes_dry_run_result_adapter():
    source = _read(ADAPTER)
    for marker in ("normalizeVirtualRunnerDryRunResultAdapter", "virtualRunnerDryRunResultAdapter", "adapterState", "dryRunMode", "scenarioDryRunResults", "sourceInputContract", "resultAuthority", "summaryState", "runnerExecutionEnabled", "approvalReleaseEnabled", "deviceCommandEnabled", "mqttEnabled", "readOnly: true", "executionEnabled: false"):
        assert marker in source
    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{ zones: [{{ virtualRunnerInputContract: {{ inputState: 'contract_ready_not_executable', inputScenarios: [{{scenario:'normal', resultState:'not_run'}}, {{scenario:'blocked', resultState:'not_run'}}], readOnly: true, executionEnabled: false }}, virtualRunnerDryRunResultAdapter: {{ adapterState: 'dry_run_results_adapted_not_executable', dryRunMode: 'synthetic_read_only_adapter', scenarioDryRunResults: [{{scenario:'normal', dryRunResult:'simulated_not_executed', executionAllowed:false}}, {{scenario:'blocked', dryRunResult:'simulated_not_executed', executionAllowed:false}}], resultAuthority: 'review_only', summaryState: 'pending_operator_review', readOnly: true, executionEnabled: false, runnerExecutionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }});
      const adapter = ctx.zones[0].virtualRunnerDryRunResultAdapter;
      if (adapter.adapterState !== 'dry_run_results_adapted_not_executable') process.exit(1);
      if (adapter.scenarioDryRunResults.length !== 2) process.exit(2);
      if (adapter.sourceInputContract.inputState !== 'contract_ready_not_executable') process.exit(3);
      if (adapter.runnerExecutionEnabled !== false || adapter.deviceCommandEnabled !== false || adapter.mqttEnabled !== false) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_dry_run_result_adapter_only_for_recommendation_stage_without_execution():
    source = _read(REBUILD_PANEL)
    for marker in ("RS-026 virtual runner dry-run result adapter", "renderVirtualRunnerDryRunResultAdapter(zone, stageKey)", "data-virtual-runner-dry-run-result-adapter-card", "data-virtual-runner-dry-run-adapter-state", "data-virtual-runner-dry-run-mode", "data-virtual-runner-dry-run-scenarios", "data-virtual-runner-dry-run-readonly", "data-virtual-runner-dry-run-execution-enabled", "data-virtual-runner-dry-run-runner-execution-enabled", "data-virtual-runner-dry-run-device-command-enabled", "data-virtual-runner-dry-run-mqtt-enabled", "가상 dry-run 결과 어댑터"):
        assert marker in source
    assert '["recommend-act"].includes(stageKey)' in source
    for forbidden in ("data-virtual-runner-execute-button", "data-virtual-runner-start-button", "data-virtual-dry-run-execute-button", "data-device-command-button", "hass.callService", "executeFinalTargets", "mqtt.publish", "POST", "PUT", "DELETE"):
        assert forbidden not in source


def test_rebuild_panel_dry_run_result_adapter_node_smoke():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ zones: [{{ id: 'zone-2', name: 'B구역', virtualRunnerDryRunResultAdapter: {{ adapterState: 'dry_run_results_adapted_not_executable', dryRunMode: 'synthetic_read_only_adapter', scenarioDryRunResults: [{{scenario:'normal', dryRunResult:'simulated_not_executed', executionAllowed:false}}, {{scenario:'fail_safe', dryRunResult:'simulated_not_executed', executionAllowed:false}}], resultAuthority: 'review_only', summaryState: 'pending_operator_review', readOnly: true, executionEnabled: false, runnerExecutionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderVirtualRunnerDryRunResultAdapter(panel._homeContext.zones[0], 'recommend-act');
      const hidden = panel.renderVirtualRunnerDryRunResultAdapter(panel._homeContext.zones[0], 'growth-goal');
      if (!html.includes('data-virtual-runner-dry-run-result-adapter-card')) process.exit(1);
      if (!html.includes('dry_run_results_adapted_not_executable')) process.exit(2);
      if (!html.includes('가상 dry-run 결과 어댑터')) process.exit(3);
      if (!html.includes('normal') || !html.includes('fail_safe')) process.exit(4);
      if (html.includes('data-virtual-dry-run-execute-button')) process.exit(5);
      if (hidden !== '') process.exit(6);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs026_and_next_step():
    spec = _read(INTERFACE_SPEC)
    workflow = _read(WORKFLOW_SPEC)
    failsafe = _read(FAILSAFE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in ("Virtual runner dry-run result adapter", "virtualRunnerDryRunResultAdapter", "virtualRunnerInputContract → virtualRunnerDryRunResultAdapter", "가상 dry-run 결과 어댑터", "No virtual runner execution in RS-026"):
        assert marker in spec
    for marker in ("virtual runner input contract → dry-run result adapter", "dry-run result remains simulated_not_executed", "No real-device hookup in RS-026"):
        assert marker in workflow
    for marker in ("dry-run result adapter does not release interlock", "runnerExecutionEnabled remains false", "No device command in RS-026"):
        assert marker in failsafe
    for marker in ("Phase R4.22 — Virtual runner dry-run result adapter", "Status:** `v1.15.20`에서 Virtual runner dry-run result adapter 완료", "No production route removal in RS-026", "No DB migration in RS-026", "No write/mutation in RS-026"):
        assert marker in plan
    assert "RS-026" in inventory
    assert "Virtual runner dry-run result adapter completed" in inventory
    assert "RS-027" in inventory
    assert "Virtual rehearsal pass/fail review projection" in inventory
