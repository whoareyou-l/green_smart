from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_130_version_surfaces_are_1_14_88():
    assert '"version": "1.15.02"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.02"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.02"' in _read(REBUILD_PANEL)


def test_r7_130_source_documents_admin_only_ha_sidebar_policy():
    source = _read(REBUILD_PANEL)
    for marker in (
        "_isCurrentUserHaSidebarAdmin",
        "data-r7-ha-sidebar-admin-only-policy",
        "data-r7-ha-sidebar-admin-source",
        "green-smart-hide-ha-sidebar",
        "green-smart-operator-ha-sidebar-adjacent",
        "_applyR7HASidebarDomVisibility",
        "data-green-smart-ha-sidebar-hidden",
        "data-r7-ha-sidebar-shadow-dom-force-hide",
        "_ensureR7HASidebarPolicyObserver",
    ):
        assert marker in source
    assert 'this._currentGreenSmartRole() === "operator" ? "operator-ha-adjacent"' not in source


def test_r7_130_node_smoke_only_admin_keeps_ha_sidebar():
    script = f"""
      let classSet = new Set();
      globalThis.document = {{
        body: {{ classList: {{
          add(c){{ classSet.add(c); }},
          remove(c){{ classSet.delete(c); }},
          contains(c){{ return classSet.has(c); }},
          toggle(c, enabled){{ if (enabled) classSet.add(c); else classSet.delete(c); }}
        }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(){{}} }}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const cases = [
        {{ label: 'ha-admin', user: {{ is_admin: true, green_smart_role: 'farm_staff' }}, context: {{ actorRole: 'farm_staff' }}, mode: 'operator-ha-adjacent', policy: 'keep', hide: false }},
        {{ label: 'gs-admin-role', user: {{ is_admin: false, green_smart_role: 'admin' }}, context: {{ actorRole: 'admin' }}, mode: 'operator-ha-adjacent', policy: 'keep', hide: false }},
        {{ label: 'operator-not-admin', user: {{ is_admin: false, green_smart_role: 'operator' }}, context: {{ actorRole: 'operator' }}, mode: 'full-left-no-ha-sidebar', policy: 'hide', hide: true }},
        {{ label: 'farm-owner-not-admin', user: {{ is_admin: false, green_smart_role: 'farm_owner' }}, context: {{ actorRole: 'farm_owner' }}, mode: 'full-left-no-ha-sidebar', policy: 'hide', hide: true }},
        {{ label: 'staff', user: {{ is_admin: false, green_smart_role: 'farm_staff' }}, context: {{ actorRole: 'farm_staff' }}, mode: 'full-left-no-ha-sidebar', policy: 'hide', hide: true }},
      ];
      for (const item of cases) {{
        classSet = new Set();
        const panel = new mod.GreenSmartRebuildPanel();
        panel.hass = {{ user: item.user, callApi: async () => ({{ ...item.context, zones: [] }}) }};
        panel._homeContext = {{ ...item.context, zones: [] }};
        panel._r7SidebarCollapsed = true;
        panel.render();
        const html = panel.innerHTML;
        const modeNeedle = `data-r7-sidebar-layout-mode="${{item.mode}}"`;
        const policyNeedle = `data-r7-ha-sidebar-policy="${{item.policy}}"`;
        const adminOnly = 'data-r7-ha-sidebar-admin-only-policy="true"';
        const hidden = classSet.has('green-smart-hide-ha-sidebar');
        const adjacent = classSet.has('green-smart-operator-ha-sidebar-adjacent');
        if (!html.includes(modeNeedle) || !html.includes(policyNeedle) || !html.includes(adminOnly)) {{
          console.error(JSON.stringify({{label:item.label, missing:[modeNeedle, policyNeedle, adminOnly].filter(x => !html.includes(x))}}));
          process.exit(1);
        }}
        if (item.hide && (!hidden || adjacent)) {{ console.error(JSON.stringify({{label:item.label, hidden, adjacent, classes:[...classSet]}})); process.exit(2); }}
        if (!item.hide && (hidden || !adjacent)) {{ console.error(JSON.stringify({{label:item.label, hidden, adjacent, classes:[...classSet]}})); process.exit(3); }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
