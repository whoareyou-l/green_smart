from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-065-growth-survey-plant-object-selector.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _node(script: str) -> str:
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout.strip()


def _bootstrap(extra: str) -> str:
    return f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.innerWidth = 1120;
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'operator', is_admin: false }}, callApi: async () => ({{}}) }};
      panel._homeContext = {{
        actorRole: 'operator',
        zones: [{{
          id: 'zone-3',
          name: '3구역',
          currentCrop: {{ crop_cycle_id: 4, crop_type: 'lettuce', growth_stage: '활착기' }},
          currentCropAssignment: {{ sourceRowId: 'crop_seasons:4' }}
        }}]
      }};
      {extra}
    """


def test_r7_065_version_surfaces_are_1_13_0():
    assert '"version": "1.14.62"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.62"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.62"' in _read(REBUILD_PANEL)


def test_r7_065_growth_survey_basic_info_has_plant_object_dropdown_from_crop_cycle():
    out = _node(_bootstrap("""
      panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 4, title: '생육조사 작성', state: 'ready', rows: [] };
      const html = panel.renderR7RecordWorkflowModal();
      console.log(JSON.stringify({ html }));
    """))
    html = json.loads(out)["html"]
    assert 'data-r7-growth-survey-field="plantObjectNumber"' in html
    assert 'name="plantObjectNumber"' in html
    assert '객체 번호' in html
    for object_no in range(1, 5):
        assert f'value="4-{object_no}"' in html
        assert f'>4-{object_no}</option>' in html
    assert 'value="4-5"' not in html


def test_r7_065_object_options_follow_selected_zone_current_crop_cycle():
    out = _node(_bootstrap("""
      panel._homeContext.zones = [{ id: 'zone-2', name: '2구역', currentCrop: { crop_cycle_id: 9, crop_type: 'lettuce', growth_stage: '활착기' }, currentCropAssignment: { sourceRowId: 'crop_seasons:9' } }];
      panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 9, title: '생육조사 작성', state: 'ready', rows: [] };
      const html = panel.renderR7RecordWorkflowModal();
      console.log(JSON.stringify({ html }));
    """))
    html = json.loads(out)["html"]
    for object_no in range(1, 5):
        assert f'value="9-{object_no}"' in html
    assert 'value="4-1"' not in html


def test_r7_065_growth_payload_persists_plant_object_in_metrics_json():
    out = _node(_bootstrap("""
      const form = { _entries: new Map([
        ['surveyDate', '2026-06-30'],
        ['zoneId', 'zone-3'],
        ['zoneLabel', '3구역'],
        ['growthStage', '활착기'],
        ['observerName', 'operator'],
        ['plantObjectNumber', '4-3'],
        ['plantHeight', '18.5'],
        ['leafCount', '9'],
        ['cropType', 'lettuce'],
        ['note', '객체번호 저장 테스트']
      ]) };
      globalThis.FormData = class { constructor(form){ this.form = form; } get(key){ return this.form._entries.get(key) ?? ''; } };
      const payload = panel.createR7RecordPayload('growth-survey', form);
      console.log(JSON.stringify(payload));
    """))
    payload = json.loads(out)
    metrics = { item['key']: item['value'] for item in json.loads(payload['metricsJson']) }
    assert metrics['plantObjectNumber'] == '4-3'
    assert metrics['cropCycleObjectLabel'] == '4-3'
    assert payload['zoneId'] == 'zone-3'
    assert payload['height'] == '18.5'


def test_r7_065_documented():
    doc = _read(DOC)
    for phrase in ('작기마다 4개의 작물 객체', '객체 번호', '4-3', '작기 번호-객체 번호', 'metricsJson'):
        assert phrase in doc
