from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
INIT = ROOT / "custom_components/green_smart/__init__.py"
REBUILD_VIEWS = ROOT / "custom_components/green_smart/rebuild_settings_write_views.py"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-095-settings-greenhouse-zone-detail-actions.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_greenhouse_zones() -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ ok: true }}) }};
      panel._homeContext = {{ greenhouseName: '제1온실', zones: [
        {{ zoneId: 'zone-1', zoneName: '1구역', name: '1구역', purpose: '재배', area: '120㎡', bedCount: 6, currentCrop: {{ crop_cycle_id: '17', crop_label_ko: '토마토' }}, dataAvailability: {{ state: 'fresh' }}, equipmentProfile: {{ labels: ['천창','측창','센서 6', '미연결 양액기'] }} }},
      ] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin','greenhouse-zones');
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_095_version_surfaces_are_1_14_20():
    assert '"version": "1.14.95"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.95"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.95"' in _read(REBUILD_PANEL)


def test_r7_095_backend_api_views_exist_and_are_registered():
    views = _read(REBUILD_VIEWS)
    for cls in [
        'RebuildSettingsGreenhouseCreateView',
        'RebuildSettingsZoneCreateView',
        'RebuildSettingsDeviceSensorMappingView',
    ]:
        assert f'class {cls}' in views
    for url in [
        '/api/green_smart/rebuild/settings/greenhouses',
        '/api/green_smart/rebuild/settings/zones',
        '/api/green_smart/rebuild/settings/device-sensor-mappings',
    ]:
        assert f'url = "{url}"' in views
    init = _read(INIT)
    for cls in ['RebuildSettingsGreenhouseCreateView', 'RebuildSettingsZoneCreateView', 'RebuildSettingsDeviceSensorMappingView']:
        assert cls in init
        assert f'hass.http.register_view({cls}())' in init


def test_r7_095_equipment_card_is_selected_zone_status_counts():
    html = _render_greenhouse_zones()
    assert 'data-r7-settings-info-card="equipment-composition"' in html
    assert '선택 구역 상태' in html
    for phrase in ['센서', '장비', '미연결']:
        assert phrase in html
    assert 'data-r7-settings-equipment-status-card="selected-zone"' in html
    assert 'data-r7-settings-equipment-unmapped-count' in html


def test_r7_095_equipment_create_card_becomes_device_sensor_mapping_entry():
    html = _render_greenhouse_zones()
    assert 'data-r7-record-card-shell="settings-equipment-mapping"' in html
    assert '장치 연결 작성' in html
    assert '장치 연결 작성' in html
    assert 'data-r7-settings-device-sensor-mapping-button' in html
    assert '+ 새 장비 추가' not in html


def test_r7_095_modals_and_frontend_api_boundaries_exist():
    source = _read(REBUILD_PANEL)
    for name in [
        '_openSettingsGreenhouseCreateModal',
        '_openSettingsZoneCreateModal',
        '_openSettingsDeviceSensorMappingModal',
        '_submitSettingsGreenhouseCreateForm',
        '_submitSettingsZoneCreateForm',
        '_submitSettingsDeviceSensorMappingForm',
    ]:
        assert name in source
    for marker in [
        'data-r7-settings-greenhouse-create-modal',
        'data-r7-settings-zone-create-modal',
        'data-r7-settings-device-sensor-mapping-modal',
        'data-r7-settings-greenhouse-create-form',
        'data-r7-settings-zone-create-form',
        'data-r7-settings-device-sensor-mapping-form',
    ]:
        assert marker in source
    for endpoint in [
        'green_smart/rebuild/settings/greenhouses',
        'green_smart/rebuild/settings/zones',
        'green_smart/rebuild/settings/device-sensor-mappings',
    ]:
        assert endpoint in source


def test_r7_095_documented():
    doc = _read(DOC)
    for phrase in ['선택 구역 상태', '센서, 장비, 미연결', '장치 연결 작성', '팝업 모달', 'API']:
        assert phrase in doc
