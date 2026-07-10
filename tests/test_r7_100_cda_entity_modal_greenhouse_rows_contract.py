from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-100-cda-entity-modal-greenhouse-rows.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(greenhouses_js: str) -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ callApi: async () => ({{ ok: true }}) }};
      panel._homeContext = {{ greenhouseName: '대표 온실', zones: [] }};
      panel._settingsShortcutCdaModal = {{ open: true, kind: 'greenhouse-info' }};
      panel._settingsGreenhouseZoneData = {{ source: 'test', greenhouses: {greenhouses_js}, zones: [], deviceSensorMappings: [] }};
      console.log(JSON.stringify({{ html: panel.renderR7SettingsShortcutReviewLikeModal() }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_100_version_surfaces_are_1_14_25():
    assert '"version": "1.15.10"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.10"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.10"' in _read(REBUILD_PANEL)


def test_r7_100_source_has_reusable_cda_entity_modal_helpers_not_greenhouse_only_dump():
    source = _read(REBUILD_PANEL)
    for marker in [
        "renderR7CdaEntityListDetailModal",
        "renderR7CdaEntityRows",
        "renderR7CdaEntityDetailFields",
        "normalizeR7SettingsGreenhouseEntityRows",
        "R7_SETTINGS_GREENHOUSE_DETAIL_FIELD_ORDER",
        "R7_SETTINGS_GREENHOUSE_LIST_COLUMNS",
    ]:
        assert marker in source
    assert "field-as-row" not in source


def test_r7_100_greenhouse_info_rows_are_greenhouse_entities_when_db_has_multiple_greenhouses():
    html = _render("[\n        { id: 21, name: 'A동 온실', location: '화성 1농장', installType: '유리온실', operatingStatus: 'active', timezone: 'Asia/Seoul', creationReason: '토마토 주력', status: 'active', updatedAt: '2026-07-02 11:00' },\n        { id: 22, name: 'B동 온실', location: '화성 2농장', installType: '비닐온실', operatingStatus: 'maintenance', timezone: 'Asia/Seoul', creationReason: '상추 실험', status: 'active', updatedAt: '2026-07-02 12:00' }\n      ]")
    assert 'data-r7-cda-entity-modal="greenhouse-info"' in html
    rows = re.findall(r'data-r7-cda-entity-row="greenhouse-info"', html)
    assert len(rows) == 2
    assert 'data-r7-settings-greenhouse-info-row="21"' in html
    assert 'data-r7-settings-greenhouse-info-row="22"' in html
    assert 'A동 온실' in html and 'B동 온실' in html
    assert '화성 1농장' in html and '화성 2농장' in html
    assert '유리온실' in html and '비닐온실' in html
    assert 'active' in html and 'maintenance' in html
    assert 'data-r7-cda-entity-field-row="name"' not in html
    assert 'data-r7-cda-entity-field-row="location"' not in html
    assert 'data-r7-cda-entity-field-row="installType"' not in html


def test_r7_100_greenhouse_info_fallback_is_one_greenhouse_row_not_three_field_rows():
    html = _render("[]")
    rows = re.findall(r'data-r7-cda-entity-row="greenhouse-info"', html)
    assert len(rows) == 1
    assert '대표 온실' in html
    assert '온실명</b>' not in html
    assert '위치</b>' not in html
    assert '설치유형</b>' not in html


def test_r7_100_detail_field_order_and_values_are_green_smart_db_schema():
    html = _render("[{ id: 31, name: 'C동 온실', location: '평택', installType: '연동형', operatingStatus: 'active', timezone: 'Asia/Seoul', creationReason: '딸기 신규 온실', status: 'active', createdAt: '2026-07-01', updatedAt: '2026-07-02' }]")
    ordered = [
        'data-r7-cda-entity-detail-field="name"',
        'data-r7-cda-entity-detail-field="location"',
        'data-r7-cda-entity-detail-field="operatingStatus"',
        'data-r7-cda-entity-detail-field="installType"',
        'data-r7-cda-entity-detail-field="timezone"',
        'data-r7-cda-entity-detail-field="status"',
        'data-r7-cda-entity-detail-field="createdAt"',
        'data-r7-cda-entity-detail-field="updatedAt"',
        'data-r7-cda-entity-detail-field="creationReason"',
    ]
    positions = [html.index(marker) for marker in ordered]
    assert positions == sorted(positions)
    for label in ['온실명', '위치', '운영상태', '설치유형', '기본 시간대', '상태', '생성시각', '수정시각', '생성 사유']:
        assert label in html
    for value in ['C동 온실', '평택', '연동형', 'active', 'Asia/Seoul', '2026-07-02', '2026-07-01', '딸기 신규 온실']:
        assert value in html
    assert 'data-r7-cda-entity-detail-field="approvalScope"' not in html
    assert '승인범위' not in html
    assert '메모</span>' not in html
    assert '선택 항목 상세' in html
    assert '수정' in html and '삭제' in html


def test_r7_100_documented():
    doc = _read(DOC)
    for phrase in ["CDA entity", "온실별 row", "필드별 row 금지", "공통 팝업 모달", "재사용", "모듈화"]:
        assert phrase in doc
