from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-050-records-workflow-delete-old-card-content.md"

OLD_RECORD_MARKERS = [
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


def _records_workflow_render_script() -> str:
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


def test_r7_050_version_surfaces_are_1_12_85():
    assert '"version": "1.12.86"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.86"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.86"' in _read(REBUILD_PANEL)
    assert "v1.12.86" in _read(DOC)


def test_r7_050_plan_says_old_content_cards_are_reference_only_then_deleted():
    text = _read(DOC)
    for phrase in [
        "old content-card UI must be used as documentation/reference, then removed",
        "Do not render the old direct-card grid wrapper",
        "old marker/contracts are now historical reference only",
        "fresh product workflow layout",
    ]:
        assert phrase in text


def test_r7_050_records_workflow_render_deletes_old_card_wrapper_and_markers():
    script = _records_workflow_render_script() + f"""
      const required = [
        'data-r7-records-workflow-product-layout="write-history-review"',
        'data-r7-record-action-queue',
        'data-r7-record-section="growth-survey"',
        'data-r7-record-section="pest-scouting"',
        'data-r7-record-section="control-treatment"',
        'data-r7-record-section="missing-attention"',
        'data-r7-record-section="record-source"',
        '생육조사 작성', '생육 히스토리', '최근 기록 수정',
        '예찰 작성', '예찰 히스토리', '방제 기록으로 연결',
        '방제 기록 작성', '방제 히스토리', 'PLS 확인',
        'data-r7-record-boundary="record-only-no-execution"',
        'data-r7-record-source-detail="admin"'
      ];
      const oldMarkers = {OLD_RECORD_MARKERS!r};
      const forbidden = [...oldMarkers, 'data-r7-crop-direct-execute', 'data-r7-crop-ha-service-call', 'data-r7-crop-mqtt-command', 'data-r7-crop-auto-apply', 'data-r7-crop-device-command'];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) {{ console.error(JSON.stringify({{ missing, bad }})); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_050_other_crop_subtabs_still_use_direct_card_grid():
    script = _records_workflow_render_script() + """
      panel.setR7DomainSubtab('crop-operations', 'crop-cycle');
      panel.render();
      const cycleHtml = panel.innerHTML;
      const required = ['data-r7-crop-product-direct-cards="crop-cycle"', 'data-r7-crop-product-card-grid', '작기 연결', '작물 프로필'];
      const missing = required.filter((needle) => !cycleHtml.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
