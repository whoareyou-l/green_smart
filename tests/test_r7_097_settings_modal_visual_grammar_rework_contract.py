from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
DOC = ROOT / "docs/rebuild/r7-097-settings-modal-visual-grammar-rework.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render_with_modal(open_call: str) -> str:
    script = f"""
      globalThis.document = {{ body: {{ classList: {{ add(){{}}, remove(){{}} }} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML=''; this.dataset={{}}; this.style={{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(n){{ return this._items.get(n); }}, define(n,c){{ this._items.set(n,c); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'operator' }}, callApi: async () => ({{ ok: true }}) }};
      panel._homeContext = {{ greenhouseName: '제1온실', zones: [{{ id:'zone-1', zoneId:'zone-1', name:'1구역', zoneName:'1구역', purpose:'재배', area:'120㎡', bedCount:6, currentCrop:{{ crop_cycle_id:'17', crop_label_ko:'토마토', growth_stage:'활착기' }}, dataAvailability:{{ state:'fresh' }}, equipmentProfile:{{ labels:['온도 센서','습도 센서','천창','순환팬','미연결 양액기'] }} }}] }};
      panel._activeR7Domain = 'settings-admin';
      panel.setR7DomainSubtab('settings-admin','greenhouse-zones');
      {open_call}
      panel.render();
      console.log(JSON.stringify({{ html: panel.innerHTML }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True, capture_output=True)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_097_version_surfaces_are_1_14_22():
    assert '"version": "1.14.28"' in _read(MANIFEST)
    assert 'const VERSION = "1.14.28"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.14.28"' in _read(REBUILD_PANEL)


def test_r7_097_create_modals_feel_like_growth_survey_write_modal():
    cases = [
        ('panel._openSettingsGreenhouseCreateModal();', 'greenhouse-create', ['basic-info', 'operation-standard', 'memo']),
        ('panel._openSettingsZoneCreateModal();', 'zone-create', ['basic-info', 'zone-composition', 'memo']),
        ('panel._openSettingsDeviceSensorMappingModal();', 'device-sensor-mapping', ['basic-info', 'mapping-target', 'memo']),
    ]
    for call, kind, sections in cases:
        html = _render_with_modal(call)
        assert 'data-r7-record-common-modal-shell' in html
        assert 'data-r7-settings-create-growth-like-modal="true"' in html
        assert 'data-r7-settings-create-left-form' in html
        assert 'data-r7-settings-create-pre-save-checklist' in html
        assert 'data-r7-record-pre-save-checklist' in html
        assert 'data-r7-settings-create-record-actions' in html
        assert '저장 전 검증' in html
        assert '생육조사 작성 모달 문법' in html
        for section in sections:
            assert f'data-r7-settings-create-section="{section}"' in html
        assert f'data-r7-settings-create-record-kind="{kind}"' in html


def test_r7_097_shortcut_list_modals_feel_like_approval_or_audit_review_modal():
    cases = [
        ('panel._openSettingsGreenhouseInfoSplitModal();', 'greenhouse-info'),
        ('panel._openSettingsZoneListSplitModal();', 'zone-list'),
        ('panel._openSettingsEquipmentInfoSplitModal();', 'equipment-info'),
    ]
    for call, kind in cases:
        html = _render_with_modal(call)
        assert 'data-r7-cda-split-modal' in html
        assert 'data-r7-settings-shortcut-review-like-modal="approval-audit"' in html
        assert f'data-r7-settings-shortcut-cda-split-kind="{kind}"' in html
        assert 'data-r7-settings-shortcut-search-input' in html
        assert 'data-r7-settings-shortcut-filter="all"' in html
        assert 'data-r7-settings-shortcut-filter="needs-review"' in html
        assert 'data-r7-settings-shortcut-review-list-panel' in html
        assert 'data-r7-settings-shortcut-review-row' in html
        assert 'data-r7-settings-shortcut-review-pane' in html
        if kind == 'greenhouse-info':
            assert 'data-r7-settings-greenhouse-info-detail-panel' in html
            assert 'data-r7-cda-entity-modal="greenhouse-info"' in html
            assert '선택 항목 상세' in html
            assert '선택 항목 검토' not in html
        elif kind == 'zone-list':
            assert 'data-r7-settings-zone-list-detail-panel' in html
            assert 'data-r7-cda-entity-modal="zone-list"' in html
            assert '1. 구역 상세 정보' in html
            assert '선택 항목 상세' in html
            assert '선택 항목 검토' not in html
        elif kind == 'equipment-info':
            assert 'data-r7-settings-equipment-info-detail-panel' in html
            assert 'data-r7-cda-entity-modal="equipment-info"' in html
            assert '1. 장비/센서 매핑 상세 정보' in html
            assert '선택 항목 상세' in html
            assert '선택 항목 검토' not in html
        else:
            assert 'data-r7-settings-shortcut-review-section="request-info"' in html
            assert 'data-r7-settings-shortcut-review-section="change-detail"' in html
            assert 'data-r7-settings-shortcut-review-section="evidence"' in html
            assert '선택 항목 검토' in html
            assert '감사 근거' in html or '승인 기준' in html
        assert '닫기' in html


def test_r7_097_source_keeps_reference_grammar_names_near_settings_modals():
    source = _read(REBUILD_PANEL)
    assert 'renderR7SettingsCreateGrowthLikeModal' in source
    assert 'renderR7SettingsCreatePreSaveChecklist' in source
    assert 'renderR7SettingsShortcutReviewLikeModal' in source
    assert 'approval-audit' in source
    assert 'growth-like' in source


def test_r7_097_documented():
    doc = _read(DOC)
    for phrase in ['승인 모달', '감사 로그 모달', '생육조사 작성 모달', '목록 버튼', '생성 버튼']:
        assert phrase in doc
