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


def test_r7_049_product_layout_is_superseded_by_image_dashboard_cards():
    source = REBUILD_PANEL.read_text(encoding="utf-8")
    assert "renderR7RecordsWorkflowProductLayout(" in source
    html = _render_records_workflow_html()
    for required in [
        'data-r7-records-image-dashboard="true"',
        'data-r7-record-image-card="today-work"',
        'data-r7-record-image-card="missing-verification"',
        'data-r7-record-image-card="growth-survey"',
        'data-r7-record-image-card="pest-scouting"',
        'data-r7-record-image-card="control-treatment"',
        'data-r7-record-row="top-actions"',
        'data-r7-record-row="core-records"',
        'data-r7-record-row="recent-records"',
        'data-r7-record-recent-log-panel',
        'data-r7-record-ai-card',
    ]:
        assert required in html
    for old in [
        'data-r7-records-workflow-product-layout="write-history-review"',
        'data-r7-record-action-queue',
        'data-r7-record-section="growth-survey"',
        'data-r7-record-source-detail="admin"',
        '기록 원천',
        '관리자 상세',
    ]:
        assert old not in html
