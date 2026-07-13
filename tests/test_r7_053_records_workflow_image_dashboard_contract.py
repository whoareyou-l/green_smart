from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


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
          growthSurvey: {{ count: 0, latest: null, latestLabel: '', staleState: 'empty' }},
          pestScouting: {{ count: 0, latest: null, latestLabel: '', staleState: 'attention' }},
          controlTreatment: {{ count: 1, latest: {{ date: '2026-06-30', pesticides: [{{ name: '리도밀', pls: true }}] }}, latestLabel: '2026-06-30 · 리도밀 · PHI 3일 남음', staleState: 'fresh' }},
          workQueue: {{ nextAction: '필수 기록 최신 상태', missingItems: ['SPAD 미입력', '병해충 예찰 5일 경과'] }},
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


def test_r7_053_version_surfaces_are_1_12_88():
    assert '"version": "1.15.57"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.57"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.57"' in _read(REBUILD_PANEL)


def test_r7_053_records_workflow_renders_image_like_dashboard_cards():
    script = _render_script() + """
      const required = [
        'data-r7-records-image-dashboard="true"',
        'data-r7-record-image-grid="primary"',
        'data-r7-record-image-card="today-work"', '오늘 할 일', '정상', '필수 기록 최신 상태', '전체 보기',
        'data-r7-record-image-card="missing-verification"', '누락·검증 필요', '확인 필요', 'SPAD 미입력', '병해충 예찰 5일 경과', '전체 보기',
        'data-r7-record-image-card="growth-survey"', '생육조사', '오늘 필요', '최근 기록 없음', 'G-Index 계산에 필요한 생육 데이터가 없습니다.', '생육조사 작성', '예전 기록',
        'data-r7-record-image-card="pest-scouting"', '병해충 예찰', '주의', '최근 5일 전', '예찰 작성', '예전 기록',
        'data-r7-record-image-card="control-treatment"', '방제 기록', '정상', 'PHI 3일 남음', '방제기록 작성', '예전 기록',
        'data-r7-record-recent-log-panel', '최근 기록', 'fresh', '방제 기록', '2026-06-30 08:10', 'PHI 3일 남음',
        'data-r7-record-ai-card', 'AI 근거 연결', '근거 부족', '근거 보기'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) { console.error(JSON.stringify({ missing })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_053_records_workflow_deletes_previous_visible_card_content_and_skeletons():
    script = _render_script() + """
      const forbidden = [
        'data-r7-record-section="today-work"',
        'data-r7-record-section="growth-survey"',
        'data-r7-record-section="pest-scouting"',
        'data-r7-record-section="control-treatment"',
        'data-r7-record-section="missing-attention"',
        'data-r7-record-section="record-source"',
        'data-r7-record-flow-skeleton="write-history-pls"',
        'data-r7-record-api-contract="planned-v1.15.57"',
        'data-r7-record-api-prefix="/api/green_smart/rebuild/crop-records"',
        '작성·히스토리 플로우',
        '생육조사 작성 플로우',
        '예찰 작성 플로우',
        '방제 기록 작성 플로우',
        '최근 생육조사 수정',
        'PLS 확인 플로우',
        '기록 원천',
        '관리자 상세',
        'readOnly=',
        'writeEnabled='
      ];
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (bad.length) { console.error(JSON.stringify({ bad })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_053_records_workflow_keeps_no_execution_boundary():
    script = _render_script() + """
      const forbidden = [
        'fetch("/api/green_smart/rebuild/crop-records',
        'fetch("/api/green_smart/crop-records',
        'data-r7-crop-ha-service-call',
        'data-r7-crop-mqtt-command',
        'data-r7-crop-auto-apply',
        'data-r7-crop-device-command',
        'hass.callService',
        'mqtt.publish',
        'saveRecord(',
        'executeRecordFlow('
      ];
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (bad.length) { console.error(JSON.stringify({ bad })); process.exit(1); }
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
