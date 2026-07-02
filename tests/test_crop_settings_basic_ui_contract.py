from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1969_basic_tab_has_selected_season_overview_and_kpis():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        'data-crop-basic-overview-card',
        'data-crop-basic-selected-season',
        'data-crop-basic-next-action',
        'data-crop-basic-lifecycle-kpis',
        'data-crop-ui-subpage-summary',
        'data-crop-ui-kpi-grid',
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan

    for phrase in (
        '선택 작기 요약',
        '농장주/농장직원이 먼저 확인할 내용',
        '다음 행동',
        '재배 중',
        '철거 완료',
    ):
        assert phrase in panel


def test_v1969_basic_tab_action_hierarchy_and_responsive_contract():
    panel = _read(PANEL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        'data-crop-basic-lifecycle-actions',
        'data-crop-basic-primary-action',
        'data-crop-basic-secondary-actions',
        'data-crop-basic-danger-actions',
        'data-crop-basic-season-list',
        'data-crop-ui-action-bar',
        'data-crop-ui-record-list',
    ):
        assert marker in panel
        assert marker in docs
        assert marker in plan

    assert 'repeat(auto-fit,minmax(' in panel
    assert 'flex-wrap:wrap' in panel
    assert 'destructive delete' in plan or 'danger action' in plan
    assert '수정' in panel
    assert '철거' in panel
    assert '삭제' in panel


def test_v1969_basic_empty_state_is_owner_friendly():
    panel = _read(PANEL)

    for marker in (
        'data-crop-basic-empty-state',
        'data-crop-ui-empty-state',
    ):
        assert marker in panel

    for phrase in (
        '아직 등록된 작기가 없습니다',
        '정식 등록으로 첫 작기를 추가하세요',
        '농장주와 직원이 같은 작기 기준으로 기록을 관리합니다',
    ):
        assert phrase in panel


def test_v1969_basic_tab_preserves_existing_bindings_and_no_execution_creep():
    panel = _read(PANEL)

    for binding in (
        'id="basic-add-btn"',
        'id="basic-export-btn"',
        'data-season-edit=',
        'data-season-demolish=',
        'data-season-delete=',
        'id="crop-seasons-list"',
    ):
        assert binding in panel

    for forbidden in (
        'data-crop-ui-execute-device',
        'data-crop-ui-train-production-model',
        'cropSettingsAllowExecution',
    ):
        assert forbidden not in panel


def test_v1969_version_markers_for_basic_ui_slice():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.14.38"' in manifest
    assert 'const VERSION = "1.14.38"' in panel
    assert 'v1.14.38' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert 'v1.9.72' in docs
    assert 'UI Slice 1 | v1.9.69' in plan
