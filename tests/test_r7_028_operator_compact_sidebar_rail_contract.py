from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-028-operator-compact-sidebar-rail-reference.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_028_version_surfaces_are_1_12_62():
    assert '"version": "1.14.22"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.22"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.22"' in _read(REBUILD_PANEL)
    assert "v1.14.22" in _read(DOC)


def test_r7_028_doc_records_reference_slim_operator_rail():
    text = _read(DOC)
    for phrase in (
        "[HA sidebar ~48px] [Green Smart compact rail ~68px] [content]",
        'data-r7-sidebar-rail-style="reference-slim-operator"',
        'data-r7-sidebar-compact-rail="true"',
        'data-r7-sidebar-rail-width="64"',
        "data-r7-sidebar-logo-tile",
        "data-r7-sidebar-nav-icon-button",
        'data-r7-sidebar-active-icon-tile="true"',
        "data-r7-sidebar-utility-group",
        'data-r7-sidebar-utility="settings"',
        'data-r7-sidebar-utility="exit"',
        "operator compact = HA sidebar kept + Green Smart slim icon rail",
        "No API route change in R7-028",
    ):
        assert phrase in text


def test_r7_028_source_contains_reference_slim_rail_markers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "renderR7SidebarUtilityGroup",
        "_isR7ReferenceSlimRail",
        'data-r7-sidebar-rail-style="reference-slim-operator"',
        'data-r7-sidebar-compact-rail="true"',
        'data-r7-sidebar-rail-width="64"',
        "data-r7-sidebar-logo-tile",
        "data-r7-sidebar-nav-list",
        "data-r7-sidebar-nav-icon-button",
        'data-r7-sidebar-active-icon-tile="true"',
        "data-r7-sidebar-utility-group",
        'data-r7-sidebar-utility="settings"',
        'data-r7-sidebar-utility="exit"',
    ):
        assert marker in text


def test_r7_028_node_smoke_operator_compact_matches_reference_rail():
    script = f"""
      const classSet = new Set();
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
      panel.hass = {{ user: {{ is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      panel._r7SidebarCollapsed = true;
      panel.setR7ActiveDomain('crop-operations');
      const html = panel.innerHTML;
      const required = [
        'data-r7-sidebar-layout-mode="operator-ha-adjacent"',
        'data-r7-ha-sidebar-policy="keep"',
        'data-r7-sidebar-rail-style="reference-slim-operator"',
        'data-r7-sidebar-compact-rail="true"',
        'data-r7-sidebar-rail-width="64"',
        'data-r7-sidebar-visual-style="ha-like"',
        'data-r7-sidebar-surface="vertical-rail"',
        'data-r7-sidebar-active-indicator="left-bar"',
        'data-r7-sidebar-logo-tile',
        'data-r7-sidebar-nav-list',
        'data-r7-sidebar-nav-icon-button',
        'data-r7-sidebar-active-icon-tile="true"',
        'data-r7-sidebar-ha-icon="crop-operations"',
        'ha-icon icon="mdi:sprout"',
        'data-r7-sidebar-utility-group',
        'data-r7-sidebar-utility-domain="settings-admin"',
        'data-r7-sidebar-utility-position="second-from-bottom"',
        'data-r7-sidebar-utility="exit"'
      ];
      const missing = required.filter((item) => !html.includes(item));
      const forbidden = ['data-r7-sidebar-summary', '>Green Smart<', '작물·구역·경보 중심'];
      const bad = forbidden.filter((item) => html.includes(item));
      const styleOk = html.includes('width:64px') && html.includes('border-radius:0') && html.includes('box-shadow:none') && html.includes('border-right:1px solid #e1e5ea') && html.includes('background:#ffffff');
      if (missing.length || bad.length || !styleOk || !classSet.has('green-smart-operator-ha-sidebar-adjacent') || classSet.has('green-smart-hide-ha-sidebar')) {{
        console.error(JSON.stringify({{missing, bad, styleOk, classes:[...classSet]}}));
        process.exit(1);
      }}
      console.log(JSON.stringify({{ok:true, len:html.length}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
