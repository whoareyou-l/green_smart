from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-041-ui-qa-baseline.md"

DOMAINS = [
    "crop-operations",
    "environment-control",
    "irrigation-fertigation",
    "device-control",
    "recommendation-automation",
    "safety-history",
    "settings-admin",
]

ALL_PAGES = ["operations-home", *DOMAINS]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_041_version_surfaces_are_1_12_76():
    assert '"version": "1.15.34"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.34"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.34"' in _read(REBUILD_PANEL)
    assert "v1.15.34" in _read(DOC)


def test_r7_041_doc_records_qa_scope_and_boundary():
    text = _read(DOC)
    for token in [
        "R7-041 End-to-End UI QA Baseline",
        "actual HA URL: http://127.0.0.1:8123/",
        "served rebuild panel JS version: 1.15.34",
        "no old pill-cluster subtab style is rendered",
        "no old emoji sidebar icons are rendered",
        "No API route" if False else "new API route",
        "physical device hookup",
    ]:
        assert token in text
    for page in ALL_PAGES:
        assert page in text


def test_r7_041_render_smoke_all_pages_have_sidebar_and_content_baseline():
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
      const pages = {json.dumps(ALL_PAGES)};
      const domains = {json.dumps(DOMAINS)};
      const results = [];
      for (const page of pages) {{
        panel._activeR7Domain = page;
        panel.render();
        const html = panel.innerHTML;
        const asideStart = html.indexOf('<aside');
        const asideEnd = asideStart >= 0 ? html.indexOf('</aside>', asideStart) : -1;
        const aside = asideStart >= 0 && asideEnd >= 0 ? html.slice(asideStart, asideEnd + 8) : '';
        const missing = [];
        if (!html.includes('data-r7-app-shell')) missing.push('app-shell');
        if (!aside.includes('data-r7-sidebar-visual-style="ha-like"')) missing.push('ha-like-sidebar');
        if (!aside.includes('data-r7-sidebar-icon-style="ha-mdi"')) missing.push('ha-mdi-sidebar');
        if (!aside.includes('data-r7-sidebar-position-policy="sticky-grid-safe"')) missing.push('sticky-sidebar');
        if (aside.includes('position:fixed')) missing.push('fixed-sidebar');
        if (/[🏠🌱🌡️💧⚙️🤖🛡️🧩]/u.test(aside)) missing.push('emoji-sidebar-icon');
        if (!html.includes(`data-r7-sidebar-target="${{page}}"`) && page !== 'settings-admin') missing.push('sidebar-target');
        if (page === 'settings-admin' && !html.includes('data-r7-sidebar-utility-domain="settings-admin"')) missing.push('settings-utility');
        if (domains.includes(page)) {{
          const order = [
            html.indexOf('data-r7-domain-visual-hero'),
            html.indexOf('data-r7-domain-content-card="tabs-zone-content"'),
            html.indexOf('data-r7-domain-content-card-section="subtabs"'),
            html.indexOf('data-r7-domain-content-card-section="zone"'),
            html.indexOf('data-r7-domain-content-card-section="panel"'),
          ];
          if (!(order[0] >= 0 && order[0] < order[1] && order[1] < order[2] && order[2] < order[3] && order[3] < order[4])) missing.push('domain-order');
          const navStart = html.indexOf(`data-r7-domain-subtabs-for="${{page}}"`);
          const navOpen = navStart >= 0 ? html.lastIndexOf('<nav', navStart) : -1;
          const navClose = navOpen >= 0 ? html.indexOf('</nav>', navOpen) : -1;
          const nav = navOpen >= 0 && navClose >= 0 ? html.slice(navOpen, navClose + 6) : '';
          const buttons = [...nav.matchAll(/<button[\\s\\S]*?<\\/button>/g)].map((m) => m[0]);
          if (!nav.includes('data-r7-domain-subtabs-visual-style="top-navbar"')) missing.push('top-navbar');
          if (nav.includes('border-radius:999px') || nav.includes('flex-wrap:wrap;gap:8px')) missing.push('old-pill-subtabs');
          if (!buttons.length) missing.push('subtab-buttons');
          if (!buttons.every((button) => button.includes('<ha-icon icon="mdi:'))) missing.push('subtab-ha-icons');
          if (!buttons.every((button) => button.includes('data-r7-domain-subtab-title'))) missing.push('subtab-title');
          if (!html.includes('data-r7-zone-context-bar')) missing.push('zone-context');
          if (!html.includes('data-r7-domain-subtab-panel')) missing.push('subtab-panel');
        }} else {{
          if (!html.includes('data-r7-operations-dashboard-rewrite="true"')) missing.push('operations-dashboard');
        }}
        results.push({{ page, missing }});
      }}
      const failed = results.filter((r) => r.missing.length);
      if (failed.length) {{ console.error(JSON.stringify(failed)); process.exit(1); }}
      console.log(JSON.stringify(results));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_041_browser_qa_markers_exist_in_source_for_prod_smoke():
    text = _read(REBUILD_PANEL)
    for marker in [
        "data-r7-app-shell",
        "data-r7-ha-adjacent-layout",
        "data-r7-sidebar-visual-style",
        "data-r7-sidebar-icon-style=\"ha-mdi\"",
        "data-r7-domain-content-card=\"tabs-zone-content\"",
        "data-r7-domain-subtabs-visual-style=\"top-navbar\"",
        "data-r7-zone-context-bar",
        "data-r7-domain-subtab-panel",
        "data-r7-operations-dashboard-rewrite=\"true\"",
    ]:
        assert marker in text
