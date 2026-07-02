from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-034-settings-utility-title-profile-logout-layout.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_034_version_surfaces_are_1_12_68():
    assert '"version": "1.14.26"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.26"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.26"' in _read(REBUILD_PANEL)
    assert "v1.14.26" in _read(DOC)


def test_r7_034_doc_records_settings_title_and_profile_logout_layout():
    text = _read(DOC)
    for phrase in (
        "Expanded/sidebar-detail mode shows Settings/Admin utility with title and description",
        "left circular user profile image/avatar, center user name+role, right logout button",
        'data-r7-settings-admin-utility-detail="true"',
        "data-r7-settings-admin-utility-title",
        "data-r7-settings-admin-utility-description",
        'data-r7-sidebar-user-profile-layout="avatar-info-logout"',
        "data-r7-sidebar-user-avatar",
        "data-r7-sidebar-user-info",
        "data-r7-sidebar-logout-button",
        'data-r7-sidebar-logout-action="preserved"',
        "No API route change in R7-034",
    ):
        assert phrase in text


def test_r7_034_source_defines_settings_utility_detail_and_profile_layout_helpers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "_r7UserInitials",
        'data-r7-settings-admin-utility-detail="true"',
        "data-r7-settings-admin-utility-title",
        "data-r7-settings-admin-utility-description",
        'data-r7-sidebar-user-profile-layout="avatar-info-logout"',
        "data-r7-sidebar-user-avatar",
        "data-r7-sidebar-user-info",
        "data-r7-sidebar-logout-button",
        'data-r7-sidebar-logout-action="preserved"',
    ):
        assert marker in text


def test_r7_034_render_smoke_expanded_settings_utility_has_title_and_logout_has_3_part_layout():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
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
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      panel._r7SidebarCollapsed = false;
      panel._activeR7Domain = 'settings-admin';
      panel.render();
      const html = panel.innerHTML;
      const nav = html.match(/<nav[^>]*data-r7-sidebar-nav-list[\\s\\S]*?<\\/nav>/)?.[0] || '';
      const utility = html.match(/<div[^>]*data-r7-sidebar-utility-group[\\s\\S]*?<\\/div>/)?.[0] || '';
      const required = [
        'data-r7-settings-admin-utility-detail="true"',
        'data-r7-settings-admin-utility-title',
        '설정',
        'data-r7-settings-admin-utility-description',
        'RBAC·HA 매핑·진단',
        'data-r7-sidebar-user-profile-layout="avatar-info-logout"',
        'data-r7-sidebar-user-avatar',
        '>서<',
        'data-r7-sidebar-user-info',
        'data-r7-sidebar-user-name',
        '서원 임',
        'data-r7-sidebar-user-role',
        '관리자 · operator',
        'data-r7-sidebar-logout-button',
        '로그아웃',
        'href="/auth/logout"',
        'data-r7-sidebar-logout-action="preserved"'
      ];
      const missing = required.filter((item) => !utility.includes(item));
      const forbiddenNav = ['data-r7-sidebar-group="settings-admin"', 'data-r7-sidebar-target="settings-admin"'].filter((item) => nav.includes(item));
      if (missing.length || forbiddenNav.length || !html.includes('data-r7-domain-visual-frame-domain="settings-admin"')) {{
        console.error(JSON.stringify({{missing, forbiddenNav, utility: utility.slice(0, 1400)}}));
        process.exit(1);
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
