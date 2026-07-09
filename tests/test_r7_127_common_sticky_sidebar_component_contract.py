from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-127-common-sticky-sidebar-component.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_127_version_surfaces_are_1_14_86():
    assert '"version": "1.14.88"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.88"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.88"' in _read(REBUILD_PANEL)
    assert "v1.14.88" in _read(DOC)


def test_r7_127_sidebar_common_component_source_contract():
    source = _read(REBUILD_PANEL)
    assert "renderR7CommonSidebarComponent(" in source
    assert "renderR7SidebarNavItems(" in source
    assert "renderR7SidebarBrand(" in source
    assert "renderR7Sidebar() {" in source
    assert "return this.renderR7CommonSidebarComponent" in source
    for marker in (
        'data-r7-sidebar-component="common"',
        'data-r7-sidebar-component-version="r7-127"',
        'data-r7-sidebar-follow-scroll="sticky"',
        'data-r7-sidebar-shell-component="common-sidebar"',
    ):
        assert marker in source


def test_r7_127_sidebar_follow_scroll_policy_source_contract():
    source = _read(REBUILD_PANEL)
    helper_start = source.index("  _r7SidebarFixedViewportStyle() {")
    helper_end = source.index("  _r7SidebarVisualAttrs", helper_start)
    helper = source[helper_start:helper_end]
    for phrase in (
        "position:sticky",
        "top:0",
        "height:100vh",
        "max-height:100vh",
        "overflow-y:auto",
        "overscroll-behavior:contain",
    ):
        assert phrase in helper
    assert "position:fixed" not in helper


def test_r7_127_node_smoke_common_sidebar_variants_render_sticky():
    script = f"""
      const classSet = new Set();
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(){{}} }}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const cases = [
        ['operator', true],
        ['operator', false],
        ['farm_staff', true],
        ['farm_staff', false],
      ];
      for (const [role, collapsed] of cases) {{
        panel.hass = {{ user: {{ is_admin: role === 'operator', green_smart_role: role }}, callApi: async () => ({{ actorRole: role, zones: [] }}) }};
        panel._homeContext = {{ actorRole: role, zones: [] }};
        panel._activeR7Domain = 'settings-admin';
        panel._r7SidebarCollapsed = collapsed;
        panel.render();
        const html = panel.innerHTML;
        const required = [
          'data-r7-sidebar-component="common"',
          'data-r7-sidebar-component-version="r7-127"',
          'data-r7-sidebar-follow-scroll="sticky"',
          'data-r7-sidebar-fixed-viewport="true"',
          'data-r7-sidebar-height-policy="100vh-sticky"',
          'data-r7-sidebar-scroll-policy="internal-auto"',
          'data-r7-sidebar-position-policy="sticky-grid-safe"',
          'position:sticky',
          'top:0',
          'height:100vh',
          'max-height:100vh',
          'overflow-y:auto',
          'overscroll-behavior:contain',
          'data-r7-sidebar-shell-component="common-sidebar"'
        ];
        const missing = required.filter((item) => !html.includes(item));
        const aside = html.match(/<aside[\\s\\S]*?<\\/aside>/)?.[0] || '';
        const forbidden = ['position:fixed', 'data-r7-sidebar-height-policy="100vh-fixed"'].filter((item) => aside.includes(item));
        if (missing.length || forbidden.length) {{ console.error(JSON.stringify({{role, collapsed, missing, forbidden}})); process.exit(1); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_127_doc_records_common_component_and_boundaries():
    text = _read(DOC)
    for phrase in (
        "단일 공통 컴포넌트 렌더러",
        "화면을 위/아래로 스크롤해도",
        'data-r7-sidebar-component="common"',
        'data-r7-sidebar-follow-scroll="sticky"',
        "No API route change in R7-127",
        "No DB migration in R7-127",
    ):
        assert phrase in text
