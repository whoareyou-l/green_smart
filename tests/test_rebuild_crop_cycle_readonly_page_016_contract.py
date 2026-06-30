from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
ADAPTER = ROOT / "custom_components/green_smart/panel/rebuild/current-crop-adapter.js"
DOC = ROOT / "docs/rebuild/crop-cycle-readonly-page-slice.md"
INTERFACE_SPEC = ROOT / "docs/master/02-interface-spec.md"
PRODUCT_PLAN = ROOT / "docs/plans/2026-06-28-green-smart-product-first-rebuild-plan.md"
LEGACY_INVENTORY = ROOT / "docs/rebuild/legacy-direction-inventory.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs016_version_surfaces_are_aligned_to_1_12_15():
    assert '"version": "1.13.6"' in _read(MANIFEST)
    assert 'const VERSION = "1.13.6"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.13.6"' in _read(REBUILD_PANEL)
    for path in (DOC, INTERFACE_SPEC, PRODUCT_PLAN, LEGACY_INVENTORY):
        assert "v1.13.6" in _read(path)


def test_rs016_document_records_crop_cycle_readonly_page_boundary():
    text = _read(DOC)
    required = (
        "# RS-016 Crop Cycle Read-only Page Slice",
        "Status: active crop cycle read-only UI slice",
        "currentCrop.crop_cycle_id",
        "crop_cycle/currentCrop",
        "작물상태 / 생육목표",
        "No production route removal in RS-016",
        "No DB migration in RS-016",
        "No write/mutation in RS-016",
        "No real-device hookup in RS-016",
    )
    for marker in required:
        assert marker in text


def test_adapter_preserves_crop_cycle_readonly_detail_fields_from_api_context():
    source = _read(ADAPTER)
    for marker in (
        "currentCrop.variety",
        "currentCrop.plant_date",
        "currentCrop.demolish_date",
        "currentCrop.crop_label_ko",
        "currentCrop.growth_stage",
    ):
        assert marker in source

    script = f"""
      import {{ normalizeRebuildHomeContext }} from {str(ADAPTER)!r};
      const ctx = normalizeRebuildHomeContext({{
        contextSource: 'legacy-physical-readonly-adapter',
        zones: [{{ id: 'zone-2', name: 'B구역', currentCrop: {{ crop_cycle_id: 12, crop_type: 'tomato', crop_label_ko: '토마토', growth_stage: '착과', variety: '대추방울', plant_date: '2026-06-01', demolish_date: null }} }}]
      }});
      const crop = ctx.zones[0].currentCrop;
      console.log(JSON.stringify(crop));
      if (crop.crop_cycle_id !== 12) process.exit(1);
      if (crop.variety !== '대추방울') process.exit(2);
      if (crop.plant_date !== '2026-06-01') process.exit(3);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_rebuild_panel_renders_crop_cycle_readonly_cards_for_crop_status_and_growth_goal():
    source = _read(REBUILD_PANEL)
    required = (
        "RS-016 crop cycle read-only page slice",
        "renderCropCycleReadOnlyCard(zone, stageKey)",
        "data-crop-cycle-readonly-card",
        "data-crop-cycle-stage",
        "data-crop-cycle-id",
        "data-active-crop-cycle-id",
        "data-current-crop-type",
        "data-current-crop-variety",
        "data-current-crop-plant-date",
        "data-current-crop-growth-stage",
        "data-current-crop-readonly-note",
        "작물상태",
        "생육목표",
    )
    for marker in required:
        assert marker in source

    for forbidden in (
        "data-crop-cycle-edit-button",
        "data-crop-cycle-delete-button",
        "data-crop-cycle-save-button",
        "hass.callService",
        "executeFinalTargets",
        "POST",
        "PUT",
        "DELETE",
    ):
        assert forbidden not in source


def test_rebuild_panel_crop_cycle_readonly_node_smoke_uses_api_shape():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'legacy-physical-readonly-adapter', zones: [{{ id: 'zone-2', name: 'B구역', currentCrop: {{ crop_cycle_id: 12, crop_type: 'tomato', crop_label_ko: '토마토', growth_stage: '착과', variety: '대추방울', plant_date: '2026-06-01' }}, equipmentProfile: {{ labels: ['천창'] }}, dataAvailability: {{ state: 'ok', freshnessMinutes: 1, note: 'ok' }} }}] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const html = panel.renderCropCycleReadOnlyCard(panel._homeContext.zones[0], 'crop-status');
      console.log(html);
      if (!html.includes('data-crop-cycle-readonly-card')) process.exit(1);
      if (!html.includes('data-crop-cycle-id="12"')) process.exit(2);
      if (!html.includes('대추방울')) process.exit(3);
      if (!html.includes('2026-06-01')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_docs_inventory_and_plan_record_rs016_completion_and_next_step():
    spec = _read(INTERFACE_SPEC)
    plan = _read(PRODUCT_PLAN)
    inventory = _read(LEGACY_INVENTORY)
    for marker in (
        "Crop cycle read-only page slice",
        "data-crop-cycle-readonly-card",
        "currentCrop.crop_cycle_id",
        "작물상태 / 생육목표",
        "No write/mutation in RS-016",
    ):
        assert marker in spec
    for marker in (
        "Phase R4.12 — Crop cycle read-only page slice",
        "Status:** `v1.13.6`에서 작물상태/생육목표의 crop_cycle/currentCrop read-only UI 표시 완료",
        "No production route removal in RS-016",
        "No DB migration in RS-016",
        "No write/mutation in RS-016",
    ):
        assert marker in plan
    assert "RS-016" in inventory
    assert "Crop cycle read-only page slice completed" in inventory
    assert "RS-017" in inventory
    assert "Zone current crop assignment read model" in inventory
