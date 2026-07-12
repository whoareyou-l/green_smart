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
        devices: [{{ id: 'dev-1', haDeviceId: 'ha-device-linked-temp', deviceName: '연결 온도 센서', deviceType: '온습도 센서', entityId: 'sensor.linked_temperature', zoneId: 'zone-a', status: 'active' }}],
        haDevices: [{{ haDeviceId: 'ha-device-linked-temp', deviceName: '이미 연결된 HA 온도센서', manufacturer: 'HA', model: 'Sensor', entityCount: 1 }}, {{ haDeviceId: 'ha-device-roof-window', deviceName: 'HA 천창 컨트롤러', manufacturer: 'HA', model: 'Cover', entityCount: 3 }}, {{ haDeviceId: 'ha-device-fan', deviceName: 'HA 배기팬', manufacturer: 'HA', model: 'Fan', entityCount: 2 }}],
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
    assert '"version": "1.15.54"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.54"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.54"' in _read(REBUILD_PANEL)


def test_r7_128_plan_is_recorded_before_implementation():
    text = _read(PLAN)
    for phrase in ('장치 연결 작성', '장비 엔티티 ID', '장비종류', '장치명', '그룹 목록', '다중 선택'):
        assert phrase in text


def test_r7_128_settings_tab_and_button_use_device_connection_authoring_label():
    html = _node_render('panel.renderR7SettingsAdminZoneVisual()')
    for phrase in ('장치 연결 작성', '장치 연결', '장치 목록', '그룹 목록'):
        assert phrase in html
    assert '장치·그룹' not in html


def test_r7_128_device_connection_modal_has_unlinked_ha_device_and_entity_role_groups():
    html = _node_render('(panel._openSettingsDeviceSensorMappingModal(), panel.renderR7SettingsDeviceSensorMappingModal())')
    for marker in (
        'data-r7-settings-device-connection-authoring-modal="true"',
        'data-r7-settings-device-connection-modal-title="장치 연결"',
        'data-r7-device-canonical-connection-modal="true"',
        'data-r7-settings-ha-device-id-select',
        'data-r7-settings-ha-device-id-source="unlinked-ha-devices"',
        'data-r7-ha-unlinked-device-select',
        'data-r7-settings-green-smart-device-fk="ha_device_id"',
        'data-r7-settings-equipment-kind-select',
        'data-r7-settings-device-name-input',
        'data-r7-device-zone-select',
        'data-r7-device-entity-repeat-group="true"',
        'data-r7-device-entity-role-select',
    ):
        assert marker in html
    assert '장치 연결 작성' not in html
    assert '장비 엔티티 ID' not in html
    for phrase in ('장치 ID', '장비종류', '장치명', '구역', '엔티티ID', '종류', '단위', '역할'):
        assert phrase in html
    assert 'ha-device-roof-window' in html
    assert 'ha-device-linked-temp' not in html
    assert '이미 연결된 HA 온도센서' not in html
    for option in ('온습도 센서', 'CO2 센서', 'CO₂ 센서', '광량 센서', '천창', '측창', '차광커튼', '순환팬', '배기팬', '관수밸브'):
        assert option in html


