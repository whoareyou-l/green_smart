from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-059-growth-survey-image-modal.md"


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
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ recordType: 'growth-survey', rows: [] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [{{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: '7', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:7', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, cropRecordSummary: {{ growthSurvey: {{ count: 0, staleState: 'empty' }}, pestScouting: {{ count: 0, staleState: 'attention' }}, controlTreatment: {{ count: 0, staleState: 'attention' }}, workQueue: {{ missingItems: ['SPAD 미입력'] }} }} }}] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      {extra}
      panel.render();
      console.log(panel.innerHTML);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def test_r7_059_version_surfaces_are_1_12_94():
    assert '"version": "1.13.5"' in _read(MANIFEST)
    assert 'const VERSION = "1.13.5"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.13.5"' in _read(REBUILD_PANEL)


def test_r7_059_growth_modal_matches_reference_image_layout_sections():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    for marker in (
        'data-r7-growth-survey-image-modal="true"',
        'data-r7-growth-survey-left-form',
        'data-r7-growth-survey-side-panel',
        'data-r7-growth-survey-section="basic-info"',
        'data-r7-growth-survey-section="growth-measurements"',
        'data-r7-growth-survey-section="quality-disorder"',
        'data-r7-growth-survey-section="memo"',
        '기본 정보', '생육 측정값', '품질/생리장해 측정값', '메모',
        '저장 전 참고', '생육값 상태', 'SPAD 입력 대기', 'V-Score 계산 대기', '작물 근거',
    ):
        assert marker in html
    assert '저장 후 검증' not in html
    assert '저장 후 최신 기록과 카드 상태를 다시 불러옵니다.' not in html


def test_r7_059_growth_modal_contains_same_survey_items_as_reference_scope():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    required_fields = {
        'surveyDate': '조사일',
        'zoneLabel': '조사구역',
        'growthStage': '생육단계',
        'observerName': '조사자',
        'plantHeight': '초장',
        'leafLength': '엽장',
        'leafWidth': '엽폭',
        'leafCount': '엽수',
        'leafArea': '엽면적',
        'freshWeight': '생체중',
        'spadValue': 'SPAD',
        'tipburnScore': '잎끝마름',
        'boltingSign': '추대 징후',
        'leafColorScore': '잎색/상품성',
        'harvestReadiness': '수확 가능 여부',
    }
    for key, label in required_fields.items():
        assert f'data-r7-growth-survey-field="{key}"' in html
        assert label in html


def test_r7_059_growth_payload_persists_extra_items_in_metrics_json_not_legacy_columns():
    source = _read(REBUILD_PANEL)
    for key in ('leafLength', 'leafWidth', 'leafArea', 'freshWeight', 'spadValue', 'tipburnScore', 'boltingSign', 'leafColorScore', 'harvestReadiness'):
        assert key in source
    assert 'metricsJson: JSON.stringify(growthMetrics)' in source
    assert 'height: data.get("plantHeight") || data.get("height") || null' in source
    assert 'leafCount: data.get("leafCount") || null' in source


def test_r7_059_growth_modal_actions_are_lightweight_reference_style():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    for marker in (
        'data-r7-growth-survey-cancel',
        'data-r7-growth-survey-draft',
        'data-r7-growth-survey-submit',
        '취소', '임시저장', '저장 후 갱신',
    ):
        assert marker in html
    assert 'data-r7-record-modal-submit' in html


def test_r7_059_policy_documented():
    doc = _read(DOC)
    for phrase in (
        '이미지 참고형 생육조사 작성 모달',
        '저장 후 검증 과잉 UX 제외',
        '조사항목 동일 반영',
        'metrics_json',
        '장치/MQTT/자동실행 제외',
    ):
        assert phrase in doc
