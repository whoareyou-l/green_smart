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


def test_r7_115_version_surfaces_are_1_14_46():
    assert '"version": "1.14.46"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.46"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.46"' in _read(REBUILD_PANEL)


def test_r7_115_device_sensor_mapping_uses_image_like_device_group_mapping_cards():
    html = _render_device_mapping()
    for marker in (
        'data-r7-settings-device-sensor-mapping',
        'data-r7-settings-device-mapping-layout="device-group-mapping"',
        'data-r7-settings-device-selected-zone-strip',
        'data-r7-settings-device-summary-grid',
        'data-r7-settings-device-card="device"',
        'data-r7-settings-device-card="group"',
        'data-r7-settings-device-card="mapping"',
        'data-r7-settings-device-action-row',
        'data-r7-settings-device-mapping-list-panel',
    ):
        assert marker in html
    for text in ('현재 선택 구역', 'A구역', 'B구역', '장치', '그룹', '매핑', '장치 구성', '그룹 구성', '매핑 확인', '매핑 목록'):
        assert text in html


def test_r7_115_mapping_cards_keep_existing_actions_and_remove_old_flat_four_card_layout():
    html = _render_device_mapping()
    assert 'data-r7-settings-device-sensor-mapping-button' in html
    assert 'data-r7-settings-equipment-info-shortcut-button' in html
    assert '장치/센서 매핑 열기' in html
    assert '장비 구성' in html
    for old in ('data-r7-settings-device-sensor-card="zone-sensors"', 'data-r7-settings-device-sensor-card="zone-devices"', 'data-r7-settings-device-sensor-card="ha-entity"', 'data-r7-settings-device-sensor-card="mapping-health"'):
        assert old not in html


def test_r7_115_mapping_list_renders_device_group_mapping_rows():
    html = _render_device_mapping()
    for text in ('환경 센서 그룹', '관수 그룹', 'sensor.a_temperature', 'switch.a_roof_motor', 'sensor.b_ec', 'switch.b_irrigation_valve', '천창 제어 기준', '점검 필요'):
        assert text in html
    assert 'data-r7-settings-device-mapping-row="10"' in html
    assert 'data-r7-settings-device-mapping-row="11"' in html