def test_r7_128_device_connection_modal_x_and_cancel_close_canonical_state():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#settings-admin' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}};this._attrs = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} setAttribute(k,v){{ this._attrs[k]=v; }} getAttribute(k){{ return this._attrs[k]; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel._renderOrRefreshR7SettingsPanel = () => {{}};
      panel._settingsDeviceSensorMappingModal = {{ open: true, state: 'idle' }};
      panel._settingsDeviceConnectionModal = {{ open: true, state: 'idle', values: {{ haDeviceId: 'ha-device-roof-window' }}, haUnlinkedDevices: [{{ haDeviceId: 'ha-device-roof-window' }}], selectedEntities: [{{ entityId: 'cover.roof' }}] }};
      panel._closeSettingsDetailActionModal('mapping');
      const cancelClosed = !panel._settingsDeviceSensorMappingModal.open && !panel._settingsDeviceConnectionModal.open && Object.keys(panel._settingsDeviceConnectionModal.values || {{}}).length === 0;
      panel._settingsDeviceSensorMappingModal = {{ open: true, state: 'idle' }};
      panel._settingsDeviceConnectionModal = {{ open: true, state: 'idle', values: {{ haDeviceId: 'ha-device-roof-window' }}, haUnlinkedDevices: [{{ haDeviceId: 'ha-device-roof-window' }}], selectedEntities: [{{ entityId: 'cover.roof' }}] }};
      const fakeModal = {{ getAttribute(name){{ return name === 'data-r7-record-modal-type' ? 'device-sensor-mapping' : ''; }} }};
      const fakeButton = {{ closest(sel){{ return sel === '[data-r7-record-modal-type]' ? fakeModal : null; }} }};
      const handled = panel._closeR7SettingsRecordModalFromButton(fakeButton);
      const xClosed = handled && !panel._settingsDeviceSensorMappingModal.open && !panel._settingsDeviceConnectionModal.open && panel._attrs['data-r7-settings-record-modal-close-type'] === 'device-sensor-mapping';
      console.log(JSON.stringify({{ cancelClosed, xClosed }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    payload = json.loads(result.stdout)
    assert payload["cancelClosed"] is True
    assert payload["xClosed"] is True


def test_r7_128_device_add_card_opens_ha_devices_page_modal():
    tab_html = _node_render('panel.renderR7SettingsDeviceSensorMappingSubtab(panel._homeContext.zones)')
    card_start = tab_html.index('data-r7-settings-device-action-card="device-create"')
    card_end = tab_html.index('</article>', card_start)
    card_html = tab_html[card_start:card_end]
    assert 'data-r7-settings-ha-devices-page-button' in card_html
    assert 'data-r7-settings-device-create-button' not in card_html
    assert 'HA로 이동' in card_html
    assert 'mdi:home-assistant' in card_html
    assert 'data-r7-settings-ha-device-list-card="true"' in card_html
    assert 'data-r7-settings-ha-device-card-row="ha-device-roof-window"' in card_html
    assert 'HA 천창 컨트롤러' in card_html

    modal_html = _node_render('(panel._openSettingsHaDevicesPageModal(), panel.renderR7SettingsHaDevicesPageModal())')
    for marker in (
        'data-r7-settings-ha-devices-page-modal="true"',
        'data-r7-settings-ha-devices-page-iframe',
        'data-r7-settings-ha-devices-page-iframe-viewport',
        'data-r7-settings-ha-devices-page-crop="hide-ha-sidebar-and-tabs"',
        'data-r7-settings-ha-devices-page-layout="cropped-full-height"',
        'height:calc(100vh - 16px);max-height:calc(100vh - 16px);',
        'left:-48px',
        'top:-104px',
        'src="/config/devices/dashboard"',
        'data-r7-settings-ha-devices-page-close',
    ):
        assert marker in modal_html
    assert 'data-r7-settings-ha-devices-page-helper' not in modal_html
    assert '이 팝업은 HA' not in modal_html
    assert 'data-r7-settings-ha-devices-page-open-new-tab' not in modal_html


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


def test_r7_128_device_list_modal_uses_canonical_device_entity_latest_snapshot():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '#settings-admin' }};
      globalThis.innerWidth = 1280;
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, states: {{}}, callApi: async () => ({{}}) }};
      panel._homeContext = {{ greenhouseName: '대표 온실', zones: [{{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역' }}] }};
      panel._settingsGreenhouseZoneData = {{
        source: 'test', greenhouses: [{{ id: 1, name: '대표 온실' }}], zones: panel._homeContext.zones,
        deviceSensorMappings: [], devices: [], deviceGroups: [],
        canonicalDevices: [{{ id: 77, haDeviceId: 'ha-device-env-77', deviceName: 'A구역 복합환경 제어기', equipmentKind: '복합환경제어기', zoneId: 'zone-a', connectionStatus: 'connected', status: 'active', note: 'canonical row' }}],
        canonicalDeviceEntities: {{ '77': [
          {{ entityId: 'sensor.a_temperature', entityDomain: 'sensor', unitOfMeasurement: '°C', entityRole: '온도', readWriteMode: 'readonly' }},
          {{ entityId: 'sensor.a_humidity', entityDomain: 'sensor', unitOfMeasurement: '%', entityRole: '습도', readWriteMode: 'readonly' }}
        ] }},
        canonicalDeviceLatestValues: {{ '77': [
          {{ entityId: 'sensor.a_temperature', state: '24.7', unitOfMeasurement: '°C', entityRole: '온도', freshnessState: 'fresh' }},
          {{ entityId: 'sensor.a_humidity', state: '68', unitOfMeasurement: '%', entityRole: '습도', freshnessState: 'fresh' }}
        ] }}
      }};
      panel._openSettingsDeviceListModal();
      const html = panel.renderR7SettingsShortcutCdaSplitModal();
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    html = json.loads(result.stdout)["html"]
    for marker in (
        'data-r7-settings-device-list-canonical="true"',
        'data-r7-settings-device-list-ha-device-id',
        'data-r7-settings-device-list-entity-table',
        'data-r7-settings-device-list-entity-row',
        'data-r7-settings-device-list-latest-value',
    ):
        assert marker in html
    for phrase in ('A구역 복합환경 제어기', 'ha-device-env-77', '복합환경제어기', 'Entity 수', '현재값 수집', 'sensor.a_temperature', 'sensor.a_humidity', '온도', '습도', '24.7', '68', 'fresh'):
        assert phrase in html
    assert 'data-r7-settings-device-edit-button="77"' in html
    assert 'data-r7-settings-device-delete-button="77"' in html


def test_r7_128_group_create_modal_creates_irrigation_group_master_without_device_selection():
    html = _node_render('(panel._openSettingsDeviceGroupCreateModal(), panel.renderR7SettingsDeviceGroupCreateModal())')
    for marker in (
        'data-r7-settings-irrigation-group-create-modal="true"',
        'data-r7-settings-create-section="irrigation-group-info"',
        'data-r7-settings-create-section="irrigation-method"',
        'data-r7-settings-create-section="irrigation-outlet-cultivation"',
        'data-r7-settings-irrigation-group-zone-fk-select',
        'data-r7-settings-irrigation-group-auto-name-preview',
        'data-r7-settings-irrigation-method-select',
        'data-r7-settings-irrigation-method-detail-select',
        'data-r7-settings-irrigation-circulation-type-select',
        'data-r7-settings-irrigation-drainage-reuse-select',
        'data-r7-settings-irrigation-outlet-count-input',
        'data-r7-settings-irrigation-flow-rate-input',
        'data-r7-settings-irrigation-flow-rate-unit',
        'data-r7-settings-irrigation-bed-count-input',
        'data-r7-settings-irrigation-bed-count-max',
    ):
        assert marker in html
    for phrase in ('관수그룹 생성', '관수그룹 저장', '관수방법', '순수경', '배지경', '코코피트', '암면', '펄라이트', '순환 방식', '배액 재활용', '토출구 수', '기준 유량', 'L/h', '배드 수', '구역 선택값에 따라 관수그룹명이 자동 변경', '같거나 낮아야 합니다', '장치는 장치 하위탭에서 관수그룹 FK로 연결'):
        assert phrase in html
    for forbidden in ('data-r7-settings-device-group-candidate-checkbox', 'name="deviceIds"', 'data-r7-settings-device-group-ungrouped-only="true"', '그룹 장치 선택', '공급 방식', '물량 계산 기준'):
        assert forbidden not in html
    source = _read(REBUILD_PANEL)
    for literal in ('_handleSettingsIrrigationGroupDynamicFields', 'data-r7-settings-next-irrigation-group-name', 'data-r7-settings-zone-bed-count', 'detailSelect.innerHTML', 'bedInput.max', 'payload.bedCount = String(Math.min', '"순수경": ["DFT", "NFT", "분무수경", "담액수경", "박막수경", "기타"]'):
        assert literal in source


def test_r7_128_irrigation_group_modal_accepts_display_bed_count_label_without_nan():
    html = _node_render("""(panel._settingsGreenhouseZoneData.zones = [{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역', bedCount: '6개' }], panel._openSettingsDeviceGroupCreateModal(), panel.renderR7SettingsDeviceGroupCreateModal())""")
    assert 'data-r7-settings-zone-bed-count="6"' in html
    assert 'max="6"' in html
    assert 'data-r7-settings-irrigation-bed-count-max="6"' in html
    assert 'NaN' not in html


def test_r7_128_snapshot_loader_preserves_irrigation_groups_for_list_modal():
    source = _read(REBUILD_PANEL)
    assert 'irrigationGroups: Array.isArray(response?.irrigationGroups) ? response.irrigationGroups : []' in source
    assert 'irrigationGroups: []' in source


def test_r7_128_group_list_button_opens_irrigation_group_list_cda_modal():
    html = _node_render("""(
        panel._settingsGreenhouseZoneData.zones = [{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역', bedCount: 6 }],
        panel._settingsGreenhouseZoneData.irrigationGroups = [{
            id: 'ig-1',
            zoneId: 'zone-a',
            irrigationGroupName: 'A구역 관수그룹 1',
            irrigationGroupNo: 1,
            irrigationMethod: '배지경',
            irrigationMethodDetail: '코코피트',
            circulationType: '비순환식',
            drainageReuse: '배액 재활용 안함',
            outletCount: 100,
            flowRatePerOutlet: 3,
            flowRateUnit: 'L/h',
            bedCount: 6,
            status: 'active',
            note: 'A구역 좌측 1~2번 베드'
        }],
        panel._openSettingsDeviceGroupListModal(),
        panel.renderR7SettingsShortcutCdaSplitModal()
    )""")
    for marker in (
        'data-r7-settings-device-group-list-cda-modal="true"',
        'data-r7-settings-irrigation-group-list-cda-modal="true"',
        'data-r7-settings-irrigation-group-list-detail-panel',
        'data-r7-settings-irrigation-group-list-row',
        '관수그룹 목록',
        '관수그룹별 목록 · 선택 관수그룹 상세',
        '관수그룹명',
        'A구역 관수그룹 1',
        '관수방법',
        '관수방법 상세',
        '배지경',
        '코코피트',
        '순환 방식',
        '비순환식',
        '배액 재활용',
        '토출구 수',
        '100개',
        '기준 유량',
        '3 L/h',
        '배드 수',
        '6개',
        '운영 메모',
        'A구역 좌측 1~2번 베드',
    ):
        assert marker in html
    modal_start = html.index('data-r7-settings-irrigation-group-list-cda-modal="true"')
    modal_html = html[modal_start:]
    for legacy_phrase in ('장치 그룹별 포함 장치', '기존 관수 그룹', '포함 장치'):
        assert legacy_phrase not in modal_html


def test_r7_128_irrigation_group_list_rows_are_selectable_and_update_detail():
    source = _read(REBUILD_PANEL)
    for literal in (
        '_selectSettingsDeviceGroupListRow',
        "[data-r7-settings-irrigation-group-list-row], [data-r7-settings-device-group-list-row]",
        'rowAttrsForId',
    ):
        assert literal in source
    html = _node_render("""(
        panel._settingsGreenhouseZoneData.zones = [{ id: 'zone-a', zoneId: 'zone-a', zoneName: 'A구역', name: 'A구역', bedCount: 6 }],
        panel._settingsGreenhouseZoneData.irrigationGroups = [
          { id: 'ig-1', zoneId: 'zone-a', irrigationGroupName: 'A구역 관수그룹 1', irrigationMethod: '배지경', irrigationMethodDetail: '코코피트', circulationType: '비순환식', drainageReuse: '배액 재활용 안함', outletCount: 100, flowRatePerOutlet: 3, flowRateUnit: 'L/h', bedCount: 6, status: 'active', note: '첫 번째 그룹' },
          { id: 'ig-2', zoneId: 'zone-a', irrigationGroupName: 'A구역 관수그룹 2', irrigationMethod: '순수경', irrigationMethodDetail: 'NFT', circulationType: '순환식', drainageReuse: '배액 재활용', outletCount: 40, flowRatePerOutlet: 1.5, flowRateUnit: 'L/h', bedCount: 2, status: 'maintenance', note: '두 번째 그룹' }
        ],
        panel._openSettingsDeviceGroupListModal(),
        panel._selectSettingsDeviceGroupListRow('ig-2'),
        panel.renderR7SettingsShortcutCdaSplitModal()
    )""")
    assert 'data-r7-settings-irrigation-group-list-row="ig-2"' in html
    assert 'data-r7-settings-device-group-list-row="ig-2"' in html
    assert 'data-r7-settings-shortcut-review-row="ig-2" data-r7-settings-shortcut-review-row-selected="true"' in html
    assert 'A구역 관수그룹 2' in html
    assert 'NFT' in html
    assert '순환식' in html
    assert '1.5 L/h' in html
    assert '두 번째 그룹' in html
