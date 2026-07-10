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
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#settings-admin' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._activeR7Domain = 'settings-admin';
      panel._activeR7DomainSubtabs = {{ ...panel._activeR7DomainSubtabs, 'settings-admin': 'greenhouse-zones' }};
      panel._homeContext = {{
        actorRole: 'admin', greenhouseName: '대표 온실',
        zones: [
          {{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역', purpose: '재배', area: '120㎡', bedCount: 6, currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토' }}, dataAvailability: {{ state: 'fresh' }}, equipmentProfile: {{ labels: ['온도 센서', '습도 센서', '천창 모터'] }} }},
          {{ id: 'zone-b', zoneId: 'zone-b', zoneName: 'B구역', name: 'B구역', purpose: '육묘', area: '80㎡', bedCount: 4, currentCrop: {{ crop_cycle_id: '18', crop_label_ko: '딸기' }}, dataAvailability: {{ state: 'stale' }}, equipmentProfile: {{ labels: ['EC 센서', '관수 밸브'] }} }}
        ]
      }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsAdminZoneVisual() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_119_version_surfaces_are_1_14_80():
    assert '"version": "1.15.07"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.07"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.07"' in _read(REBUILD_PANEL)


def test_r7_119_greenhouse_zone_uses_only_cdb_card_grammar_for_rows():
    html = _render_greenhouse_zones()
    assert 'data-r7-settings-greenhouse-zones' in html
    assert 'data-r7-cdb-subtab-content-layout="summary3-action3-list"' in html
    assert 'data-r7-cdb-layout-row="summary"' in html
    assert 'data-r7-cdb-layout-row="actions"' in html
    assert 'data-r7-cdb-layout-row="list"' in html
    assert html.count('data-r7-cdb-common-card="summary-card"') >= 3
    assert html.count('data-r7-cdb-card-type="summary"') >= 3
    assert html.count('data-r7-cdb-card-type="button-two"') >= 3
    assert html.count('data-r7-cdb-card-type="list"') >= 1
    for card in ('greenhouse-basic-info', 'zone-basic-info', 'equipment-composition'):
        start = html.index(f'data-r7-settings-greenhouse-summary-card="{card}"')
        end = html.index('</article>', start)
        snippet = html[start:end]
        assert 'data-r7-cdb-card-type="summary"' in snippet
        assert 'data-r7-cdb-common-card="summary-card"' in snippet
    for card in ('settings-greenhouse-create', 'settings-zone-create', 'settings-equipment-mapping'):
        marker_at = html.index(f'data-r7-settings-create-card="{card}"')
        start = html.rindex('<article', 0, marker_at)
        end = html.index('</article>', marker_at)
        snippet = html[start:end]
        assert 'data-r7-cdb-card-type="button-two"' in snippet
        assert 'data-r7-cdb-common-card="button-2-card"' in snippet


def test_r7_119_greenhouse_zone_action_row_is_three_button_cards_in_order():
    html = _render_greenhouse_zones()
    greenhouse = 'data-r7-settings-create-card="settings-greenhouse-create"'
    zone = 'data-r7-settings-create-card="settings-zone-create"'
    mapping = 'data-r7-settings-create-card="settings-equipment-mapping"'
    assert greenhouse in html
    assert zone in html
    assert mapping in html
    assert html.index(greenhouse) < html.index(zone) < html.index(mapping)
    for text in ('온실 생성', '+ 새 온실 추가', '온실 정보', '구역 생성', '+ 새 구역 추가', '구역 목록', '장치 연결 작성', '장치 연결 작성', '장치 목록'):
        assert text in html


def test_r7_119_greenhouse_zone_button_two_cards_have_common_subtitles():
    html = _render_greenhouse_zones()
    expectations = {
        'settings-greenhouse-create': '새 온실 없음',
        'settings-zone-create': '새 구역 없음',
        'settings-equipment-mapping': '매핑 확인 필요',
    }
    for card, subtitle in expectations.items():
        marker_at = html.index(f'data-r7-settings-create-card="{card}"')
        start = html.rindex('<article', 0, marker_at)
        end = html.index('</article>', marker_at)
        snippet = html[start:end]
        assert 'data-r7-cdb-card-type="button-two"' in snippet
        assert 'data-r7-common-card-subtitle' in snippet
        assert subtitle in snippet


def test_r7_119_documented():
    doc = _read(DOC)
    for phrase in ('CDB card grammar hotfix in v1.15.07', 'summary row: 3 summary cards', 'action row: 3 two-button cards', 'list row: 1 list card'):
        assert phrase in doc
