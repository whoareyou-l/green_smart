from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-035-reference-logo-sage-icons.md"
LOGO_ASSET = ROOT / "custom_components/green_smart/panel/rebuild/assets/r7-reference-green-smart-logo.png"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_035_version_surfaces_are_current_after_mdi_supersession():
    assert '"version": "1.14.56"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.56"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.56"' in _read(REBUILD_PANEL)
    assert "v1.14.56" in _read(DOC)


def test_r7_035_reference_asset_remains_historical_but_not_active_sidebar_logo():
    assert LOGO_ASSET.exists()
    assert LOGO_ASSET.stat().st_size > 500
    text = _read(REBUILD_PANEL)
    assert "r7-reference-green-smart-logo.png" not in text
    assert 'data-r7-sidebar-logo-style="ha-mdi-leaf"' in text
    assert 'ha-icon icon="mdi:leaf"' in text


def test_r7_035_doc_still_records_historical_reference_slice():
    text = _read(DOC)
    for phrase in (
        "green rounded square tile with white leaf mark",
        "muted sage green",
        "pale mint rounded square tile",
        "No API route change in R7-035",
    ):
        assert phrase in text


def test_r7_035_render_smoke_uses_r7_038_mdi_superseding_logo_and_icons():
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
        const required = ['data-r7-sidebar-logo-style="ha-mdi-leaf"', '<ha-icon icon="mdi:leaf"', 'data-r7-sidebar-icon-style="ha-mdi"', 'ha-icon icon="mdi:home-variant"'];
        const missing = required.filter((item) => !aside.includes(item));
        const forbidden = ['r7-reference-green-smart-logo.png', 'data-r7-sidebar-logo-source="attached-reference"', 'data-r7-sidebar-icon-reference-style="soft-sage-filled"', '🏠','🌱','🌡️','💧','⚙️','🤖','🛡️','🧩','#03a9f4'].filter((item) => aside.includes(item));
        if (missing.length || forbidden.length) {{
          console.error(JSON.stringify({{collapsed, missing, forbidden, aside: aside.slice(0, 1600)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
