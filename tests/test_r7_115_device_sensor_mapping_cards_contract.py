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


def test_r7_115_version_surfaces_are_1_14_47():
    assert '"version": "1.14.47"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.47"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.47"' in _read(REBUILD_PANEL)


def test_r7_115_device_mapping_removes_selected_zone_and_uses_requested_card_labels():
    html = _render_device_mapping()
    for marker in (
        'data-r7-settings-device-sensor-mapping',
        'data-r7-settings-device-mapping-layout="device-group-error-device-list"',
        'data-r7-settings-device-summary-grid',
        'data-r7-settings-device-card="device-basic"',
        'data-r7-settings-device-card="group-basic"',
        'data-r7-settings-device-card="error-basic"',
        'data-r7-settings-device-action-row',
        'data-r7-settings-device-list-panel',
    ):
        assert marker in html
    for text in ('장치 기본 정보', '그룹 기본 정보', '오류 기본 정보', '장치 추가', '그룹 추가', '장치 목록'):
        assert text in html
    for forbidden in ('data-r7-settings-device-selected-zone-strip', 'data-r7-settings-device-action-card="mapping"', '장치 구성', '그룹 구성', '매핑 목록'):
        assert forbidden not in html


def test_r7_115_device_group_process_is_device_add_then_group_with_zone_fk_then_group_device_link():
    html = _render_device_mapping()
    for marker in (
        'data-r7-settings-device-process="device-add-first"',
        'data-r7-settings-device-process="group-create-zone-fk"',
        'data-r7-settings-device-process="group-device-link"',
        'data-r7-settings-device-group-zone-fk="required"',
        'data-r7-settings-device-group-link-stage="device-to-group"',
    ):
        assert marker in html
    for text in ('1. 장치 추가', '2. 그룹 추가', '3. 그룹에 장치 연결', '그룹 생성 단계에서 구역 정보를 외래키로 저장', '하나의 장치를 여러 그룹에 연결할 수 있습니다'):
        assert text in html


def test_r7_115_device_list_keeps_rows_and_old_flat_cards_removed():
    html = _render_device_mapping()
    for text in ('환경 센서 그룹', '관수 그룹', 'sensor.a_temperature', 'switch.a_roof_motor', 'sensor.b_ec', 'switch.b_irrigation_valve', '천창 제어 기준', '점검 필요'):
        assert text in html
    assert 'data-r7-settings-device-list-row="10"' in html
    assert 'data-r7-settings-device-list-row="11"' in html
    for old in ('data-r7-settings-device-sensor-card="zone-sensors"', 'data-r7-settings-device-sensor-card="zone-devices"', 'data-r7-settings-device-sensor-card="ha-entity"', 'data-r7-settings-device-sensor-card="mapping-health"', 'data-r7-settings-device-mapping-list-panel'):
        assert old not in html
