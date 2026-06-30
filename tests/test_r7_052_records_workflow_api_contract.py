from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-052-records-workflow-api-contract.md"


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


def test_r7_052_version_surfaces_are_1_12_87():
    assert '"version": "1.12.87"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.87"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.87"' in _read(REBUILD_PANEL)
    assert "v1.12.87" in _read(DOC)


def test_r7_052_doc_freezes_endpoint_family_payload_rbac_audit_and_nongoals():
    text = _read(DOC)
    required = [
        "/api/green_smart/rebuild/crop-records",
        "GET /api/green_smart/rebuild/crop-records/history",
        "POST /api/green_smart/rebuild/crop-records/growth-survey",
        "POST /api/green_smart/rebuild/crop-records/pest-scouting",
        "POST /api/green_smart/rebuild/crop-records/control-treatment",
        "PATCH /api/green_smart/rebuild/crop-records/{recordType}/{recordId}",
        "POST /api/green_smart/rebuild/crop-records/pls-check",
        "zoneId",
        "cropCycleId",
        "recordedAt",
        "actorRole",
        "actorUserId",
        "sourceSurface",
        "idempotencyKey",
        "crop-operations.records-workflow",
        "admin: allowed",
        "farm_owner: allowed",
        "farm_staff: allowed only when permission crop_records_write is granted",
        "crop_record_created",
        "crop_record_updated",
        "pls_check_requested",
        "No route implementation",
        "No DB migration",
        "No UI submit binding",
        "No actual save/edit/delete",
        "No HA service call",
        "No MQTT/device command",
        "No automatic apply/execute",
    ]
    missing = [needle for needle in required if needle not in text]
    assert not missing


def test_r7_052_rebuild_panel_exposes_static_contract_descriptor_without_fetching():
    source = _read(REBUILD_PANEL)
    required = [
        "R7_RECORDS_WORKFLOW_API_CONTRACT",
        'prefix: "/api/green_smart/rebuild/crop-records"',
        '"get /history"',
        '"post /growth-survey"',
        '"post /pest-scouting"',
        '"post /control-treatment"',
        '"patch /{recordType}/{recordId}"',
        '"post /pls-check"',
        'sourceSurface: "crop-operations.records-workflow"',
        'mode: "planned-contract-only"',
        'writeImplementationEnabled: false',
    ]
    missing = [needle for needle in required if needle not in source]
    assert not missing
    forbidden = [
        'fetch("/api/green_smart/rebuild/crop-records',
        "fetch('/api/green_smart/rebuild/crop-records",
        ".callService",
        "mqtt.publish",
        "saveRecord(",
        "executeRecordFlow(",
    ]
    bad = [needle for needle in forbidden if needle in source]
    assert not bad


def test_r7_052_render_marks_planned_api_contract_but_keeps_ui_skeleton_only_boundary():
    script = _render_script() + """
      const required = [
        'data-r7-record-api-contract="planned-v1.12.87"',
        'data-r7-record-api-prefix="/api/green_smart/rebuild/crop-records"',
        'data-r7-record-api-boundary="ui-skeleton-only"',
        'data-r7-record-flow-skeleton="write-history-pls"',
        'planned-contract-only',
        'writeImplementationEnabled=false',
        'post /growth-survey',
        'post /pest-scouting',
        'post /control-treatment',
        'post /pls-check'
      ];
      const forbidden = [
        'data-r7-crop-product-direct-cards="records-workflow"',
        'data-r7-crop-record-card-kind="today-work"',
        'data-r7-crop-record-workflow-vertical-slice="true"',
        'fetch("/api/green_smart/rebuild/crop-records',
        'data-r7-crop-ha-service-call',
        'data-r7-crop-mqtt-command',
        'data-r7-crop-auto-apply',
        'data-r7-crop-device-command'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) { console.error(JSON.stringify({ missing, bad })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_052_no_runtime_route_implementation_added_yet():
    py_sources = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in (ROOT / "custom_components/green_smart").rglob("*.py"))
    forbidden = [
        "/api/green_smart/rebuild/crop-records",
        "crop_record_created",
        "crop_record_updated",
        "pls_check_requested",
    ]
    bad = [needle for needle in forbidden if needle in py_sources]
    assert not bad
