from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-056-records-workflow-common-components.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_script() -> str:
    return f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}};this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, cropRecordSummary: {{ recordSummarySource: 'crop_repo_recent_records_readonly', growthSurvey: {{ count: 0, latest: null, latestLabel: '', staleState: 'empty' }}, pestScouting: {{ count: 0, latest: null, latestLabel: '', staleState: 'attention' }}, controlTreatment: {{ count: 1, latest: {{ date: '2026-06-30', pesticides: [{{ name: '리도밀', pls: true }}] }}, latestLabel: '2026-06-30 · 리도밀 · PHI 3일 남음', staleState: 'fresh' }}, workQueue: {{ nextAction: '필수 기록 최신 상태', missingItems: ['SPAD 미입력', '병해충 예찰 5일 경과'] }}, readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow');
      panel._activeR7Domain = 'crop-operations';
      panel.render();
      const html = panel.innerHTML;
    """


def test_r7_056_version_surfaces_are_1_12_91():
    assert '"version": "1.15.51"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.51"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.51"' in _read(REBUILD_PANEL)


def test_r7_056_source_uses_shared_record_components_instead_of_inline_locals():
    source = _read(REBUILD_PANEL)
    for helper in (
        "renderR7RecordCardShell(",
        "renderR7RecordCardHeader(",
        "renderR7RecordCardBody(",
        "renderR7RecordCardActionRow(",
        "renderR7RecordCardButton(",
        "renderR7RecentRecordPanel(",
        "renderR7RecentRecordRow(",
    ):
        assert helper in source
    layout_source = source[source.index("renderR7RecordsWorkflowProductLayout(ctx)"):source.index("renderR7CropRecordWorkflowVerticalSlice(ctx)")]
    for forbidden in (
        "const cardStyle =",
        "const badge =",
        "const button =",
        "const header =",
    ):
        assert forbidden not in layout_source


def test_r7_056_rendered_cards_have_common_head_body_action_button_alignment():
    script = _render_script() + """
      const cardKinds = ['today-work','missing-verification','growth-survey','pest-scouting','control-treatment'];
      const required = [
        'data-r7-record-card-shell',
        'data-r7-record-card-header',
        'data-r7-record-card-headline',
        'data-r7-record-card-icon-wrap',
        'data-r7-record-card-title',
        'data-r7-record-card-badge',
        'data-r7-record-card-body',
        'data-r7-record-card-primary',
        'data-r7-record-card-note',
        'data-r7-record-card-action-row',
        'data-r7-record-card-button',
        'height:34px;',
        'min-width:0;width:100%;',
        'display:inline-flex;align-items:center;justify-content:center;gap:6px;',
        '--mdc-icon-size:15px;width:15px;height:15px;flex:0 0 auto;',
        'text-align:center;white-space:nowrap;'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      const missingCards = cardKinds.filter((kind) => !html.includes(`data-r7-record-card-shell="${kind}"`));
      if (missing.length || missingCards.length) { console.error(JSON.stringify({ missing, missingCards })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_056_ai_and_recent_records_use_the_same_component_grammar():
    script = _render_script() + """
      const required = [
        'data-r7-record-card-shell="ai-evidence"',
        'data-r7-record-ai-card',
        'data-r7-record-recent-log-panel',
        'data-r7-record-recent-header',
        'data-r7-record-recent-body',
        'data-r7-record-recent-row',
        'data-r7-record-recent-kind',
        'data-r7-record-recent-time',
        'data-r7-record-recent-memo',
        'data-r7-record-recent-state',
        'grid-template-columns:minmax(120px,.8fr) minmax(130px,.9fr) minmax(0,2fr) minmax(96px,.7fr) 18px;',
        'align-items:center;gap:10px;'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_056_component_policy_documented():
    doc = _read(DOC)
    for phrase in (
        "head/body/action-row/button 공통 컴포넌트",
        "버튼은 동일 높이와 전체 폭 정렬",
        "아이콘과 텍스트는 수평 중앙 정렬",
        "최근 기록도 동일한 header/body/row grammar",
    ):
        assert phrase in doc
