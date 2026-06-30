from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-051-records-workflow-flow-skeleton.md"

FORBIDDEN_OLD_RECORD_MARKERS = [
    'data-r7-crop-product-direct-cards="records-workflow"',
    'data-r7-crop-record-card-kind="today-work"',
    'data-r7-crop-record-card-kind="growth-survey"',
    'data-r7-crop-record-card-kind="pest-scouting"',
    'data-r7-crop-record-card-kind="control-treatment"',
    'data-r7-crop-record-card-kind="missing-attention"',
    'data-r7-crop-record-card-kind="record-source"',
    'data-r7-crop-record-workflow-vertical-slice="true"',
    'data-r7-crop-record-workflow-layout="priority-records-source"',
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_script() -> str:
    return f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{
        id: 'zone-1', name: '1구역', crop: '상추', state: '활착기',
        currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }},
        currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }},
        cropRecordSummary: {{
          recordSummarySource: 'crop_repo_recent_records_readonly',
          growthSurvey: {{ count: 2, latest: {{ date: '2026-06-28', height: 18.4, leafCount: 9 }}, latestLabel: '2026-06-28 · 초장 18.4cm · 엽수 9', staleState: 'fresh' }},
          pestScouting: {{ count: 1, latest: {{ date: '2026-06-29', type: '진딧물', severity: 'high' }}, latestLabel: '2026-06-29 · 진딧물 · high', staleState: 'attention' }},
          controlTreatment: {{ count: 1, latest: {{ date: '2026-06-30', pesticides: [{{ name: '리도밀', pls: false }}] }}, latestLabel: '2026-06-30 · 리도밀 · PLS 확인 필요', staleState: 'fresh' }},
          workQueue: {{ nextAction: '생육조사 입력 필요', missingItems: ['생육조사 없음'] }},
          readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false
        }},
        dataAvailability: {{ state: 'fresh', source: 'qa' }}
      }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      panel.render();
      const html = panel.innerHTML;
    """


def test_r7_051_version_surfaces_are_1_12_86():
    assert '"version": "1.12.87"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.87"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.87"' in _read(REBUILD_PANEL)
    assert "v1.12.87" in _read(DOC)


def test_r7_051_plan_defines_ui_only_write_history_pls_skeletons():
    text = _read(DOC)
    for phrase in [
        "Do not restore old content-card wrappers",
        "data-r7-record-flow-skeleton=\"write-history-pls\"",
        "data-r7-record-modal=\"growth-survey-write\"",
        "data-r7-record-history-drawer=\"growth-survey\"",
        "data-r7-record-pls-check-flow",
        "data-r7-record-api-boundary=\"ui-skeleton-only\"",
    ]:
        assert phrase in text


def test_r7_051_records_workflow_renders_write_modal_skeletons_with_fields():
    script = _render_script() + """
      const required = [
        'data-r7-record-flow-skeleton="write-history-pls"',
        'data-r7-record-modal="growth-survey-write"', '생육조사 작성 플로우', '조사일', '초장', '엽수', '생육단계', '특이사항', '작기/구역 연결',
        'data-r7-record-modal="pest-scouting-write"', '예찰 작성 플로우', '예찰일', '병해충명', 'severity', '발생 위치', '확산 여부', '사진/메모', '방제 필요 여부',
        'data-r7-record-modal="control-treatment-write"', '방제 기록 작성 플로우', '방제일', '대상 병해충', '약제명', '희석배수/사용량', 'PLS 상태', '작업자', '안전 메모',
        'data-r7-record-submit-state="pending-api"'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_051_records_workflow_renders_history_edit_and_pls_skeletons():
    script = _render_script() + """
      const required = [
        'data-r7-record-history-drawer="growth-survey"', '생육 히스토리 플로우',
        'data-r7-record-history-drawer="pest-scouting"', '예찰 히스토리 플로우',
        'data-r7-record-history-drawer="control-treatment"', '방제 히스토리 플로우',
        'data-r7-record-history-state="navigation-only"', '최근 N건', '날짜', '요약', '작성자/수정 여부는 API 연결 후',
        'data-r7-record-edit-flow="growth-survey-latest"', '최근 생육조사 수정', '저장 API 연결 전',
        'data-r7-record-pls-check-flow', 'PLS 확인 플로우', 'PSIS/약제 DB 확인은 후속 API slice',
        'data-r7-record-api-boundary="ui-skeleton-only"'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_051_no_old_record_cards_no_execution_no_write_api_connected():
    script = _render_script() + f"""
      const forbidden = [
        ...{FORBIDDEN_OLD_RECORD_MARKERS!r},
        'fetch("/api/green_smart/crop-records',
        '.callService',
        'data-r7-crop-ha-service-call',
        'data-r7-crop-mqtt-command',
        'data-r7-crop-auto-apply',
        'data-r7-crop-device-command',
        'saveRecord(',
        'mqtt.publish',
        'executeRecordFlow('
      ];
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (bad.length) {{ console.error(JSON.stringify({{ bad }})); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
