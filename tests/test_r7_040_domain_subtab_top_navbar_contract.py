from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-040-domain-subtab-top-navbar.md"

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


def test_r7_040_version_surfaces_are_1_12_75():
    assert '"version": "1.14.17"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.17"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.17"' in _read(REBUILD_PANEL)
    assert "v1.14.17" in _read(DOC)


def test_r7_040_doc_records_top_navbar_icon_title_contract():
    text = _read(DOC)
    for phrase in (
        "상단 네비게이션바",
        "ha-icon과 제목",
        'data-r7-domain-subtabs-visual-style="top-navbar"',
        'data-r7-domain-subtabs-old-style="pill-cluster"',
        'data-r7-domain-subtab-icon="ha-mdi"',
        "R7_DOMAIN_SUBTAB_ICONS",
        "No API route change in R7-040",
    ):
        assert phrase in text


def test_r7_040_source_defines_top_navbar_subtab_renderer():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7_DOMAIN_SUBTAB_ICONS",
        "_r7DomainSubtabIcon",
        'data-r7-domain-subtabs-visual-style="top-navbar"',
        'data-r7-domain-subtabs-old-style="pill-cluster"',
        'data-r7-domain-subtab-layout="nav-item"',
        'data-r7-domain-subtab-icon="ha-mdi"',
        "data-r7-domain-subtab-title",
        'ha-icon icon="mdi:',
    ):
        assert marker in text


def test_r7_040_render_smoke_all_shared_domains_have_top_navbar_subtabs_with_icons_and_titles():
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
      const domains = {json.dumps(DOMAINS)};
      const results = [];
      for (const domain of domains) {{
        panel._activeR7Domain = domain;
        panel.render();
        const html = panel.innerHTML;
        const navStart = html.indexOf(`data-r7-domain-subtabs-for="${{domain}}"`);
        const navOpen = navStart >= 0 ? html.lastIndexOf('<nav', navStart) : -1;
        const navClose = navOpen >= 0 ? html.indexOf('</nav>', navOpen) : -1;
        const nav = navOpen >= 0 && navClose >= 0 ? html.slice(navOpen, navClose + 6) : '';
        const buttons = [...nav.matchAll(/<button[\\s\\S]*?<\\/button>/g)].map((m) => m[0]);
        const missing = [];
        if (!nav.includes('data-r7-domain-subtabs-visual-style="top-navbar"')) missing.push('top-navbar-marker');
        if (!nav.includes('data-r7-domain-subtabs-old-style="pill-cluster"')) missing.push('old-style-evidence');
        if (!nav.includes('role="tablist"')) missing.push('tablist');
        if (!nav.includes('overflow-x:auto')) missing.push('horizontal-scroll');
        if (nav.includes('border-radius:999px')) missing.push('forbidden-pill-radius');
        if (nav.includes('flex-wrap:wrap;gap:8px')) missing.push('forbidden-button-cluster-wrap');
        if (!buttons.length) missing.push('buttons');
        for (const button of buttons) {{
          if (!button.includes('data-r7-domain-subtab-layout="nav-item"')) missing.push('nav-item-layout');
          if (!button.includes('data-r7-domain-subtab-icon="ha-mdi"')) missing.push('ha-icon-marker');
          if (!button.includes('<ha-icon icon="mdi:')) missing.push('ha-icon-element');
          if (!button.includes('data-r7-domain-subtab-title')) missing.push('title-marker');
          if (!button.includes('border-bottom:')) missing.push('active-underline-style');
        }}
        const order = [
          html.indexOf('data-r7-domain-content-card-section="subtabs"'),
          html.indexOf('data-r7-domain-content-card-section="zone"'),
          html.indexOf('data-r7-domain-content-card-section="panel"'),
        ];
        if (!(order[0] >= 0 && order[0] < order[1] && order[1] < order[2])) missing.push('unified-card-order');
        results.push({{ domain, buttonCount: buttons.length, missing }});
      }}
      const failed = results.filter((r) => r.missing.length);
      if (failed.length) {{ console.error(JSON.stringify(failed)); process.exit(1); }}
      console.log(JSON.stringify(results));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
