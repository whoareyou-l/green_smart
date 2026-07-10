from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-029-fixed-full-height-sidebar.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_029_version_surfaces_are_1_12_63():
    assert '"version": "1.15.09"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.09"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.09"' in _read(REBUILD_PANEL)
    assert "v1.15.09" in _read(DOC)


def test_r7_029_doc_records_fixed_full_height_policy():
    text = _read(DOC)
    for phrase in (
        "height:100vh",
        "max-height:100vh",
        "position:fixed",
        "top:0",
        "bottom:0",
        "overflow-y:auto",
        'data-r7-sidebar-fixed-viewport="true"',
        'data-r7-sidebar-height-policy="100vh-fixed"',
        'data-r7-sidebar-scroll-policy="internal-auto"',
        "operator compact reference rail",
        "operator detailed sidebar",
        "non-operator compact sidebar",
        "non-operator detailed sidebar",
        "No API route change in R7-029",
    ):
        assert phrase in text


def test_r7_029_source_has_fixed_viewport_sidebar_policy_for_all_render_paths():
    text = _read(REBUILD_PANEL)
    for marker in (
        "_r7SidebarFixedViewportAttrs",
        "_r7SidebarFixedViewportStyle",
        'data-r7-sidebar-fixed-viewport="true"',
        'data-r7-sidebar-height-policy="100vh-sticky"',
        'data-r7-sidebar-scroll-policy="internal-auto"',
        'data-r7-sidebar-position-policy="sticky-grid-safe"',
        "height:100vh",
        "max-height:100vh",
        "position:sticky",
        "top:0",
        "overflow-y:auto",
    ):
        assert marker in text


def test_r7_029_node_smoke_all_sidebar_modes_are_fixed_full_height():
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
        ['operator', true, 'operator compact'],
        ['operator', false, 'operator detailed'],
        ['farm_staff', true, 'staff compact'],
        ['farm_staff', false, 'staff detailed'],
      ];
      for (const [role, collapsed, label] of cases) {{
        panel.hass = {{ user: {{ is_admin: role === 'operator', green_smart_role: role }}, callApi: async () => ({{ actorRole: role, zones: [] }}) }};
        panel._homeContext = {{ actorRole: role, zones: [] }};
        panel._r7SidebarCollapsed = collapsed;
        panel.render();
        const html = panel.innerHTML;
        const required = [
          'data-r7-sidebar-fixed-viewport="true"',
          'data-r7-sidebar-height-policy="100vh-sticky"',
          'data-r7-sidebar-scroll-policy="internal-auto"',
          'data-r7-sidebar-position-policy="sticky-grid-safe"',
          'height:100vh',
          'max-height:100vh',
          'position:sticky',
          'top:0',
          'overflow-y:auto'
        ];
        const missing = required.filter((item) => !html.includes(item));
        if (missing.length) {{ console.error(JSON.stringify({{label, missing}})); process.exit(1); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
