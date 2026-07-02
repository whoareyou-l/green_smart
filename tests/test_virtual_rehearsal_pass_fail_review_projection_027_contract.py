from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/virtual-rehearsal-pass-fail-review-projection.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
WORKFLOW_SPEC = ROOT / "docs/master/04-workflow-diagrams.md"
FAILSAFE_SPEC = ROOT / "docs/master/05-ml-interlock-failsafe-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs027_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs027_version_surfaces_are_aligned_to_1_12_26():
    assert '"version": "1.14.43"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.43"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.43"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, WORKFLOW_SPEC, FAILSAFE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.14.43" in _read(path)


def test_rs027_document_records_pass_fail_review_projection_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-027 Virtual Rehearsal Pass/Fail Review Projection",
        "Status: virtual rehearsal pass/fail review projection",
        "virtualRehearsalPassFailReviewProjection",
        "virtualRunnerDryRunResultAdapter → virtualRehearsalPassFailReviewProjection",
        "가상 리허설 pass/fail 검토 projection",
        "reviewState",
        "overallDecision",
        "scenarioReviews",
        "sourceDryRunResultAdapter",
        "passFailAuthority",
        "operatorReviewRequired",
        "pass",
        "fail",
        "review_needed",
        "normal",
        "strong_wind",
        "rain",
        "low_temperature",
        "sensor_fault",
        "blocked",
        "fail_safe",
        "recovery",
        "No production route removal in RS-027",
        "No DB migration in RS-027",
        "No write/mutation in RS-027",
        "No real-device hookup in RS-027",
        "No MQTT/device command in RS-027",
        "No virtual runner execution in RS-027",
        "No approval/execution release in RS-027",
    ):
        assert marker in text


def test_service_maps_dry_run_result_adapter_to_pass_fail_review_projection():
    service = _load_service()
    zone = service.crop_cycle_row_to_zone_context({"zone_id": 2, "zone_name": "B구역", "crop_cycle_id": 18, "compatibility_crop_season_id": 18, "crop_type": "lettuce", "growth_stage": "엽채 생육 관찰"})
    projection = zone["virtualRehearsalPassFailReviewProjection"]
    source = zone["virtualRunnerDryRunResultAdapter"]
    assert projection["reviewState"] == "pass_fail_review_pending"
    assert projection["overallDecision"] == "review_needed"
    assert projection["sourceDryRunResultAdapter"] == source
    assert projection["passFailAuthority"] == "operator_review_only"
    assert projection["operatorReviewRequired"] is True
    assert [item["scenario"] for item in projection["scenarioReviews"]] == ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"]
    assert all(item["decision"] == "review_needed" for item in projection["scenarioReviews"])
    assert all(item["executionAllowed"] is False for item in projection["scenarioReviews"])
    assert projection["readOnly"] is True
    assert projection["executionEnabled"] is False
    assert projection["runnerExecutionEnabled"] is False
    assert projection["approvalReleaseEnabled"] is False
    assert projection["deviceCommandEnabled"] is False
    assert projection["mqttEnabled"] is False


