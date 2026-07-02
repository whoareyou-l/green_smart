from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-038-ha-mdi-sidebar-icons.md"

ICON_MAPPING = {
    "operations-home": "mdi:home-variant",
    "crop-operations": "mdi:sprout",
    "environment-control": "mdi:thermometer-lines",
    "irrigation-fertigation": "mdi:water",
    "device-control": "mdi:cog-box",
    "recommendation-automation": "mdi:robot-outline",
    "safety-history": "mdi:shield-check-outline",
    "settings-admin": "mdi:cog",
}


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_038_version_surfaces_are_1_12_73():
    assert '"version": "1.14.52"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.52"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.52"' in _read(REBUILD_PANEL)
    assert "v1.14.52" in _read(DOC)


def test_r7_038_doc_records_exact_user_requested_mdi_mapping():
    text = _read(DOC)
    for key, icon in ICON_MAPPING.items():
        assert key in text
        assert icon in text
    for phrase in (
        'logo -> mdi:leaf',
        'data-r7-sidebar-icon-style="ha-mdi"',
        'data-r7-sidebar-logo-style="ha-mdi-leaf"',
        'ha-icon icon="mdi:leaf"',
        "No API route change in R7-038",
    ):
        assert phrase in text


def test_r7_038_source_defines_ha_mdi_icon_helpers_and_not_old_svg_logo():
    text = _read(REBUILD_PANEL)
    assert "R7_HA_MDI_ICONS" in text
    assert "_r7SidebarHaIcon" in text
    assert "_r7SidebarReferenceLogo" in text
    assert 'data-r7-sidebar-logo-style="ha-mdi-leaf"' in text
    assert 'data-r7-sidebar-icon-style="ha-mdi"' in text
    assert 'data-r7-sidebar-ha-icon="${key}"' in text
    assert 'ha-icon icon="mdi:leaf"' in text
    for icon in ICON_MAPPING.values():
        assert icon in text
    assert "r7-reference-green-smart-logo.png" not in text
    assert "R7_LINE_ICONS = Object.freeze" not in text


def test_r7_038_render_smoke_sidebar_uses_requested_ha_icons():
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
      for (const collapsed of [true, false]) {{
        panel._r7SidebarCollapsed = collapsed;
        panel._activeR7Domain = 'operations-home';
        panel.render();
        const aside = panel.innerHTML.match(/<aside[\\s\\S]*?<\\/aside>/)?.[0] || '';
        const required = [
          'data-r7-sidebar-logo-style="ha-mdi-leaf"',
          '<ha-icon icon="mdi:leaf"',
          'data-r7-sidebar-icon-style="ha-mdi"',
          'data-r7-sidebar-ha-icon="operations-home"',
          'ha-icon icon="mdi:home-variant"',
          'data-r7-sidebar-ha-icon="crop-operations"',
          'ha-icon icon="mdi:sprout"',
          'data-r7-sidebar-ha-icon="environment-control"',
          'ha-icon icon="mdi:thermometer-lines"',
          'data-r7-sidebar-ha-icon="irrigation-fertigation"',
          'ha-icon icon="mdi:water"',
          'data-r7-sidebar-ha-icon="device-control"',
          'ha-icon icon="mdi:cog-box"',
          'data-r7-sidebar-ha-icon="recommendation-automation"',
          'ha-icon icon="mdi:robot-outline"',
          'data-r7-sidebar-ha-icon="safety-history"',
          'ha-icon icon="mdi:shield-check-outline"',
          'data-r7-sidebar-ha-icon="settings-admin"',
          'ha-icon icon="mdi:cog"',
        ];
        const missing = required.filter((item) => !aside.includes(item));
        const forbidden = ['r7-reference-green-smart-logo.png', 'data-r7-sidebar-logo-source="attached-reference"', 'data-r7-sidebar-icon-reference-style="soft-sage-filled"', '🏠','🌱','🌡️','💧','⚙️','🤖','🛡️','🧩'].filter((item) => aside.includes(item));
        if (missing.length || forbidden.length) {{
          console.error(JSON.stringify({{collapsed, missing, forbidden, aside: aside.slice(0, 2600)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
