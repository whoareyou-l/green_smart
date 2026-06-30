from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-049-records-workflow-product-layout-redo-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _node_harness(record_summary: str) -> str:
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
        cropRecordSummary: {record_summary},
        dataAvailability: {{ state: 'fresh', source: 'qa' }}
      }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      panel.render();
      const html = panel.innerHTML;
    """


def test_r7_049_version_surfaces_are_1_12_84():
    assert '"version": "1.12.84"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.84"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.84"' in _read(REBUILD_PANEL)
    assert "v1.12.84" in _read(DOC)


def test_r7_049_plan_supersedes_value_card_work_with_product_judgment():
    text = _read(DOC)
    for phrase in [
        "supersedes the shallow R7-048",
        "DTO value -> card display",
        "decide if it needs write CTA / history / edit / settings / approval / read-only source",
        "v1.12.84` must be redone as `v1.12.84`",
        "Product judgment matrix",
        "data-r7-records-workflow-product-layout=\"write-history-review\"",
    ]:
        assert phrase in text


def test_r7_049_source_exposes_product_layout_helpers_and_markers():
    text = _read(REBUILD_PANEL)
    for marker in [
        "r7RecordActionButton(",
        "r7RecordActionsForMissingItems(",
        "r7RecordPlsRequiresCheck(",
        "renderR7RecordsWorkflowProductLayout(",
        "data-r7-records-workflow-product-layout=\"write-history-review\"",
        "data-r7-record-action-state=\"pending-api\"",
        "data-r7-record-action-state=\"navigation-only\"",
        "data-r7-record-boundary=\"record-only-no-execution\"",
    ]:
        assert marker in text


def test_r7_049_missing_items_generate_write_ctas_and_history_navigation():
    record_summary = """{
      recordSummarySource: 'crop_repo_recent_records_readonly',
      growthSurvey: { count: 0, latest: {}, latestLabel: '생육조사 기록 없음', staleState: 'empty' },
      pestScouting: { count: 0, latest: {}, latestLabel: '병해충 예찰 기록 없음', staleState: 'empty' },
      controlTreatment: { count: 0, latest: {}, latestLabel: '방제 기록 없음', staleState: 'empty' },
      workQueue: { nextAction: '누락 기록 확인', missingItems: ['생육조사 없음', '병해충 예찰 없음', '방제 기록 없음'] },
      readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false
    }"""
    script = _node_harness(record_summary) + """
      const required = [
        'data-r7-records-workflow-product-layout="write-history-review"',
        'data-r7-record-action-queue',
        '오늘 할 일', '누락 기록 확인',
        'data-r7-record-action-primary="growth-survey-write"', '생육조사 작성',
        'data-r7-record-action-primary="pest-scouting-write"', '예찰 작성',
        'data-r7-record-action-primary="control-treatment-write"', '방제 기록 작성',
        'data-r7-record-action-secondary="record-history"', '전체 기록 보기',
        'data-r7-record-action-state="pending-api"',
        'data-r7-record-action-state="navigation-only"'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_049_growth_pest_control_sections_have_required_affordances():
    record_summary = """{
      recordSummarySource: 'crop_repo_recent_records_readonly',
      growthSurvey: { count: 2, latest: { date: '2026-06-28', height: 18.4, leafCount: 9 }, latestLabel: '2026-06-28 · 초장 18.4cm · 엽수 9', staleState: 'fresh' },
      pestScouting: { count: 1, latest: { date: '2026-06-29', type: '진딧물', severity: 'high' }, latestLabel: '2026-06-29 · 진딧물 · high', staleState: 'attention' },
      controlTreatment: { count: 1, latest: { date: '2026-06-30', pesticides: [{ name: '리도밀', pls: false }] }, latestLabel: '2026-06-30 · 리도밀 · PLS 확인 필요', staleState: 'fresh' },
      workQueue: { nextAction: '방제 PLS 확인', missingItems: [] },
      readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false
    }"""
    script = _node_harness(record_summary) + """
      const required = [
        'data-r7-record-section="growth-survey"',
        'data-r7-record-write-target="growth-survey"', '생육조사 작성',
        'data-r7-record-history-target="growth-survey"', '생육 히스토리',
        'data-r7-record-edit-target="growth-survey-latest"', '최근 기록 수정',
        '2026-06-28 · 초장 18.4cm · 엽수 9', '초장 18.4cm', '엽수 9',
        'data-r7-record-section="pest-scouting"',
        'data-r7-record-write-target="pest-scouting"', '예찰 작성',
        'data-r7-record-history-target="pest-scouting"', '예찰 히스토리',
        'data-r7-record-link-target="control-treatment"', '방제 기록으로 연결',
        '2026-06-29 · 진딧물 · high',
        'data-r7-record-section="control-treatment"',
        'data-r7-record-write-target="control-treatment"', '방제 기록 작성',
        'data-r7-record-history-target="control-treatment"', '방제 히스토리',
        'data-r7-record-check-target="pls"', 'PLS 확인',
        'data-r7-record-boundary="record-only-no-execution"', '실행 아님 · 기록 전용',
        '2026-06-30 · 리도밀 · PLS 확인 필요'
      ];
      const forbidden = ['data-r7-crop-direct-execute', 'data-r7-crop-ha-service-call', 'data-r7-crop-mqtt-command', 'data-r7-crop-auto-apply', 'data-r7-crop-device-command'];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) { console.error(JSON.stringify({ missing, bad })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_049_missing_attention_and_record_source_are_operator_judged_not_raw_dump():
    record_summary = """{
      recordSummarySource: 'crop_repo_recent_records_readonly',
      growthSurvey: { count: 0, latest: {}, latestLabel: '생육조사 기록 없음', staleState: 'empty' },
      pestScouting: { count: 1, latest: { date: '2026-06-29', type: '진딧물', severity: 'low' }, latestLabel: '2026-06-29 · 진딧물 · low', staleState: 'fresh' },
      controlTreatment: { count: 1, latest: { date: '2026-06-30', pesticides: [{ name: '리도밀', pls: false }] }, latestLabel: '2026-06-30 · 리도밀 · PLS 확인 필요', staleState: 'fresh' },
      workQueue: { nextAction: '생육조사 입력 필요', missingItems: ['생육조사 없음'] },
      readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false
    }"""
    script = _node_harness(record_summary) + """
      const required = [
        'data-r7-record-section="missing-attention"',
        'data-r7-record-missing-count="',
        'data-r7-record-missing-action="growth-survey-write"',
        '생육조사 작성',
        'PLS 확인 필요',
        'data-r7-record-section="record-source"',
        'data-r7-record-source-summary',
        '최근 기록 요약 · read-only',
        'data-r7-record-source-detail="admin"',
        '관리자 상세',
        'recordSummarySource=crop_repo_recent_records_readonly',
        'readOnly=true', 'writeEnabled=false', 'executionEnabled=false', 'deviceCommandEnabled=false', 'mqttEnabled=false'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_049_other_subtabs_are_not_the_product_layout_target():
    text = _read(REBUILD_PANEL)
    assert text.count('data-r7-records-workflow-product-layout="write-history-review"') == 1
    for helper in [
        "renderR7CropCycleCards(",
        "renderR7CropGrowthTargetCards(",
        "renderR7CropModelAssistCards(",
        "renderR7CropTrendEvidenceCards(",
    ]:
        assert helper in text
