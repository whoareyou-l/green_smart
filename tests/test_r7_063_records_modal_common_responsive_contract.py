from pathlib import Path
import subprocess, json, re

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
LEGACY_PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
REBUILD_PANEL = ROOT / "custom_components/green_smart/panel/rebuild/green-smart-rebuild-panel.js"
DOC = ROOT / "docs/rebuild/r7-063-records-modal-common-responsive.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _render(record_type="growth-survey", width=1024):
    script = f"""
      const classSet = new Set();
      globalThis.location = {{ pathname: '/green_smart', search: '', hash: '' }};
      globalThis.innerWidth = {width};
      globalThis.document = {{ body: {{ classList: {{ add(c){{ classSet.add(c); }}, remove(c){{ classSet.delete(c); }}, contains(c){{ return classSet.has(c); }} }} }}, getElementById(){{ return null; }}, createElement(){{ return {{ id: '', textContent: '', setAttribute(){{}}, appendChild(){{}} }}; }}, head: {{ appendChild(){{}} }} }};
      globalThis.HTMLElement = class {{ constructor(){{ this.innerHTML = '';this.dataset = {{}};this.style = {{}}; }} querySelectorAll(){{ return []; }} querySelector(){{ return null; }} addEventListener(){{}} }};
      globalThis.customElements = {{ _items: new Map(), get(name){{ return this._items.get(name); }}, define(name, cls){{ this._items.set(name, cls); }} }};
      const mod = await import({str(REBUILD_PANEL)!r});
      const panel = new mod.GreenSmartRebuildPanel();
      panel.hass = {{ user: {{ name: 'admin', is_admin: true }}, callApi: async () => ({{}}) }};
      panel._homeContext = {{ actorRole: 'operator', zones: [{{ id: 'zone-1', name: '1구역', currentCrop: {{ crop_cycle_id: 7, crop_type: 'lettuce', growth_stage: '활착기' }}, currentCropAssignment: {{ sourceRowId: 'crop_seasons:7' }} }}] }};
      panel._r7RecordModal = {{ mode: 'write', recordType: {record_type!r}, seasonId: '7', title: '작성', state: 'ready', rows: [] }};
      const html = panel.renderR7RecordWorkflowModal();
      console.log(JSON.stringify({{ html }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr + result.stdout
    return json.loads(result.stdout)["html"]


def test_r7_063_version_surfaces_are_1_12_98():
    assert '"version": "1.15.07"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.07"' in _read(LEGACY_PANEL)
    assert 'REBUILD_VERSION = "1.15.07"' in _read(REBUILD_PANEL)


def test_r7_063_required_note_card_removed_from_write_modal():
    html = _render("growth-survey")
    assert 'data-r7-record-modal-required-note' not in html
    assert '필수 입력' not in html
    assert '날짜와 기록 유형별 핵심 항목을 확인하세요' not in html


def test_r7_063_common_modal_shell_and_sticky_header_for_all_record_forms():
    source = _read(REBUILD_PANEL)
    for needle in (
        'renderR7RecordCommonModalShell(',
        'renderR7RecordFormLayout(',
        'renderR7RecordPreSaveChecklist(',
        'data-r7-record-common-modal-shell',
        'data-r7-record-modal-sticky-header',
        'position:sticky;top:0',
        'data-r7-record-modal-scroll-body',
    ):
        assert needle in source
    for record_type in ('growth-survey', 'pest-scouting', 'control-treatment'):
        html = _render(record_type)
        assert 'data-r7-record-common-modal-shell' in html
        assert 'data-r7-record-modal-sticky-header' in html
        assert 'data-r7-record-form-layout' in html


def test_r7_063_pre_save_checklist_has_required_section_completion_cards():
    html = _render("growth-survey")
    for needle in (
        'data-r7-record-pre-save-checklist',
        'data-r7-record-validation-card="required"',
        'data-r7-record-validation-card="spad"',
        'data-r7-record-validation-card="tipburn"',
        'data-r7-record-validation-card="bolting"',
        'data-r7-record-validation-icon="ok"',
        'data-r7-record-validation-icon="wait"',
        '저장 전 검증',
        '필수값 0/8',
        'SPAD 입력 대기',
        '팁번/잎끝 마름 확인',
        '추대·웃자람 지표 저장 가능',
        'data-r7-record-check-card="basic-info"',
        'data-r7-record-check-card="growth-measurements"',
        'data-r7-record-check-card="quality-disorder"',
        '기본 정보',
        '생육 측정값',
        '품질/생리장해 측정값',
        '빈 칸 없이 값을 넣었는지 확인',
    ):
        assert needle in html


def test_r7_063_mobile_layout_moves_reference_between_memo_and_actions():
    source = _read(REBUILD_PANEL)
    assert '@media (max-width: 860px)' in source
    assert 'data-r7-record-mobile-reference-slot' in source
    assert 'grid-template-columns:1fr' in source
    assert 'data-r7-record-modal-actions' in source
    mobile_html = _render("growth-survey", width=390)
    assert mobile_html.index('data-r7-growth-survey-section="memo"') < mobile_html.index('data-r7-record-mobile-reference-slot') < mobile_html.index('data-r7-record-modal-actions')


def test_r7_063_documented():
    doc = _read(DOC)
    for phrase in ('필수 입력 카드 삭제', 'sticky header', '공통 모달 컴포넌트', '모바일', '저장 전 참고'):
        assert phrase in doc
