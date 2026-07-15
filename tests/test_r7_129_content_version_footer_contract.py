from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_129_version_surfaces_are_1_14_87():
    assert '"version": "1.15.60"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.60"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.60"' in _read(REBUILD_PANEL)


def test_r7_129_version_footer_source_is_inside_content_column_not_sidebar_grid_footer():
    source = _read(REBUILD_PANEL)
    assert 'data-r7-content-version-footer="true"' in source
    assert 'data-r7-version-footer-placement="content-bottom-outside-cards"' in source
    assert 'data-r7-version-footer-not-under-sidebar="true"' in source
    old = '<div data-rebuild-version="${REBUILD_VERSION}" style="font-size:12px;color:#78927f;">Green Smart ${REBUILD_VERSION}</div>'
    assert old not in source
    shell_start = source.index('<section data-r7-ha-adjacent-layout="true"')
    shell_end = source.index('</section>', shell_start)
    shell = source[shell_start:shell_end]
    assert 'data-rebuild-version="${REBUILD_VERSION}"' in shell
    assert 'data-rebuild-shell-main' in shell


def test_r7_129_node_smoke_version_footer_renders_after_page_shell_inside_main_content():
    script = f"""
      const classSet = new Set();
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{ setProperty(){{}} }}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [] }};
      panel.render();
      const html = panel.innerHTML;
      const mainStart = html.indexOf('data-rebuild-shell-main');
      const pageShell = html.indexOf('data-r7-page-shell', mainStart);
      const footer = html.indexOf('data-r7-content-version-footer="true"', mainStart);
      const sidebar = html.indexOf('data-r7-sidebar ');
      if (mainStart < 0 || pageShell < 0 || footer < 0) {{ console.error('missing footer/main markers'); process.exit(1); }}
      if (!(sidebar < mainStart && mainStart < pageShell && pageShell < footer)) {{ console.error(JSON.stringify({{sidebar, mainStart, pageShell, footer}})); process.exit(1); }}
      const required = [
        'data-rebuild-version="1.15.60"',
        'data-r7-content-version-footer="true"',
        'data-r7-version-footer-placement="content-bottom-outside-cards"',
        'data-r7-version-footer-not-under-sidebar="true"',
        'Green Smart 1.15.60'
      ];
      const missing = required.filter((item) => !html.includes(item));
      if (missing.length) {{ console.error(JSON.stringify({{missing}})); process.exit(1); }}
      console.log(JSON.stringify({{ok:true}}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
