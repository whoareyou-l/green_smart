from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_054_version_surfaces_are_1_12_89():
    assert '"version": "1.15.34"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.34"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.34"' in _read(REBUILD_PANEL)


def test_r7_054_records_workflow_bypasses_190px_subtab_grid_wrapper():
    source = _read(REBUILD_PANEL)
    assert 'data-r7-records-full-width-panel' in source
    assert 'tabKey === "records-workflow"' in source
    assert 'display:block;width:100%;min-width:0;' in source
    assert 'grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;' in source


def test_r7_054_records_workflow_render_places_image_dashboard_in_full_width_panel():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, cropRecordSummary: {{ recordSummarySource: 'crop_repo_recent_records_readonly', growthSurvey: {{ count: 0, latest: null, latestLabel: '', staleState: 'empty' }}, pestScouting: {{ count: 0, latest: null, latestLabel: '', staleState: 'attention' }}, controlTreatment: {{ count: 1, latest: {{ date: '2026-06-30', pesticides: [{{ name: '리도밀', pls: true }}] }}, latestLabel: '2026-06-30 · 리도밀 · PHI 3일 남음', staleState: 'fresh' }}, workQueue: {{ nextAction: '필수 기록 최신 상태', missingItems: ['SPAD 미입력'] }}, readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      panel.render();
      const html = panel.innerHTML;
      const required = [
        'data-r7-records-full-width-panel',
        'display:block;width:100%;min-width:0;',
        'data-r7-records-image-dashboard="true"',
        'data-r7-record-image-grid="primary"',
        'grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;',
        'data-r7-record-image-card="today-work"',
        'data-r7-record-row="top-actions"',
        'data-r7-record-row="core-records"',
        'data-r7-record-row="recent-records"',
        'data-r7-record-recent-log-panel',
        'data-r7-record-ai-card'
      ];
      const forbidden = [
        'data-r7-records-full-width-panel style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))',
        'data-r7-record-section="record-source"',
        'data-r7-record-flow-skeleton="write-history-pls"'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) {{ console.error(JSON.stringify({{ missing, bad }})); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
