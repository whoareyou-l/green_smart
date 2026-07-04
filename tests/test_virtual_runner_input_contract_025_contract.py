from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/virtual-runner-input-contract.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
WORKFLOW_SPEC = ROOT / "docs/master/04-workflow-diagrams.md"
FAILSAFE_SPEC = ROOT / "docs/master/05-ml-interlock-failsafe-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs025_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs025_version_surfaces_are_aligned_to_1_12_24():
    assert '"version": "1.14.65"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.65"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.65"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, WORKFLOW_SPEC, FAILSAFE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.14.65" in _read(path)


def test_rs025_document_records_virtual_runner_input_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-025 Virtual Runner Input Contract",
        "Status: virtual runner input contract",
        "virtualRunnerInputContract",
        "rehearsalResultReviewProjection → virtualRunnerInputContract",
        "가상 러너 입력 계약",
        "inputState",
        "runnerMode",
        "inputScenarios",
        "sourceReview",
        "executionCandidate",
        "normal",
        "strong_wind",
        "rain",
        "low_temperature",
        "sensor_fault",
        "blocked",
        "fail_safe",
        "recovery",
        "No production route removal in RS-025",
        "No DB migration in RS-025",
        "No write/mutation in RS-025",
        "No real-device hookup in RS-025",
        "No MQTT/device command in RS-025",
        "No virtual runner execution in RS-025",
        "No approval/execution release in RS-025",
    ):
        assert marker in text


def test_service_maps_result_review_to_virtual_runner_input_contract():
    service = _load_service()
    zone = service.crop_cycle_row_to_zone_context({"zone_id": 2, "zone_name": "B구역", "crop_cycle_id": 18, "compatibility_crop_season_id": 18, "crop_type": "lettuce", "growth_stage": "엽채 생육 관찰"})
    contract = zone["virtualRunnerInputContract"]
    assert contract["inputState"] == "contract_ready_not_executable"
    assert contract["runnerMode"] == "read_only_contract"
    assert contract["sourceReview"] == zone["rehearsalResultReviewProjection"]
    assert contract["executionCandidate"] is False
    assert [item["scenario"] for item in contract["inputScenarios"]] == ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"]
    assert all(item["resultState"] == "not_run" for item in contract["inputScenarios"])
    assert contract["readOnly"] is True
    assert contract["executionEnabled"] is False
    assert contract["runnerExecutionEnabled"] is False
    assert contract["approvalReleaseEnabled"] is False
    assert contract["deviceCommandEnabled"] is False
    assert contract["mqttEnabled"] is False


def test_frontend_adapter_normalizes_virtual_runner_input_contract():
    source = _read(ADAPTER)
    for marker in ("normalizeVirtualRunnerInputContract", "virtualRunnerInputContract", "inputState", "runnerMode", "inputScenarios", "sourceReview", "executionCandidate", "runnerExecutionEnabled", "approvalReleaseEnabled", "deviceCommandEnabled", "mqttEnabled", "readOnly: true", "executionEnabled: false"):
        assert marker in source
    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{ zones: [{{ rehearsalResultReviewProjection: {{ reviewState: 'pending_virtual_results', scenarioResults: [{{scenario:'normal', resultState:'not_run'}}, {{scenario:'blocked', resultState:'not_run'}}], readOnly: true, executionEnabled: false }}, virtualRunnerInputContract: {{ inputState: 'contract_ready_not_executable', runnerMode: 'read_only_contract', inputScenarios: [{{scenario:'normal', resultState:'not_run'}}, {{scenario:'blocked', resultState:'not_run'}}], executionCandidate: false, readOnly: true, executionEnabled: false, runnerExecutionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }});
      const contract = ctx.zones[0].virtualRunnerInputContract;
      if (contract.inputState !== 'contract_ready_not_executable') process.exit(1);
      if (contract.inputScenarios.length !== 2) process.exit(2);
      if (contract.sourceReview.reviewState !== 'pending_virtual_results') process.exit(3);
      if (contract.runnerExecutionEnabled !== false || contract.deviceCommandEnabled !== false || contract.mqttEnabled !== false) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_virtual_runner_input_contract_only_for_recommendation_stage_without_runner_execution():
    source = _read(REBUILD_PANEL)
    for marker in ("RS-025 virtual runner input contract", "renderVirtualRunnerInputContract(zone, stageKey)", "data-virtual-runner-input-contract-card", "data-virtual-runner-input-state", "data-virtual-runner-mode", "data-virtual-runner-input-scenarios", "data-virtual-runner-readonly", "data-virtual-runner-execution-enabled", "data-virtual-runner-runner-execution-enabled", "data-virtual-runner-device-command-enabled", "data-virtual-runner-mqtt-enabled", "가상 러너 입력 계약"):
        assert marker in source
    assert '["recommend-act"].includes(stageKey)' in source
    for forbidden in ("data-virtual-runner-execute-button", "data-virtual-runner-start-button", "data-device-command-button", "hass.callService", "executeFinalTargets", "mqtt.publish", "POST", "PUT", "DELETE"):
        assert forbidden not in source


def test_rebuild_panel_virtual_runner_input_contract_node_smoke():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ zones: [{{ id: 'zone-2', name: 'B구역', virtualRunnerInputContract: {{ inputState: 'contract_ready_not_executable', runnerMode: 'read_only_contract', inputScenarios: [{{scenario:'normal', resultState:'not_run'}}, {{scenario:'fail_safe', resultState:'not_run'}}], executionCandidate: false, readOnly: true, executionEnabled: false, runnerExecutionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderVirtualRunnerInputContract(panel._homeContext.zones[0], 'recommend-act');
      const hidden = panel.renderVirtualRunnerInputContract(panel._homeContext.zones[0], 'growth-goal');
      if (!html.includes('data-virtual-runner-input-contract-card')) process.exit(1);
      if (!html.includes('contract_ready_not_executable')) process.exit(2);
      if (!html.includes('가상 러너 입력 계약')) process.exit(3);
      if (!html.includes('normal') || !html.includes('fail_safe')) process.exit(4);
      if (hidden !== '') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs025_and_next_step():
    spec = _read(INTERFACE_SPEC)
    workflow = _read(WORKFLOW_SPEC)
    failsafe = _read(FAILSAFE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in ("Virtual runner input contract", "virtualRunnerInputContract", "rehearsalResultReviewProjection → virtualRunnerInputContract", "가상 러너 입력 계약", "No virtual runner execution in RS-025"):
        assert marker in spec
    for marker in ("result review projection → virtual runner input contract", "runner input remains contract_ready_not_executable", "No real-device hookup in RS-025"):
        assert marker in workflow
    for marker in ("runner input contract does not release interlock", "runnerExecutionEnabled remains false", "No device command in RS-025"):
        assert marker in failsafe
    for marker in ("Phase R4.21 — Virtual runner input contract", "Status:** `v1.14.65`에서 Virtual runner input contract 완료", "No production route removal in RS-025", "No DB migration in RS-025", "No write/mutation in RS-025"):
        assert marker in plan
    assert "RS-025" in inventory
    assert "Virtual runner input contract completed" in inventory
    assert "RS-026" in inventory
    assert "Virtual runner dry-run result adapter" in inventory
