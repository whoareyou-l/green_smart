from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-036-domain-header-card-order-cleanup.md"

DOMAINS = [
    "crop-operations",
    "environment-control",
    "irrigation-fertigation",
    "device-control",
    "recommendation-automation",
    "safety-history",
    "settings-admin",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_036_version_surfaces_are_1_12_71():
    assert '"version": "1.14.98"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.98"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.98"' in _read(REBUILD_PANEL)
    assert "v1.14.98" in _read(DOC)


def test_r7_036_doc_records_requested_domain_order_and_removed_metric_grid():
    text = _read(DOC)
    for phrase in (
        "title / hero card",
        "domain sub-tabs",
        "selected zone / zone selector",
        "active sub-tab content card",
        'data-r7-domain-frame-order="title-subtabs-zone-content"',
        'data-r7-domain-top-env-metrics="removed"',
        "No API route change in R7-036",
    ):
        assert phrase in text


def test_r7_036_source_removes_top_env_metric_summary_grid_and_marks_new_order():
    text = _read(REBUILD_PANEL)
    assert 'data-r7-domain-previous-frame-order="title-subtabs-zone-content"' in text
    assert 'data-r7-domain-frame-order="title-unified-card"' in text
    assert 'data-r7-domain-top-env-metrics="removed"' in text
    assert "renderR7DomainTopEnvMetrics" not in text
    forbidden = 'data-r7-domain-visual-summary-grid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;">${this.renderR7MetricCard("온도", "24.1℃", "23~25℃", "+0.4℃", "정상")}${this.renderR7MetricCard("습도", "82%", "70~78%", "+4%", "주의")}${this.renderR7MetricCard("VPD", "0.72 kPa", "0.8~1.2", "-0.08", "주의")}${this.renderR7MetricCard("CO₂", "720 ppm", "600~900", "0", "정상")}</section>'
    assert forbidden not in text


def test_r7_036_render_smoke_domain_order_and_no_top_metric_grid():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      panel._r7SidebarCollapsed = false;
      const domains = {DOMAINS!r};
      for (const domain of domains) {{
        panel._activeR7Domain = domain;
        panel.render();
        const html = panel.innerHTML;
        const frameStart = html.indexOf(`data-r7-domain-visual-frame-domain="${{domain}}"`);
        const nextPage = frameStart >= 0 ? html.indexOf('data-r7-domain-page="', frameStart + 1) : -1;
        const frame = frameStart >= 0 ? html.slice(frameStart, nextPage > frameStart ? nextPage : undefined) : '';
        const required = [
          'data-r7-domain-frame-order="title-unified-card"',
          'data-r7-domain-previous-frame-order="title-subtabs-zone-content"',
          'data-r7-domain-top-env-metrics="removed"',
          'data-r7-domain-visual-hero',
          'data-r7-domain-content-card="tabs-zone-content"',
          'data-r7-domain-subtabs',
          'data-r7-zone-context-bar',
          'data-r7-domain-subtab-panel',
        ];
        const missing = required.filter((item)=>!frame.includes(item));
        const hero = frame.indexOf('data-r7-domain-visual-hero');
        const card = frame.indexOf('data-r7-domain-content-card="tabs-zone-content"');
        const tabs = frame.indexOf('data-r7-domain-subtabs');
        const zone = frame.indexOf('data-r7-zone-context-bar');
        const panelIndex = frame.indexOf('data-r7-domain-subtab-panel');
        const orderOk = hero >= 0 && card > hero && tabs > card && zone > tabs && panelIndex > zone;
        const beforeTabs = tabs >= 0 ? frame.slice(hero, tabs) : frame;
        const forbiddenTopGrid = beforeTabs.includes('data-r7-domain-visual-summary-grid') || beforeTabs.includes('24.1℃') || beforeTabs.includes('0.72 kPa') || beforeTabs.includes('720 ppm');
        if (missing.length || !orderOk || forbiddenTopGrid) {{
          console.error(JSON.stringify({{domain, missing, order: {{hero, tabs, zone, panelIndex}}, forbiddenTopGrid, frame: frame.slice(0, 2400)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true, domains: domains.length}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
