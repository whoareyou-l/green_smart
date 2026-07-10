from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_132_version_surfaces_are_1_15_00():
    assert '"version": "1.15.07"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.07"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.07"' in _read(REBUILD_PANEL)


def test_r7_132_source_has_adaptive_content_width_policy_markers():
    source = _read(REBUILD_PANEL)
    for marker in (
        "_r7ContentWidthMode",
        "_r7ContentWidthPolicyAttrs",
        "_r7RootWidthVarsStyle",
        "_r7ContentColumnWidthVarsStyle",
        "_applyR7HostWidthPolicy",
        'data-r7-host-width-policy',
        "viewport-fill",
        "block-fill",
        'data-r7-root-width-policy="ha-sidebar-aware-shell"',
        'data-r7-root-width-mode="${contentWidthMode}"',
        'contentWidthMode === "ha-sidebar-visible" ? "100%" : "100dvw"',
        'data-r7-content-width-policy="grid-contained-fill"',
        'data-r7-content-width-mode="${contentWidthMode}"',
        'data-r7-content-width-fills-viewport="true"',
        'data-r7-content-width-contained="true"',
        'data-r7-content-width-uses-dvw="false"',
        'data-r7-shell-grid-width-policy="sidebar-aware-fill"',
        'data-r7-page-shell-width="viewport"',
        'data-r7-page-workspace-width="viewport"',
        'data-r7-domain-page-width="viewport"',
        '--r7-root-viewport-width:${rootWidth}',
        'width:var(--r7-root-viewport-width)',
        'max-width:${rootWidth}',
        '--r7-content-viewport-width:100%',
        '--r7-content-main-width:${mainWidth}',
        'grid-template-columns:${sidebarTrack} minmax(0,1fr)',
        'width:var(--r7-content-main-width)',
        'max-width:100%',
        'overflow-x:clip',
    ):
        assert marker in source
    for bad in (
        'contentWidthMode === "ha-sidebar-hidden" ? "100dvw" : "100%"',
        '--r7-content-main-width:100dvw',
        'data-r7-content-width-uses-dvw="true"',
        'const contentWidthAttrs = this._r7ContentWidthPolicyAttrs(contentWidthMode), contentWidthStyle = this._r7ContentWidthVarsStyle();',
    ):
        assert bad not in source


def test_r7_132_node_smoke_content_width_adapts_for_ha_sidebar_modes():
    script = f"""
      let classSet = new Set();
      globalThis.MutationObserver = class {{ constructor(fn){{ this.fn = fn; }} observe(){{}} }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }}, toggle(c, enabled){{ if (enabled) classSet.add(c); else classSet.delete(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(tag){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }},
        querySelectorAll(sel){{ return []; }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(k,v){{ this[k]=v; }} }}; this._listeners = {{}}; this._attrs = {{}}; }} setAttribute(k,v){{ this._attrs[k]=String(v); }} getAttribute(k){{ return this._attrs[k]; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const cases = [
        {{ label: 'admin-ha-visible', user: {{ is_admin: true, green_smart_role: 'admin' }}, role: 'admin', mode: 'ha-sidebar-visible', rootWidth: '100%' }},
        {{ label: 'staff-ha-hidden', user: {{ is_admin: false, green_smart_role: 'farm_staff' }}, role: 'farm_staff', mode: 'ha-sidebar-hidden', rootWidth: '100dvw' }},
      ];
      for (const item of cases) {{
        classSet = new Set();
        const panel = new mod.GreenSmartRebuildPanel();
        panel.hass = {{ user: item.user, callApi: async () => ({{ actorRole: item.role, zones: [] }}) }};
        panel._homeContext = {{ actorRole: item.role, zones: [] }};
        panel.setR7ActiveDomain('safety-history');
        const html = panel.innerHTML;
        const required = [
          'data-r7-root-width-policy="ha-sidebar-aware-shell"',
          `data-r7-root-width-mode="${{item.mode}}"`,
          'data-r7-content-width-policy="grid-contained-fill"',
          `data-r7-content-width-mode="${{item.mode}}"`,
          'data-r7-content-width-fills-viewport="true"',
          'data-r7-content-width-contained="true"',
          'data-r7-content-width-uses-dvw="false"',
          'data-r7-shell-grid-width-policy="sidebar-aware-fill"',
          'data-r7-page-shell-width="viewport"',
          'data-r7-page-workspace-width="viewport"',
          'data-r7-domain-page-width="viewport"',
          `--r7-root-viewport-width:${{item.rootWidth}}`,
          'width:var(--r7-root-viewport-width)',
          `max-width:${{item.rootWidth}}`,
          '--r7-content-viewport-width:100%',
          '--r7-content-main-width:100%',
          'width:var(--r7-content-main-width)',
          'grid-template-columns:minmax(0,1fr)',
          'max-width:100%',
          'overflow-x:clip',
        ];
        const missing = required.filter((needle) => !html.includes(needle));
        if (missing.length) {{ console.error(JSON.stringify({{label:item.label, missing}})); process.exit(1); }}
        const bad = ['--r7-content-main-width:100dvw', 'data-r7-content-width-uses-dvw="true"'].filter((needle) => html.includes(needle));
        if (bad.length) {{ console.error(JSON.stringify({{label:item.label, bad}})); process.exit(7); }}
        const mainStart = html.indexOf('data-rebuild-shell-main');
        const mainEnd = html.indexOf('data-r7-page-shell', mainStart);
        const shellMain = html.slice(mainStart, mainEnd);
        if (shellMain.includes('100dvw') || shellMain.includes('r7-root-viewport-width')) {{ console.error(JSON.stringify({{label:item.label, shellMain}})); process.exit(8); }}
        if (!shellMain.includes('--r7-content-main-width:100%') || !shellMain.includes('max-width:100%')) {{ console.error(JSON.stringify({{label:item.label, shellMainMissing:true}})); process.exit(9); }}
        if (panel.getAttribute('data-r7-host-width-policy') !== 'viewport-fill') {{ console.error('host width attr missing'); process.exit(4); }}
        if (panel.getAttribute('data-r7-host-display') !== 'block-fill') {{ console.error('host display attr missing'); process.exit(5); }}
        if (panel.style.display !== 'block' || panel.style.width !== '100%' || panel.style.maxWidth !== '100%') {{ console.error(JSON.stringify({{hostStyle: panel.style}})); process.exit(6); }}
        if (item.mode === 'ha-sidebar-hidden' && !classSet.has('green-smart-hide-ha-sidebar')) {{ console.error('hide class missing'); process.exit(2); }}
        if (item.mode === 'ha-sidebar-visible' && !classSet.has('green-smart-operator-ha-sidebar-adjacent')) {{ console.error('admin adjacent class missing'); process.exit(3); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
