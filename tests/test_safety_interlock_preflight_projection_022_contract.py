from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/safety-interlock-preflight-projection.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs022_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs022_version_surfaces_are_aligned_to_1_12_21():
    assert '"version": "1.12.45"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.45"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.45"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.12.45" in _read(path)


def test_rs022_document_records_safety_interlock_preflight_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-022 Safety/Interlock Preflight Projection",
        "Status: safety/interlock preflight projection",
        "safetyInterlockPreflightProjection",
        "operatorApprovalScaffold → safetyInterlockPreflightProjection",
        "Safety / Interlock / Fail Safe 사전검증",
        "safetyState",
        "interlockState",
        "failSafeState",
        "blockedReasons",
        "requiredChecks",
        "No production route removal in RS-022",
        "No DB migration in RS-022",
        "No write/mutation in RS-022",
        "No real-device hookup in RS-022",
    ):
        assert marker in text


def test_service_maps_operator_approval_to_safety_interlock_preflight_projection():
    service = _load_service()
    zone = service.crop_cycle_row_to_zone_context({"zone_id": 2, "zone_name": "B구역", "crop_cycle_id": 18, "compatibility_crop_season_id": 18, "crop_type": "lettuce", "growth_stage": "엽채 생육 관찰"})
    projection = zone["safetyInterlockPreflightProjection"]
    assert projection["preflightState"] == "blocked_until_review"
    assert projection["safetyState"] == "pending"
    assert projection["interlockState"] == "pending"
    assert projection["failSafeState"] == "standby"
    assert "operator_approval_required" in projection["blockedReasons"]
    assert projection["requiredChecks"] == ["작업자 승인", "Safety 검증", "Interlock 검증", "Fail Safe 확인"]
    assert projection["sourceOperatorApproval"] == zone["operatorApprovalScaffold"]
    assert projection["readOnly"] is True
    assert projection["executionEnabled"] is False


def test_frontend_adapter_normalizes_safety_interlock_preflight_projection():
    source = _read(ADAPTER)
    for marker in ("normalizeSafetyInterlockPreflightProjection", "safetyInterlockPreflightProjection", "preflightState", "safetyState", "interlockState", "failSafeState", "blockedReasons", "requiredChecks", "sourceOperatorApproval", "readOnly: true", "executionEnabled: false"):
        assert marker in source
    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{ zones: [{{ currentCrop: {{ crop_cycle_id: 18 }}, operatorApprovalScaffold: {{ approvalState: 'required', executionBlocked: true }}, safetyInterlockPreflightProjection: {{ preflightState: 'blocked_until_review', safetyState: 'pending', interlockState: 'pending', failSafeState: 'standby', blockedReasons: ['operator_approval_required'], requiredChecks: ['작업자 승인'], readOnly: true, executionEnabled: false }} }}] }});
      const projection = ctx.zones[0].safetyInterlockPreflightProjection;
      if (projection.preflightState !== 'blocked_until_review') process.exit(1);
      if (projection.blockedReasons[0] !== 'operator_approval_required') process.exit(2);
      if (projection.sourceOperatorApproval.approvalState !== 'required') process.exit(3);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_safety_preflight_only_for_recommendation_stage_without_mutation():
    source = _read(REBUILD_PANEL)
    for marker in ("RS-022 safety/interlock preflight projection", "renderSafetyInterlockPreflightProjection(zone, stageKey)", "data-safety-interlock-preflight-card", "data-safety-preflight-state", "data-safety-state", "data-interlock-state", "data-failsafe-state", "data-preflight-blocked-reasons", "data-preflight-required-checks", "data-preflight-readonly", "data-preflight-execution-enabled", "Safety / Interlock / Fail Safe 사전검증"):
        assert marker in source
    assert '["recommend-act"].includes(stageKey)' in source
    for forbidden in ("data-preflight-execute-button", "data-preflight-approve-button", "hass.callService", "executeFinalTargets", "POST", "PUT", "DELETE"):
        assert forbidden not in source


def test_rebuild_panel_safety_preflight_node_smoke():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ zones: [{{ id: 'zone-2', name: 'B구역', safetyInterlockPreflightProjection: {{ preflightState: 'blocked_until_review', safetyState: 'pending', interlockState: 'pending', failSafeState: 'standby', blockedReasons: ['operator_approval_required'], requiredChecks: ['작업자 승인', 'Safety 검증'], readOnly: true, executionEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderSafetyInterlockPreflightProjection(panel._homeContext.zones[0], 'recommend-act');
      const hidden = panel.renderSafetyInterlockPreflightProjection(panel._homeContext.zones[0], 'growth-goal');
      if (!html.includes('data-safety-interlock-preflight-card')) process.exit(1);
      if (!html.includes('blocked_until_review')) process.exit(2);
      if (!html.includes('Safety / Interlock / Fail Safe 사전검증')) process.exit(3);
      if (hidden !== '') process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs022_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in ("Safety/Interlock preflight projection", "safetyInterlockPreflightProjection", "operatorApprovalScaffold → safetyInterlockPreflightProjection", "Safety / Interlock / Fail Safe 사전검증", "No write/mutation in RS-022"):
        assert marker in spec
    for marker in ("Phase R4.18 — Safety/Interlock preflight projection", "Status:** `v1.12.45`에서 Safety/Interlock preflight projection 완료", "No production route removal in RS-022", "No DB migration in RS-022", "No write/mutation in RS-022"):
        assert marker in plan
    assert "RS-022" in inventory
    assert "Safety/Interlock preflight projection completed" in inventory
    assert "RS-023" in inventory
    assert "Virtual execution rehearsal scaffold" in inventory
