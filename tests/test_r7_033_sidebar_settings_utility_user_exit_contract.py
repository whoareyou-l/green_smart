from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-033-sidebar-settings-utility-user-exit.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_033_version_surfaces_are_1_14_99():
    assert '"version": "1.15.16"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.16"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.16"' in _read(REBUILD_PANEL)
    assert "v1.15.16" in _read(DOC)


def test_r7_033_doc_records_settings_utility_and_split_profile_logout_scope():
    text = _read(DOC)
    for phrase in (
        "settings-admin is not rendered in the main sidebar domain navigation list",
        "settings-admin remains routable and renderable as a domain page",
        "settings-admin appears only as the second item from the bottom utility area",
        "displays the currently logged-in user's name/role",
        "separates profile and Home Assistant logout semantics",
        'data-r7-sidebar-main-domain-list="without-settings-admin"',
        'data-r7-sidebar-utility-domain="settings-admin"',
        'data-r7-sidebar-utility-position="second-from-bottom"',
        'data-r7-sidebar-user-profile-button="true"',
        'data-r7-sidebar-logout-button="true"',
        'data-r7-sidebar-logout-action="ha-auth-logout"',
        "No API route change in R7-033",
    ):
        assert phrase in text


def test_r7_033_source_defines_separate_main_domains_and_profile_logout_helpers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7_MAIN_SIDEBAR_GROUPS",
        "_r7CurrentUserInfo",
        "_r7LogoutHref",
        "_openR7UserProfileSettings",
        "_performR7HaLogout",
        'data-r7-sidebar-main-domain-list="without-settings-admin"',
        'data-r7-sidebar-user-profile-button="true"',
        'data-r7-sidebar-logout-button="true"',
        'data-r7-sidebar-user-name',
        'data-r7-sidebar-user-role',
        'data-r7-sidebar-logout-action="ha-auth-logout"',
        'data-r7-sidebar-utility-domain="settings-admin"',
        'data-r7-sidebar-utility-position="second-from-bottom"',
    ):
        assert marker in text
    assert '{ key: "settings-admin", label: "설정"' in text
    assert 'data-r7-sidebar-user-exit="true"' not in text
    assert 'data-r7-sidebar-logout-action="preserved"' not in text


def test_r7_033_render_smoke_settings_removed_from_main_nav_and_profile_logout_split():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '', assign(){{}} }};
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
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      for (const collapsed of [true, false]) {{
        panel._r7SidebarCollapsed = collapsed;
        panel._activeR7Domain = 'settings-admin';
        panel.render();
        const html = panel.innerHTML;
        const nav = html.match(/<nav[^>]*data-r7-sidebar-nav-list[\\s\\S]*?<\\/nav>/)?.[0] || '';
        const required = [
          'data-r7-sidebar-main-domain-list="without-settings-admin"',
          'data-r7-sidebar-utility-domain="settings-admin"',
          'data-r7-sidebar-utility-position="second-from-bottom"',
          'data-r7-sidebar-group="settings-admin"',
          'data-r7-sidebar-target="settings-admin"',
          'data-r7-sidebar-user-profile-button="true"',
          'data-r7-profile-settings-route="settings-admin/users-permissions"',
          'data-r7-sidebar-user-name',
          '서원 임',
          'data-r7-sidebar-user-role',
          '관리자 · operator',
          'data-r7-sidebar-utility="profile"',
          'data-r7-sidebar-logout-button="true"',
          'data-r7-sidebar-utility="logout"',
          'data-r7-sidebar-logout-action="ha-auth-logout"'
        ];
        const missing = required.filter((item) => !html.includes(item));
        const forbiddenNav = ['data-r7-sidebar-group="settings-admin"', 'data-r7-sidebar-target="settings-admin"'].filter((item) => nav.includes(item));
        const forbidden = ['data-r7-sidebar-user-exit="true"', 'data-r7-sidebar-logout-action="preserved"'].filter((item) => html.includes(item));
        if (missing.length || forbiddenNav.length || forbidden.length || !html.includes('data-r7-domain-page="settings-admin"')) {{
          console.error(JSON.stringify({{collapsed, missing, forbiddenNav, forbidden, nav: nav.slice(0, 900)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
