from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-090-settings-greenhouse-common-components.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_zones() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{ greenhouseName: '제1온실', contextSource: 'r7-090-contract', zones: [
        {{ zoneId: 'zone-1', zoneName: '1구역', name: '1구역', currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토' }}, dataAvailability: {{ state: 'fresh' }}, equipmentProfile: {{ labels: ['천창','측창','WMC','센서 6'] }} }},
        {{ zoneId: 'zone-2', zoneName: '2구역', name: '2구역', currentCrop: {{ crop_cycle_id: '18', crop_label_ko: '상추' }}, dataAvailability: {{ state: 'stale' }}, equipmentProfile: {{ labels: ['순환팬','관수밸브','센서 5'] }} }},
      ] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin','greenhouse-zones');
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_090_version_surfaces_are_1_14_15():
    assert '"version": "1.14.97"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.97"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.97"' in _read(REBUILD_PANEL)


def test_r7_090_settings_info_cards_use_new_common_component():
    source = _read(REBUILD_PANEL)
    assert 'renderR7SettingsInfoCard' in source
    assert 'renderR7SettingsInfoCard({' in source
    html = _render_greenhouse_zones()
    assert 'data-r7-settings-info-card="greenhouse-basic-info"' in html
    assert 'data-r7-cdb-common-card="summary-card"' in html
    assert 'data-r7-cdb-card-type="summary"' in html
    assert 'data-r7-cdb-subtab-content-layout="summary3-action3-list"' in html
    assert 'data-r7-cdb-layout-row="summary"' in html
    assert 'data-r7-cdb-layout-row="actions"' in html
    assert 'data-r7-cdb-layout-row="list"' in html
    assert html.count('data-r7-cdb-common-card="summary-card"') >= 3
    assert 'data-r7-settings-info-card="zone-basic-info"' in html
    assert 'data-r7-settings-info-card="equipment-composition"' in html
    assert 'data-r7-settings-greenhouse-summary-card="greenhouse-basic-info"' in html
    assert 'data-r7-settings-greenhouse-summary-card="zone-basic-info"' in html
    assert 'data-r7-settings-info-card="zone-create"' not in html


def test_r7_090_zone_create_uses_existing_record_card_shell():
    html = _render_greenhouse_zones()
    assert 'data-r7-record-card-shell="settings-zone-create"' in html
    assert 'data-r7-record-image-card="settings-zone-create"' in html
    assert 'data-r7-common-card-shell="settings-zone-create"' in html
    assert 'data-r7-settings-zone-create-card' in html
    assert 'data-r7-settings-zone-create-button' in html
    assert '+ 새 구역 추가' in html
    assert '구역을 추가하려면 승인 후 저장이 필요합니다' in html


def test_r7_090_zone_list_uses_existing_common_recent_components():
    html = _render_greenhouse_zones()
    assert 'data-r7-common-recent-panel="settings-zone-list"' in html
    assert 'data-r7-common-recent-row="settings-zone"' in html
    assert 'data-r7-settings-zone-list-panel' in html
    assert 'data-r7-settings-zone-list-panel-width="full"' in html
    for marker in ['data-r7-settings-zone-list-row="zone-1"', 'data-r7-settings-zone-list-row="zone-2"', 'data-r7-settings-zone-row="zone-1"', 'data-r7-settings-zone-row="zone-2"']:
        assert marker in html
    for phrase in ['1구역', '2구역', '토마토', '상추', '현재 작기 17', '현재 작기 18']:
        assert phrase in html


def test_r7_090_removed_detail_and_removed_cards_stay_absent():
    html = _render_greenhouse_zones()
    for forbidden in [
        'data-r7-settings-zone-detail-panel',
        'data-r7-settings-greenhouse-summary-card="data-health"',
        'data-r7-settings-greenhouse-summary-card="zone-current-crop"',
        '선택 구역 상세',
        '데이터 상태',
        '구역별 현재 작기',
    ]:
        assert forbidden not in html


def test_r7_090_documented():
    doc = _read(DOC)
    for phrase in ['renderR7SettingsInfoCard', 'Record Card Shell', 'renderR7CommonRecentPanel', '구역 생성', '구역 목록']:
        assert phrase in doc
