from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-052-records-workflow-api-contract.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_records_workflow_html() -> str:
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, cropRecordSummary: {{ recordSummarySource: 'crop_repo_recent_records_readonly', growthSurvey: {{ count: 0, latest: null, latestLabel: '', staleState: 'empty' }}, pestScouting: {{ count: 0, latest: null, latestLabel: '', staleState: 'attention' }}, controlTreatment: {{ count: 1, latest: {{ date: '2026-06-30', pesticides: [{{ name: '리도밀', pls: true }}] }}, latestLabel: '2026-06-30 · 리도밀 · PHI 3일 남음', staleState: 'fresh' }}, workQueue: {{ nextAction: '필수 기록 최신 상태', missingItems: ['SPAD 미입력', '병해충 예찰 5일 경과'] }}, readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      panel.setR7DomainSubtab('crop-operations', 'records-workflow'); panel._activeR7Domain = 'crop-operations'; panel.render();
      console.log(panel.innerHTML);
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout


def test_r7_052_version_surfaces_are_1_12_88_after_r7_053_supersession():
    assert '"version": "1.14.80"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.80"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.80"' in _read(REBUILD_PANEL)
    assert "v1.14.80" in _read(DOC)


def test_r7_052_api_contract_doc_is_implemented_by_r7_057_wrapper():
    text = _read(DOC)
    for phrase in [
        "/api/green_smart/rebuild/crop-records",
        "POST /api/green_smart/rebuild/crop-records/growth-survey",
        "crop-operations.records-workflow",
        "crop_record_created",
    ]:
        assert phrase in text
    source = _read(REBUILD_PANEL)
    assert "R7_RECORDS_WORKFLOW_API_CONTRACT" in source
    assert 'writeImplementationEnabled: true' in source
    assert 'mode: "implemented-wrapper"' in source
    assert 'this.hass.callApi(writeMethod, `green_smart/rebuild/crop-records/${normalizedSeasonId}/${recordType}`' in source
    assert 'this.hass.callApi("GET", `green_smart/rebuild/crop-records/${seasonId}/history/${recordType}`)' in source


def test_r7_052_render_contract_is_superseded_by_r7_053_image_dashboard():
    html = _render_records_workflow_html()
    for required in [
        'data-r7-records-image-dashboard="true"',
        'data-r7-record-image-card="today-work"',
        'data-r7-record-image-card="missing-verification"',
        'data-r7-record-image-card="growth-survey"',
        'data-r7-record-recent-log-panel',
    ]:
        assert required in html
    for forbidden in [
        'data-r7-record-api-contract="planned-v1.14.80"',
        'data-r7-record-flow-skeleton="write-history-pls"',
        'planned-contract-only',
    ]:
        assert forbidden not in html
