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


def test_r7_035_version_surfaces_are_1_12_70():
    assert '"version": "1.12.70"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.70"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.70"' in _read(REBUILD_PANEL)
    assert "v1.12.70" in _read(DOC)


def test_r7_035_uses_actual_attached_reference_logo_asset():
    assert LOGO_ASSET.exists()
    assert LOGO_ASSET.stat().st_size > 500
    text = _read(REBUILD_PANEL)
    assert "r7-reference-green-smart-logo.png" in text
    assert "<img" in text
    assert "Green Smart reference logo" in text


def test_r7_035_doc_records_reference_logo_and_sage_icon_style():
    text = _read(DOC)
    for phrase in (
        "green rounded square tile with white leaf mark",
        "muted sage green",
        "pale mint rounded square tile",
        'data-r7-sidebar-logo-style="reference-leaf-tile"',
        'data-r7-sidebar-logo-source="attached-reference"',
        'data-r7-sidebar-logo-leaf="true"',
        'data-r7-sidebar-icon-reference-style="soft-sage-filled"',
        'data-r7-sidebar-icon-palette="reference-sage"',
        'data-r7-sidebar-active-icon-tile="soft-mint"',
        'data-r7-sidebar-icon-tone="#6f8d7b"',
        'data-r7-sidebar-active-icon-bg="#eef8ee"',
        "No API route change in R7-035",
    ):
        assert phrase in text


def test_r7_035_source_defines_reference_logo_and_sage_icon_helpers():
    text = _read(REBUILD_PANEL)
    for marker in (
        "R7_REFERENCE_SAGE_ICON",
        "R7_REFERENCE_ACTIVE_ICON_BG",
        "R7_REFERENCE_LOGO_TILE",
        "_r7SidebarReferenceLogo",
        "_r7SidebarReferenceIcon",
        "r7-reference-green-smart-logo.png",
        'data-r7-sidebar-logo-style="reference-leaf-tile"',
        'data-r7-sidebar-logo-source="attached-reference"',
        'data-r7-sidebar-logo-leaf="true"',
        'data-r7-sidebar-icon-reference-style="soft-sage-filled"',
        'data-r7-sidebar-icon-palette="reference-sage"',
        'data-r7-sidebar-active-icon-tile="soft-mint"',
        'data-r7-sidebar-icon-tone="#6f8d7b"',
        'data-r7-sidebar-active-icon-bg="#eef8ee"',
        "#43ad5e",
        "#6f8d7b",
        "#eef8ee",
    ):
        assert marker in text


def test_r7_035_render_smoke_logo_and_icons_match_reference_style():
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
        const html = panel.innerHTML;
        const aside = html.match(/<aside[\\s\\S]*?<\\/aside>/)?.[0] || '';
        const required = [
          'data-r7-sidebar-logo-style="reference-leaf-tile"',
          'data-r7-sidebar-logo-source="attached-reference"',
          'data-r7-sidebar-logo-leaf="true"',
          '<img',
          'r7-reference-green-smart-logo.png',
          '#43ad5e',
          'Green Smart reference logo',
          'data-r7-sidebar-icon-reference-style="soft-sage-filled"',
          'data-r7-sidebar-icon-palette="reference-sage"',
          'data-r7-sidebar-active-icon-tile="soft-mint"',
          'data-r7-sidebar-icon-tone="#6f8d7b"',
          'data-r7-sidebar-active-icon-bg="#eef8ee"',
          '#6f8d7b',
          '#eef8ee',
          'fill="currentColor"',
          'data-r7-sidebar-line-icon="operations-home"'
        ];
        const missing = required.filter((item) => !aside.includes(item));
        const forbidden = ['🏠','🌱','🌡️','💧','⚙️','🤖','🛡️','🧩','#03a9f4'].filter((item) => aside.includes(item));
        if (missing.length || forbidden.length) {{
          console.error(JSON.stringify({{collapsed, missing, forbidden, aside: aside.slice(0, 1600)}}));
          process.exit(1);
        }}
      }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