def test_frontend_adapter_normalizes_pass_fail_review_projection():
    source = _read(ADAPTER)
    for marker in ("normalizeVirtualRehearsalPassFailReviewProjection", "virtualRehearsalPassFailReviewProjection", "reviewState", "overallDecision", "scenarioReviews", "sourceDryRunResultAdapter", "passFailAuthority", "operatorReviewRequired", "runnerExecutionEnabled", "approvalReleaseEnabled", "deviceCommandEnabled", "mqttEnabled", "readOnly: true", "executionEnabled: false"):
        assert marker in source
    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{ zones: [{{ virtualRunnerDryRunResultAdapter: {{ adapterState: 'dry_run_results_adapted_not_executable', scenarioDryRunResults: [{{scenario:'normal', dryRunResult:'simulated_not_executed', executionAllowed:false}}, {{scenario:'blocked', dryRunResult:'simulated_not_executed', executionAllowed:false}}], readOnly: true, executionEnabled: false }}, virtualRehearsalPassFailReviewProjection: {{ reviewState: 'pass_fail_review_pending', overallDecision: 'review_needed', scenarioReviews: [{{scenario:'normal', decision:'review_needed', executionAllowed:false}}, {{scenario:'blocked', decision:'review_needed', executionAllowed:false}}], passFailAuthority: 'operator_review_only', operatorReviewRequired: true, readOnly: true, executionEnabled: false, runnerExecutionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }});
      const projection = ctx.zones[0].virtualRehearsalPassFailReviewProjection;
      if (projection.reviewState !== 'pass_fail_review_pending') process.exit(1);
      if (projection.overallDecision !== 'review_needed') process.exit(2);
      if (projection.scenarioReviews.length !== 2) process.exit(3);
      if (projection.runnerExecutionEnabled !== false || projection.deviceCommandEnabled !== false || projection.mqttEnabled !== false) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_pass_fail_review_projection_only_for_recommendation_stage_without_execution():
    source = _read(REBUILD_PANEL)
    for marker in ("RS-027 virtual rehearsal pass/fail review projection", "renderVirtualRehearsalPassFailReviewProjection(zone, stageKey)", "data-virtual-rehearsal-pass-fail-review-card", "data-virtual-rehearsal-review-state", "data-virtual-rehearsal-overall-decision", "data-virtual-rehearsal-scenario-reviews", "data-virtual-rehearsal-pass-fail-readonly", "data-virtual-rehearsal-pass-fail-execution-enabled", "data-virtual-rehearsal-pass-fail-runner-execution-enabled", "data-virtual-rehearsal-pass-fail-device-command-enabled", "data-virtual-rehearsal-pass-fail-mqtt-enabled", "가상 리허설 pass/fail 검토"):
        assert marker in source
    assert '["recommend-act"].includes(stageKey)' in source
    for forbidden in ("data-virtual-pass-approve-button", "data-virtual-fail-release-button", "data-virtual-rehearsal-execute-button", "data-device-command-button", "hass.callService", "executeFinalTargets", "mqtt.publish", "POST", "PUT", "DELETE"):
        assert forbidden not in source


def test_rebuild_panel_pass_fail_review_projection_node_smoke():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ zones: [{{ id: 'zone-2', name: 'B구역', virtualRehearsalPassFailReviewProjection: {{ reviewState: 'pass_fail_review_pending', overallDecision: 'review_needed', scenarioReviews: [{{scenario:'normal', decision:'review_needed', executionAllowed:false}}, {{scenario:'fail_safe', decision:'review_needed', executionAllowed:false}}], passFailAuthority: 'operator_review_only', operatorReviewRequired: true, readOnly: true, executionEnabled: false, runnerExecutionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderVirtualRehearsalPassFailReviewProjection(panel._homeContext.zones[0], 'recommend-act');
      const hidden = panel.renderVirtualRehearsalPassFailReviewProjection(panel._homeContext.zones[0], 'growth-goal');
      if (!html.includes('data-virtual-rehearsal-pass-fail-review-card')) process.exit(1);
      if (!html.includes('pass_fail_review_pending')) process.exit(2);
      if (!html.includes('가상 리허설 pass/fail 검토')) process.exit(3);
      if (!html.includes('normal') || !html.includes('fail_safe')) process.exit(4);
      if (html.includes('data-virtual-pass-approve-button')) process.exit(5);
      if (hidden !== '') process.exit(6);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs027_and_rs_series_completion():
    spec = _read(INTERFACE_SPEC)
    workflow = _read(WORKFLOW_SPEC)
    failsafe = _read(FAILSAFE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in ("Virtual rehearsal pass/fail review projection", "virtualRehearsalPassFailReviewProjection", "virtualRunnerDryRunResultAdapter → virtualRehearsalPassFailReviewProjection", "가상 리허설 pass/fail 검토 projection", "No virtual runner execution in RS-027"):
        assert marker in spec
    for marker in ("dry-run result adapter → pass/fail review projection", "pass/fail remains operator_review_only", "No real-device hookup in RS-027"):
        assert marker in workflow
    for marker in ("pass/fail review projection does not release interlock", "approvalReleaseEnabled remains false", "No device command in RS-027"):
        assert marker in failsafe
    for marker in ("Phase R4.23 — Virtual rehearsal pass/fail review projection", "Status:** `v1.14.43`에서 Virtual rehearsal pass/fail review projection 완료", "No production route removal in RS-027", "No DB migration in RS-027", "No write/mutation in RS-027", "RS sequence complete before R5 scaffold"):
        assert marker in plan
    assert "RS-027" in inventory
    assert "Virtual rehearsal pass/fail review projection completed" in inventory
    assert "RS sequence complete before R5 scaffold" in inventory
