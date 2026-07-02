from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-027-sidebar-role-and-settings-subtab-hotfix.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_027_version_surfaces_are_1_12_61():
    assert '"version": "1.14.46"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.46"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.46"' in _read(REBUILD_PANEL)
    assert "v1.14.46" in _read(DOC)


def test_r7_027_doc_records_sidebar_and_settings_subtab_requirements():
    text = _read(DOC)
    for phrase in (
        "설정 도메인의 하위탭은 다른 도메인과 동일하게 클릭 시 active tab/panel이 바뀌어야 한다",
        'data-r7-sidebar-layout-mode="operator-ha-adjacent"',
        'data-r7-sidebar-layout-mode="full-left-no-ha-sidebar"',
        "green-smart-hide-ha-sidebar",
        "data-r7-sidebar-logo-image",
        "data-r7-sidebar-collapse-toggle",
        "운영 홈: 🏠",
        "작물 운영: 🌱",
        "환경 제어: 🌡️",
        "관수 제어: 💧",
        "장치 제어: ⚙️",
        "자동화 제어: 🤖",
        "안전 제어: 🛡️",
        "설정: 🧩",
        "No API route change in R7-027",
    ):
        assert phrase in text


def test_r7_027_source_allows_settings_admin_subtabs_and_sidebar_role_layout():
    text = _read(REBUILD_PANEL)
    for marker in (
        "settingsTabs",
        'domain === "settings-admin" ? settingsTabs',
        '"domain-ownership"',
        '"role-permissions"',
        '"mapping-devices"',
        '"system-security"',
        '"diagnostics-audit"',
        '"rbac-policy"',
        "_currentGreenSmartRole",
        "_r7SidebarLayoutMode",
        "_applyR7HASidebarPolicy",
        "green-smart-hide-ha-sidebar",
        "green-smart-operator-ha-sidebar-adjacent",
        "data-r7-sidebar-layout-mode",
        "data-r7-ha-sidebar-policy",
        "data-r7-sidebar-logo-image",
        "data-r7-sidebar-collapse-toggle",
        "data-r7-sidebar-collapsed",
        "R7_HA_MDI_ICONS",
        "_r7SidebarHaIcon",
    ):
        assert marker in text


def test_r7_027_node_smoke_settings_admin_subtabs_and_sidebar_toggle_work():
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
      panel.hass = {{ user: {{ is_admin: false, green_smart_role: 'farm_staff' }}, callApi: async () => ({{ contextSource: 'r7-027-smoke', actorRole: 'farm_staff', zones: [] }}) }};
      panel.connectedCallback();
      await new Promise((resolve) => setTimeout(resolve, 0));
      panel.setR7ActiveDomain('settings-admin');
      let html = panel.innerHTML;
      const firstRequired = [
        'data-r7-sidebar-layout-mode="full-left-no-ha-sidebar"',
        'data-r7-ha-sidebar-policy="hide"',
        'data-r7-sidebar-logo-image',
        'data-r7-sidebar-collapse-toggle',
        'data-r7-sidebar-ha-icon="settings-admin"',
        'ha-icon icon="mdi:cog"',
        'data-r7-settings-admin-subtab="domain-ownership"',
        'data-r7-settings-admin-subtab="rbac-policy"'
      ];
      for (const item of firstRequired) {{ if (!html.includes(item)) {{ console.error('missing ' + item); process.exit(1); }} }}
      if (!classSet.has('green-smart-hide-ha-sidebar')) {{ console.error('missing hide class'); process.exit(2); }}
      if (!panel.setR7DomainSubtab('settings-admin', 'rbac-policy')) {{ console.error('subtab rejected'); process.exit(3); }}
      html = panel.innerHTML;
      if (!html.includes('data-r7-domain-subtab-key="rbac-policy" data-r7-settings-admin-subtab="rbac-policy" data-r7-domain-subtab-active="true"')) {{ console.error('rbac tab not active'); process.exit(4); }}
      panel.toggleR7SidebarCollapsed();
      html = panel.innerHTML;
      if (!html.includes('data-r7-sidebar-collapsed="true"')) {{ console.error('collapse failed'); process.exit(5); }}
      panel.hass = {{ user: {{ is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      panel.render();
      html = panel.innerHTML;
      if (!html.includes('data-r7-sidebar-layout-mode="operator-ha-adjacent"')) {{ console.error('operator layout missing'); process.exit(6); }}
      if (!classSet.has('green-smart-operator-ha-sidebar-adjacent')) {{ console.error('operator class missing'); process.exit(7); }}
      console.log(JSON.stringify({{ok:true, len: html.length}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
