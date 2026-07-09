from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-092-settings-greenhouse-zone-equipment-layout.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_zones() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{ greenhouseName: '제1온실', contextSource: 'r7-092-contract', zones: [
        {{ zoneId: 'zone-1', zoneName: '1구역', name: '1구역', purpose: '재배', area: '120㎡', bedCount: 6, currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토' }}, dataAvailability: {{ state: 'fresh' }}, equipmentProfile: {{ labels: ['천창','측창','WMC','센서 6'] }} }},
        {{ zoneId: 'zone-2', zoneName: '2구역', name: '2구역', purpose: '육묘', area: '80㎡', bedCount: 4, currentCrop: {{ crop_cycle_id: '18', crop_label_ko: '상추' }}, dataAvailability: {{ state: 'stale' }}, equipmentProfile: {{ labels: ['순환팬','관수밸브','센서 5'] }} }},
      ] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin','greenhouse-zones');
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def _fragment(html: str, marker: str, next_marker: str) -> str:
    start = html.index(marker)
    end = html.index(next_marker, start)
    return html[start:end]


def test_r7_092_version_surfaces_are_1_14_17():
    assert '"version": "1.14.90"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.90"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.90"' in _read(REBUILD_PANEL)


def test_r7_092_info_card_headers_have_common_status_badges():
    html = _render_greenhouse_zones()
    greenhouse = _fragment(html, 'data-r7-settings-info-card="greenhouse-basic-info"', 'data-r7-settings-info-card="zone-basic-info"')
    zone = _fragment(html, 'data-r7-settings-info-card="zone-basic-info"', 'data-r7-settings-info-card="equipment-composition"')
    for card in [greenhouse, zone]:
        assert 'data-r7-common-card-header' in card
        assert 'data-r7-record-card-badge' in card
        assert 'data-r7-record-status-key="normal-ready"' in card
        assert '정상' in card


def test_r7_092_info_card_bodies_show_only_requested_values():
    html = _render_greenhouse_zones()
    greenhouse = _fragment(html, 'data-r7-settings-info-card="greenhouse-basic-info"', 'data-r7-settings-info-card="zone-basic-info"')
    zone = _fragment(html, 'data-r7-settings-info-card="zone-basic-info"', 'data-r7-settings-info-card="equipment-composition"')
    for phrase in ['온실 기본 정보', '온실명', '제1온실', '위치', '경기 화성', '설치유형', 'NUC edge']:
        assert phrase in greenhouse
    for forbidden in ['운영상태', '활성</b>']:
        assert forbidden not in greenhouse
    for phrase in ['구역 기본 정보', '구역 용도', '재배', '면적', '120㎡', '배드 수', '6']:
        assert phrase in zone
    for forbidden in ['작물 연결', '미지정', '확인 필요', '구역 구성']:
        assert forbidden not in zone


def test_r7_092_card_layout_is_two_rows_then_full_width_zone_list():
    html = _render_greenhouse_zones()
    assert 'data-r7-settings-greenhouse-zones-layout="info-create-equipment-list"' in html
    assert 'data-r7-settings-info-row="overview"' in html
    assert 'data-r7-settings-create-row="create"' in html
    assert 'data-r7-settings-zone-list-panel-width="full"' in html
    order = [
        'data-r7-settings-info-card="greenhouse-basic-info"',
        'data-r7-settings-info-card="zone-basic-info"',
        'data-r7-settings-info-card="equipment-composition"',
        'data-r7-record-card-shell="settings-greenhouse-create"',
        'data-r7-record-card-shell="settings-zone-create"',
        'data-r7-record-card-shell="settings-equipment-mapping"',
        'data-r7-common-recent-panel="settings-zone-list"',
    ]
    positions = [html.index(marker) for marker in order]
    assert positions == sorted(positions)


def test_r7_092_required_cards_exist_with_expected_titles():
    html = _render_greenhouse_zones()
    for marker in [
        'data-r7-settings-info-card="equipment-composition"',
        'data-r7-record-card-shell="settings-greenhouse-create"',
        'data-r7-record-card-shell="settings-equipment-mapping"',
    ]:
        assert marker in html
    for phrase in ['장비 구성', '온실 생성', '구역 생성', '장치 연결 작성', '+ 새 온실 추가', '+ 새 구역 추가', '장치 연결 작성']:
        assert phrase in html


def test_r7_092_documented():
    doc = _read(DOC)
    for phrase in ['온실 기본 정보, 구역 기본 정보, 장비 구성', '온실 생성, 구역 생성, 장비 생성', '구역 목록', '상태 뱃지']:
        assert phrase in doc
