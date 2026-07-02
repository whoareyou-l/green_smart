from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-030-sticky-full-height-sidebar-repair.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_030_version_surfaces_are_1_12_64():
    assert '"version": "1.14.25"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.25"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.25"' in _read(REBUILD_PANEL)
    assert "v1.14.25" in _read(DOC)


def test_r7_030_doc_records_fixed_left_root_cause_and_sticky_fix():
    text = _read(DOC)
    for phrase in (
        "position:fixed; left:0",
        "grid layout에서 빼내 viewport 왼쪽에 강제로 붙인다",
        "position:sticky",
        "height:100vh",
        "max-height:100vh",
        "overflow-y:auto",
        'data-r7-sidebar-height-policy="100vh-sticky"',
        'data-r7-sidebar-position-policy="sticky-grid-safe"',
        "No API route change in R7-030",
    ):
        assert phrase in text


def test_r7_030_source_uses_sticky_grid_safe_policy_not_fixed_left():
    text = _read(REBUILD_PANEL)
    assert 'data-r7-sidebar-height-policy="100vh-sticky"' in text
    assert 'data-r7-sidebar-position-policy="sticky-grid-safe"' in text
    assert "position:sticky" in text
    assert "height:100vh" in text
    assert "max-height:100vh" in text
    assert "overflow-y:auto" in text
    helper_start = text.index("  _r7SidebarFixedViewportStyle() {")
    helper_end = text.index("  renderR7SidebarUtilityGroup", helper_start)
    helper = text[helper_start:helper_end]
    assert "position:fixed" not in helper
    assert 'data-r7-sidebar-height-policy="100vh-fixed"' not in text


def test_r7_030_node_smoke_sidebar_modes_stay_in_grid_with_sticky_100vh():
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
        const aside = html.match(/<aside[\\s\\S]*?<\\/aside>/)?.[0] || '';
        const forbidden = ['position:fixed', 'data-r7-sidebar-height-policy="100vh-fixed"'].filter((item) => aside.includes(item));
        if (missing.length || forbidden.length) {{ console.error(JSON.stringify({{label, missing, forbidden}})); process.exit(1); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
