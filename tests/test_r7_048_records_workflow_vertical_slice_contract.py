from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _render_records_workflow_html() -> str:
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow'); panel._activeR7Domain = 'crop-operations'; panel.render();
      console.log(panel.innerHTML);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def test_r7_048_records_workflow_vertical_slice_is_superseded_by_image_dashboard():
    html = _render_records_workflow_html()
    for required in [
        'data-r7-records-image-dashboard="true"',
        '오늘 할 일',
        '누락·검증 필요',
        '생육조사',
        '병해충 예찰',
        '방제 기록',
        'data-r7-record-row="top-actions"',
        'data-r7-record-row="core-records"',
        'data-r7-record-row="recent-records"',
        '최근 기록',
        'AI 근거 연결',
    ]:
        assert required in html
    for old in [
        'data-r7-records-workflow-product-layout="write-history-review"',
        'data-r7-crop-record-workflow-vertical-slice="true"',
        'data-r7-crop-record-card-kind="today-work"',
        'recordSummarySource=',
        'readOnly=',
        'writeEnabled=',
    ]:
        assert old not in html
