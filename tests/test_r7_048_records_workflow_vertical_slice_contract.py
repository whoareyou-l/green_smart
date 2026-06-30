from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-048-records-workflow-vertical-slice.md"


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


def test_r7_048_version_surfaces_are_1_12_83():
    assert '"version": "1.12.84"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.84"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.84"' in _read(REBUILD_PANEL)
    assert "v1.12.84" in _read(DOC)


def test_r7_048_plan_is_records_workflow_only_and_field_mapped():
    text = _read(DOC)
    for phrase in [
        "Implement only the `작물 운영 > 기록·작업` subtab",
        "records-workflow` only",
        "selectedZone.cropRecordSummary",
        "workQueue.nextAction",
        "growthSurvey.latestLabel",
        "pestScouting.latestLabel",
        "controlTreatment.latestLabel",
        "PLS 확인 필요",
        "data-r7-crop-record-workflow-vertical-slice=\"true\"",
    ]:
        assert phrase in text


def test_r7_048_source_contains_records_workflow_vertical_slice_helpers_only():
    text = _read(REBUILD_PANEL)
    for marker in [
        "renderR7CropRecordWorkflowVerticalSlice(",
        "r7RecordMissingItems(",
        "r7RecordCardState(",
        "r7RecordEvidence(",
        "data-r7-crop-record-workflow-vertical-slice=\"true\"",
        "data-r7-crop-record-workflow-layout=\"priority-records-source\"",
        "data-r7-crop-record-card-kind=\"missing-attention\"",
    ]:
        assert marker in text


def test_r7_048_records_workflow_complete_state_uses_exact_dto_values():
    record_summary = """{
      recordSummarySource: 'crop_repo_recent_records_readonly',
      growthSurvey: { count: 2, latest: { date: '2026-06-28', height: 18.4, leafCount: 9 }, latestLabel: '2026-06-28 · 초장 18.4cm · 엽수 9', staleState: 'fresh' },
      pestScouting: { count: 1, latest: { date: '2026-06-29', type: '진딧물', severity: 'low' }, latestLabel: '2026-06-29 · 진딧물 · low', staleState: 'fresh' },
      controlTreatment: { count: 1, latest: { date: '2026-06-29', pesticides: [{ name: '친환경유제', pls: true }] }, latestLabel: '2026-06-29 · 친환경유제 · PLS 적합', staleState: 'fresh' },
      workQueue: { nextAction: '최근 기록 검토 완료', missingItems: [] },
      readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false
    }"""
    script = _node_harness(record_summary) + """
      const required = [
        'data-r7-crop-record-workflow-vertical-slice="true"',
        'data-r7-crop-record-workflow-layout="priority-records-source"',
        'data-r7-crop-record-card-kind="today-work"',
        'data-r7-crop-record-card-kind="growth-survey"',
        'data-r7-crop-record-card-kind="pest-scouting"',
        'data-r7-crop-record-card-kind="control-treatment"',
        'data-r7-crop-record-card-kind="missing-attention"',
        'data-r7-crop-record-card-kind="record-source"',
        '오늘 할 일', '최근 기록 검토 완료', '누락 없음',
        '생육조사', '2026-06-28 · 초장 18.4cm · 엽수 9', '초장 18.4cm', '엽수 9',
        '병해충 예찰', '2026-06-29 · 진딧물 · low',
        '방제', '2026-06-29 · 친환경유제 · PLS 적합', 'PLS 적합',
        '기록 원천', 'crop_repo_recent_records_readonly',
        'readOnly=true', 'writeEnabled=false', 'executionEnabled=false', 'deviceCommandEnabled=false', 'mqttEnabled=false'
      ];
      const forbidden = ['기록·작업 운영 화면', 'data-r7-crop-direct-execute', 'data-r7-crop-ha-service-call', 'data-r7-crop-mqtt-command'];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) { console.error(JSON.stringify({ missing, bad })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_048_records_workflow_missing_and_pls_warning_state_is_explicit():
    record_summary = """{
      recordSummarySource: 'crop_repo_recent_records_readonly',
      growthSurvey: { count: 0, latest: {}, latestLabel: '생육조사 기록 없음', staleState: 'empty' },
      pestScouting: { count: 0, latest: {}, latestLabel: '병해충 예찰 기록 없음', staleState: 'empty' },
      controlTreatment: { count: 1, latest: { date: '2026-06-30', pesticides: [{ name: '리도밀', pls: false }] }, latestLabel: '2026-06-30 · 리도밀 · PLS 확인 필요', staleState: 'fresh' },
      workQueue: { nextAction: '누락 기록 확인', missingItems: ['생육조사 없음', '병해충 예찰 없음'] },
      readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false
    }"""
    script = _node_harness(record_summary) + """
      const required = [
        '오늘 할 일', '누락 기록 확인', '2개 확인 필요',
        '생육조사 없음', '병해충 예찰 없음',
        '생육조사 기록 없음', '최근 0건 · empty',
        '병해충 예찰 기록 없음',
        '방제', '2026-06-30 · 리도밀 · PLS 확인 필요', 'PLS 확인 필요',
        '누락/주의', '2개 확인 필요',
        'data-r7-crop-record-attention="true"',
        'data-r7-product-state="attention"'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_048_other_crop_subtab_product_builders_are_not_replaced_by_this_slice():
    text = _read(REBUILD_PANEL)
    # The slice may route through the common dispatcher, but only records-workflow gets the vertical-slice layout marker.
    assert text.count('data-r7-crop-record-workflow-vertical-slice="true"') == 1
    for helper in [
        "renderR7CropCycleCards(",
        "renderR7CropGrowthTargetCards(",
        "renderR7CropModelAssistCards(",
        "renderR7CropTrendEvidenceCards(",
    ]:
        assert helper in text
