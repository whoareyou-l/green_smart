from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"

OLD_RECORD_MARKERS = [
    'data-r7-crop-product-direct-cards="records-workflow"',
    'data-r7-crop-record-card-kind="today-work"',
    'data-r7-crop-record-card-kind="growth-survey"',
    'data-r7-crop-record-card-kind="pest-scouting"',
    'data-r7-crop-record-card-kind="control-treatment"',
    'data-r7-crop-record-card-kind="missing-attention"',
    'data-r7-crop-record-card-kind="record-source"',
    'data-r7-crop-record-workflow-vertical-slice="true"',
    'data-r7-crop-record-workflow-layout="priority-records-source"',
]


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


def test_r7_050_old_record_wrappers_remain_deleted_and_r7_053_dashboard_is_current():
    html = _render_records_workflow_html()
    assert 'data-r7-records-image-dashboard="true"' in html
    assert 'data-r7-record-image-grid="primary"' in html
    for old in OLD_RECORD_MARKERS + [
        'data-r7-record-section="today-work"',
        'data-r7-record-section="record-source"',
        'data-r7-record-source-detail="admin"',
        'data-r7-record-flow-skeleton="write-history-pls"',
    ]:
        assert old not in html
