from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_131_version_surfaces_are_1_14_90():
    assert '"version": "1.15.16"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.16"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.16"' in _read(REBUILD_PANEL)


def test_r7_131_source_never_display_none_app_shell_drawers():
    source = _read(REBUILD_PANEL)
    assert 'return "ha-sidebar,hui-sidebar";' in source
    assert 'return "ha-sidebar,hui-sidebar,app-drawer,ha-drawer";' not in source
    style_start = source.index('style.textContent = `')
    style_end = source.index('`;', style_start)
    policy_css = source[style_start:style_end]
    assert 'body.green-smart-hide-ha-sidebar ha-sidebar' in policy_css
    assert 'body.green-smart-hide-ha-sidebar hui-sidebar { display:none !important;' in policy_css
    assert 'body.green-smart-hide-ha-sidebar app-drawer,\n          body.green-smart-hide-ha-sidebar ha-drawer { --mdc-drawer-width:0px; --sidebar-width:0px; --app-drawer-width:0px; width:0 !important; min-width:0 !important; max-width:0 !important; flex:0 0 0px !important; margin:0 !important; padding:0 !important; border:0 !important; }' in policy_css
    assert 'body.green-smart-hide-ha-sidebar app-drawer,\n          body.green-smart-hide-ha-sidebar ha-drawer { display:none' not in policy_css
    assert 'data-r7-ha-sidebar-blank-space-collapsed' in source
    assert 'data-green-smart-ha-sidebar-space-collapsed' in source


def test_r7_131_node_smoke_non_admin_keeps_green_smart_content_visible():
    script = f"""
      let classSet = new Set();
      const shellNodes = [];
      function node(tag) {{
        const attrs = new Map();
        return {{
          tagName: tag.toUpperCase(), style: {{
            values: {{}}, setProperty(k,v,p){{ this.values[k] = [v,p]; }}, removeProperty(k){{ delete this.values[k]; }}
          }},
          setAttribute(k,v){{ attrs.set(k,v); }}, removeAttribute(k){{ attrs.delete(k); }}, getAttribute(k){{ return attrs.get(k); }},
          querySelectorAll(sel){{ return []; }}
        }};
      }}
      const haSidebar = node('ha-sidebar');
      const huiSidebar = node('hui-sidebar');
      const appDrawer = node('app-drawer');
      const haDrawer = node('ha-drawer');
      shellNodes.push(haSidebar, huiSidebar, appDrawer, haDrawer);
      globalThis.MutationObserver = class {{ constructor(fn){{ this.fn = fn; }} observe(){{}} }};
      globalThis.document = {{
        body: {{ classList: {{
          add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }}, toggle(c, enabled){{ if (enabled) classSet.add(c); else classSet.delete(c); }}
        }} }},
        getElementById(){{ return null; }},
        createElement(tag){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }},
        querySelectorAll(sel){{
          if (sel === 'ha-sidebar,hui-sidebar') return [haSidebar, huiSidebar];
          if (sel === 'app-drawer,ha-drawer') return [appDrawer, haDrawer];
          if (sel === '*') return [];
          return [];
        }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(){{}} }}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ is_admin: false, green_smart_role: 'farm_staff' }}, callApi: async () => ({{ actorRole: 'farm_staff', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'farm_staff', zones: [] }};
      panel.render();
      const html = panel.innerHTML;
      if (!classSet.has('green-smart-hide-ha-sidebar')) {{ console.error('hide class missing'); process.exit(1); }}
      if (!html.includes('data-rebuild-shell-main') || !html.includes('data-r7-sidebar data-r7-sidebar-component="common"') || !html.includes('data-r7-page-shell')) {{ console.error('green smart content missing'); process.exit(2); }}
      for (const el of [haSidebar, huiSidebar]) {{
        if (el.style.values.display?.[0] !== 'none') {{ console.error('sidebar not hidden'); process.exit(3); }}
      }}
      for (const el of [appDrawer, haDrawer]) {{
        if (el.style.values.display?.[0] === 'none') {{ console.error('app shell drawer was hidden'); process.exit(4); }}
        if (el.style.values.width?.[0] !== '0px' || el.style.values['max-width']?.[0] !== '0px' || el.style.values.flex?.[0] !== '0 0 0px') {{ console.error('app shell drawer blank space was not collapsed'); process.exit(5); }}
        if (el.getAttribute('data-r7-ha-sidebar-blank-space-collapsed') !== 'true') {{ console.error('blank space marker missing'); process.exit(6); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
