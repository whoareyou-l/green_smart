from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CONTROL_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-control-modal.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _control_popup(panel: str) -> str:
    return panel.split("  _openControlAddPopup()", 1)[1].split("  _refreshCropContent", 1)[0]


def _control_frontend(panel: str) -> str:
    return _control_popup(panel) + "\n" + _read(CONTROL_MODAL)


def test_v1981_control_popup_compact_scope_row_and_no_free_location_detail():
    panel = _read(PANEL)
    popup = _control_frontend(panel)

    for marker in (
        "data-control-compact-modal",
        "data-control-date-field",
        "data-control-scope-row",
        "data-control-active-season-pill",
        "data-control-location-scope-select",
        "data-control-pesticide-list",
        "data-control-pesticide-entry",
        "data-control-pesticide-name-field",
        "data-control-pesticide-add-row",
        "data-control-note-compact",
    ):
        assert marker in popup

    assert popup.index("data-control-date-field") < popup.index("data-control-scope-row")
    assert popup.index("data-control-scope-row") < popup.index("data-control-pesticide-list")
    assert popup.index("data-control-pesticide-list") < popup.index("data-control-pesticide-add-row")
    assert popup.index("data-control-pesticide-add-row") < popup.index("data-control-note-compact")
    assert "id=\"c-zone\"" not in popup
    assert "c-location-detail" not in popup
    assert "처리 위치 상세" not in popup
    assert "상세 위치" not in popup


def test_v1981_control_popup_preserves_dose_calculation_and_no_execution_authority():
    panel = _read(PANEL)
    popup = _control_frontend(panel)

    for marker in (
        "data-control-dose-grid",
        "data-chemical-amount-input",
        "data-water-amount-input",
        "data-dil-input",
        "data-treatment-area-input",
        "data-pyeong-amount-output",
        "_syncControlDoseCalculations",
        "_calculateControlDilution",
        "_calculateTreatmentAreaFromSeason",
        "_calculatePyeongUsage",
        "chemicalAmount",
        "waterAmount",
        "treatmentAreaM2",
        "perPyeongUsage",
        "cropModelNutritionHint",
    ):
        assert marker in popup or marker in panel

    for forbidden in (
        "data-crop-control-execute-spray",
        "data-crop-control-auto-apply",
        "controlAllowPesticideExecution",
        "autoSchedulePesticideApplication",
    ):
        assert forbidden not in panel


def test_v1981_control_popup_docs_and_version_contract():
    panel = _read(PANEL)
    popup = _control_frontend(panel)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    ui_doc = _read(UI_DOC)
    master = _read(MASTER)

    assert '"version": "1.15.45"' in manifest
    assert 'const VERSION = "1.15.45"' in panel
    assert "v1.15.45" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "방제 기록 모달 compact layout" in master

    for marker in (
        "data-control-compact-modal",
        "data-control-scope-row",
        "data-control-pesticide-entry",
        "data-control-dose-grid",
    ):
        assert marker in ui_doc
        assert marker in popup

    assert "처리 위치 상세" not in ui_doc
    assert "c-location-detail" not in ui_doc
