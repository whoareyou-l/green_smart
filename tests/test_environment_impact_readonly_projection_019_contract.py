from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/environment-impact-readonly-projection.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs019_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs019_version_surfaces_are_aligned_to_1_12_18():
    assert '"version": "1.12.54"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.54"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.54"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.12.54" in _read(path)


def test_rs019_document_records_environment_impact_projection_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-019 Environment Impact Read-only Projection",
        "Status: environment impact read-only projection",
        "environmentImpactProjection",
        "currentCropAssignment + equipmentProfile + dataAvailability → environmentImpactProjection",
        "영향지도",
        "impactState",
        "impactFocus",
        "impactFactors",
        "freshnessLabel",
        "No production route removal in RS-019",
        "No DB migration in RS-019",
        "No write/mutation in RS-019",
        "No real-device hookup in RS-019",
    ):
        assert marker in text


def test_service_maps_assignment_equipment_and_availability_to_environment_impact_projection():
    service = _load_service()
    row = {
        "zone_id": 2,
        "zone_name": "B구역",
        "crop_cycle_id": 18,
        "compatibility_crop_season_id": 18,
        "crop_type": "lettuce",
        "variety": "버터헤드",
        "growth_stage": "엽채 생육 관찰",
        "plant_date": "2026-06-03",
        "updated_at": "2026-06-28T22:00:00+09:00",
    }
    zone = service.crop_cycle_row_to_zone_context(row)
    projection = zone["environmentImpactProjection"]
    assert projection["impactState"] == "ready"
    assert projection["impactFocus"] == "구역 장비와 데이터 신선도 기준 영향 확인"
    assert projection["impactFactors"] == zone["equipmentProfile"]["labels"]
    assert projection["dataAvailability"] == zone["dataAvailability"]
    assert projection["sourceAssignment"] == zone["currentCropAssignment"]
    assert projection["readOnly"] is True
    assert projection["executionEnabled"] is False


def test_frontend_adapter_normalizes_environment_impact_projection_from_api_context():
    source = _read(ADAPTER)
    for marker in (
        "normalizeEnvironmentImpactProjection",
        "environmentImpactProjection",
        "impactState",
        "impactFocus",
        "impactFactors",
        "freshnessLabel",
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
          currentCrop: {{ crop_cycle_id: 18, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '엽채 생육 관찰' }},
          currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 18, readOnly: true, executionEnabled: false }},
          equipmentProfile: {{ labels: ['천창', '차광막'] }},
          dataAvailability: {{ state: 'ok', freshnessMinutes: 3, source: 'legacy_physical_readonly_adapter' }},
          environmentImpactProjection: {{ impactState: 'ready', impactFocus: '환경 영향 확인', impactFactors: ['천창', '차광막'], freshnessLabel: '3분 전 갱신', readOnly: true, executionEnabled: false }}
        }}]
      }});
      const projection = ctx.zones[0].environmentImpactProjection;
      console.log(JSON.stringify(projection));
      if (projection.impactState !== 'ready') process.exit(1);
      if (projection.impactFactors.length !== 2) process.exit(2);
      if (projection.freshnessLabel !== '3분 전 갱신') process.exit(3);
      if (projection.sourceAssignment.currentCrop.crop_cycle_id !== 18) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_environment_impact_projection_only_for_influence_map_without_mutation():
    source = _read(REBUILD_PANEL)
    for marker in (
        "RS-019 environment impact read-only projection",
        "renderEnvironmentImpactProjection(zone, stageKey)",
        "data-environment-impact-projection-card",
        "data-environment-impact-state",
        "data-environment-impact-focus",
        "data-environment-impact-factors",
        "data-environment-impact-freshness",
        "data-environment-impact-readonly",
        "data-environment-impact-execution-enabled",
        "영향지도 projection",
    ):
        assert marker in source
    assert '["influence-map"].includes(stageKey)' in source

    for forbidden in (
        "data-environment-impact-edit-button",
        "data-environment-impact-save-button",
        "data-environment-impact-delete-button",
        "hass.callService",
        "executeFinalTargets",
        "POST",
        "PUT",
        "DELETE",
    ):
        assert forbidden not in source


def test_rebuild_panel_environment_impact_node_smoke_uses_normalized_context():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'legacy-physical-readonly-adapter', zones: [{{ id: 'zone-2', zone_id: 2, name: 'B구역', currentCrop: {{ crop_cycle_id: 18, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '엽채 생육 관찰' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 18, readOnly: true, executionEnabled: false }}, equipmentProfile: {{ labels: ['천창', '차광막'] }}, dataAvailability: {{ state: 'ok', freshnessMinutes: 3, source: 'legacy_physical_readonly_adapter' }}, environmentImpactProjection: {{ impactState: 'ready', impactFocus: '환경 영향 확인', impactFactors: ['천창', '차광막'], freshnessLabel: '3분 전 갱신', readOnly: true, executionEnabled: false }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderEnvironmentImpactProjection(panel._homeContext.zones[0], 'influence-map');
      const hidden = panel.renderEnvironmentImpactProjection(panel._homeContext.zones[0], 'growth-goal');
      console.log(html);
      if (!html.includes('data-environment-impact-projection-card')) process.exit(1);
      if (!html.includes('data-environment-impact-state="ready"')) process.exit(2);
      if (!html.includes('천창')) process.exit(3);
      if (!html.includes('3분 전 갱신')) process.exit(4);
      if (hidden !== '') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs019_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Environment impact read-only projection",
        "environmentImpactProjection",
        "currentCropAssignment + equipmentProfile + dataAvailability → environmentImpactProjection",
        "영향지도",
        "No write/mutation in RS-019",
    ):
        assert marker in spec
    for marker in (
        "Phase R4.15 — Environment impact read-only projection",
        "Status:** `v1.12.54`에서 영향지도 read-only projection 완료",
        "No production route removal in RS-019",
        "No DB migration in RS-019",
        "No write/mutation in RS-019",
    ):
        assert marker in plan
    assert "RS-019" in inventory
    assert "Environment impact read-only projection completed" in inventory
    assert "RS-020" in inventory
    assert "Recommendation review read-only projection" in inventory
