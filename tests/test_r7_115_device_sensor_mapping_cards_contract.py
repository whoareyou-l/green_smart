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
        haDevices: [
          {{ haDeviceId: 'ha-device-roof-window', deviceName: 'HA 천창 컨트롤러', manufacturer: 'HA', model: 'Cover', entityCount: 4 }},
          {{ haDeviceId: 'ha-device-irrigation', deviceName: 'HA 관수 밸브', manufacturer: 'HA', model: 'Switch', entityCount: 2 }}
        ],
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
    assert '"version": "1.15.59"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.59"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.59"' in _read(REBUILD_PANEL)


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
    for text in ('전체 장치', '구역 장치', '관수그룹 장치', '장치 추가', '관수그룹 장치 연결', '장치 목록', 'HA로 이동', 'HA 천창 컨트롤러'):
        assert text in html
    for text in ('연결', '미연결', '장치오류', '센서', '복합환경제어반 장치', '기타 장치', '양액기 센서', '양액기 장치', '배액기 센서', '구역 장치 연결'):
        assert text in html
    assert 'data-r7-settings-ha-devices-page-button' in html
    assert 'data-r7-settings-ha-device-list-card="true"' in html
    assert 'data-r7-settings-ha-device-card-row="ha-device-roof-window"' in html
    assert 'data-r7-settings-device-create-button' not in html
    assert 'data-r7-settings-device-group-create-button' in html
    for forbidden in ('data-r7-settings-device-selected-zone-strip', 'data-r7-settings-device-process-summary', 'data-r7-settings-device-action-card="mapping"', '장치 구성', '그룹 구성', '매핑 목록'):
        assert forbidden not in html
    assert 'data-r7-settings-device-action-row style="display:grid;grid-template-columns:repeat(3,minmax(210px,1fr));gap:12px;"' in html


def test_r7_115_irrigation_group_device_link_button_opens_dedicated_modal_not_group_create():
    html = _render_device_mapping()
    group_start = html.index('data-r7-settings-device-action-card="group-add"')
    group_card = html[html.rindex('<article', 0, group_start):html.index('</article>', group_start)]
    assert '관수그룹 장치 연결' in group_card
    assert 'data-r7-settings-irrigation-group-device-link-button' in group_card
    assert 'data-r7-settings-device-process="irrigation-group-device-link"' in group_card
    assert 'data-r7-settings-device-group-create-button' not in group_card
    assert '관수그룹 연결' not in group_card


