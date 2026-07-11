from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-088-settings-greenhouse-zone-cards.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_zones() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._homeContext = {{ greenhouseName: '제1온실', contextSource: 'r7-088-compat-contract', zones: [
        {{ zoneId: 'zone-1', zoneName: '1구역', name: '1구역', currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토', crop_type: 'tomato', growth_stage: '착과기' }}, dataAvailability: {{ state: 'fresh', freshnessMinutes: 1 }}, equipmentProfile: {{ labels: ['천창', '측창', 'WMC', '센서 6'] }} }},
        {{ zoneId: 'zone-2', zoneName: '2구역', name: '2구역', currentCrop: {{ crop_cycle_id: '18', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착' }}, dataAvailability: {{ state: 'stale', freshnessMinutes: 32 }}, equipmentProfile: {{ labels: ['순환팬', '관수밸브', '센서 5'] }} }},
      ] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin', 'greenhouse-zones');
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_088_version_surfaces_are_current():
    assert '"version": "1.15.35"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.35"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.35"' in _read(REBUILD_PANEL)


def test_r7_088_greenhouse_zone_subtab_keeps_reference_card_foundation_after_simplification():
    html = _render_greenhouse_zones()
    assert 'data-r7-settings-greenhouse-zones' in html
    assert 'data-r7-settings-greenhouse-zones-layout="info-create-equipment-list"' in html
    for card in ['greenhouse-basic-info', 'zone-basic-info', 'equipment-composition', 'zone-create']:
        assert f'data-r7-settings-greenhouse-summary-card="{card}"' in html
    for legacy_marker in ['data-r7-settings-greenhouse-card="greenhouse-profile"', 'data-r7-settings-greenhouse-card="zone-count"']:
        assert legacy_marker in html
    for phrase in ['온실 기본 정보', '구역 기본 정보', '장비 구성', '구역 생성', '구역 목록']:
        assert phrase in html


def test_r7_088_zone_list_uses_real_zone_context_without_selected_detail_panel():
    html = _render_greenhouse_zones()
    for marker in ['data-r7-settings-zone-table-header', 'data-r7-settings-zone-list-row="zone-1"', 'data-r7-settings-zone-list-row="zone-2"', 'data-r7-settings-zone-row="zone-1"', 'data-r7-settings-zone-row="zone-2"']:
        assert marker in html
    for phrase in ['1구역', '2구역', '토마토', '상추', '현재 작기 17', '현재 작기 18']:
        assert phrase in html
    assert 'data-r7-settings-zone-detail-panel' not in html
    assert 'data-r7-settings-selected-zone-detail-card' not in html


def test_r7_088_greenhouse_zone_cards_use_ha_icons_and_no_fixture_warning_copy():
    html = _render_greenhouse_zones()
    for icon in ['mdi:greenhouse', 'mdi:view-grid-outline', 'mdi:plus-circle-outline']:
        assert f'icon="{icon}"' in html
    assert 'static-fixture-before-api' not in html
    assert 'Developer-only' not in html


def test_r7_088_documented():
    doc = _read(DOC)
    for phrase in ['온실 기본 정보', '구역 구성', '구역 생성', '구역 목록']:
        assert phrase in doc
