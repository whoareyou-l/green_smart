from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/rehearsal-result-review-projection.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
WORKFLOW_SPEC = ROOT / "docs/master/04-workflow-diagrams.md"
FAILSAFE_SPEC = ROOT / "docs/master/05-ml-interlock-failsafe-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs024_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs024_version_surfaces_are_aligned_to_1_12_23():
    assert '"version": "1.14.49"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.49"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.49"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, WORKFLOW_SPEC, FAILSAFE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.14.49" in _read(path)


def test_rs024_document_records_rehearsal_result_review_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-024 Rehearsal Result Review Projection",
        "Status: rehearsal result review projection",
        "rehearsalResultReviewProjection",
        "virtualExecutionRehearsalScaffold → rehearsalResultReviewProjection",
        "리허설 결과 검토",
        "reviewState",
        "resultSummary",
        "scenarioResults",
        "normal",
        "strong_wind",
        "rain",
        "low_temperature",
        "sensor_fault",
        "blocked",
        "fail_safe",
        "recovery",
        "No production route removal in RS-024",
        "No DB migration in RS-024",
        "No write/mutation in RS-024",
        "No real-device hookup in RS-024",
        "No MQTT/device command in RS-024",
        "No approval/execution release in RS-024",
    ):
        assert marker in text


def test_service_maps_virtual_rehearsal_to_result_review_projection():
    service = _load_service()
    zone = service.crop_cycle_row_to_zone_context({"zone_id": 2, "zone_name": "B구역", "crop_cycle_id": 18, "compatibility_crop_season_id": 18, "crop_type": "lettuce", "growth_stage": "엽채 생육 관찰"})
    review = zone["rehearsalResultReviewProjection"]
    assert review["reviewState"] == "pending_virtual_results"
    assert review["resultSummary"] == "가상 리허설 결과 검토 대기: 실제 실행 없이 시나리오별 결과를 확인합니다."
    assert review["sourceRehearsal"] == zone["virtualExecutionRehearsalScaffold"]
    assert [item["scenario"] for item in review["scenarioResults"]] == ["normal", "strong_wind", "rain", "low_temperature", "sensor_fault", "blocked", "fail_safe", "recovery"]
    assert {item["resultState"] for item in review["scenarioResults"]} == {"not_run"}
    assert review["readOnly"] is True
    assert review["executionEnabled"] is False
    assert review["approvalReleaseEnabled"] is False
    assert review["deviceCommandEnabled"] is False
    assert review["mqttEnabled"] is False


def test_frontend_adapter_normalizes_rehearsal_result_review_projection():
    source = _read(ADAPTER)
    for marker in ("normalizeRehearsalResultReviewProjection", "rehearsalResultReviewProjection", "reviewState", "resultSummary", "scenarioResults", "sourceRehearsal", "approvalReleaseEnabled", "deviceCommandEnabled", "mqttEnabled", "readOnly: true", "executionEnabled: false"):
        assert marker in source
    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{ zones: [{{ virtualExecutionRehearsalScaffold: {{ rehearsalState: 'blocked_until_virtual_rehearsal', scenarioSet: ['normal','blocked'], readOnly: true, executionEnabled: false }}, rehearsalResultReviewProjection: {{ reviewState: 'pending_virtual_results', resultSummary: '검토 대기', scenarioResults: [{{scenario:'normal', resultState:'not_run'}}, {{scenario:'blocked', resultState:'not_run'}}], readOnly: true, executionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }});
      const review = ctx.zones[0].rehearsalResultReviewProjection;
      if (review.reviewState !== 'pending_virtual_results') process.exit(1);
      if (review.scenarioResults.length !== 2) process.exit(2);
      if (review.sourceRehearsal.rehearsalState !== 'blocked_until_virtual_rehearsal') process.exit(3);
      if (review.approvalReleaseEnabled !== false || review.deviceCommandEnabled !== false || review.mqttEnabled !== false) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_rehearsal_result_review_only_for_recommendation_stage_without_execution():
    source = _read(REBUILD_PANEL)
    for marker in ("RS-024 rehearsal result review projection", "renderRehearsalResultReviewProjection(zone, stageKey)", "data-rehearsal-result-review-card", "data-rehearsal-result-review-state", "data-rehearsal-result-summary", "data-rehearsal-result-scenarios", "data-rehearsal-result-readonly", "data-rehearsal-result-execution-enabled", "data-rehearsal-result-approval-release-enabled", "data-rehearsal-result-device-command-enabled", "data-rehearsal-result-mqtt-enabled", "리허설 결과 검토"):
        assert marker in source
    assert '["recommend-act"].includes(stageKey)' in source
    for forbidden in ("data-rehearsal-result-approve-button", "data-rehearsal-result-execute-button", "data-device-command-button", "hass.callService", "executeFinalTargets", "mqtt.publish", "POST", "PUT", "DELETE"):
        assert forbidden not in source


def test_rebuild_panel_rehearsal_result_review_node_smoke():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ zones: [{{ id: 'zone-2', name: 'B구역', rehearsalResultReviewProjection: {{ reviewState: 'pending_virtual_results', resultSummary: '검토 대기', scenarioResults: [{{scenario:'normal', resultState:'not_run'}}, {{scenario:'fail_safe', resultState:'not_run'}}], readOnly: true, executionEnabled: false, approvalReleaseEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderRehearsalResultReviewProjection(panel._homeContext.zones[0], 'recommend-act');
      const hidden = panel.renderRehearsalResultReviewProjection(panel._homeContext.zones[0], 'growth-goal');
      if (!html.includes('data-rehearsal-result-review-card')) process.exit(1);
      if (!html.includes('pending_virtual_results')) process.exit(2);
      if (!html.includes('리허설 결과 검토')) process.exit(3);
      if (!html.includes('normal') || !html.includes('fail_safe')) process.exit(4);
      if (hidden !== '') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs024_and_next_step():
    spec = _read(INTERFACE_SPEC)
    workflow = _read(WORKFLOW_SPEC)
    failsafe = _read(FAILSAFE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in ("Rehearsal result review projection", "rehearsalResultReviewProjection", "virtualExecutionRehearsalScaffold → rehearsalResultReviewProjection", "리허설 결과 검토", "No approval/execution release in RS-024"):
        assert marker in spec
    for marker in ("virtual rehearsal scaffold → result review projection", "scenario result remains not_run until real virtual runner slice", "No real-device hookup in RS-024"):
        assert marker in workflow
    for marker in ("result review does not release interlock", "approvalReleaseEnabled remains false", "No device command in RS-024"):
        assert marker in failsafe
    for marker in ("Phase R4.20 — Rehearsal result review projection", "Status:** `v1.14.49`에서 Rehearsal result review projection 완료", "No production route removal in RS-024", "No DB migration in RS-024", "No write/mutation in RS-024"):
        assert marker in plan
    assert "RS-024" in inventory
    assert "Rehearsal result review projection completed" in inventory
    assert "RS-025" in inventory
    assert "Virtual runner input contract" in inventory
