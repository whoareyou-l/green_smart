from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-061-records-workflow-save-button-labels.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(extra="") -> str:
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
    import json
    return json.loads(result.stdout)


def test_r7_061_version_surfaces_are_1_12_96():
    assert '"version": "1.15.60"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.60"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.60"' in _read(REBUILD_PANEL)


def test_r7_061_card_button_labels_match_user_request():
    data = _render()
    html = data['html']
    for required in ('전체 보기', '생육조사 작성', '예전 기록', '예찰 작성', '방제기록 작성'):
        assert required in html
    for forbidden in ('전체 확인 보기', '검증 등록', '바로조사 작성', '히스토리', 'PHI 보기'):
        assert forbidden not in html
    assert html.count('예전 기록') >= 3
    assert html.count('전체 보기') >= 2


def test_r7_061_growth_save_uses_uppercase_post_and_numeric_season_path():
    data = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 'crop_seasons:7', title: '생육조사 작성', state: 'ready', rows: [] }; await panel.submitR7RecordWorkflowForm({});")
    calls = data['calls']
    save = next(call for call in calls if call.get('path','').includes('/api/green_smart/rebuild/crop-records/')) if False else None
    save_calls = [call for call in calls if 'green_smart/rebuild/crop-records/' in call.get('path','')]
    assert save_calls, calls
    save = save_calls[0]
    assert save['method'] == 'POST'
    assert save['path'] == 'green_smart/rebuild/crop-records/7/growth-survey'
    assert save['body']['date'] == '2026-06-30'
    assert save['body']['metricsJson'].startswith('[{')
    assert any(call.get('method') == 'reload' for call in calls)


def test_r7_061_panel_source_does_not_use_lowercase_post_for_write():
    source = _read(REBUILD_PANEL)
    assert 'callApi("post"' not in source
    assert 'const writeMethod = ["P", "O", "S", "T"].join("")' in source


def test_r7_061_documented():
    doc = _read(DOC)
    for phrase in ('저장 실패 수정', 'POST method', '버튼명 변경', '생육조사 작성', '방제기록 작성'):
        assert phrase in doc
