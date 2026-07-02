from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-103-cda-entity-modal-equipment-mapping-rows.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(mappings_js: str) -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ ok: true }}) }};
      panel._homeContext = {{ greenhouseName: '대표 온실', zones: [] }};
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'equipment-info', selectedMappingId: 'map-b' }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [], zones: [{{ id: 'zone-a', zoneName: '1구역' }}], deviceSensorMappings: {mappings_js} }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsShortcutReviewLikeModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_103_version_surfaces_are_1_14_28():
    assert '"version": "1.14.41"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.41"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.41"' in _read(REBUILD_PANEL)


def test_r7_103_source_has_reusable_equipment_entity_schema_not_review_like_dump():
    source = _read(REBUILD_PANEL)
    for marker in [
        "normalizeR7SettingsEquipmentEntityRows",
        "R7_SETTINGS_EQUIPMENT_LIST_COLUMNS",
        "R7_SETTINGS_EQUIPMENT_DETAIL_FIELD_ORDER",
        "renderR7CdaEntityListDetailModal",
        'entityType: "equipment-info"',
    ]:
        assert marker in source


def test_r7_103_equipment_rows_are_mapping_entities_when_db_has_multiple_mappings():
    html = _render("[\n        { id: 'map-a', zoneId: 'zone-a', zoneName: '1구역', mappingRole: '환경 센서', sensorEntity: 'sensor.temp_1', deviceEntity: 'switch.fan_1', status: 'active', protocol: 'mqtt', direction: 'sensor-to-device', updatedAt: '2026-07-02 09:00', note: '환기 연동' },\n        { id: 'map-b', zoneId: 'zone-b', zoneName: '2구역', mappingRole: '관수 밸브', sensorEntity: 'sensor.moisture_2', deviceEntity: 'switch.valve_2', status: 'inactive', protocol: 'modbus', direction: 'manual', updatedAt: '2026-07-02 10:00', note: '점검 필요' }\n      ]")
    assert 'data-r7-cda-entity-modal="equipment-info"' in html
    rows = re.findall(r'data-r7-cda-entity-row="equipment-info"', html)
    assert len(rows) == 2
    assert 'data-r7-settings-equipment-info-row="map-a"' in html
    assert 'data-r7-settings-equipment-info-row="map-b"' in html
    for value in ['환경 센서', '관수 밸브', '1구역', '2구역', 'sensor.temp_1', 'sensor.moisture_2', 'switch.fan_1', 'switch.valve_2']:
        assert value in html
    assert 'data-r7-cda-entity-field-row="mappingRole"' not in html
    assert '<b>센서</b>' not in html
    assert '<b>장비</b>' not in html
    assert '<b>미연결</b>' not in html


def test_r7_103_equipment_fallback_is_one_mapping_row_not_summary_rows():
    html = _render("[]")
    rows = re.findall(r'data-r7-cda-entity-row="equipment-info"', html)
    assert len(rows) == 1
    assert '환경 센서/환기 장치' in html
    assert '센서 1개' not in html
    assert '장비 1개' not in html
    assert '미연결 없음' not in html


def test_r7_103_equipment_detail_field_order_and_values_are_operator_schema():
    html = _render("[{ id: 'map-b', zoneId: 'zone-b', zoneName: '2구역', mappingRole: '관수 밸브', sensorEntity: 'sensor.moisture_2', deviceEntity: 'switch.valve_2', status: 'inactive', protocol: 'modbus', direction: 'manual', updatedAt: '2026-07-02 10:00', note: '점검 필요' }]")
    assert '1. 장비/센서 매핑 상세 정보' in html
    ordered = [
        'data-r7-cda-entity-detail-field="mappingRole"',
        'data-r7-cda-entity-detail-field="zoneName"',
        'data-r7-cda-entity-detail-field="sensorEntity"',
        'data-r7-cda-entity-detail-field="deviceEntity"',
        'data-r7-cda-entity-detail-field="protocol"',
        'data-r7-cda-entity-detail-field="direction"',
        'data-r7-cda-entity-detail-field="status"',
        'data-r7-cda-entity-detail-field="updatedAt"',
        'data-r7-cda-entity-detail-field="note"',
    ]
    positions = [html.index(marker) for marker in ordered]
    assert positions == sorted(positions)
    for value in ['관수 밸브', '2구역', 'sensor.moisture_2', 'switch.valve_2', 'modbus', 'manual', '비활성', '2026-07-02 10:00', '점검 필요']:
        assert value in html
    assert 'data-r7-cda-entity-detail-footer="equipment-info"' in html


def test_r7_103_documented():
    doc = _read(DOC)
    for phrase in ["CDA entity", "장비/센서 매핑별 row", "필드별 row 금지", "매핑 상세", "공통 팝업 모달"]:
        assert phrase in doc
