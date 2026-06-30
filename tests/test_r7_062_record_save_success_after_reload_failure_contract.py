from pathlib import Path
import subprocess, json

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
CROP_REPO = ROOT / "custom_components/green_smart/repositories/crop_repo.py"


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
      panel._homeContext = {{ actorRole: 'operator', zones: [{{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 7, crop_type: 'lettuce' }}, currentCropAssignment: {{ sourceRowId: 'crop_seasons:7' }} }}] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      {extra}
      console.log(JSON.stringify({{ state: panel._r7RecordModal, calls }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)


def test_r7_062_save_success_is_not_converted_to_error_when_context_reload_fails():
    data = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: '7', title: '생육조사 작성', state: 'ready', rows: [] }; panel._loadHomeContext = async () => { throw new Error('context-decimal-500'); }; await panel.submitR7RecordWorkflowForm({});")
    assert data['state']['state'] == 'saved'
    assert data['state']['saved']['ok'] is True
    assert data['state'].get('reloadError') == 'context-decimal-500'


def test_r7_062_crop_repo_normalizes_decimal_values_before_json_response():
    source = _read(CROP_REPO)
    assert 'from decimal import Decimal' in source
    assert 'def _json_safe_value' in source
    assert 'def _json_safe_rows' in source
    assert '_json_safe_rows(await fetchall(hass, """' in source
    assert 'Decimal' in source


def test_r7_062_panel_source_separates_save_failure_from_reload_failure():
    source = _read(REBUILD_PANEL)
    assert 'reloadError' in source
    assert 'contextReloadError' in source
    assert 'catch (reloadError)' in source
