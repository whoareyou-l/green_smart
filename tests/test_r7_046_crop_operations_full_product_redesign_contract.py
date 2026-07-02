from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-046-crop-operations-full-product-ui-redesign.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_046_version_surfaces_are_1_12_81():
    assert '"version": "1.14.39"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.39"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.39"' in _read(REBUILD_PANEL)
    assert "v1.14.39" in _read(DOC)


def test_r7_046_plan_documents_full_replacement_direction():
    text = _read(DOC)
    for phrase in [
        "Do not wrap `기록·작업` inside another visible title",
        "subtab → product cards",
        "Shared card grammar",
        "오늘 할 일",
        "생육조사",
        "병해충 예찰",
        "방제",
        "기록 원천",
    ]:
        assert phrase in text


def test_r7_046_source_uses_product_screen_helpers_for_all_crop_subtabs():
    text = _read(REBUILD_PANEL)
    for marker in [
        "renderR7ProductScreen(",
        "renderR7ProductScreenHeader(",
        "renderR7ProductScreenPrimaryPanel(",
        "renderR7ProductScreenEvidenceRail(",
        "renderR7ProductScreenActionBar(",
        "renderR7CropProductSubtabScreen(",
        "data-r7-product-screen",
        "data-r7-product-screen-header",
        "data-r7-product-screen-primary-panel",
        "data-r7-product-screen-evidence-rail",
        "data-r7-product-screen-action-bar",
        "data-r7-crop-product-subtab-screen",
    ]:
        assert marker in text


def test_r7_046_all_crop_subtabs_render_product_screens_with_context_values():
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
        growthTargetProjection: {{ targetStageLabel: '엽수 확대', targetFocus: '초기 활착 안정' }},
        environmentImpactProjection: {{ impactState: 'attention', impactFocus: 'VPD 낮음 · 근권 수분 높음', impactFactors: ['VPD 0.68kPa', '배액률 18%', '차광 스크린 닫힘'] }},
        recommendationReviewProjection: {{ reviewState: 'ready', reviewSummary: '관수 지연 검토 · 환기 후보 확인', approvalRequired: true }},
        cropRecordSummary: {{
          recordSummarySource: 'crop_repo_recent_records_readonly',
          growthSurvey: {{ count: 2, latestLabel: '2026-06-28 · 초장 18.4cm · 엽수 9', staleState: 'fresh' }},
          pestScouting: {{ count: 1, latestLabel: '2026-06-29 · 진딧물 · low', staleState: 'attention' }},
          controlTreatment: {{ count: 1, latestLabel: '2026-06-29 · 친환경유제 · PLS 적합', staleState: 'fresh' }},
          workQueue: {{ nextAction: '병해충 예찰 재확인', missingItems: ['생육조사 7일 경과', '예찰 위치 확인'] }},
          readOnly: true, executionEnabled: false
        }},
        dataAvailability: {{ state: 'fresh', source: 'qa' }}
      }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      const tabs = ['status-summary','crop-cycle','growth-target','records-workflow','model-assist','trend-evidence'];
      const requiredByTab = {{
        'status-summary': ['data-r7-product-screen-kind="status-summary"','현재 작물','우선 확인','기록 상태','영향 요인','추천 검토','병해충 예찰 재확인'],
        'crop-cycle': ['data-r7-product-screen-kind="crop-cycle"','작기 연결','작물 프로필','운영 경계','구역 배정 근거','cycle-1','청치마','2026-06-01'],
        'growth-target': ['data-r7-product-screen-kind="growth-target"','현재 → 목표','관찰 포인트','환경 영향','기록 확인','활착기 → 엽수 확대','초기 활착 안정'],
        'records-workflow': ['data-r7-product-screen-kind="records-workflow"','data-r7-records-image-dashboard="true"','data-r7-record-row="top-actions"','오늘 할 일','누락·검증 필요','AI 근거 연결','data-r7-record-row="core-records"','생육조사','병해충 예찰','방제 기록','data-r7-record-row="recent-records"','최근 기록'],
        'model-assist': ['data-r7-product-screen-kind="model-assist"','추천 요약','근거 요인','승인/실행 경계','관수 지연 검토 · 환기 후보 확인','승인 검토 필요'],
        'trend-evidence': ['data-r7-product-screen-kind="trend-evidence"','시즌 근거 요약','생육 흐름','영향 흐름','데이터 충분성','2회 생육조사','1회 예찰','1회 방제']
      }};
      const failed = [];
      for (const tab of tabs) {{
        panel.setR7DomainSubtab('crop-operations', tab);
        panel._activeR7Domain = 'crop-operations';
        panel.render();
        const html = panel.innerHTML;
        const missing = [
          'data-r7-product-screen',
          'data-r7-product-screen-header',
          'data-r7-product-screen-primary-panel',
          'data-r7-product-screen-evidence-rail',
          'data-r7-product-screen-action-bar',
          ...requiredByTab[tab]
        ].filter((needle) => !html.includes(needle));
        if (missing.length) failed.push({{ tab, missing }});
      }}
      if (failed.length) {{ console.error(JSON.stringify(failed)); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_046_replacement_keeps_readonly_execution_boundary():
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
