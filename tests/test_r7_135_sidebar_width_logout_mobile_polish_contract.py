from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-sidebar-width-logout-mobile-polish-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_135_version_surfaces_are_1_15_00():
    assert '"version": "1.15.48"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.48"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.48"' in _read(REBUILD_PANEL)
    assert "v1.15.48" in _read(PLAN)


def test_r7_135_source_has_ha_sidebar_aware_width_logout_and_mobile_polish():
    source = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-root-width-policy="ha-sidebar-aware-shell"',
        'data-r7-root-width-mode="${contentWidthMode}"',
        'contentWidthMode === "ha-sidebar-visible" ? "100%" : "100dvw"',
        'data-r7-sidebar-button-placement="outside-right"',
        'data-r7-sidebar-logout-fallback-href="/"',
        'data-r7-mobile-top-background="white"',
        'background:#fff',
        'data-r7-mobile-brand-text="true"',
        'Green Smart',
        'data-r7-mobile-action-order="account-logout-settings"',
        'data-r7-mobile-logout-button="true"',
        'data-r7-mobile-domain-active-only-bg="true"',
        "background:${active ? R7_GREEN_ACTIVE_BG : 'transparent'}",
    ):
        assert marker in source
    for forbidden in (
        'data-r7-sidebar-logout-href="/auth/logout"',
        'return "/auth/logout"',
        'data-r7-mobile-action-order="settings-account"',
        'data-r7-mobile-top-background="green"',
        "border:1px solid ${this._activeR7Domain === group.key ? '#badcc8' : '#dcebe0'}",
    ):
        assert forbidden not in source


def test_r7_135_render_admin_uses_100_percent_root_non_admin_uses_dvw_and_buttons_are_placed():
    script = f"""
      let classSet = new Set();
      globalThis.MutationObserver = class {{ constructor(fn){{ this.fn = fn; }} observe(){{}} }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }}, toggle(c, enabled){{ if (enabled) classSet.add(c); else classSet.delete(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }},
        querySelectorAll(){{ return []; }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(k,v){{ this[k]=v; }} }}; this._listeners = {{}}; this._attrs = {{}}; }} setAttribute(k,v){{ this._attrs[k]=String(v); }} getAttribute(k){{ return this._attrs[k]; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const cases = [
        {{ label: 'admin-expanded', collapsed: false, user: {{ is_admin: true, green_smart_role: 'admin', name: 'Admin' }}, role: 'admin', mode: 'ha-sidebar-visible', root: '--r7-root-viewport-width:100%', placement: 'outside-right' }},
        {{ label: 'admin-collapsed', collapsed: true, user: {{ is_admin: true, green_smart_role: 'admin', name: 'Admin' }}, role: 'admin', mode: 'ha-sidebar-visible', root: '--r7-root-viewport-width:100%', placement: 'outside-right' }},
        {{ label: 'staff-expanded', collapsed: false, user: {{ is_admin: false, green_smart_role: 'farm_staff', name: 'Staff' }}, role: 'farm_staff', mode: 'ha-sidebar-hidden', root: '--r7-root-viewport-width:100dvw', placement: 'outside-right' }},
      ];
      for (const item of cases) {{
        classSet = new Set();
        const panel = new mod.GreenSmartRebuildPanel();
        panel.hass = {{ user: item.user, callApi: async () => ({{ actorRole: item.role, zones: [] }}) }};
        panel._homeContext = {{ actorRole: item.role, zones: [] }};
        panel._r7SidebarCollapsed = item.collapsed;
        panel.render();
        const html = panel.innerHTML;
        const required = [
          `data-r7-root-width-mode="${{item.mode}}"`,
          item.root,
          `data-r7-sidebar-button-placement="${{item.placement}}"`,
          'data-r7-sidebar-logout-fallback-href="/"',
          'data-r7-mobile-top-background="white"',
          'data-r7-mobile-brand-text="true"',
          'data-r7-mobile-action-order="account-logout-settings"',
          'data-r7-mobile-logout-button="true"',
          'data-r7-mobile-domain-active-only-bg="true"',
        ];
        const missing = required.filter((needle) => !html.includes(needle));
        const forbidden = ['data-r7-sidebar-logout-href="/auth/logout"', 'href="/auth/logout"'].filter((needle) => html.includes(needle));
        if (missing.length || forbidden.length) {{ console.error(JSON.stringify({{label:item.label, missing, forbidden}})); process.exit(1); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_135_logout_clears_auth_state_and_redirects_to_authorize_not_404_route():
    script = f"""
      let assignedUrl = '';
      const makeStorage = (entries) => {{
        const data = new Map(entries);
        return {{ _data:data, get length(){{ return data.size; }}, key(i){{ return [...data.keys()][i]; }}, removeItem(k){{ data.delete(k); }} }};
      }};
      globalThis.localStorage = makeStorage([['hassTokens','x'], ['refresh_token','x'], ['keep','safe']]);
      globalThis.sessionStorage = makeStorage([['access_token','x']]);
      globalThis.location = {{ assign(url){{ assignedUrl = url; }} }};
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}}, toggle(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.style={{}}; this._attrs={{}}; }} setAttribute(k,v){{this._attrs[k]=v}} getAttribute(k){{return this._attrs[k]}} querySelectorAll(){{return[]}} querySelector(){{return null}} addEventListener(){{}} }};
      globalThis.customElements = {{ _items:new Map(), get(n){{return this._items.get(n)}}, define(n,c){{this._items.set(n,c)}} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      if (panel._r7LogoutHref() !== '/') {{ console.error('bad href'); process.exit(1); }}
      panel._performR7HaLogout();
      if (assignedUrl !== '/') {{ console.error(JSON.stringify({{assignedUrl}})); process.exit(2); }}
      if (localStorage._data.has('hassTokens') || localStorage._data.has('refresh_token') || sessionStorage._data.has('access_token')) {{ console.error('auth leftovers'); process.exit(3); }}
      if (!localStorage._data.has('keep')) {{ console.error('unrelated key removed'); process.exit(4); }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
