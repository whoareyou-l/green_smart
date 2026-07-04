from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/operator-approval-scaffold.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs021_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs021_version_surfaces_are_aligned_to_1_12_20():
    assert '"version": "1.14.67"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.67"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.67"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.14.67" in _read(path)


def test_rs021_document_records_operator_approval_scaffold_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-021 Operator Approval Scaffold",
        "Status: operator approval scaffold",
        "operatorApprovalScaffold",
        "recommendationReviewProjection → operatorApprovalScaffold",
        "작업자 승인 필요",
        "approvalState",
        "approvalRequired",
        "disabledReason",
        "executionBlocked",
        "No production route removal in RS-021",
        "No DB migration in RS-021",
        "No write/mutation in RS-021",
        "No real-device hookup in RS-021",
    ):
        assert marker in text


def test_service_maps_recommendation_review_to_operator_approval_scaffold():
    service = _load_service()
    zone = service.crop_cycle_row_to_zone_context({
        "zone_id": 2,
        "zone_name": "B구역",
        "crop_cycle_id": 18,
        "compatibility_crop_season_id": 18,
        "crop_type": "lettuce",
        "growth_stage": "엽채 생육 관찰",
    })
    scaffold = zone["operatorApprovalScaffold"]
    assert scaffold["approvalState"] == "required"
    assert scaffold["approvalRequired"] is True
    assert scaffold["disabledReason"] == "작업자 승인과 안전/인터록 사전검증 전에는 실행할 수 없습니다."
    assert scaffold["executionBlocked"] is True
    assert scaffold["sourceRecommendationReview"] == zone["recommendationReviewProjection"]
    assert scaffold["readOnly"] is True
    assert scaffold["executionEnabled"] is False


def test_frontend_adapter_normalizes_operator_approval_scaffold():
    source = _read(ADAPTER)
    for marker in (
        "normalizeOperatorApprovalScaffold",
        "operatorApprovalScaffold",
        "approvalState",
        "disabledReason",
        "executionBlocked",
        "sourceRecommendationReview",
        "readOnly: true",
        "executionEnabled: false",
    ):
        assert marker in source

    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{ zones: [{{ currentCrop: {{ crop_cycle_id: 18 }}, recommendationReviewProjection: {{ reviewState: 'ready', approvalRequired: true }}, operatorApprovalScaffold: {{ approvalState: 'required', disabledReason: '승인 전 실행 불가', executionBlocked: true, readOnly: true, executionEnabled: false }} }}] }});
      const scaffold = ctx.zones[0].operatorApprovalScaffold;
      console.log(JSON.stringify(scaffold));
      if (scaffold.approvalState !== 'required') process.exit(1);
      if (!scaffold.executionBlocked) process.exit(2);
      if (scaffold.sourceRecommendationReview.reviewState !== 'ready') process.exit(3);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_operator_approval_scaffold_only_for_recommendation_stage_without_mutation():
    source = _read(REBUILD_PANEL)
    for marker in (
        "RS-021 operator approval scaffold",
        "renderOperatorApprovalScaffold(zone, stageKey)",
        "data-operator-approval-scaffold-card",
        "data-operator-approval-state",
        "data-operator-approval-required",
        "data-operator-approval-disabled-reason",
        "data-operator-approval-execution-blocked",
        "data-operator-approval-readonly",
        "data-operator-approval-execution-enabled",
        "작업자 승인 scaffold",
    ):
        assert marker in source
    assert '["recommend-act"].includes(stageKey)' in source

    for forbidden in (
        "data-operator-approval-approve-button",
        "data-operator-approval-save-button",
        "data-operator-approval-execute-button",
        "hass.callService",
        "executeFinalTargets",
        "POST",
        "PUT",
        "DELETE",
    ):
        assert forbidden not in source


def test_rebuild_panel_operator_approval_node_smoke():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ zones: [{{ id: 'zone-2', name: 'B구역', currentCrop: {{ crop_cycle_id: 18 }}, recommendationReviewProjection: {{ reviewState: 'ready', approvalRequired: true }}, operatorApprovalScaffold: {{ approvalState: 'required', disabledReason: '작업자 승인과 안전/인터록 사전검증 전에는 실행할 수 없습니다.', executionBlocked: true, readOnly: true, executionEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderOperatorApprovalScaffold(panel._homeContext.zones[0], 'recommend-act');
      const hidden = panel.renderOperatorApprovalScaffold(panel._homeContext.zones[0], 'growth-goal');
      console.log(html);
      if (!html.includes('data-operator-approval-scaffold-card')) process.exit(1);
      if (!html.includes('data-operator-approval-state="required"')) process.exit(2);
      if (!html.includes('작업자 승인')) process.exit(3);
      if (!html.includes('실행 비활성화')) process.exit(4);
      if (hidden !== '') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs021_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Operator approval scaffold",
        "operatorApprovalScaffold",
        "recommendationReviewProjection → operatorApprovalScaffold",
        "작업자 승인 필요",
        "No write/mutation in RS-021",
    ):
        assert marker in spec
    for marker in (
        "Phase R4.17 — Operator approval scaffold",
        "Status:** `v1.14.67`에서 작업자 승인 scaffold 완료",
        "No production route removal in RS-021",
        "No DB migration in RS-021",
        "No write/mutation in RS-021",
    ):
        assert marker in plan
    assert "RS-021" in inventory
    assert "Operator approval scaffold completed" in inventory
    assert "RS-022" in inventory
    assert "Safety/Interlock preflight projection" in inventory
