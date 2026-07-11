from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_device_mapping() -> str:
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
      panel._activeR7DomainSubtabs = {{ ...panel._activeR7DomainSubtabs, 'settings-admin': 'device-sensor-mapping' }};
      panel._homeContext = {{
        actorRole: 'admin', greenhouseName: '대표 온실',
        zones: [
          {{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역', currentCrop: {{ crop_label_ko: '토마토' }}, equipmentProfile: {{ labels: ['온도 센서', '습도 센서', '천창 모터'] }}, dataAvailability: {{ state: 'fresh' }} }},
          {{ id: 'zone-b', zoneId: 'zone-b', zoneName: 'B구역', name: 'B구역', currentCrop: {{ crop_label_ko: '딸기' }}, equipmentProfile: {{ labels: ['EC 센서', '관수 밸브'] }}, dataAvailability: {{ state: 'stale' }} }}
        ]
      }};
      panel._settingsGreenhouseZoneData = {{
        source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}],
        zones: panel._homeContext.zones,
        deviceSensorMappings: [
          {{ id: 10, zoneId: 'zone-a', zoneName: 'A구역', mappingRole: '환경 센서 그룹', sensorEntity: 'sensor.a_temperature', deviceEntity: 'switch.a_roof_motor', protocol: 'HA entity', direction: 'sensor_to_device', status: 'active', note: '천창 제어 기준' }},
          {{ id: 11, zoneId: 'zone-b', zoneName: 'B구역', mappingRole: '관수 그룹', sensorEntity: 'sensor.b_ec', deviceEntity: 'switch.b_irrigation_valve', protocol: 'HA entity', direction: 'sensor_to_device', status: 'inactive', note: '점검 필요' }}
        ]
      }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsAdminZoneVisual() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_115_version_surfaces_are_1_14_49():
    assert '"version": "1.15.21"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.21"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.21"' in _read(REBUILD_PANEL)


def test_r7_115_device_mapping_removes_selected_zone_and_uses_requested_card_labels():
    html = _render_device_mapping()
    for marker in (
        'data-r7-settings-device-sensor-mapping',
        'data-r7-settings-device-mapping-layout="error-device-group-device-list"',
        'data-r7-settings-device-summary-grid',
        'data-r7-settings-device-card="device-basic"',
        'data-r7-settings-device-card="group-basic"',
        'data-r7-settings-device-card="error-basic"',
        'data-r7-settings-device-error-common-card="approval-needed"',
        'data-r7-settings-device-action-row',
        'data-r7-settings-device-list-panel',
    ):
        assert marker in html
    for text in ('장치 연결 작성', '장치 기본 정보', '그룹 기본 정보', '오류 기본 정보', '장치 추가', '그룹 추가', '장치 목록'):
        assert text in html
    for text in ('미연결', '통신 오류', '장치 오류', '센서', '장치', '센서 그룹', '장치 그룹', '관수 그룹', '장치 연결'):
        assert text in html
    assert 'data-r7-settings-device-create-button' in html
    assert 'data-r7-settings-device-group-create-button' in html
    for forbidden in ('data-r7-settings-device-selected-zone-strip', 'data-r7-settings-device-process-summary', 'data-r7-settings-device-action-card="mapping"', '장치 구성', '그룹 구성', '매핑 목록'):
        assert forbidden not in html
    assert 'data-r7-settings-device-action-row style="display:grid;grid-template-columns:repeat(3,minmax(210px,1fr));gap:12px;"' in html


def test_r7_115_device_mapping_uses_only_cdb_card_grammar_for_rows():
    html = _render_device_mapping()
    assert html.count('data-r7-cdb-common-card="summary-card"') >= 3
    assert html.count('data-r7-cdb-card-type="summary"') >= 3
    assert html.count('data-r7-cdb-card-type="button-one"') >= 1
    assert html.count('data-r7-cdb-card-type="button-two"') >= 2
    error_card_start = html.index('data-r7-settings-device-card="error-basic"')
    device_card_start = html.index('data-r7-settings-device-card="device-basic"')
    group_card_start = html.index('data-r7-settings-device-card="group-basic"')
    assert error_card_start < device_card_start < group_card_start
    error_card_end = html.index('</article>', error_card_start)
    error_card = html[error_card_start:error_card_end]
    assert 'data-r7-settings-device-error-common-card="approval-needed"' in error_card
    assert 'data-r7-cdb-card-type="summary"' in error_card
    assert 'data-r7-cdb-common-card="summary-card"' in error_card
    assert 'data-r7-settings-device-action-card="device-create"' in html
    assert 'data-r7-settings-device-action-card="device-link"' in html
    assert 'data-r7-settings-device-action-card="group-add"' in html
    assert html.index('data-r7-settings-device-action-card="device-create"') < html.index('data-r7-settings-device-action-card="device-link"')
    assert 'data-r7-settings-device-action-card="device-add"' not in html


def test_r7_115_device_button_two_cards_have_common_subtitles():
    html = _render_device_mapping()
    expectations = {
        'device-create': '먼저 장치를 등록',
        'device-link': '장치와 센서 연결',
        'group-add': '구역 FK 필수',
    }
    for card, subtitle in expectations.items():
        marker_at = html.index(f'data-r7-settings-device-action-card="{card}"')
        start = html.rindex('<article', 0, marker_at)
        end = html.index('</article>', marker_at)
        snippet = html[start:end]
        expected_type = 'button-one' if card == 'device-create' else 'button-two'
        assert f'data-r7-cdb-card-type="{expected_type}"' in snippet
        assert 'data-r7-common-card-subtitle' in snippet
        assert subtitle in snippet


def test_r7_115_device_group_process_is_documented_not_rendered_as_guidance_box():
    html = _render_device_mapping()
    for marker in (
        'data-r7-settings-device-process="device-add-first"',
        'data-r7-settings-device-process="group-create-zone-fk"',
        'data-r7-settings-device-process="group-device-link"',
        'data-r7-settings-device-group-zone-fk="required"',
        'data-r7-settings-device-group-link-stage="device-to-group"',
    ):
        assert marker in html
    for forbidden_text in ('1. 장치 추가', '2. 그룹 추가', '3. 그룹에 장치 연결', '그룹 생성 단계에서 구역 정보를 외래키로 저장', '하나의 장치를 여러 그룹에 연결할 수 있습니다'):
        assert forbidden_text not in html


def test_r7_115_device_list_keeps_rows_and_old_flat_cards_removed():
    html = _render_device_mapping()
    for text in ('환경 센서 그룹', '관수 그룹', 'sensor.a_temperature', 'switch.a_roof_motor', 'sensor.b_ec', 'switch.b_irrigation_valve', '천창 제어 기준', '점검 필요'):
        assert text in html
    assert 'data-r7-settings-device-list-row="10"' in html
    assert 'data-r7-settings-device-list-row="11"' in html
    for old in ('data-r7-settings-device-sensor-card="zone-sensors"', 'data-r7-settings-device-sensor-card="zone-devices"', 'data-r7-settings-device-sensor-card="ha-entity"', 'data-r7-settings-device-sensor-card="mapping-health"', 'data-r7-settings-device-mapping-list-panel'):
        assert old not in html


def _render_device_common_create_modal(kind: str) -> str:
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
      panel._homeContext = {{ greenhouseName: '대표 온실', zones: [{{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역' }}] }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: panel._homeContext.zones, deviceSensorMappings: [] }};
      let html = '';
      if ({kind!r} === 'device') {{ panel._openSettingsDeviceCreateModal(); html = panel.renderR7SettingsDeviceCreateModal(); }}
      if ({kind!r} === 'group') {{ panel._openSettingsDeviceGroupCreateModal(); html = panel.renderR7SettingsDeviceGroupCreateModal(); }}
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_115_device_add_uses_greenhouse_create_common_modal_grammar():
    html = _render_device_common_create_modal('device')
    for marker in (
        'data-r7-settings-device-create-modal="true"',
        'data-r7-settings-create-growth-like-modal="true"',
        'data-r7-settings-create-left-form',
        'data-r7-settings-create-section="basic-info"',
        'data-r7-settings-create-section="device-target"',
        'data-r7-settings-create-section="memo"',
        'data-r7-settings-create-pre-save-checklist',
        'data-r7-record-pre-save-checklist',
        'data-r7-settings-device-create-form',
    ):
        assert marker in html
    for text in ('장치 생성', '장치명', '장치 유형', 'HA entity', '장치 저장', '저장 전 검증'):
        assert text in html


def test_r7_115_group_add_uses_greenhouse_create_common_modal_grammar_with_zone_fk():
    html = _render_device_common_create_modal('group')
    for marker in (
        'data-r7-settings-device-group-create-modal="true"',
        'data-r7-settings-create-growth-like-modal="true"',
        'data-r7-settings-create-left-form',
        'data-r7-settings-create-section="basic-info"',
        'data-r7-settings-create-section="zone-fk"',
        'data-r7-settings-create-section="memo"',
        'data-r7-settings-create-pre-save-checklist',
        'data-r7-record-pre-save-checklist',
        'data-r7-settings-device-group-create-form',
        'data-r7-settings-device-group-zone-fk-select',
    ):
        assert marker in html
    for text in ('그룹 생성', '그룹명', '구역 FK', 'A구역', '그룹 저장', '저장 전 검증'):
        assert text in html
