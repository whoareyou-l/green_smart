from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _basic_tab(panel: str) -> str:
    return panel.split("  _renderCropBasicTab()", 1)[1].split("  _renderCropSeasonsList()", 1)[0]


def _season_list(panel: str) -> str:
    return panel.split("  _renderCropSeasonsList()", 1)[1].split("  _renderGrowthReportCard()", 1)[0]


def test_v1972_basic_tab_reuses_common_subpage_workflow_contract():
    panel = _read(PANEL)
    basic = _basic_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-basic-summary-card",
        "data-crop-basic-overview-card",
        "data-crop-ui-subpage-summary",
        "data-crop-basic-kpi-grid",
        "data-crop-basic-lifecycle-kpis",
        "data-crop-ui-kpi-grid",
        "data-crop-basic-latest-season",
        "data-crop-basic-next-action",
        "data-crop-ui-action-bar",
        "data-crop-basic-primary-action",
        "data-crop-basic-secondary-actions",
        "data-crop-basic-season-list",
        "data-crop-ui-record-list",
    ):
        assert marker in basic
        assert marker in docs
        assert marker in plan

    for phrase in (
        "현재 작기 설정",
        "농장주와 직원이 같은 작기 기준으로 생육·예찰·방제 기록을 이어갑니다.",
        "작기 설정도 공통 하위페이지 포맷",
        "CSV 내보내기",
        "+ 정식 등록",
    ):
        assert phrase in basic

    assert "repeat(auto-fit,minmax(" in basic
    assert "flex-wrap:wrap" in basic


def test_v1972_basic_record_rows_are_compact_and_have_consistent_actions():
    panel = _read(PANEL)
    season_list = _season_list(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-basic-record-row",
        "data-crop-basic-record-summary",
        "data-crop-basic-record-meta",
        "data-crop-basic-record-actions",
        "data-crop-basic-danger-actions",
        "data-crop-basic-empty-state",
        "data-crop-ui-empty-state",
    ):
        assert marker in season_list
        assert marker in docs
        assert marker in plan

    for phrase in (
        "작기 목록은 compact record list로 유지하고, 삭제는 danger action으로 분리합니다.",
        "정식일",
        "철거일",
    ):
        assert phrase in season_list or phrase in docs

    for forbidden in (
        "data-crop-ui-execute-device",
        "data-crop-ui-train-production-model",
        "cropSettingsAllowExecution",
    ):
        assert forbidden not in season_list


def test_v1972_basic_common_format_version_and_plan_shift():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.11.10"' in manifest
    assert 'const VERSION = "1.11.10"' in panel
    assert 'v1.11.10' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert '기준 버전: `v1.11.10`' in docs
    assert 'UI Correction | v1.9.72 | 작기 설정 공통 포맷 재적용' in plan
    assert 'UI Slice 3 | v1.9.74 | AI 전략' in plan
