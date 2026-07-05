from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-102-cda-entity-modal-zone-rows.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(zones_js: str) -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ ok: true }}) }};
      panel._homeContext = {{ greenhouseName: '대표 온실', zones: [] }};
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'zone-list', selectedZoneId: 'zone-b' }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: [], zones: {zones_js}, deviceSensorMappings: [] }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsShortcutReviewLikeModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_102_version_surfaces_are_1_14_27():
    assert '"version": "1.14.79"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.79"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.79"' in _read(REBUILD_PANEL)


def test_r7_102_source_has_reusable_zone_entity_schema_not_review_like_dump():
    source = _read(REBUILD_PANEL)
    for marker in [
        "normalizeR7SettingsZoneEntityRows",
        "R7_SETTINGS_ZONE_LIST_COLUMNS",
        "R7_SETTINGS_ZONE_DETAIL_FIELD_ORDER",
        "detailSectionTitle",
        "renderR7CdaEntityListDetailModal",
    ]:
        assert marker in source
    assert 'kind === "zone-list"' in source


def test_r7_102_zone_list_rows_are_zone_entities_when_db_has_multiple_zones():
    html = _render("[\n        { id: 'zone-a', zoneName: '1구역', greenhouseName: 'A동 온실', purpose: '토마토 재배', area: '120㎡', bedCount: 6, currentCrop: '토마토', status: 'active', updatedAt: '2026-07-02 09:00', note: '동측' },\n        { id: 'zone-b', zoneName: '2구역', greenhouseName: 'A동 온실', purpose: '상추 재배', area: '80㎡', bedCount: 4, currentCrop: '상추', status: 'inactive', updatedAt: '2026-07-02 10:00', note: '서측' }\n      ]")
    assert 'data-r7-cda-entity-modal="zone-list"' in html
    rows = re.findall(r'data-r7-cda-entity-row="zone-list"', html)
    assert len(rows) == 2
    assert 'data-r7-settings-zone-list-row="zone-a"' in html
    assert 'data-r7-settings-zone-list-row="zone-b"' in html
    for value in ['1구역', '2구역', 'A동 온실', '토마토 재배', '상추 재배', '6개', '4개', '정상', '비활성']:
        assert value in html
    assert '6 bed' not in html
    assert '4 bed' not in html
    assert '>active<' not in html
    assert '>inactive<' not in html
    assert 'data-r7-cda-entity-field-row="zoneName"' not in html
    assert 'data-r7-cda-entity-field-row="purpose"' not in html


def test_r7_102_zone_list_fallback_is_one_zone_row_not_field_rows():
    html = _render("[]")
    rows = re.findall(r'data-r7-cda-entity-row="zone-list"', html)
    assert len(rows) == 1
    assert '1구역' in html
    assert '구역명</b>' not in html
    assert '용도</b>' not in html
    assert '베드</b>' not in html


def test_r7_102_zone_detail_field_order_and_values_are_green_smart_zone_db_schema():
    html = _render("[{ id: 'zone-b', zoneName: '2구역', greenhouseName: 'A동 온실', purpose: '상추 재배', area: '80㎡', bedCount: 4, currentCrop: '상추', status: 'inactive', createdAt: '2026-07-01 10:00', updatedAt: '2026-07-02 10:00', note: '서측' }]")
    assert '1. 구역 상세 정보' in html
    ordered = [
        'data-r7-cda-entity-detail-field="zoneName"',
        'data-r7-cda-entity-detail-field="greenhouseName"',
        'data-r7-cda-entity-detail-field="purpose"',
        'data-r7-cda-entity-detail-field="area"',
        'data-r7-cda-entity-detail-field="bedCount"',
        'data-r7-cda-entity-detail-field="status"',
        'data-r7-cda-entity-detail-field="createdAt"',
        'data-r7-cda-entity-detail-field="updatedAt"',
        'data-r7-cda-entity-detail-field="note"',
    ]
    positions = [html.index(marker) for marker in ordered]
    assert positions == sorted(positions)
    for value in ['2구역', 'A동 온실', '상추 재배', '80㎡', '4개', '비활성', '2026-07-01 10:00', '2026-07-02 10:00', '서측']:
        assert value in html
    assert 'data-r7-cda-entity-detail-field="currentCrop"' not in html
    assert '4 bed' not in html
    assert '>inactive<' not in html
    assert '선택 항목 상세' in html
    assert 'data-r7-cda-entity-detail-footer="zone-list"' in html


def test_r7_102_documented():
    doc = _read(DOC)
    for phrase in ["CDA entity", "구역별 row", "필드별 row 금지", "구역 상세", "공통 팝업 모달"]:
        assert phrase in doc
