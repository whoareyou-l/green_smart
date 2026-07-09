from pathlib import Path
import importlib.util
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
SERVICE = ROOT / "custom_components/green_smart/services/rebuild_crop_context_service.py"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_service_module():
    spec = importlib.util.spec_from_file_location("rebuild_crop_context_service_r7_043", SERVICE)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_r7_043_version_surfaces_are_1_12_78():
    assert '"version": "1.14.91"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.91"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.91"' in _read(REBUILD_PANEL)


def test_r7_043_backend_normalizes_recent_crop_record_summary():
    module = _load_service_module()
    summary = module.normalize_crop_operations_record_summary(
        growth_records=[{"date": "2026-06-28", "height": 18.4, "leafCount": 9, "stemDia": 4.1, "note": "활착 양호"}],
        pest_records=[{"date": "2026-06-29", "type": "진딧물", "location": "1구역 A베드", "severity": "low", "note": "엽 뒷면 관찰"}],
        control_records=[{"date": "2026-06-29", "zone": "1구역", "pesticides": [{"name": "친환경유제", "pls": True, "mixCheckStatus": "ok", "phiDays": 3, "reiHours": 12}]}],
    )
    assert summary["recordSummarySource"] == "crop_repo_recent_records_readonly"
    assert summary["growthSurvey"]["count"] == 1
    assert summary["growthSurvey"]["latestLabel"] == "2026-06-28 · 초장 18.4cm · 엽수 9"
    assert summary["pestScouting"]["latestLabel"] == "2026-06-29 · 진딧물 · low"
    assert summary["controlTreatment"]["latestLabel"] == "2026-06-29 · 친환경유제 · PLS 적합"
    assert summary["workQueue"]["nextAction"] == "최근 기록 검토 완료"
    assert summary["readOnly"] is True
    assert summary["executionEnabled"] is False


def test_r7_043_rebuild_panel_binds_crop_operations_cards_to_real_context_values():
    text = _read(REBUILD_PANEL)
    for marker in [
        'data-r7-crop-real-context-bound="true"',
        "data-r7-crop-record-summary-source",
        "data-r7-crop-environment-impact-source",
        "data-r7-crop-recommendation-review-source",
        "cropRecordSummary",
        "environmentImpactProjection",
        "recommendationReviewProjection",
    ]:
        assert marker in text

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
        growthTargetProjection: {{ targetStageLabel: '엽수 확대', targetFocus: '초기 활착 안정' }},
        environmentImpactProjection: {{ impactState: 'attention', impactFocus: 'VPD 낮음 · 근권 수분 높음', impactFactors: ['VPD 0.68kPa', '배액률 18%', '차광 스크린 닫힘'], freshnessLabel: '12분 전 갱신' }},
        recommendationReviewProjection: {{ reviewState: 'ready', reviewSummary: '관수 지연 검토 · 환기 후보 확인', approvalRequired: true }},
        cropRecordSummary: {{
          recordSummarySource: 'crop_repo_recent_records_readonly',
          growthSurvey: {{ count: 2, latestLabel: '2026-06-28 · 초장 18.4cm · 엽수 9', staleState: 'fresh' }},
          pestScouting: {{ count: 1, latestLabel: '2026-06-29 · 진딧물 · low', staleState: 'attention' }},
          controlTreatment: {{ count: 1, latestLabel: '2026-06-29 · 친환경유제 · PLS 적합', staleState: 'fresh' }},
          workQueue: {{ nextAction: '병해충 예찰 재확인', missingItems: ['생육조사 7일 경과'] }},
          readOnly: true, executionEnabled: false
        }},
        dataAvailability: {{ state: 'fresh', source: 'qa' }}
      }};
      panel.hass = {{ user: {{ name: '서원 임', is_admin: true, green_smart_role: 'operator' }}, callApi: async () => ({{ actorRole: 'operator', zones: [zone] }}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [zone] }};
      const tabs = ['status-summary','growth-target','records-workflow','model-assist','trend-evidence'];
      let html = '';
      for (const tab of tabs) {{
        panel.setR7DomainSubtab('crop-operations', tab);
        panel._activeR7Domain = 'crop-operations';
        panel.render();
        html += panel.innerHTML;
      }}
      const required = [
        'data-r7-crop-real-context-bound="true"',
        'data-r7-crop-record-summary-source="crop_repo_recent_records_readonly"',
        'data-r7-crop-environment-impact-source="attention"',
        'data-r7-crop-recommendation-review-source="ready"',
        '2026-06-28 · 초장 18.4cm · 엽수 9',
        '2026-06-29 · 진딧물 · low',
        '2026-06-29 · 친환경유제 · PLS 적합',
        '병해충 예찰 재확인',
        'VPD 낮음 · 근권 수분 높음',
        'VPD 0.68kPa, 배액률 18%, 차광 스크린 닫힘',
        '관수 지연 검토 · 환기 후보 확인'
      ];
      const missing = required.filter((needle) => !html.includes(needle));
      if (missing.length) {{ console.error(JSON.stringify(missing)); process.exit(1); }}
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout


def test_r7_043_keeps_crop_operations_data_binding_readonly():
    text = _read(REBUILD_PANEL) + _read(SERVICE)
    for forbidden in [
        "data-r7-crop-direct-execute",
        "data-r7-crop-ha-service-call",
        "data-r7-crop-mqtt-command",
        "data-r7-crop-auto-apply",
        "data-r7-crop-device-command",
        "cropWriteEnabled\": True",
        "executionEnabled\": True",
        "deviceCommandEnabled\": True",
        "mqttEnabled\": True",
    ]:
        assert forbidden not in text
