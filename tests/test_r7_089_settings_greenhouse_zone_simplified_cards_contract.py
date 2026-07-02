from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-089-settings-greenhouse-zone-simplified-cards.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_zones() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{
        greenhouseName: '제1온실',
        contextSource: 'r7-089-contract',
        zones: [
          {{ zoneId: 'zone-1', zoneName: '1구역', name: '1구역', currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토', crop_type: 'tomato', growth_stage: '착과기' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:17' }}, dataAvailability: {{ state: 'fresh', freshnessMinutes: 1 }}, equipmentProfile: {{ labels: ['천창', '측창', 'WMC', '센서 6'] }} }},
          {{ zoneId: 'zone-2', zoneName: '2구역', name: '2구역', currentCrop: {{ crop_cycle_id: '18', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:18' }}, dataAvailability: {{ state: 'stale', freshnessMinutes: 32 }}, equipmentProfile: {{ labels: ['순환팬', '관수밸브', '센서 5'] }} }},
        ]
      }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin', 'greenhouse-zones');
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_089_version_surfaces_are_1_14_14():
    assert '"version": "1.14.53"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.53"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.53"' in _read(REBUILD_PANEL)


def test_r7_089_greenhouse_zone_top_cards_are_basic_composition_create_only():
    html = _render_greenhouse_zones()
    assert 'data-r7-settings-greenhouse-zones-layout="info-create-equipment-list"' in html
    for card in ['greenhouse-basic-info', 'zone-basic-info', 'equipment-composition', 'zone-create']:
        assert f'data-r7-settings-greenhouse-summary-card="{card}"' in html
    assert html.index('data-r7-settings-greenhouse-summary-card="zone-basic-info"') < html.index('data-r7-record-card-shell="settings-zone-create"')
    for forbidden_card in ['zone-current-crop', 'data-health']:
        assert f'data-r7-settings-greenhouse-summary-card="{forbidden_card}"' not in html
    for forbidden_text in ['구역별 현재 작기', '데이터 상태', '선택 구역 상세', '대표 센서', '제어 장비 매핑']:
        assert forbidden_text not in html
    for phrase in ['온실 기본 정보', '구역 기본 정보', '장비 구성', '구역 생성', '+ 새 구역 추가']:
        assert phrase in html


def test_r7_089_greenhouse_zone_list_is_single_main_panel_without_detail_panel():
    html = _render_greenhouse_zones()
    assert 'data-r7-settings-zone-list-panel' in html
    assert 'data-r7-settings-zone-list-panel-width="full"' in html
    assert 'data-r7-settings-zone-detail-panel' not in html
    assert 'data-r7-settings-selected-zone-detail-card' not in html
    for marker in ['data-r7-settings-zone-table-header', 'data-r7-settings-zone-list-row="zone-1"', 'data-r7-settings-zone-list-row="zone-2"']:
        assert marker in html
    for phrase in ['1구역', '2구역', '토마토', '상추', '현재 작기 17', '현재 작기 18', '센서 1 · 장치 3']:
        assert phrase in html


def test_r7_089_greenhouse_create_card_uses_ha_icon_and_mutation_boundary():
    html = _render_greenhouse_zones()
    assert 'icon="mdi:plus-circle-outline"' in html
    assert 'data-r7-settings-zone-create-card' in html
    assert 'data-r7-settings-zone-create-button' in html
    assert '구역을 추가하려면 승인 후 저장이 필요합니다' in html
    assert 'static-fixture-before-api' not in html
    assert 'Developer-only' not in html


def test_r7_089_documented():
    doc = _read(DOC)
    for phrase in ['데이터 상태 삭제', '선택 구역 상세 삭제', '구역별 현재 작기 삭제', '구역 생성 카드', 'basic-composition-create-list']:
        assert phrase in doc
