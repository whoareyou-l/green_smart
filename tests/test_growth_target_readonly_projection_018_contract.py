from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/growth-target-readonly-projection.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs018_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs018_version_surfaces_are_aligned_to_1_12_17():
    assert '"version": "1.15.16"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.16"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.16"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.15.16" in _read(path)


def test_rs018_document_records_growth_target_projection_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-018 Growth Target Read-only Projection",
        "Status: growth target read-only projection",
        "growthTargetProjection",
        "currentCropAssignment → growthTargetProjection",
        "생육목표",
        "targetStageLabel",
        "targetFocus",
        "targetBasis",
        "No production route removal in RS-018",
        "No DB migration in RS-018",
        "No write/mutation in RS-018",
        "No real-device hookup in RS-018",
    ):
        assert marker in text


def test_service_maps_assignment_to_growth_target_projection():
    service = _load_service()
    row = {
        "zone_id": 2,
        "zone_name": "B구역",
        "crop_cycle_id": 18,
        "compatibility_crop_season_id": 18,
        "crop_type": "lettuce",
        "variety": "버터헤드",
        "growth_stage": "정식",
        "plant_date": "2026-06-03",
        "updated_at": "2026-06-28T22:00:00+09:00",
    }
    zone = service.crop_cycle_row_to_zone_context(row)
    projection = zone["growthTargetProjection"]
    assert projection["projectionState"] == "ready"
    assert projection["targetStageLabel"] == "정식"
    assert projection["targetFocus"]
    assert projection["targetBasis"]["crop_cycle_id"] == 18
    assert projection["sourceAssignment"] == zone["currentCropAssignment"]
    assert projection["readOnly"] is True
    assert projection["executionEnabled"] is False


def test_frontend_adapter_normalizes_growth_target_projection_from_api_context():
    source = _read(ADAPTER)
    for marker in (
        "normalizeGrowthTargetProjection",
        "growthTargetProjection",
        "projectionState",
        "targetStageLabel",
        "targetFocus",
        "targetBasis",
        "sourceAssignment",
        "readOnly: true",
        "executionEnabled: false",
    ):
        assert marker in source

    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{
        contextSource: 'legacy-physical-readonly-adapter',
        zones: [{{
          id: 'zone-2', zone_id: 2, name: 'B구역',
          currentCrop: {{ crop_cycle_id: 18, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '정식' }},
          currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 18, readOnly: true, executionEnabled: false }},
          growthTargetProjection: {{ projectionState: 'ready', targetStageLabel: '정식', targetFocus: '활착 안정', targetBasis: {{ crop_cycle_id: 18 }}, readOnly: true, executionEnabled: false }},
          equipmentProfile: {{ labels: ['천창'] }},
          dataAvailability: {{ state: 'ok', source: 'legacy_physical_readonly_adapter' }}
        }}]
      }});
      const projection = ctx.zones[0].growthTargetProjection;
      console.log(JSON.stringify(projection));
      if (projection.projectionState !== 'ready') process.exit(1);
      if (projection.targetStageLabel !== '정식') process.exit(2);
      if (projection.targetBasis.crop_cycle_id !== 18) process.exit(3);
      if (projection.sourceAssignment.currentCrop.crop_cycle_id !== 18) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_growth_target_projection_only_for_growth_goal_without_mutation():
    source = _read(REBUILD_PANEL)
    for marker in (
        "RS-018 growth target read-only projection",
        "renderGrowthTargetProjection(zone, stageKey)",
        "data-growth-target-projection-card",
        "data-growth-target-projection-state",
        "data-growth-target-stage-label",
        "data-growth-target-focus",
        "data-growth-target-basis-crop-cycle-id",
        "data-growth-target-readonly",
        "data-growth-target-execution-enabled",
        "생육목표 projection",
    ):
        assert marker in source
    assert '["growth-goal"].includes(stageKey)' in source

    for forbidden in (
        "data-growth-target-edit-button",
        "data-growth-target-save-button",
        "data-growth-target-delete-button",
        "hass.callService",
        "executeFinalTargets",
        "POST",
        "PUT",
        "DELETE",
    ):
        assert forbidden not in source


def test_rebuild_panel_growth_target_node_smoke_uses_normalized_context():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'legacy-physical-readonly-adapter', zones: [{{ id: 'zone-2', zone_id: 2, name: 'B구역', currentCrop: {{ crop_cycle_id: 18, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '정식' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 18, readOnly: true, executionEnabled: false }}, growthTargetProjection: {{ projectionState: 'ready', targetStageLabel: '정식', targetFocus: '활착 안정', targetBasis: {{ crop_cycle_id: 18 }}, readOnly: true, executionEnabled: false }}, equipmentProfile: {{ labels: ['천창'] }}, dataAvailability: {{ state: 'ok', source: 'legacy_physical_readonly_adapter' }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderGrowthTargetProjection(panel._homeContext.zones[0], 'growth-goal');
      const hidden = panel.renderGrowthTargetProjection(panel._homeContext.zones[0], 'crop-status');
      console.log(html);
      if (!html.includes('data-growth-target-projection-card')) process.exit(1);
      if (!html.includes('data-growth-target-projection-state="ready"')) process.exit(2);
      if (!html.includes('data-growth-target-basis-crop-cycle-id="18"')) process.exit(3);
      if (!html.includes('활착 안정')) process.exit(4);
      if (hidden !== '') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs018_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Growth target read-only projection",
        "growthTargetProjection",
        "currentCropAssignment → growthTargetProjection",
        "생육목표",
        "No write/mutation in RS-018",
    ):
        assert marker in spec
    for marker in (
        "Phase R4.14 — Growth target read-only projection",
        "Status:** `v1.15.16`에서 생육목표 read-only projection 완료",
        "No production route removal in RS-018",
        "No DB migration in RS-018",
        "No write/mutation in RS-018",
    ):
        assert marker in plan
    assert "RS-018" in inventory
    assert "Growth target read-only projection completed" in inventory
    assert "RS-019" in inventory
    assert "Environment impact read-only projection" in inventory
