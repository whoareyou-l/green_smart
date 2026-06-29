from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _pest_tab(panel: str) -> str:
    return panel.split("  _renderCropPestTab()", 1)[1].split("  _renderCropControlTab()", 1)[0]


def test_v1975_pest_tab_has_summary_severity_and_next_action():
    panel = _read(PANEL)
    pest = _pest_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-pest-summary-card",
        "data-crop-pest-severity-overview",
        "data-crop-pest-next-action",
        "병해충 예찰 요약",
        "고위험/미해결",
        "다음 행동",
        "방제 기록으로 이동",
    ):
        assert marker in pest
        assert marker in docs
        assert marker in plan

    for marker in (
        "const pestSeverityCounts",
        "const highRiskPests",
        "const pestNextAction",
    ):
        assert marker in pest


def test_v1975_pest_record_list_is_compact_and_preserves_actions():
    panel = _read(PANEL)
    pest = _pest_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-pest-record-list",
        "data-crop-pest-record-row",
        "data-crop-pest-record-summary",
        "data-crop-pest-record-meta",
        "data-crop-pest-delete-action",
        "data-pest-del",
    ):
        assert marker in pest
        assert marker in docs
        assert marker in plan

    assert "data-crop-control-safety-summary" not in pest
    assert "control-add-btn" not in pest


def test_v1975_pest_tab_does_not_duplicate_control_form_or_execution():
    panel = _read(PANEL)
    pest = _pest_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    forbidden = (
        "data-crop-pest-control-form",
        "data-crop-pest-apply-treatment",
        "data-crop-pest-execute-control",
        "pestAllowPesticideExecution",
    )
    for marker in forbidden:
        assert marker not in pest
        assert marker in docs
        assert marker in plan

    assert "this._cropSubTab = \"control\"" in panel
    assert "data-crop-pest-go-control" in pest


def test_v1975_pest_ui_version_markers_and_future_versions():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.12.80"' in manifest
    assert 'const VERSION = "1.12.80"' in panel
    assert 'v1.12.80' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert '기준 버전: `v1.12.80`' in docs
    assert 'UI Slice 4 | v1.9.75 | 병해충 예찰' in plan
    assert 'UI Slice 5 | v1.9.76 | 방제 기록' in plan
