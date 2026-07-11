from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-10-sidebar-account-logout-mobile-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_134_version_surfaces_are_1_15_00():
    assert '"version": "1.15.27"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.27"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.27"' in _read(REBUILD_PANEL)
    assert "v1.15.27" in _read(PLAN)


def test_r7_134_source_separates_user_profile_logout_toggle_and_mobile_nav():
    source = _read(REBUILD_PANEL)
    for marker in (
        "_openR7UserProfileSettings",
        "_performR7HaLogout",
        'data-r7-sidebar-user-profile-button',
        'data-r7-profile-settings-route="settings-admin/users-permissions"',
        'data-r7-sidebar-logout-button="true"',
        'data-r7-sidebar-logout-action="ha-auth-logout"',
        'data-r7-sidebar-account-logout-split="true"',
        'data-r7-sidebar-user-profile-layout="avatar-info-separated-logout"',
        'data-r7-sidebar-external-toggle="true"',
        'data-r7-sidebar-logo-static="true"',
        'renderR7MobileTopNavigation',
        'data-r7-mobile-top-nav="two-row"',
        'data-r7-mobile-top-nav-row="brand-settings-account"',
        'data-r7-mobile-top-nav-row="domain-scroll"',
        'data-r7-mobile-domain-scroll="horizontal"',
        'data-r7-mobile-settings-button="true"',
        'data-r7-mobile-account-button="true"',
        'data-r7-mobile-logout-button="true"',
        '@media (max-width: 760px)',
        '[data-r7-sidebar][data-r7-sidebar-component="common"] { display:none !important; }',
        'overflow-x:auto',
    ):
        assert marker in source
    for forbidden in (
        'data-r7-sidebar-logout-action="preserved"',
        'data-r7-sidebar-user-profile-layout="avatar-info-logout"',
        '<button type="button" data-r7-sidebar-collapse-toggle data-r7-sidebar-logo-tile',
    ):
        assert forbidden not in source


def test_r7_134_render_and_click_behaviors_for_profile_logout_and_mobile_top_nav():
    script = f"""
      let classSet = new Set();
      const storage = {{ _data: new Map([['hassTokens', 'secret'], ['refresh_token', 'secret'], ['keep', 'safe']]), get length(){{ return this._data.size; }}, key(i){{ return [...this._data.keys()][i]; }}, removeItem(k){{ this._data.delete(k); }} }};
      let assignedUrl = '';
      globalThis.localStorage = storage;
      globalThis.sessionStorage = {{ _data: new Map([['access_token', 'secret']]), get length(){{ return this._data.size; }}, key(i){{ return [...this._data.keys()][i]; }}, removeItem(k){{ this._data.delete(k); }} }};
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '', assign(url){{ assignedUrl = url; }} }};
      globalThis.MutationObserver = class {{ constructor(fn){{ this.fn = fn; }} observe(){{}} }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }}, toggle(c, enabled){{ if (enabled) classSet.add(c); else classSet.delete(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }},
        querySelectorAll(){{ return []; }}
      }};
      globalThis.HTMLElement = class {{
        constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(k,v){{ this[k]=v; }} }}; this._listeners = {{}}; this._attrs = {{}}; }}
        setAttribute(k,v){{ this._attrs[k]=String(v); }}
        getAttribute(k){{ return this._attrs[k]; }}
        querySelectorAll(sel){{ return []; }}
        querySelector(){{ return null; }}
        addEventListener(type, fn){{ this._listeners[type] = fn; }}
      }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'admin' }}, callApi: async () => ({{ actorRole: 'admin', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'admin', zones: [] }};
      for (const collapsed of [false, true]) {{
        panel._r7SidebarCollapsed = collapsed;
        panel._activeR7Domain = 'operations-home';
        panel.render();
        const html = panel.innerHTML;
        const required = [
          'data-r7-sidebar-account-logout-split="true"',
          'data-r7-sidebar-user-profile-button="true"',
          'data-r7-profile-settings-route="settings-admin/users-permissions"',
          'data-r7-sidebar-logout-button="true"',
          'data-r7-sidebar-logout-action="ha-auth-logout"',
          'data-r7-sidebar-external-toggle="true"',
          'data-r7-sidebar-logo-static="true"',
          'data-r7-mobile-top-nav="two-row"',
          'data-r7-mobile-top-nav-row="brand-settings-account"',
          'data-r7-mobile-top-nav-row="domain-scroll"',
          'data-r7-mobile-domain-scroll="horizontal"',
          'data-r7-mobile-settings-button="true"',
          'data-r7-mobile-account-button="true"',
          'overflow-x:auto'
        ];
        const missing = required.filter((needle) => !html.includes(needle));
        const forbidden = ['data-r7-sidebar-logout-action="preserved"', 'data-r7-sidebar-user-profile-layout="avatar-info-logout"'].filter((needle) => html.includes(needle));
        if (missing.length || forbidden.length) {{ console.error(JSON.stringify({{collapsed, missing, forbidden}})); process.exit(1); }}
      }}
      panel._activeR7Domain = 'operations-home';
      panel._activeR7DomainSubtabs = {{ 'settings-admin': 'greenhouse-zones' }};
      panel._openR7UserProfileSettings();
      if (panel._activeR7Domain !== 'settings-admin' || panel._activeR7DomainSubtabs['settings-admin'] !== 'users-permissions') {{ console.error('profile route failed'); process.exit(2); }}
      panel._performR7HaLogout();
      if (assignedUrl !== '/') {{ console.error(JSON.stringify({{assignedUrl}})); process.exit(3); }}
      if (globalThis.localStorage._data.has('hassTokens') || globalThis.localStorage._data.has('refresh_token') || globalThis.sessionStorage._data.has('access_token')) {{ console.error('auth storage not cleared'); process.exit(4); }}
      if (!globalThis.localStorage._data.has('keep')) {{ console.error('unrelated storage removed'); process.exit(5); }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
