from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
REBUILD_VIEWS = ROOT / "custom_components/green_smart/rebuild_crop_records_views.py"
INIT = ROOT / "custom_components/green_smart/__init__.py"
DOC = ROOT / "docs/rebuild/r7-057-records-workflow-status-modal-api.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_script(extra="") -> str:
    return f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}};this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const calls = [];
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: '7', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:7', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, cropRecordSummary: {{ recordSummarySource: 'crop_repo_recent_records_readonly', growthSurvey: {{ count: 0, latest: null, latestLabel: '', staleState: 'empty' }}, pestScouting: {{ count: 0, latest: null, latestLabel: '', staleState: 'attention' }}, controlTreatment: {{ count: 1, latest: {{ date: '2026-06-30', pesticides: [{{ name: '리도밀', pls: true }}] }}, latestLabel: '2026-06-30 · 리도밀 · PHI 3일 남음', staleState: 'fresh' }}, workQueue: {{ nextAction: '필수 기록 최신 상태', missingItems: ['SPAD 미입력', '병해충 예찰 5일 경과'] }}, readOnly: false, writeEnabled: true, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async (method, path, body) => {{ calls.push({{ method, path, body }}); if (method === 'GET') return {{ recordType: 'growth-survey', rows: [{{ id: 1, date: '2026-06-30', summary: '초장 18cm · 엽수 9' }}] }}; return {{ ok: true, id: 9, recordType: path.split('/').pop() }}; }} }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      {extra}
      panel.render();
      const html = panel.innerHTML;
    """


def test_r7_057_version_surfaces_are_1_12_92():
    assert '"version": "1.14.60"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.60"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.60"' in _read(REBUILD_PANEL)


def test_r7_057_status_badges_are_explicit_by_card_with_color_policy():
    source = _read(REBUILD_PANEL)
    for key in (
        "normal-ready",
        "needs-verification",
        "evidence-limited",
        "due-today",
        "attention-stale",
        "safety-check",
    ):
        assert key in source
    script = _render_script() + """
      const required = [
        'data-r7-record-status-key="normal-ready"', '정상', '운영 가능', 'background:#e8f7ee',
        'data-r7-record-status-key="needs-verification"', '확인 필요', '누락 확인', 'background:#fff4d6',
        'data-r7-record-status-key="evidence-limited"', '근거 부족', '신뢰도 제한', 'background:#fde7e4',
        'data-r7-record-status-key="due-today"', '오늘 필요', '오늘 작성', 'background:#eaf3ff',
        'data-r7-record-status-key="attention-stale"', '주의', '지연 확인',
        'data-r7-record-status-key="safety-check"', '확인', '안전 확인'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_057_buttons_are_real_actions_for_write_history_and_evidence_modals():
    script = _render_script() + """
      const required = [
        'data-r7-record-card-button',
        'data-r7-record-action-mode="write"',
        'data-r7-record-action-mode="history"',
        'data-r7-record-action-mode="evidence"',
        'data-r7-record-action-mode="verification"',
        'data-r7-record-action-type="growth-survey"',
        'data-r7-record-action-type="pest-scouting"',
        'data-r7-record-action-type="control-treatment"',
        'data-r7-record-action-season-id="7"'
      ];
      const forbidden = ['data-r7-record-action-state="pending-api"', 'navigation-only'];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) { console.error(JSON.stringify({ missing, bad })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_057_modal_shell_renders_write_history_evidence_and_verification_modes():
    script = _render_script("panel._r7RecordModal = { mode: 'write', recordType: 'growth-survey', seasonId: 7, title: '생육조사 작성', state: 'ready', rows: [] };") + """
      const required = ['data-r7-record-modal-shell', 'data-r7-record-modal-mode="write"', 'data-r7-record-write-form', 'data-r7-record-modal-submit', 'data-r7-record-modal-close'];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout

    script = _render_script("panel._r7RecordModal = { mode: 'history', recordType: 'growth-survey', seasonId: 7, title: '생육조사 히스토리', state: 'ready', rows: [{ id: 1, date: '2026-06-30', summary: '초장 18cm · 엽수 9' }] };") + """
      const required = ['data-r7-record-modal-shell', 'data-r7-record-modal-mode="history"', 'data-r7-record-history-list', 'data-r7-record-history-row', '초장 18cm · 엽수 9'];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_057_panel_source_wires_api_calls_and_submit_binding():
    source = _read(REBUILD_PANEL)
    for needle in (
        "_bindR7RecordWorkflowActions()",
        "openR7RecordWorkflowModal(",
        "submitR7RecordWorkflowForm(",
        "fetchR7RecordHistory(",
        "createR7RecordPayload(",
        "this.hass.callApi(\"GET\", `green_smart/rebuild/crop-records/${seasonId}/history/${recordType}`)",
        "this.hass.callApi(writeMethod, `green_smart/rebuild/crop-records/${normalizedSeasonId}/${recordType}`",
    ):
        assert needle in source


def test_r7_057_rebuild_backend_exposes_registered_records_api_wrappers():
    source = _read(REBUILD_VIEWS)
    for needle in (
        "class RebuildCropRecordsHistoryView(HomeAssistantView)",
        "class RebuildCropRecordsWriteView(HomeAssistantView)",
        "/api/green_smart/rebuild/crop-records/{season_id}/history/{record_type}",
        "/api/green_smart/rebuild/crop-records/{season_id}/{record_type}",
        "list_growth_records",
        "list_pest_records",
        "list_control_records",
        "INSERT INTO growth_surveys",
        "INSERT INTO pest_surveys",
        "INSERT INTO control_records",
        "control_pesticides",
    ):
        assert needle in source
    init = _read(INIT)
    assert "RebuildCropRecordsHistoryView" in init
    assert "RebuildCropRecordsWriteView" in init
    assert "hass.http.register_view(RebuildCropRecordsHistoryView())" in init
    assert "hass.http.register_view(RebuildCropRecordsWriteView())" in init


def test_r7_057_status_modal_api_policy_documented():
    doc = _read(DOC)
    for phrase in (
        "상태 뱃지 구체화",
        "작성 팝업과 히스토리 팝업",
        "기존 growth_surveys/pest_surveys/control_records 테이블 재사용",
        "rebuild crop-records API wrapper",
        "장치/MQTT/자동실행 제외",
    ):
        assert phrase in doc
