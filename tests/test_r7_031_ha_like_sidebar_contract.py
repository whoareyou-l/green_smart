from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-031-ha-like-sidebar.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_031_version_surfaces_are_1_12_65():
    assert '"version": "1.15.39"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.39"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.39"' in _read(REBUILD_PANEL)
    assert "v1.15.39" in _read(DOC)


def test_r7_031_doc_defines_ha_like_sidebar_contract():
    text = _read(DOC)
    for phrase in (
        "Home Assistant-like sidebar",
        "straight vertical panel, not floating rounded card",
        "compact icon-only width around 64px",
        "expanded width around 256px",
        "selected item uses a left accent bar",
        'data-r7-sidebar-visual-style="ha-like"',
        'data-r7-sidebar-surface="vertical-rail"',
        'data-r7-sidebar-active-indicator="left-bar"',
        "border-right:1px solid #e1e5ea",
        "border-radius:0",
        "box-shadow:none",
        "No API route change in R7-031",
    ):
        assert phrase in text


def test_r7_031_source_has_ha_like_sidebar_helpers_and_attrs():
    text = _read(REBUILD_PANEL)
    for marker in (
        "_r7SidebarVisualAttrs",
        "_r7SidebarBaseStyle",
        "_r7SidebarNavItemStyle",
        'data-r7-sidebar-visual-style="ha-like"',
        'data-r7-sidebar-surface="vertical-rail"',
        'data-r7-sidebar-compact-width="64"',
        'data-r7-sidebar-expanded-width="256"',
        'data-r7-sidebar-active-indicator="left-bar"',
        "border-right:1px solid #e1e5ea",
        "border-radius:0",
        "box-shadow:none",
    ):
        assert marker in text


def test_r7_031_node_smoke_sidebar_modes_render_ha_like_grid_safe_rail():
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
      const cases = [
        ['operator', true, '64px', 'operator compact'],
        ['operator', false, '256px', 'operator expanded'],
        ['farm_staff', true, '64px', 'staff compact'],
        ['farm_staff', false, '256px', 'staff expanded'],
      ];
      for (const [role, collapsed, width, label] of cases) {{
        panel.hass = {{ user: {{ is_admin: role === 'operator', green_smart_role: role }}, callApi: async () => ({{ actorRole: role, zones: [] }}) }};
        panel._homeContext = {{ actorRole: role, zones: [] }};
        panel._r7SidebarCollapsed = collapsed;
        panel.render();
        const html = panel.innerHTML;
        const aside = html.match(/<aside[\\s\\S]*?<\\/aside>/)?.[0] || '';
        const required = [
          'data-r7-sidebar-visual-style="ha-like"',
          'data-r7-sidebar-surface="vertical-rail"',
          'data-r7-sidebar-active-indicator="left-bar"',
          'data-r7-sidebar-position-policy="sticky-grid-safe"',
          'data-r7-sidebar-height-policy="100vh-sticky"',
          `width:${{width}}`,
          'border-right:1px solid #e1e5ea',
          'border-radius:0',
          'box-shadow:none',
          'background:#ffffff',
          'height:100vh',
          'max-height:100vh',
          'position:sticky',
          'top:0',
          'overflow-y:auto'
        ];
        const missing = required.filter((item) => !aside.includes(item));
        const forbidden = ['position:fixed', 'border-radius:22px', 'box-shadow:8px 0 24px'].filter((item) => aside.includes(item));
        if (missing.length || forbidden.length) {{ console.error(JSON.stringify({{label, missing, forbidden, aside: aside.slice(0, 500)}})); process.exit(1); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
