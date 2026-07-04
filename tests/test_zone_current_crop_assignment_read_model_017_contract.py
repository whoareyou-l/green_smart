from pathlib import Path
import importlib.util
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"
DOC = ROOT / "docs/rebuild/zone-current-crop-assignment-read-model.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
DB_SPEC = ROOT / "docs/master/03-database-schema.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service():
    spec = importlib.util.spec_from_file_location("rs017_rebuild_crop_context_service", SERVICE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_rs017_version_surfaces_are_aligned_to_1_12_16():
    assert '"version": "1.14.72"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.72"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.72"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, DB_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.14.72" in _read(path)


def test_rs017_document_records_assignment_read_model_boundary():
    text = _read(DOC)
    for marker in (
        "# RS-017 Zone Current Crop Assignment Read Model",
        "Status: zone current crop assignment read model",
        "currentCropAssignment",
        "zone → currentCrop/crop_cycle",
        "zone → equipmentProfile",
        "zone → dataAvailability",
        "assignmentState",
        "sourceRowId",
        "No production route removal in RS-017",
        "No DB migration in RS-017",
        "No write/mutation in RS-017",
        "No real-device hookup in RS-017",
    ):
        assert marker in text


def test_service_maps_rows_to_current_crop_assignment_read_model():
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
    assignment = zone["currentCropAssignment"]
    assert assignment["assignmentState"] == "assigned"
    assert assignment["zone_id"] == 2
    assert assignment["sourceRowId"] == 18
    assert assignment["currentCrop"]["crop_cycle_id"] == 18
    assert assignment["equipmentProfile"] == zone["equipmentProfile"]
    assert assignment["dataAvailability"] == zone["dataAvailability"]
    assert assignment["readOnly"] is True
    assert assignment["executionEnabled"] is False


def test_frontend_adapter_normalizes_current_crop_assignment_from_api_context():
    source = _read(ADAPTER)
    for marker in (
        "normalizeCurrentCropAssignment",
        "currentCropAssignment",
        "assignmentState",
        "sourceRowId",
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
          equipmentProfile: {{ labels: ['천창', '차광막'] }},
          dataAvailability: {{ state: 'ok', source: 'legacy_physical_readonly_adapter', updatedAt: '2026-06-28T22:00:00+09:00' }}
        }}]
      }});
      const zone = ctx.zones[0];
      console.log(JSON.stringify(zone.currentCropAssignment));
      if (zone.currentCropAssignment.assignmentState !== 'assigned') process.exit(1);
      if (zone.currentCropAssignment.sourceRowId !== 18) process.exit(2);
      if (zone.currentCropAssignment.currentCrop.crop_cycle_id !== 18) process.exit(3);
      if (zone.currentCropAssignment.equipmentProfile.labels.length !== 2) process.exit(4);
      if (zone.currentCropAssignment.dataAvailability.state !== 'ok') process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_assignment_read_model_markers_without_mutation():
    source = _read(REBUILD_PANEL)
    for marker in (
        "RS-017 zone current crop assignment read model",
        "renderCurrentCropAssignmentReadModel(zone)",
        "data-current-crop-assignment-card",
        "data-current-crop-assignment-state",
        "data-current-crop-assignment-source-row-id",
        "data-current-crop-assignment-readonly",
        "data-current-crop-assignment-execution-enabled",
        "data-current-crop-assignment-equipment-profile",
        "data-current-crop-assignment-data-availability",
        "구역별 현재 작기 배정",
    ):
        assert marker in source

    for forbidden in (
        "data-current-crop-assignment-edit-button",
        "data-current-crop-assignment-save-button",
        "data-current-crop-assignment-delete-button",
        "hass.callService",
        "executeFinalTargets",
        "POST",
        "PUT",
        "DELETE",
    ):
        assert forbidden not in source


def test_rebuild_panel_assignment_node_smoke_uses_normalized_context():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'legacy-physical-readonly-adapter', zones: [{{ id: 'zone-2', zone_id: 2, name: 'B구역', currentCrop: {{ crop_cycle_id: 18, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '정식' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 18, readOnly: true, executionEnabled: false }}, equipmentProfile: {{ labels: ['천창', '차광막'] }}, dataAvailability: {{ state: 'ok', source: 'legacy_physical_readonly_adapter', updatedAt: '2026-06-28T22:00:00+09:00' }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderCurrentCropAssignmentReadModel(panel._homeContext.zones[0]);
      console.log(html);
      if (!html.includes('data-current-crop-assignment-card')) process.exit(1);
      if (!html.includes('data-current-crop-assignment-state="assigned"')) process.exit(2);
      if (!html.includes('data-current-crop-assignment-source-row-id="18"')) process.exit(3);
      if (!html.includes('천창')) process.exit(4);
      if (!html.includes('legacy_physical_readonly_adapter')) process.exit(5);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_specs_plan_and_inventory_record_rs017_and_next_step():
    spec = _read(INTERFACE_SPEC)
    db_spec = _read(DB_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Zone current crop assignment read model",
        "currentCropAssignment",
        "zone → currentCrop/crop_cycle",
        "zone → equipmentProfile",
        "zone → dataAvailability",
        "No write/mutation in RS-017",
    ):
        assert marker in spec
    for marker in (
        "legacy physical schema is adapter-only",
        "currentCropAssignment",
        "sourceRowId",
        "No DB migration in RS-017",
    ):
        assert marker in db_spec
    for marker in (
        "Phase R4.13 — Zone current crop assignment read model",
        "Status:** `v1.14.72`에서 구역별 currentCrop 배정 read model 완료",
        "No production route removal in RS-017",
        "No DB migration in RS-017",
        "No write/mutation in RS-017",
    ):
        assert marker in plan
    assert "RS-017" in inventory
    assert "Zone current crop assignment read model completed" in inventory
    assert "RS-018" in inventory
    assert "Growth target read-only projection" in inventory
