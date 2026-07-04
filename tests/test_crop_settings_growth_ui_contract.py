from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _growth_tab(panel: str) -> str:
    return panel.split("  _renderCropGrowthTab()", 1)[1].split("  _renderCropAiStrategyTab", 1)[0]


def test_v1971_growth_tab_has_summary_next_action_and_action_hierarchy():
    panel = _read(PANEL)
    growth = _growth_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-growth-summary-card",
        "data-crop-growth-latest-survey",
        "data-crop-growth-next-action",
        "data-crop-growth-kpi-grid",
        "data-crop-ui-kpi-grid",
        "data-crop-ui-action-bar",
        "data-crop-growth-primary-action",
        "data-crop-growth-secondary-actions",
        "data-crop-growth-record-list",
        "data-crop-ui-record-list",
        "data-crop-ui-empty-state",
    ):
        assert marker in growth
        assert marker in docs
        assert marker in plan

    for phrase in (
        "최근 생육조사",
        "다음 조사 안내",
        "농장주와 직원이 같은 작기 기준으로 주간 생육 상태를 확인합니다.",
        "생육조사 추가",
        "CSV 내보내기",
    ):
        assert phrase in growth

    assert "repeat(auto-fit,minmax(" in growth
    assert "flex-wrap:wrap" in growth


def test_v1971_growth_records_group_core_and_quality_metrics_without_execution_authority():
    panel = _read(PANEL)
    growth = _growth_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-growth-record-row",
        "data-crop-growth-core-metrics",
        "data-crop-growth-quality-metrics",
        "data-crop-growth-note",
        "data-crop-growth-delete-action",
    ):
        assert marker in growth
        assert marker in docs
        assert marker in plan

    for phrase in (
        "핵심 생육값",
        "품질·장해값",
        "기록이 많아도 날짜별 핵심값을 먼저 보고, 품질/장해와 메모는 아래에서 확인합니다.",
    ):
        assert phrase in growth
        assert phrase in docs

    for forbidden in (
        "data-crop-ui-execute-device",
        "data-crop-ui-train-production-model",
        "cropSettingsAllowExecution",
    ):
        assert forbidden not in growth


def test_v1971_growth_slice_version_markers():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.14.61"' in manifest
    assert 'const VERSION = "1.14.61"' in panel
    assert 'v1.14.61' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert '기준 버전: `v1.14.61`' in docs
    assert 'UI Slice 2 — v1.9.71 생육조사 Subpage Polish' in plan
