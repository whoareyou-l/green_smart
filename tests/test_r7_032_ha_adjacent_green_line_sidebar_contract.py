from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-032-ha-adjacent-green-line-sidebar.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_032_version_surfaces_are_1_12_66():
    assert '"version": "1.15.07"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.07"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.07"' in _read(REBUILD_PANEL)
    assert "v1.15.07" in _read(DOC)


def test_r7_032_doc_records_user_requested_sidebar_changes():
    text = _read(DOC)
    for phrase in (
        "HA sidebar is kept visible",
        "immediate next grid column after HA sidebar",
        "No visual gap",
        "Main accent color returns to green",
        "second utility item from the bottom opens/settings-admin domain",
        "simple line-icon style",
        'data-r7-ha-adjacent-placement="right-of-ha-sidebar"',
        'data-r7-sidebar-adjacent-gap="0"',
        'data-r7-sidebar-main-color="green"',
        'data-r7-sidebar-icon-style="line"',
        'data-r7-sidebar-utility-domain="settings-admin"',
        "No API route change in R7-032",
    ):
        assert phrase in text


def test_r7_032_source_defines_green_line_icon_sidebar_policy():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7_GREEN_ACCENT",
        "R7_HA_MDI_ICONS",
        "_r7SidebarLineIcon",
        "_r7SidebarHaIcon",
        "_r7SidebarPlacementAttrs",
        'data-r7-ha-adjacent-placement="right-of-ha-sidebar"',
        'data-r7-sidebar-adjacent-gap="0"',
        'data-r7-sidebar-main-color="green"',
        'data-r7-sidebar-accent-color="#43ad5e"',
        'data-r7-sidebar-icon-style="ha-mdi"',
        'data-r7-sidebar-utility-domain="settings-admin"',
        'data-r7-sidebar-utility-position="second-from-bottom"',
        "mdi:sprout",
        "#43ad5e",
        "#31523b",
    ):
        assert marker in text
    for stale in ('"🏠"', '"🌱"', '"🌡️"', '"💧"', '"⚙️"', '"🤖"', '"🛡️"', '"🧩"', "#03a9f4"):
        assert stale not in text


def test_r7_032_node_smoke_sidebar_is_ha_adjacent_green_and_ha_mdi_icon_based():
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
      panel.hass = {{ user: {{ is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      const cases = [[true, '64px'], [false, '256px']];
      for (const [collapsed, width] of cases) {{
        panel._r7SidebarCollapsed = collapsed;
        panel._activeR7Domain = 'crop-operations';
        panel.render();
        const html = panel.innerHTML;
        const aside = html.match(/<aside[\\s\\S]*?<\\/aside>/)?.[0] || '';
        const required = [
          'data-r7-ha-adjacent-placement="right-of-ha-sidebar"',
          'data-r7-sidebar-adjacent-gap="0"',
          'data-r7-sidebar-main-color="green"',
          'data-r7-sidebar-accent-color="#43ad5e"',
          'data-r7-sidebar-icon-style="ha-mdi"',
          'data-r7-sidebar-utility-domain="settings-admin"',
          'data-r7-sidebar-utility-position="second-from-bottom"',
          'data-r7-sidebar-utility="exit"',
          `width:${{width}}`,
          'margin-left:0',
          'border-left:0',
          '#43ad5e',
          '#31523b',
          'data-r7-sidebar-ha-icon="crop-operations"',
          'ha-icon icon="mdi:sprout"'
        ];
        const missing = required.filter((item) => !aside.includes(item));
        const forbidden = ['🏠','🌱','🌡️','💧','⚙️','🤖','🛡️','🧩','#03a9f4','data-r7-sidebar-utility="settings"'].filter((item) => aside.includes(item));
        if (missing.length || forbidden.length || !classSet.has('green-smart-operator-ha-sidebar-adjacent') || classSet.has('green-smart-hide-ha-sidebar')) {{
          console.error(JSON.stringify({{collapsed, missing, forbidden, classes:[...classSet], aside: aside.slice(0, 900)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
