from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_133_version_surfaces_are_1_14_95():
    assert '"version": "1.15.24"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.24"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.24"' in _read(REBUILD_PANEL)


def test_r7_133_source_domain_frames_fill_outer_card_only_without_forced_stretch():
    source = _read(REBUILD_PANEL)
    for marker in (
        'data-r7-domain-frame-width="safe-fill"',
        'data-r7-domain-content-card-width="safe-fill"',
        'data-r7-domain-visual-hero-width="safe-natural"',
        'data-r7-content-width-policy="grid-contained-fill"',
        'data-r7-shell-grid-width-policy="sidebar-aware-fill"',
        'data-r7-page-shell-width="viewport"',
        'data-r7-page-workspace-width="viewport"',
    ):
        assert marker in source
    frame_start = source.index('renderR7DomainVisualFrame')
    frame_end = source.index('renderR7CropValueCard', frame_start)
    frame_block = source[frame_start:frame_end]
    for bad in (
        'data-r7-domain-card-width-policy="fill-available-content-column"',
        'data-r7-domain-content-card-width="viewport"',
        'data-r7-domain-content-panel-width="viewport"',
        'width:100%;min-width:0;max-width:none;box-sizing:border-box;justify-self:stretch;align-self:stretch;',
        'grid-template-columns:minmax(0,1fr);">\n      <section data-r7-domain-visual-hero',
        'max-width:none',
        '100dvw',
        'justify-self:stretch',
        'align-self:stretch',
    ):
        assert bad not in frame_block
    assert 'style="display:grid;gap:14px;min-width:0;width:100%;max-width:100%;box-sizing:border-box;"' in frame_block
    assert 'data-r7-domain-visual-hero data-r7-domain-visual-hero-width="safe-natural" style="border:1px solid #cfe5d4' in frame_block


def test_r7_133_node_smoke_settings_domain_hero_does_not_vertical_shred():
    script = f"""
      let classSet = new Set();
      globalThis.MutationObserver = class {{ constructor(fn){{ this.fn = fn; }} observe(){{}} }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }}, toggle(c, enabled){{ if (enabled) classSet.add(c); else classSet.delete(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(tag){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }},
        querySelectorAll(sel){{ return []; }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(){{}} }}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ is_admin: false, green_smart_role: 'farm_staff' }}, callApi: async () => ({{ actorRole: 'farm_staff', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'farm_staff', zones: [] }};
      panel.setR7ActiveDomain('recommendation-automation');
      const html = panel.innerHTML;
      const required = [
        'data-r7-content-width-mode="ha-sidebar-hidden"',
        'data-r7-domain-frame-width="safe-fill"',
        'data-r7-domain-content-card-width="safe-fill"',
        'data-r7-domain-visual-hero-width="safe-natural"',
        '자동화 제어',
        '구역별 자동화 제어 후보',
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) {{ console.error(JSON.stringify({{missing}})); process.exit(1); }}
      const frameStart = html.indexOf('data-r7-domain-visual-frame');
      const frameEnd = html.indexOf('data-r7-crop-product-subtab-screen', frameStart);
      const frame = html.slice(frameStart, frameEnd);
      const bad = [
        'data-r7-domain-card-width-policy="fill-available-content-column"',
        'data-r7-domain-content-card-width="viewport"',
        'data-r7-domain-content-panel-width="viewport"',
        'width:100%;min-width:0;max-width:none;box-sizing:border-box;justify-self:stretch;align-self:stretch;',
        'max-width:none',
        '100dvw',
        'justify-self:stretch',
        'align-self:stretch'
      ].filter((needle) => frame.includes(needle));
      if (bad.length) {{ console.error(JSON.stringify({{bad}})); process.exit(2); }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
