from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
FORBIDDEN_WRAPPER_HEADINGS = ["기록·작업 운영 화면"]


def test_r7_047_records_workflow_now_uses_r7_053_image_dashboard_not_old_direct_cards():
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = ''; this.dataset = {{}}; this.style = {{}}; this._listeners = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(type, fn){{ this._listeners[type] = fn; }} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      const zone = {{ id: 'zone-1', name: '1구역', crop: '상추', state: '활착기', currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01', demolish_date: '철거 예정 없음' }}, currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }}, growthTargetProjection: {{ targetStageLabel: '엽수 확대', targetFocus: '초기 활착 안정' }}, environmentImpactProjection: {{ impactState: 'attention', impactFocus: 'VPD 낮음 · 근권 수분 높음', impactFactors: ['VPD 0.68kPa', '배액률 18%', '차광 스크린 닫힘'] }}, recommendationReviewProjection: {{ reviewState: 'ready', reviewSummary: '관수 지연 검토 · 환기 후보 확인', approvalRequired: true }}, cropRecordSummary: {{ recordSummarySource: 'crop_repo_recent_records_readonly', growthSurvey: {{ count: 0, latestLabel: '', staleState: 'empty' }}, pestScouting: {{ count: 0, latestLabel: '', staleState: 'attention' }}, controlTreatment: {{ count: 1, latestLabel: '2026-06-30 · 리도밀 · PHI 3일 남음', staleState: 'fresh' }}, workQueue: {{ nextAction: '필수 기록 최신 상태', missingItems: ['SPAD 미입력'] }}, readOnly: true, writeEnabled: false, executionEnabled: false, deviceCommandEnabled: false, mqttEnabled: false }}, dataAvailability: {{ state: 'fresh', source: 'qa' }} }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      const requiredByTab = {{
        'status-summary': ['현재 작물','우선 확인','기록 상태','영향 요인','추천 검토'],
        'crop-cycle': ['작기 연결','작물 프로필','운영 경계','구역 배정 근거'],
        'growth-target': ['현재 → 목표','관찰 포인트','환경 영향','기록 확인'],
        'records-workflow': ['data-r7-records-image-dashboard="true"','data-r7-record-row="top-actions"','오늘 할 일','누락·검증 필요','AI 근거 연결','data-r7-record-row="core-records"','생육조사','병해충 예찰','방제 기록','data-r7-record-row="recent-records"','최근 기록'],
        'model-assist': ['추천 요약','근거 요인','승인/실행 경계'],
        'trend-evidence': ['시즌 근거 요약','생육 흐름','영향 흐름','데이터 충분성']
      }};
      const failed = [];
      for (const tab of Object.keys(requiredByTab)) {{
        panel.setR7DomainSubtab('crop-operations', tab); panel._activeR7Domain = 'crop-operations'; panel.render();
        const html = panel.innerHTML;
        const required = tab === 'records-workflow' ? requiredByTab[tab] : [`data-r7-crop-product-direct-cards="${{tab}}"`, 'data-r7-crop-product-card-grid', ...requiredByTab[tab]];
        const missing = required.filter((needle) => !html.includes(needle));
        const forbidden = {FORBIDDEN_WRAPPER_HEADINGS!r}.filter((needle) => html.includes(needle));
        const oldRecords = tab === 'records-workflow' ? ['data-r7-records-workflow-product-layout="write-history-review"','data-r7-record-section="record-source"'].filter((needle) => html.includes(needle)) : [];
        if (missing.length || forbidden.length || oldRecords.length) failed.push({{ tab, missing, forbidden, oldRecords }});
      }}
      if (failed.length) {{ console.error(JSON.stringify(failed)); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
