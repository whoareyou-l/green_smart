from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-023-crop-operations-detail-absorption.md"
PLAN = ROOT / "docs/rebuild/r7-017-024-domain-tabs-zone-qa-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_023_version_surfaces_are_1_12_57():
    assert '"version": "1.14.39"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.39"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.39"' in _read(REBUILD_PANEL)
    assert "v1.14.39" in _read(DOC)


def test_r7_023_doc_records_crop_operations_inventory_and_forward_plan():
    text = _read(DOC)
    for phrase in (
        "# R7-023 Crop Operations Detail Absorption",
        "작물 운영 도메인을 crop-centered, zone-scoped visual 하위탭으로 전환",
        "The user corrected that the R7 visual-domain track must not skip **작물 운영**",
        "renderCropCycleReadOnlyCard()",
        "renderCurrentCropAssignmentReadModel()",
        "renderGrowthTargetProjection()",
        "생육조사, 병해충 예찰, 방제 기록 read-only workflow summary",
        "No API route change",
        "No DB migration",
        "No crop season save/update/delete/demolish logic change",
        "No HA service call",
        "No MQTT/device command",
        "No physical device hookup",
    ):
        assert phrase in text
    plan = _read(PLAN)
    assert "R7-023 | 작물 운영" in plan
    assert "next corrective slice" in plan


def _render_crop_operations_page() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-023-crop-visual-smoke', zones: [
        {{ zoneId: 'zone-2', zoneName: '2구역', currentCrop: {{ crop_cycle_id: 'season-lettuce-2', crop_type: 'lettuce', crop_label_ko: '상추', variety: '청치마', plant_date: '2026-06-01', demolish_date: '', growth_stage: '활착' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'season-lettuce-2', dataAvailability: {{ state: 'fresh', source: 'crop_repo' }} }}, growthTargetProjection: {{ projectionState: 'ready', targetStageLabel: '활착 안정', targetFocus: '근권 안정', targetBasis: {{ crop_cycle_id: 'season-lettuce-2' }} }} }},
        {{ zoneId: 'zone-1', zoneName: '1구역', currentCrop: {{ crop_cycle_id: 'season-tomato-1', crop_type: 'tomato', crop_label_ko: '토마토', variety: '대추방울', plant_date: '2026-05-20', growth_stage: '착과·비대' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'season-tomato-1', dataAvailability: {{ state: 'fresh', source: 'crop_repo' }} }}, growthTargetProjection: {{ projectionState: 'ready', targetStageLabel: '착과 안정', targetFocus: '과비대 균형', targetBasis: {{ crop_cycle_id: 'season-tomato-1' }} }} }}
      ] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('crop-operations');
      console.log(panel.innerHTML);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def test_r7_023_crop_operations_visual_tabs_absorb_crop_sources():
    html = _render_crop_operations_page()
    for marker in (
        'data-r7-domain-page="crop-operations"',
        'data-r7-crop-zone-visual="true"',
        'data-r7-crop-detail-absorbed="true"',
        'data-r7-domain-subtabs data-r7-domain-subtabs-for="crop-operations"',
        'data-r7-crop-subtab="status-summary"',
        'data-r7-crop-subtab="crop-cycle"',
        'data-r7-crop-subtab="growth-target"',
        'data-r7-crop-subtab="records-workflow"',
        'data-r7-crop-subtab="model-assist"',
        'data-r7-crop-subtab="trend-evidence"',
        'data-r7-zone-context-default="zone-1"',
        'data-r7-zone-sync-button',
        'data-r7-crop-current-card',
        'data-r7-crop-cycle-card',
        'data-r7-crop-assignment-card',
        'data-r7-crop-growth-target-card',
        'data-r7-crop-record-card',
        'data-r7-crop-model-card',
        'data-r7-crop-trend-evidence',
    ):
        assert marker in html
    for phrase in (
        "작물 운영",
        "구역 기준 작물 운영",
        "1구역 · 토마토",
        "season-tomato-1",
        "대추방울",
        "착과·비대",
        "착과 안정",
        "과비대 균형",
        "생육조사",
        "병해충 예찰",
        "방제 기록",
        "crop model evidence",
        "진단·위험·조치 추천",
    ):
        assert phrase in html


def test_r7_023_crop_operations_subtabs_switch_visible_panel_on_click():
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }}
        querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ contextSource: 'r7-023-crop-subtab-click-smoke', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('crop-operations');
      const clicked = panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      const html = panel.innerHTML;
      if (clicked !== true) process.exit(1);
      if (!html.includes('data-r7-crop-subtab="records-workflow" role="tab" aria-selected="true"')) process.exit(2);
      const panelStart = html.indexOf('data-r7-domain-subtab-panel-key="records-workflow"');
      const sectionOpen = panelStart >= 0 ? html.lastIndexOf('<section', panelStart) : -1;
      const sectionClose = sectionOpen >= 0 ? html.indexOf('</section>', sectionOpen) : -1;
      const section = sectionOpen >= 0 && sectionClose >= 0 ? html.slice(sectionOpen, sectionClose + 10) : '';
      if (!section.includes('data-r7-crop-detail-absorbed="true"') || !section.includes('data-r7-crop-record-workflow-grid') || !section.includes('style="display:grid')) process.exit(3);
      if (!html.includes('생육조사') || !html.includes('병해충 예찰') || !html.includes('방제 기록')) process.exit(4);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_023_does_not_add_crop_write_or_execution_authority():
    text = _read(REBUILD_PANEL)
    forbidden = (
        "data-r7-crop-save",
        "data-r7-crop-apply",
        "data-r7-crop-execute",
        "data-r7-crop-demolish-action",
        "data-r7-crop-delete-action",
        "callService(",
        ".callService",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
        "cropWriteEnabled\": true",
    )
    for marker in forbidden:
        assert marker not in text
