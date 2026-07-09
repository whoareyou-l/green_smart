from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_132_version_surfaces_are_1_14_92():
    assert '"version": "1.14.92"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.92"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.92"' in _read(REBUILD_PANEL)


def test_r7_132_source_has_adaptive_content_width_policy_markers():
    source = _read(REBUILD_PANEL)
    for marker in (
        "_r7ContentWidthMode",
        "_r7ContentWidthPolicyAttrs",
        "_r7ContentWidthVarsStyle",
        'data-r7-content-width-policy="adaptive-viewport-fill"',
        'data-r7-content-width-mode="${contentWidthMode}"',
        'data-r7-content-width-fills-viewport="true"',
        'data-r7-content-width-uses-dvw="true"',
        'data-r7-shell-grid-width-policy="sidebar-aware-fill"',
        'data-r7-page-shell-width="viewport"',
        'data-r7-page-workspace-width="viewport"',
        'data-r7-domain-page-width="viewport"',
        '--r7-content-viewport-width:100dvw',
        '--r7-content-main-width:100%',
        'grid-template-columns:${sidebarTrack} minmax(0,1fr)',
        'width:var(--r7-content-main-width)',
        'max-width:none',
    ):
        assert marker in source


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
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(){{}} }}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const cases = [
        {{ label: 'admin-ha-visible', user: {{ is_admin: true, green_smart_role: 'admin' }}, role: 'admin', mode: 'ha-sidebar-visible' }},
        {{ label: 'staff-ha-hidden', user: {{ is_admin: false, green_smart_role: 'farm_staff' }}, role: 'farm_staff', mode: 'ha-sidebar-hidden' }},
      ];
      for (const item of cases) {{
        classSet = new Set();
        const panel = new mod.GreenSmartRebuildPanel();
        panel.hass = {{ user: item.user, callApi: async () => ({{ actorRole: item.role, zones: [] }}) }};
        panel._homeContext = {{ actorRole: item.role, zones: [] }};
        panel.setR7ActiveDomain('safety-history');
        const html = panel.innerHTML;
        const required = [
          'data-r7-content-width-policy="adaptive-viewport-fill"',
          `data-r7-content-width-mode="${{item.mode}}"`,
          'data-r7-content-width-fills-viewport="true"',
          'data-r7-content-width-uses-dvw="true"',
          'data-r7-shell-grid-width-policy="sidebar-aware-fill"',
          'data-r7-page-shell-width="viewport"',
          'data-r7-page-workspace-width="viewport"',
          'data-r7-domain-page-width="viewport"',
          '--r7-content-viewport-width:100dvw',
          '--r7-content-main-width:100%',
          'width:var(--r7-content-main-width)',
          'grid-template-columns:minmax(0,1fr)',
          'max-width:none',
        ];
        const missing = required.filter((needle) => !html.includes(needle));
        if (missing.length) {{ console.error(JSON.stringify({{label:item.label, missing}})); process.exit(1); }}
        if (item.mode === 'ha-sidebar-hidden' && !classSet.has('green-smart-hide-ha-sidebar')) {{ console.error('hide class missing'); process.exit(2); }}
        if (item.mode === 'ha-sidebar-visible' && !classSet.has('green-smart-operator-ha-sidebar-adjacent')) {{ console.error('admin adjacent class missing'); process.exit(3); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
