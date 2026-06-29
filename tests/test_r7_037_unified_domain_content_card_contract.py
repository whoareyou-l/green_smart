from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-037-unified-domain-content-card.md"

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


def test_r7_037_version_surfaces_are_1_12_72():
    assert '"version": "1.12.77"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.77"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.77"' in _read(REBUILD_PANEL)
    assert "v1.12.77" in _read(DOC)


def test_r7_037_doc_records_unified_card_request_and_boundary():
    text = _read(DOC)
    for phrase in (
        "one unified content card",
        "domain sub-tabs",
        "selected zone / zone selector",
        "active sub-tab content",
        'data-r7-domain-frame-order="title-unified-card"',
        'data-r7-domain-content-card="tabs-zone-content"',
        'data-r7-domain-content-card-unified="true"',
        "No API route change in R7-037",
    ):
        assert phrase in text


def test_r7_037_source_defines_unified_domain_content_shell():
    text = _read(REBUILD_PANEL)
    for marker in (
        "renderR7UnifiedDomainContentCard",
        'data-r7-domain-frame-order="title-unified-card"',
        'data-r7-domain-content-card="tabs-zone-content"',
        'data-r7-domain-content-card-unified="true"',
        'data-r7-domain-content-card-domain="${domainKey}"',
        'data-r7-domain-content-card-section="subtabs"',
        'data-r7-domain-content-card-section="zone"',
        'data-r7-domain-content-card-section="panel"',
    ):
        assert marker in text


def test_r7_037_render_smoke_tabs_zone_panel_are_inside_one_card():
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
        const cardStart = frame.indexOf(`data-r7-domain-content-card-domain="${{domain}}"`);
        const card = cardStart >= 0 ? frame.slice(cardStart) : '';
        const hero = frame.indexOf('data-r7-domain-visual-hero');
        const cardIndex = frame.indexOf('data-r7-domain-content-card="tabs-zone-content"');
        const tabs = card.indexOf('data-r7-domain-subtabs');
        const zone = card.indexOf('data-r7-zone-context-bar');
        const subpanel = card.indexOf('data-r7-domain-subtab-panel');
        const required = [
          'data-r7-domain-frame-order="title-unified-card"',
          'data-r7-domain-content-card="tabs-zone-content"',
          'data-r7-domain-content-card-unified="true"',
          `data-r7-domain-content-card-domain="${{domain}}"`,
          'data-r7-domain-content-card-section="subtabs"',
          'data-r7-domain-content-card-section="zone"',
          'data-r7-domain-content-card-section="panel"',
          'data-r7-domain-top-env-metrics="removed"',
        ];
        const missing = required.filter((item)=>!frame.includes(item));
        const orderOk = hero >= 0 && cardIndex > hero && tabs >= 0 && zone > tabs && subpanel > zone;
        const separateSiblingOrder = frame.indexOf('data-r7-domain-subtabs') >= 0 && frame.indexOf('data-r7-domain-subtabs') < cardIndex;
        if (missing.length || !orderOk || separateSiblingOrder) {{
          console.error(JSON.stringify({{domain, missing, order: {{hero, cardIndex, tabs, zone, subpanel}}, separateSiblingOrder, frame: frame.slice(0, 2600)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true, domains: domains.length}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
