from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-094-settings-info-card-header-subtitle.md"


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


def _card(html: str, marker: str, next_marker: str) -> str:
    start = html.index(marker)
    end = html.index(next_marker, start)
    return html[start:end]


def test_r7_094_version_surfaces_are_1_14_19():
    assert '"version": "1.15.32"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.32"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.32"' in _read(REBUILD_PANEL)


def test_r7_094_settings_info_subtitle_is_inside_header_headline_next_to_icon():
    html = _render_greenhouse_zones()
    cards = [
        _card(html, 'data-r7-settings-info-card="greenhouse-basic-info"', 'data-r7-settings-info-card="zone-basic-info"'),
        _card(html, 'data-r7-settings-info-card="zone-basic-info"', 'data-r7-settings-info-card="equipment-composition"'),
        _card(html, 'data-r7-settings-info-card="equipment-composition"', 'data-r7-settings-create-row="create"'),
    ]
    for card in cards:
        match = re.search(r'<header[^>]*data-r7-common-card-header.*?</header>', card, flags=re.S)
        assert match
        header = match.group(0)
        assert 'data-r7-common-card-icon-wrap' in header
        assert 'data-r7-common-card-title-stack' in header
        assert 'data-r7-common-card-subtitle' in header
        assert header.index('data-r7-common-card-icon-wrap') < header.index('data-r7-common-card-title') < header.index('data-r7-common-card-subtitle')
        assert 'data-r7-record-card-badge' in header
        assert header.index('data-r7-common-card-subtitle') < header.index('data-r7-record-card-badge')


def test_r7_094_settings_info_primary_is_not_rendered_as_separate_body_line():
    html = _render_greenhouse_zones()
    for forbidden in ['data-r7-settings-info-card-primary', '운영 기준 데이터</span>\n      <div data-r7-settings-info-card-body']:
        assert forbidden not in html
    for phrase in ['운영 기준 데이터', '1구역', '선택 구역 상태']:
        assert phrase in html


def test_r7_094_documented():
    doc = _read(DOC)
    for phrase in ['아이콘 ㅣ 제목', '부연 설명', 'data-r7-common-card-subtitle', '제목 stack']:
        assert phrase in doc
