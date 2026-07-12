from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-093-common-card-header-icon-plain-large.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_zones() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{ greenhouseName: '제1온실', zones: [{{ zoneId: 'zone-1', zoneName: '1구역', name: '1구역', purpose: '재배', area: '120㎡', bedCount: 6, currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토' }}, dataAvailability: {{ state: 'fresh' }}, equipmentProfile: {{ labels: ['천창','측창','WMC','센서 6'] }} }}] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin','greenhouse-zones');
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_093_version_surfaces_are_1_14_18():
    assert '"version": "1.15.45"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.45"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.45"' in _read(REBUILD_PANEL)


def test_r7_093_common_card_header_icon_wrap_has_no_background():
    html = _render_greenhouse_zones()
    wraps = re.findall(r'<span[^>]*data-r7-common-card-icon-wrap[^>]*style="([^"]+)"[^>]*>', html)
    assert wraps
    for style in wraps[:6]:
        normalized = style.replace(' ', '').lower()
        assert 'background:' not in normalized
        assert 'border-radius' not in normalized
        assert 'width:30px' in normalized
        assert 'height:30px' in normalized


def test_r7_093_common_card_header_icons_are_larger_than_previous_17px():
    html = _render_greenhouse_zones()
    header_icons = re.findall(r'data-r7-common-card-icon-wrap.*?<ha-icon[^>]*data-r7-common-ha-icon-policy="mdi-only"[^>]*style="([^"]+)"', html, flags=re.S)
    assert header_icons
    for style in header_icons[:6]:
        normalized = style.replace(' ', '').lower()
        assert '--mdc-icon-size:22px' in normalized
        assert 'width:22px' in normalized
        assert 'height:22px' in normalized


def test_r7_093_documented():
    doc = _read(DOC)
    for phrase in ['헤더 아이콘', '배경색 제거', '22px', 'data-r7-common-card-icon-wrap']:
        assert phrase in doc
