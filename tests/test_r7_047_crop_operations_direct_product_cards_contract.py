from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-046-crop-operations-full-product-ui-redesign.md"

FORBIDDEN_WRAPPER_HEADINGS = [
    "상태 요약 운영 화면",
    "작기 운영 화면",
    "생육목표 운영 화면",
    "기록·작업 운영 화면",
    "모델·추천 운영 화면",
    "추세·근거 운영 화면",
]


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_047_version_surfaces_are_1_12_82():
    assert '"version": "1.12.87"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.87"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.12.87"' in _read(REBUILD_PANEL)
    assert "v1.12.87" in _read(DOC)


def test_r7_047_plan_forbids_duplicate_operating_screen_wrappers():
    text = _read(DOC)
    for phrase in [
        "Do not wrap `기록·작업` inside another visible title",
        "Do **not** render generic duplicate headings",
        "The first visible title inside the panel must be `오늘 할 일`",
        "subtab → product cards",
    ]:
        assert phrase in text


def test_r7_047_source_removes_visible_duplicate_wrapper_headings():
    text = _read(REBUILD_PANEL)
    for forbidden in FORBIDDEN_WRAPPER_HEADINGS:
        assert forbidden not in text
    for helper in [
        "renderR7CropProductCard(",
        "renderR7CropProductCardGrid(",
        "renderR7CropRecordWorkCards(",
        "renderR7CropProductCardsForSubtab(",
        "data-r7-crop-product-card-grid",
        "data-r7-crop-product-direct-cards",
    ]:
        assert helper in text


def test_r7_047_records_workflow_values_survive_in_r7_050_product_layout_without_old_cards():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{
        body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }},
        getElementById(){{ return null; }},
        createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }},
        head: {{ appendChild(){{}} }}
      }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{
        id: 'zone-1', name: '1구역', crop: '상추', state: '활착기',
        currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01', demolish_date: '철거 예정 없음' }},
        currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }},
        cropRecordSummary: {{
          recordSummarySource: 'crop_repo_recent_records_readonly',
          growthSurvey: {{ count: 2, latest: {{ date: '2026-06-28', height: 18.4, leafCount: 9 }}, latestLabel: '2026-06-28 · 초장 18.4cm · 엽수 9', staleState: 'fresh' }},
          pestScouting: {{ count: 1, latest: {{ date: '2026-06-29', type: '진딧물', severity: 'low' }}, latestLabel: '2026-06-29 · 진딧물 · low', staleState: 'attention' }},
          controlTreatment: {{ count: 1, latest: {{ date: '2026-06-29', pesticides: [{{ name: '친환경유제', pls: true }}] }}, latestLabel: '2026-06-29 · 친환경유제 · PLS 적합', staleState: 'fresh' }},
          workQueue: {{ nextAction: '병해충 예찰 재확인', missingItems: ['생육조사 7일 경과', '예찰 위치 확인'] }},
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
      const required = [
        'data-r7-records-workflow-product-layout="write-history-review"',
        '오늘 할 일', '병해충 예찰 재확인', '생육조사 7일 경과', '예찰 위치 확인',
        '생육조사', '2026-06-28 · 초장 18.4cm · 엽수 9', '최근 2건 · fresh',
        '병해충 예찰', '2026-06-29 · 진딧물 · low', '최근 1건 · attention',
        '방제', '2026-06-29 · 친환경유제 · PLS 적합', '최근 1건 · fresh',
        '기록 원천', 'recordSummarySource=crop_repo_recent_records_readonly', 'read-only · write/execute disabled'
      ];
      const forbidden = ['data-r7-crop-product-direct-cards="records-workflow"', 'data-r7-crop-record-card-kind="today-work"', 'data-r7-crop-record-card-kind="growth-survey"', ...{FORBIDDEN_WRAPPER_HEADINGS!r}];
      const missing = required.filter((needle) => !html.includes(needle));
      const bad = forbidden.filter((needle) => html.includes(needle));
      if (missing.length || bad.length) {{ console.error(JSON.stringify({{ missing, bad }})); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_047_all_crop_subtabs_use_direct_cards_not_duplicate_screens():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01', demolish_date: '철거 예정 없음' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, growthTargetProjection: {{ targetStageLabel: '엽수 확대', targetFocus: '초기 활착 안정' }}, environmentImpactProjection: {{ impactState: 'attention', impactFocus: 'VPD 낮음 · 근권 수분 높음', impactFactors: ['VPD 0.68kPa', '배액률 18%', '차광 스크린 닫힘'] }}, recommendationReviewProjection: {{ reviewState: 'ready', reviewSummary: '관수 지연 검토 · 환기 후보 확인', approvalRequired: true }}, cropRecordSummary: {{ recordSummarySource: 'crop_repo_recent_records_readonly', growthSurvey: {{ count: 2, latestLabel: '2026-06-28 · 초장 18.4cm · 엽수 9', staleState: 'fresh' }}, pestScouting: {{ count: 1, latestLabel: '2026-06-29 · 진딧물 · low', staleState: 'attention' }}, controlTreatment: {{ count: 1, latestLabel: '2026-06-29 · 친환경유제 · PLS 적합', staleState: 'fresh' }}, workQueue: {{ nextAction: '병해충 예찰 재확인', missingItems: ['생육조사 7일 경과'] }}, readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      const requiredByTab = {{
        'status-summary': ['현재 작물','우선 확인','기록 상태','영향 요인','추천 검토'],
        'crop-cycle': ['작기 연결','작물 프로필','운영 경계','구역 배정 근거'],
        'growth-target': ['현재 → 목표','관찰 포인트','환경 영향','기록 확인'],
        'records-workflow': ['오늘 할 일','생육조사','병해충 예찰','방제','기록 원천'],
        'model-assist': ['추천 요약','근거 요인','승인/실행 경계'],
        'trend-evidence': ['시즌 근거 요약','생육 흐름','영향 흐름','데이터 충분성']
      }};
      const failed = [];
      for (const tab of Object.keys(requiredByTab)) {{
        panel.setR7DomainSubtab('crop-operations', tab);
        panel._activeR7Domain = 'crop-operations';
        panel.render();
        const html = panel.innerHTML;
        const required = tab === 'records-workflow'
          ? ['data-r7-records-workflow-product-layout="write-history-review"', ...requiredByTab[tab]]
          : [`data-r7-crop-product-direct-cards="${{tab}}"`, 'data-r7-crop-product-card-grid', ...requiredByTab[tab]];
        const missing = required.filter((needle) => !html.includes(needle));
        const forbidden = {FORBIDDEN_WRAPPER_HEADINGS!r}.filter((needle) => html.includes(needle));
        if (missing.length || forbidden.length) failed.push({{ tab, missing, forbidden }});
      }}
      if (failed.length) {{ console.error(JSON.stringify(failed)); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_047_execution_boundary_stays_readonly():
    text = _read(REBUILD_PANEL)
    for forbidden in [
        "data-r7-crop-direct-execute",
        "data-r7-crop-ha-service-call",
        "data-r7-crop-mqtt-command",
        "data-r7-crop-auto-apply",
        "data-r7-crop-device-command",
        ".callService",
        "callService(",
        "mqttEnabled\": true",
        "deviceCommandEnabled\": true",
    ]:
        assert forbidden not in text
