from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r7_045_version_surfaces_are_1_12_80():
    assert '"version": "1.15.50"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.50"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.50"' in _read(REBUILD_PANEL)


def test_r7_045_product_ui_component_helpers_exist():
    text = _read(REBUILD_PANEL)
    for marker in [
        "renderR7ProductCard(",
        "renderR7ProductCardHeader(",
        "renderR7ProductCardBody(",
        "renderR7ProductCardEvidence(",
        "renderR7ProductCardActionRow(",
        "renderR7ProductEmptyState(",
        "data-r7-product-card",
        "data-r7-product-card-header",
        "data-r7-product-card-body",
        "data-r7-product-card-evidence",
        "data-r7-product-card-action-row",
        "data-r7-product-empty-state",
        "data-r7-product-responsive",
        "data-r7-product-component-version=\"1\"",
    ]:
        assert marker in text


def test_r7_045_status_summary_uses_product_components_with_states_and_actions():
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
        currentCrop: {{ crop_cycle_id: 'cycle-1', crop_label_ko: '상추', crop_type: 'lettuce', growth_stage: '활착기', variety: '청치마', plant_date: '2026-06-01' }},
        currentCropAssignment: {{ assignmentState: 'assigned', sourceRowId: 'crop_seasons:1', dataAvailability: {{ state: 'fresh', source: 'currentCropAssignment' }} }},
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
      panel.setR7DomainSubtab('crop-operations', 'status-summary');
      panel._activeR7Domain = 'crop-operations';
      panel.render();
      const html = panel.innerHTML;
      const required = [
        'data-r7-product-card',
        'data-r7-product-card-kind="current-crop"',
        'data-r7-product-card-kind="priority-check"',
        'data-r7-product-card-kind="record-health"',
        'data-r7-product-card-kind="influence"',
        'data-r7-product-card-kind="recommendation"',
        'data-r7-product-card-header',
        'data-r7-product-card-body',
        'data-r7-product-card-evidence',
        'data-r7-product-card-action-row',
        'data-r7-product-responsive="mobile-first"',
        'data-r7-product-state="fresh"',
        'data-r7-product-state="attention"',
        'data-r7-product-empty-state',
        '상추 · 활착기',
        '병해충 예찰 재확인',
        '생육조사 7일 경과',
        'VPD 0.68kPa',
        '관수 지연 검토 · 환기 후보 확인',
        '승인 검토 필요',
        'data-r7-crop-action-target-subtab="records-workflow"',
        'data-r7-sidebar-target="environment-control"'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      const productCards = (html.match(/data-r7-product-card/g) || []).length;
      if (productCards < 5) missing.push(`product-card-count:${{productCards}}`);
      if (missing.length) {{ console.error(JSON.stringify(missing)); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_045_product_components_keep_execution_boundary():
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
