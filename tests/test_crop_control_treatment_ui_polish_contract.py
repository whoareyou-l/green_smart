from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/green_smart/panel/green-smart-panel.js"
MANIFEST = ROOT / "custom_components/green_smart/manifest.json"
CENTRAL = ROOT / "custom_components/green_smart/central_views.py"
UI_DOC = ROOT / "docs/design/current-ui-design-and-navigation.md"
PLAN = ROOT / "docs/plans/2026-06-24-crop-settings-ui-slice-plan.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _control_tab(panel: str) -> str:
    return panel.split("  _renderCropControlTab()", 1)[1].split("  // ── Crop 팝업", 1)[0]


def test_v1976_control_tab_has_safety_summary_and_next_check():
    panel = _read(PANEL)
    control = _control_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-control-safety-summary",
        "data-crop-control-pls-overview",
        "data-crop-control-phi-rei-overview",
        "data-crop-control-next-check",
        "방제 안전 요약",
        "PLS 확인",
        "PHI/REI 확인",
        "다음 점검",
    ):
        assert marker in control
        assert marker in docs
        assert marker in plan

    for marker in (
        "const controlPlsCounts",
        "const latestControl",
        "const controlNextCheck",
    ):
        assert marker in control


def test_v1976_control_treatment_list_is_readable_and_preserves_actions():
    panel = _read(PANEL)
    control = _control_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    for marker in (
        "data-crop-control-treatment-list",
        "data-crop-control-treatment-row",
        "data-crop-control-treatment-summary",
        "data-crop-control-treatment-meta",
        "data-crop-control-pesticide-chip-group",
        "data-crop-control-delete-action",
        "data-control-del",
    ):
        assert marker in control
        assert marker in docs
        assert marker in plan

    assert "control-export-btn" in control
    assert "control-add-btn" in control


def test_v1976_control_tab_scope_boundaries_are_preserved():
    panel = _read(PANEL)
    control = _control_tab(panel)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    forbidden = (
        "data-crop-control-execute-spray",
        "data-crop-control-auto-apply",
        "controlAllowPesticideExecution",
        "autoSchedulePesticideApplication",
    )
    for marker in forbidden:
        assert marker not in control
        assert marker in docs
        assert marker in plan

    assert "병해충 예찰로 이동" not in control
    assert "data-crop-pest-summary-card" not in control


def test_v1976_control_ui_version_markers_and_future_shift():
    manifest = _read(MANIFEST)
    panel = _read(PANEL)
    central = _read(CENTRAL)
    docs = _read(UI_DOC)
    plan = _read(PLAN)

    assert '"version": "1.15.06"' in manifest
    assert 'const VERSION = "1.15.06"' in panel
    assert 'v1.15.06' in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert '기준 버전: `v1.15.06`' in docs
    assert 'UI Slice 5 | v1.9.76 | 방제 기록' in plan
    assert 'UI Slice 6 | v1.9.77 | Cross-subpage consistency pass' in plan
