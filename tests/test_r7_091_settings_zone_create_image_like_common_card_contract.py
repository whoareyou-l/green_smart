from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-091-settings-zone-create-image-like-common-card.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_zones() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{ greenhouseName: '제1온실', contextSource: 'r7-091-contract', zones: [
        {{ zoneId: 'zone-1', zoneName: '1구역', name: '1구역', currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토' }}, dataAvailability: {{ state: 'fresh' }}, equipmentProfile: {{ labels: ['천창','측창','WMC','센서 6'] }} }},
      ] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin','greenhouse-zones');
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def _zone_create_fragment(html: str) -> str:
    marker = 'data-r7-common-card-shell="settings-zone-create"'
    start = html.index(marker)
    end = html.index('data-r7-common-recent-panel="settings-zone-list"')
    return html[start:end]


def test_r7_091_version_surfaces_are_1_14_16():
    assert '"version": "1.15.47"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.47"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.47"' in _read(REBUILD_PANEL)


def test_r7_091_zone_create_matches_image_like_common_card_shape():
    html = _render_greenhouse_zones()
    card = _zone_create_fragment(html)
    assert 'data-r7-common-card-shell="settings-zone-create"' in card
    assert 'data-r7-record-card-shell="settings-zone-create"' in card
    assert 'data-r7-record-card-header' in card
    assert 'data-r7-record-card-primary' in card
    assert 'data-r7-record-card-note' in card
    assert 'data-r7-record-card-action-row' in card
    assert 'data-r7-common-card-data-row="settings-zone-create"' not in card


def test_r7_091_zone_create_copy_and_buttons_match_reference_card_pattern():
    html = _render_greenhouse_zones()
    card = _zone_create_fragment(html)
    for phrase in ['구역 생성', '새 구역 없음', '구역을 추가하려면 승인 후 저장이 필요합니다', '+ 새 구역 추가', '구역 목록']:
        assert phrase in card
    assert 'data-r7-record-status-key="due-today"' in card
    assert '오늘 필요' in card
    assert card.count('data-r7-common-card-button') >= 2
    assert 'data-r7-settings-zone-create-button' in card
    assert 'data-r7-settings-zone-list-shortcut-button' in card


def test_r7_091_documented():
    doc = _read(DOC)
    for phrase in ['이미지형 공통 카드', 'primary + note + action buttons', 'data row를 사용하지 않는다', 'due-today']:
        assert phrase in doc
