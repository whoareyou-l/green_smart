from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-058-records-workflow-modal-ux-badge.md"


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
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: '7', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:7', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, cropRecordSummary: {{ recordSummarySource: 'crop_repo_recent_records_readonly', growthSurvey: {{ count: 0, latest: null, latestLabel: '', staleState: 'empty' }}, pestScouting: {{ count: 0, latest: null, latestLabel: '', staleState: 'attention' }}, controlTreatment: {{ count: 0, latest: null, latestLabel: '', staleState: 'attention' }}, workQueue: {{ nextAction: '필수 기록 최신 상태', missingItems: ['SPAD 미입력', '병해충 예찰 5일 경과'] }}, readOnly: false, writeEnabled: true, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ recordType: 'growth-survey', rows: [{{ id: 1, date: '2026-06-30', summary: '초장 18cm · 엽수 9' }}] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      {extra}
      panel.render();
      const html = panel.innerHTML;
      console.log(html);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def test_r7_058_version_surfaces_are_1_12_93():
    assert '"version": "1.15.12"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.12"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.12"' in _read(REBUILD_PANEL)


def test_r7_058_record_badge_has_one_visible_status_label_not_label_plus_stage():
    html = _render()
    for label in ("정상", "확인 필요", "근거 부족", "오늘 필요", "주의", "확인"):
        assert label in html
    # Stage labels must remain as metadata, not second visible text inside the pill.
    for stage in ("운영 가능", "누락 확인", "신뢰도 제한", "오늘 작성", "지연 확인", "안전 확인"):
        assert f'data-r7-record-status-stage="{stage}"' in html
        assert f'>{stage}</small>' not in html
    assert 'data-r7-record-badge-visible-label' in html
    assert 'data-r7-record-badge-stage-text' not in html


def test_r7_058_record_card_shell_does_not_accept_legacy_status_text_prop():
    source = _read(REBUILD_PANEL)
    assert 'renderR7RecordCardShell({ kind, icon, title, status,' not in source
    assert 'renderR7RecordCardHeader({ icon, title, status,' not in source
    assert 'status: "fresh"' not in source


def test_r7_058_write_modal_has_operator_ux_sections_and_validation_copy_after_r7_059_growth_modal_supersession():
    html = _render("panel._r7RecordModal = { mode: 'write', recordType: 'pest-scouting', seasonId: 7, title: '병해충 예찰 작성', state: 'ready', rows: [] };")
    for marker in (
        'data-r7-record-modal-operator-summary',
        'data-r7-record-common-modal-shell',
        'data-r7-record-modal-sticky-header',
        'data-r7-record-pre-save-checklist',
        'data-r7-record-form-field-group="common"',
        'data-r7-record-form-field-group="pest-scouting"',
        'data-r7-record-modal-actions',
        'data-r7-record-modal-cancel',
        'data-r7-record-modal-submit',
        '저장 전 참고',
        '저장 후 최신 기록과 카드 상태를 다시 불러옵니다.',
    ):
        assert marker in html
    assert 'data-r7-record-modal-required-note' not in html
    assert '필수 입력' not in html
    growth = _render("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };")
    assert 'data-r7-growth-survey-image-modal="true"' in growth
    assert '저장 후 검증' not in growth


def test_r7_058_history_modal_has_summary_empty_error_and_loading_grammar():
    html = _render("panel._r7RecordModal = { mode: 'history', recordType: 'growth-survey', seasonId: 7, title: '생육조사 히스토리', state: 'ready', rows: [{ id: 1, date: '2026-06-30', summary: '초장 18cm · 엽수 9' }] };")
    for marker in (
        'data-r7-record-history-summary',
        'data-r7-record-history-list',
        'data-r7-record-history-row',
        'data-r7-record-history-row-date',
        'data-r7-record-history-row-summary',
        '초장 18cm · 엽수 9',
    ):
        assert marker in html
    empty = _render("panel._r7RecordModal = { mode: 'history', recordType: 'growth-survey', seasonId: 7, title: '생육조사 히스토리', state: 'ready', rows: [] };")
    assert 'data-r7-record-history-empty' in empty
    loading = _render("panel._r7RecordModal = { mode: 'history', recordType: 'growth-survey', seasonId: 7, title: '생육조사 히스토리', state: 'loading', rows: [] };")
    assert 'data-r7-record-modal-loading' in loading
    error = _render("panel._r7RecordModal = { mode: 'history', recordType: 'growth-survey', seasonId: 7, title: '생육조사 히스토리', state: 'error', error: 'boom', rows: [] };")
    assert 'data-r7-record-modal-error' in error


def test_r7_058_policy_documented():
    doc = _read(DOC)
    for phrase in (
        "상태 뱃지는 화면에 하나의 라벨만 표시",
        "단계 설명은 data/aria/title 메타데이터로 유지",
        "작성 모달 UX",
        "히스토리 모달 UX",
        "장치/MQTT/자동실행 제외",
    ):
        assert phrase in doc