def test_r7_115_irrigation_group_device_link_modal_fields_and_save_contract():
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
      panel._settingsGreenhouseZoneData = {{
        source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: panel._homeContext.zones,
        irrigationGroups: [{{ id: 7, zoneId: 'zone-a', zoneName: 'A구역', irrigationGroupName: 'A구역 관수그룹 1' }}],
        devices: [{{ id: 9, deviceName: 'A구역 양액기', deviceType: '양액기', entityId: 'switch.a_fertigation', status: 'active' }}],
        deviceSensorMappings: []
      }};
      panel._openSettingsIrrigationGroupDeviceLinkModal();
      console.log(JSON.stringify({{ html: panel.renderR7SettingsIrrigationGroupDeviceLinkModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    for marker in (
        'data-r7-settings-irrigation-group-device-link-modal="true"',
        'data-r7-settings-irrigation-group-device-link-form',
        'data-r7-settings-irrigation-group-device-link-group-fk-select',
        'data-r7-settings-irrigation-group-device-link-role-select',
        'data-r7-settings-irrigation-group-device-link-component-type-select',
        'data-r7-settings-irrigation-group-device-link-io-type-select',
        'data-r7-settings-irrigation-group-device-link-control-target-select',
        'data-r7-settings-irrigation-group-device-link-nutrient-channel-select',
        'data-r7-settings-irrigation-group-device-link-device-fk-select',
        'data-r7-settings-irrigation-group-device-link-entity-input',
        'data-r7-settings-irrigation-group-device-link-unit-input',
        'data-r7-settings-irrigation-group-device-link-normal-range-input',
        'data-r7-settings-irrigation-group-device-link-status-select',
    ):
        assert marker in html
    for phrase in ('관수그룹 장치 연결', '관수그룹 장치 연결 저장', '관수그룹', '상위 역할', '구성요소 상세', '구성요소 유형', '입출력 유형', '제어/측정 대상', '계통/채널', '양액기 센서', '양액기 액추에이터', '양액기 유량계', '원수/급수 장치', '관수그룹 공급장치', '배액기 센서', '배액기 장치', 'EC 센서', 'pH 센서', '급액 유량계', '원수 유량계', 'EC 조절 솔밸브', 'pH 조절 솔밸브', '원수 유입 모터', '급수 모터', '관수그룹 공급 솔밸브', 'Entity 연결', '대표 Entity', '단위', '정상 범위', '연결 상태', '장치오류', 'A구역 관수그룹 1', 'A구역 양액기'):
        assert phrase in html
    assert '관수그룹 생성' not in html


def test_r7_115_irrigation_group_device_link_db_api_contract_exists():
    db = (ROOT / 'custom_components/green_smart/db.py').read_text(encoding='utf-8')
    backend = (ROOT / 'custom_components/green_smart/rebuild_settings_write_views.py').read_text(encoding='utf-8')
    init = (ROOT / 'custom_components/green_smart/__init__.py').read_text(encoding='utf-8')
    for literal in (
        'CREATE TABLE IF NOT EXISTS green_smart_settings_irrigation_group_device_links',
        'irrigation_group_id BIGINT NOT NULL',
        'device_id VARCHAR(128)',
        'device_entity VARCHAR(255)',
        'link_role VARCHAR(64)',
        'component_type VARCHAR(96)',
        'io_type VARCHAR(32)',
        'control_target VARCHAR(64)',
        'nutrient_channel VARCHAR(64)',
        'unit VARCHAR(32)',
        'normal_range VARCHAR(64)',
        'uniq_settings_irrigation_group_device_link',
    ):
        assert literal in db
    for literal in (
        'list_settings_irrigation_group_device_links',
        'create_settings_irrigation_group_device_link',
        'class RebuildSettingsIrrigationGroupDeviceLinkView',
        'url = "/api/green_smart/rebuild/settings/irrigation-group-device-links"',
        '"irrigationGroupDeviceLinks": irrigation_group_device_links',
        '"componentType": row.get("component_type")',
        '_str(payload, "componentType", "component_type"',
        '_str(payload, "ioType", "io_type"',
        '_str(payload, "controlTarget", "control_target"',
        '_str(payload, "nutrientChannel", "nutrient_channel"',
    ):
        assert literal in backend
    assert 'RebuildSettingsIrrigationGroupDeviceLinkView' in init
    assert 'hass.http.register_view(RebuildSettingsIrrigationGroupDeviceLinkView())' in init


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
        'device-create': '실제 HA 연동 기기 목록',
        'device-link': '구역 장치와 센서 연결',
        'group-add': '관수그룹 FK 필수',
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
        'data-r7-settings-device-process="ha-devices-page"',
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
        'data-r7-settings-create-section="irrigation-group-info"',
        'data-r7-settings-create-section="irrigation-method"',
        'data-r7-settings-create-section="irrigation-outlet-cultivation"',
        'data-r7-settings-create-section="memo"',
        'data-r7-settings-create-pre-save-checklist',
        'data-r7-record-pre-save-checklist',
        'data-r7-settings-device-group-create-form',
        'data-r7-settings-device-group-zone-fk-select',
    ):
        assert marker in html
    for text in ('관수그룹 생성', '관수그룹 정보', '구역', '관수그룹', '상태', '관수방법', '관수방법 상세', '순환 방식', '배액 재활용', '토출구 수', '기준 유량', 'L/h', '배드 수', '관수그룹 저장', '저장 전 검증'):
        assert text in html
    for forbidden in ('그룹 장치 선택', '장치 연결 정책', '그룹 유형', '공급 방식', '물량 계산 기준'):
        assert forbidden not in html
