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


def test_r7_048_version_surfaces_follow_current_release():
    assert '"version": "1.12.87"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.87"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.87"' in _read(REBUILD_PANEL)
    assert "v1.12.87" in _read(DOC)


def test_r7_048_records_workflow_baseline_is_superseded_by_r7_050_product_layout():
    text = _read(REBUILD_PANEL)
    for current_marker in [
        "renderR7RecordsWorkflowProductLayout(",
        "data-r7-records-workflow-product-layout=\"write-history-review\"",
        "data-r7-record-action-state=\"pending-api\"",
        "data-r7-record-action-state=\"navigation-only\"",
    ]:
        assert current_marker in text
    for old_marker in [
        "data-r7-crop-record-workflow-vertical-slice=\"true\"",
        "data-r7-crop-record-workflow-layout=\"priority-records-source\"",
        "data-r7-crop-record-card-kind=\"missing-attention\"",
    ]:
        assert old_marker not in text


def test_r7_048_records_workflow_values_remain_visible_inside_new_product_layout():
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
        'data-r7-records-workflow-product-layout="write-history-review"',
        '오늘 할 일', '최근 기록 검토 완료', '누락 없음',
        '생육조사', '2026-06-28 · 초장 18.4cm · 엽수 9', '초장 18.4cm', '엽수 9',
        '병해충 예찰', '2026-06-29 · 진딧물 · low',
        '방제', '2026-06-29 · 친환경유제 · PLS 적합', 'PLS 적합',
        '기록 원천', 'recordSummarySource=crop_repo_recent_records_readonly',
        'readOnly=true', 'writeEnabled=false', 'executionEnabled=false', 'deviceCommandEnabled=false', 'mqttEnabled=false'
      ];
      const forbidden = ['data-r7-crop-product-direct-cards="records-workflow"', 'data-r7-crop-record-card-kind="today-work"', 'data-r7-crop-record-card-kind="growth-survey"'];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) { console.error(JSON.stringify({ missing, bad })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_048_other_crop_subtab_product_builders_are_preserved():
    text = _read(REBUILD_PANEL)
    for helper in [
        "renderR7CropCycleCards(",
        "renderR7CropGrowthTargetCards(",
        "renderR7CropModelAssistCards(",
        "renderR7CropTrendEvidenceCards(",
    ]:
        assert helper in text
