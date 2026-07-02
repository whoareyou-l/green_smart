from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
RECORDS_VIEW = ROOT / "custom_components/green_smart/rebuild_crop_records_views.py"
DOC = ROOT / "docs/rebuild/r7-060-growth-survey-modal-hotfix.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(extra="") -> str:
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}};this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ ok: true, id: 77 }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [
        {{ id: 'zone-2', name: '2구역', currentCrop: {{ crop_cycle_id: 8, crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '본격 엽생장기' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:8' }}, dataAvailability: {{ state: 'fresh' }} }},
        {{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 7, crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:7' }}, dataAvailability: {{ state: 'fresh' }} }},
        {{ id: 'all', name: '전체', currentCrop: {{ crop_label_ko: '전체' }}, dataAvailability: {{ state: 'partial' }} }}
      ] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      {extra}
      panel.render();
      console.log(panel.innerHTML);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def test_r7_060_version_surfaces_are_1_12_95():
    assert '"version": "1.14.37"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.37"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.37"' in _read(REBUILD_PANEL)


def test_r7_060_modal_is_wider_and_measurement_grid_does_not_crush_inputs():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    assert 'width:min(1120px,calc(100vw - 28px))' in html
    assert 'data-r7-growth-survey-measurement-grid' in html
    assert 'grid-template-columns:repeat(3,minmax(150px,1fr))' in html
    assert 'data-r7-growth-survey-quality-grid' in html


def test_r7_060_zone_and_stage_are_dropdowns_with_current_zone_default():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    assert '<select name="zoneId" data-r7-growth-survey-field="zoneId"' in html
    assert 'data-r7-growth-survey-zone-option="zone-1" selected' in html
    assert 'value="zone-1" data-r7-growth-survey-zone-option="zone-1" selected>1구역</option>' in html
    assert '<select name="growthStage" data-r7-growth-survey-field="growthStage"' in html
    for label in ('활착기', '본격 엽생장기', '수확 전 품질관리기', '수확기'):
        assert label in html


def test_r7_060_field_relocation_and_removal_contract():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    growth_section = html.split('data-r7-growth-survey-section="growth-measurements"', 1)[1].split('data-r7-growth-survey-section="quality-disorder"', 1)[0]
    quality_section = html.split('data-r7-growth-survey-section="quality-disorder"', 1)[1].split('data-r7-growth-survey-section="memo"', 1)[0]
    assert 'data-r7-growth-survey-field="rootLength"' not in html
    assert '근장(cm)' not in html
    assert 'data-r7-growth-survey-field="spadValue"' in growth_section
    assert 'data-r7-growth-survey-field="leafArea"' in quality_section
    assert 'data-r7-growth-survey-field="freshWeight"' in quality_section
    assert '<select name="leafColorScore" data-r7-growth-survey-field="leafColorScore"' in quality_section


def test_r7_060_quality_image_upload_button_and_payload_fields_exist():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    for marker in (
        'data-r7-growth-survey-image-upload',
        'data-r7-growth-survey-image-input',
        '품질/생리장해 이미지 추가',
        'imageAnalysisNote',
        '이미지 분석 결과',
    ):
        assert marker in html
    source = _read(REBUILD_PANEL)
    for key in ('zoneId', 'zoneLabel', 'qualityImageAttached', 'imageAnalysisNote'):
        assert key in source


def test_r7_060_save_payload_and_backend_accept_non_numeric_season_ids():
    panel = _read(REBUILD_PANEL)
    backend = _read(RECORDS_VIEW)
    assert 'activeR7RecordSeasonIdForZone' in panel
    assert 'sourceRowId' in panel
    assert '["qualityImageAttached", data.get("qualityImage") ? true : false]' in panel
    assert 'metricsJson: JSON.stringify(growthMetrics)' in panel
    assert 'def _normalize_season_id' in backend
    assert 'crop_seasons:' in backend
    assert 'cycle-' in backend
    assert 'sid = _normalize_season_id(season_id)' in backend


def test_r7_060_hotfix_documented():
    doc = _read(DOC)
    for phrase in (
        '모달 폭 확장',
        '조사구역 드롭다운',
        '생육단계 드롭다운',
        '근장 제거',
        '이미지 추가 버튼',
        'save-failed 방어',
    ):
        assert phrase in doc
