from pathlib import Path
import subprocess, json

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-062-record-save-callapi-path-hotfix.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(extra=""):
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.FormData = class {{ constructor(){{ this.map = new Map([['surveyDate','2026-06-30'], ['plantHeight','12.5'], ['leafCount','7'], ['cropType','lettuce'], ['zoneId','zone-1']]); }} get(k){{ return this.map.get(k) || ''; }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}};this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const calls = [];
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async (method, path, body) => {{ calls.push({{ method, path, body }}); return {{ ok: true, record: {{ id: 9 }} }}; }} }};
      panel._homeContext = {{ actorRole: 'operator', zones: [{{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 7, crop_type: 'lettuce', crop_label_ko: '상추', growth_stage: '활착기' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:7' }}, cropRecordSummary: {{ growthSurvey: {{ count: 0 }}, pestScouting: {{ count: 0 }}, controlTreatment: {{ count: 0 }} }} }}] }};
      panel._loadHomeContext = async () => {{ calls.push({{ method: 'reload' }}); }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      {extra}
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML, calls }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)


def test_r7_062_version_surfaces_are_1_12_97():
    assert '"version": "1.12.98"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.98"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.98"' in _read(REBUILD_PANEL)


def test_r7_062_write_callapi_uses_ha_relative_path_not_api_absolute_path():
    data = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 'crop_seasons:7', title: '생육조사 작성', state: 'ready', rows: [] }; await panel.submitR7RecordWorkflowForm({});")
    save_calls = [call for call in data['calls'] if 'crop-records/' in call.get('path','')]
    assert save_calls, data['calls']
    save = save_calls[0]
    assert save['method'] == 'POST'
    assert save['path'] == 'green_smart/rebuild/crop-records/7/growth-survey'
    assert not save['path'].startswith('/api/')
    assert save['body']['date'] == '2026-06-30'
    assert save['body']['metricsJson'].startswith('[{')


def test_r7_062_history_callapi_uses_ha_relative_path_too():
    source = _read(REBUILD_PANEL)
    assert 'hass.callApi("GET", `green_smart/rebuild/crop-records/${seasonId}/history/${recordType}`)' in source
    assert '`/api/green_smart/rebuild/crop-records/${seasonId}/history/${recordType}`' not in source
    assert '`/api/green_smart/rebuild/crop-records/${normalizedSeasonId}/${recordType}`' not in source
    assert 'green_smart/rebuild/crop-records/${normalizedSeasonId}/${recordType}' in source


def test_r7_062_documented():
    doc = _read(DOC)
    for phrase in ('저장 실패 실제 원인', 'hass.callApi', '/api/ 중복', 'green_smart/rebuild/crop-records'):
        assert phrase in doc
