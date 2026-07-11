from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
PLAN = ROOT / "docs/plans/2026-07-06-device-connection-authoring-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _node_render(expr: str) -> str:
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#settings-admin' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, states: {{
        'sensor.unlinked_temp_humidity': {{ entity_id: 'sensor.unlinked_temp_humidity', attributes: {{ friendly_name: '미연결 온습도 센서' }} }},
        'sensor.linked_temperature': {{ entity_id: 'sensor.linked_temperature', attributes: {{ friendly_name: '연결 온도 센서' }} }},
        'switch.unlinked_roof_window': {{ entity_id: 'switch.unlinked_roof_window', attributes: {{ friendly_name: '미연결 천창' }} }},
        'fan.unlinked_exhaust': {{ entity_id: 'fan.unlinked_exhaust', attributes: {{ friendly_name: '미연결 배기팬' }} }},
      }}, callApi: async () => ({{}}) }};
      panel._activeR7Domain = 'settings-admin';
      panel._activeR7DomainSubtabs = {{ ...panel._activeR7DomainSubtabs, 'settings-admin': 'device-sensor-mapping' }};
      panel._homeContext = {{ actorRole: 'admin', greenhouseName: '대표 온실', zones: [{{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역' }}] }};
      panel._settingsGreenhouseZoneData = {{
        source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: panel._homeContext.zones,
        devices: [{{ id: 'dev-1', deviceName: '연결 온도 센서', deviceType: '온습도 센서', entityId: 'sensor.linked_temperature', zoneId: 'zone-a', status: 'active' }}],
        deviceGroups: [{{ id: 'grp-1', groupName: '기존 관수 그룹', groupType: '관수 그룹', zoneId: 'zone-a', deviceIds: ['dev-1'], status: 'active' }}],
        deviceSensorMappings: [
          {{ id: 'dev-1', zoneId: 'zone-a', zoneName: 'A구역', deviceName: '연결 온도 센서', deviceType: '온습도 센서', mappingRole: '온습도 센서', sensorEntity: 'sensor.linked_temperature', deviceEntity: 'sensor.linked_temperature', entityId: 'sensor.linked_temperature', status: 'active', groupId: 'grp-1', note: '이미 그룹 등록' }},
          {{ id: 'dev-2', zoneId: 'zone-a', zoneName: 'A구역', deviceName: '천창 1', deviceType: '천창 장치', mappingRole: '천창 장치', sensorEntity: 'switch.unlinked_roof_window', deviceEntity: 'switch.unlinked_roof_window', entityId: 'switch.unlinked_roof_window', status: 'active', note: '그룹 미등록' }}
        ]
      }};
      const html = {expr};
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_128_version_surfaces_are_1_14_85():
    assert '"version": "1.15.16"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.16"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.16"' in _read(REBUILD_PANEL)


def test_r7_128_plan_is_recorded_before_implementation():
    text = _read(PLAN)
    for phrase in ('장치 연결 작성', '장비 엔티티 ID', '장비종류', '장치명', '그룹 목록', '다중 선택'):
        assert phrase in text


def test_r7_128_settings_tab_and_button_use_device_connection_authoring_label():
    html = _node_render('panel.renderR7SettingsAdminZoneVisual()')
    for phrase in ('장치 연결 작성', '장치 연결', '장치 목록', '그룹 목록'):
        assert phrase in html
    assert '장치·그룹' not in html


def test_r7_128_device_connection_modal_has_unlinked_ha_entity_and_equipment_type_dropdowns():
    html = _node_render('(panel._openSettingsDeviceSensorMappingModal(), panel.renderR7SettingsDeviceSensorMappingModal())')
    for marker in (
        'data-r7-settings-device-connection-authoring-modal="true"',
        'data-r7-settings-unlinked-ha-entity-select',
        'data-r7-settings-unlinked-ha-entity-option',
        'data-r7-settings-equipment-kind-select',
        'data-r7-settings-device-name-input',
    ):
        assert marker in html
    assert 'sensor.unlinked_temp_humidity' in html
    assert 'fan.unlinked_exhaust' in html
    assert 'sensor.linked_temperature' not in html
    assert 'switch.unlinked_roof_window' not in html
    for option in ('온습도 센서', 'CO2 센서', '일사 센서', 'VWC 센서', '천창 장치', '측창 장치', '스크린 장치', '유동팬 장치', '배기팬 장치', '관수 장치'):
        assert option in html
    assert '역할' not in html


def test_r7_128_device_list_modal_has_edit_delete_footer_and_no_bottom_close_button():
    html = _node_render('(panel._openSettingsDeviceListModal(), panel.renderR7SettingsShortcutCdaSplitModal())')
    for marker in (
        'data-r7-settings-device-list-cda-modal="true"',
        'data-r7-settings-device-list-detail-panel',
        'data-r7-settings-device-edit-button',
        'data-r7-settings-device-delete-button',
        'data-r7-cdb-positive-action="edit"',
        'data-r7-cdb-negative-action="delete"',
    ):
        assert marker in html
    assert '천창 1' in html
    assert 'switch.unlinked_roof_window' in html
    footer_start = html.index('data-r7-cda-entity-detail-footer="equipment-info"')
    footer = html[footer_start:html.index('</footer>', footer_start)]
    assert '>닫기<' not in footer


def test_r7_128_group_create_modal_lists_only_connected_ungrouped_devices_as_checkboxes():
    html = _node_render('(panel._openSettingsDeviceGroupCreateModal(), panel.renderR7SettingsDeviceGroupCreateModal())')
    for marker in (
        'data-r7-settings-device-group-candidate-checkbox',
        'name="deviceIds"',
        'data-r7-settings-device-group-ungrouped-only="true"',
        'data-r7-settings-device-group-multi-select="true"',
    ):
        assert marker in html
    assert '천창 1' in html
    assert 'switch.unlinked_roof_window' in html
    assert '연결 온도 센서' not in html


def test_r7_128_group_list_button_opens_group_list_cda_modal():
    html = _node_render('(panel._openSettingsDeviceGroupListModal(), panel.renderR7SettingsShortcutCdaSplitModal())')
    for marker in (
        'data-r7-settings-device-group-list-cda-modal="true"',
        'data-r7-settings-device-group-list-detail-panel',
        '기존 관수 그룹',
        '관수 그룹',
    ):
        assert marker in html
