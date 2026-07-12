from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components/green_smart/db.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
WRITE_VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
PLAN = ROOT / "docs/plans/2026-07-12-device-registry-unified-device-entity-values-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _node_render(expr: str) -> str:
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#settings-admin' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} setAttribute(){{}} removeAttribute(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, states: {{
        'sensor.greenhouse_temperature': {{ state: '24.7', attributes: {{ friendly_name: '온실 온도', unit_of_measurement: '°C', device_class: 'temperature', state_class: 'measurement' }}, last_changed: '2026-07-12T10:00:00+00:00', last_updated: '2026-07-12T10:00:00+00:00' }},
        'sensor.greenhouse_humidity': {{ state: '68', attributes: {{ friendly_name: '온실 습도', unit_of_measurement: '%', device_class: 'humidity', state_class: 'measurement' }}, last_changed: '2026-07-12T10:00:00+00:00', last_updated: '2026-07-12T10:00:00+00:00' }},
        'switch.greenhouse_fan': {{ state: 'on', attributes: {{ friendly_name: '순환팬' }}, last_changed: '2026-07-12T10:00:00+00:00', last_updated: '2026-07-12T10:00:00+00:00' }}
      }}, callApi: async () => ({{}}) }};
      panel._activeR7Domain = 'settings-admin';
      panel._activeR7DomainSubtabs = {{ ...panel._activeR7DomainSubtabs, 'settings-admin': 'device-sensor-mapping' }};
      panel._homeContext = {{ actorRole: 'admin', greenhouseName: '대표 온실', zones: [{{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역' }}] }};
      panel._settingsGreenhouseZoneData = {{
        source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: panel._homeContext.zones,
        devices: [{{ id: 10, haDeviceId: 'ha-device-linked', deviceName: '이미 연결된 장치', equipmentKind: '온습도 센서', zoneId: 'zone-a', status: 'active' }}],
        haUnlinkedDevices: [{{ haDeviceId: 'ha-device-env-controller', deviceName: 'HA 복합환경 제어기', manufacturer: 'Green Smart', model: 'GS-CTRL', entityCount: 3 }}],
        canonicalDeviceEntities: {{ 'ha-device-env-controller': [
          {{ entityId: 'sensor.greenhouse_temperature', domain: 'sensor', unitOfMeasurement: '°C', deviceClass: 'temperature', entityRole: '온도', valueKind: 'temperature', readWriteMode: 'readonly', name: '온실 온도' }},
          {{ entityId: 'sensor.greenhouse_humidity', domain: 'sensor', unitOfMeasurement: '%', deviceClass: 'humidity', entityRole: '습도', valueKind: 'humidity', readWriteMode: 'readonly', name: '온실 습도' }},
          {{ entityId: 'switch.greenhouse_fan', domain: 'switch', unitOfMeasurement: '', deviceClass: '', entityRole: '순환팬', valueKind: 'actuator_state', readWriteMode: 'controllable', name: '순환팬' }}
        ] }}
      }};
      panel._settingsDeviceConnectionModal = {{ open: true, state: 'idle', values: {{ haDeviceId: 'ha-device-env-controller', deviceName: 'HA 복합환경 제어기', equipmentKind: '복합환경제어기', zoneId: 'zone-a' }}, haUnlinkedDevices: panel._settingsGreenhouseZoneData.haUnlinkedDevices, selectedEntities: panel._settingsGreenhouseZoneData.canonicalDeviceEntities['ha-device-env-controller'] }};
      const html = {expr};
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_129_plan_records_canonical_device_entity_values_direction():
    text = _read(PLAN)
    for phrase in (
        "green_smart_devices",
        "green_smart_device_entities",
        "green_smart_device_entity_latest_values",
        "green_smart_device_entity_samples",
        "장치마다 시간열 테이블을 따로 만들지 않는다",
        "역할은 자동 유추",
    ):
        assert phrase in text


def test_r7_129_db_schema_declares_canonical_device_tables_and_no_dynamic_per_device_tables():
    db = _read(DB)
    for literal in (
        "CREATE TABLE IF NOT EXISTS green_smart_devices",
        "CREATE TABLE IF NOT EXISTS green_smart_device_entities",
        "CREATE TABLE IF NOT EXISTS green_smart_device_entity_latest_values",
        "CREATE TABLE IF NOT EXISTS green_smart_device_entity_samples",
        "entities_snapshot_json JSON NULL",
        "UNIQUE KEY uq_green_smart_device_ha_device (farm_id, ha_device_id)",
        "UNIQUE KEY uq_green_smart_device_entity (farm_id, entity_id)",
        "UNIQUE KEY uq_green_smart_entity_latest (farm_id, entity_id)",
        "KEY idx_gs_samples_device_time (farm_id, green_smart_device_id, sampled_at)",
    ):
        assert literal in db
    assert "device_values_" not in db
    assert "CREATE TABLE IF NOT EXISTS green_smart_device_values_" not in db


def test_r7_129_backend_exposes_canonical_device_registry_and_data_apis():
    views = _read(WRITE_VIEWS)
    init = _read(INIT)
    for literal in (
        "infer_green_smart_entity_role",
        "infer_green_smart_read_write_mode",
        "list_green_smart_unlinked_ha_devices",
        "list_green_smart_ha_device_entities",
        "create_green_smart_device_connection",
        "refresh_green_smart_device_latest_values",
        'url = "/api/green_smart/devices/ha/unlinked"',
        'url = "/api/green_smart/devices/ha/{ha_device_id}/entities"',
        'url = "/api/green_smart/devices"',
        'url = "/api/green_smart/devices/{device_id}/data/latest"',
        'url = "/api/green_smart/devices/{device_id}/data/refresh"',
        'url = "/api/green_smart/devices/{device_id}/data/samples"',
        "green_smart_device_entity_samples",
        "green_smart_device_entity_latest_values",
    ):
        assert literal in views
    for view in (
        "GreenSmartHaUnlinkedDevicesView",
        "GreenSmartHaDeviceEntitiesView",
        "GreenSmartDevicesView",
        "GreenSmartDeviceLatestDataView",
        "GreenSmartDeviceDataRefreshView",
        "GreenSmartDeviceSamplesView",
    ):
        assert view in init
        assert f"hass.http.register_view({view}())" in init


def test_r7_129_frontend_has_canonical_device_connection_modal_and_entity_role_rows():
    html = _node_render('panel.renderR7SettingsDeviceSensorMappingModal()')
    for marker in (
        'data-r7-device-canonical-connection-modal="true"',
        'data-r7-device-connection-group="true"',
        'data-r7-ha-unlinked-device-select',
        'data-r7-ha-device-source="unlinked-ha-devices"',
        'data-r7-equipment-kind-select',
        'data-r7-device-name-input',
        'data-r7-device-zone-select',
        'data-r7-device-entity-repeat-group="true"',
        'data-r7-device-entity-row',
        'data-r7-device-entity-id-readonly',
        'data-r7-device-entity-domain-readonly',
        'data-r7-device-entity-unit-readonly',
        'data-r7-device-entity-role-select',
    ):
        assert marker in html
    for phrase in ("장치 ID", "장비종류", "장치명", "구역", "엔티티ID", "종류", "단위", "역할"):
        assert phrase in html
    for value in ("ha-device-env-controller", "sensor.greenhouse_temperature", "sensor.greenhouse_humidity", "switch.greenhouse_fan", "온도", "습도", "순환팬", "°C", "%"):
        assert value in html
    assert "ha-device-linked" not in html


def test_r7_129_frontend_saves_to_canonical_devices_api_with_entities_array():
    source = _read(REBUILD_PANEL)
    for literal in (
        'const GREEN_SMART_HA_UNLINKED_DEVICES_API_PATH = "green_smart/devices/ha/unlinked";',
        'const GREEN_SMART_DEVICE_CONNECTION_API_PATH = "green_smart/devices";',
        'const GREEN_SMART_DEVICE_DATA_REFRESH_API_PATH = "green_smart/devices";',
        "selectedEntities",
        "entityRole",
        "entities:",
        'this.hass.callApi(["P", "OST"].join(""), GREEN_SMART_DEVICE_CONNECTION_API_PATH, payload)',
    ):
        assert literal in source
    assert "device_values_${" not in source
    assert "CREATE TABLE" not in source
