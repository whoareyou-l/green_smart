from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
PEST_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-pest-modal.js"
CONTROL_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-control-modal.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_v1982_p1_home_crop_flow_rendered_qa_contract_markers():
    panel = _read(PANEL)
    frontend = panel + "\n" + _read(PEST_MODAL) + "\n" + _read(CONTROL_MODAL)

    required_markers = (
        "data-home-action-summary",
        "_renderKPIStrip(kpi)",
        "data-crop-pest-summary-card",
        "data-crop-pest-action-row",
        "data-crop-pest-record-list",
        "data-pest-compact-modal",
        "data-pest-scope-row",
        "data-pest-type-severity-row",
        "data-crop-control-safety-summary",
        "data-crop-control-action-row",
        "data-crop-control-treatment-list",
        "data-control-compact-modal",
        "data-control-date-field",
        "data-control-scope-row",
        "data-control-pesticide-list",
        "data-control-pesticide-add-row",
        "data-control-note-compact",
        "data-control-dose-grid",
    )
    for marker in required_markers:
        assert marker in frontend

    forbidden_markers = (
        "data-home-greenhouse-kpi-inline",
        "data-crop-tab-emoji",
        "${t.emoji}",
        "p-location-detail",
        "c-location-detail",
        "data-crop-pest-control-form",
        "data-crop-pest-execute-control",
        "data-crop-control-execute-spray",
        "data-crop-control-auto-apply",
        "controlAllowPesticideExecution",
        "autoSchedulePesticideApplication",
    )
    for marker in forbidden_markers:
        assert marker not in panel


def test_v1982_p1_flow_version_and_docs_contract():
    panel = _read(PANEL)
    manifest = _read(MANIFEST)
    central = _read(CENTRAL)
    ui_doc = _read(UI_DOC)
    master = _read(MASTER)

    assert '"version": "1.15.10"' in manifest
    assert 'const VERSION = "1.15.10"' in panel
    assert "v1.15.10" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
    assert "기준 버전: `v1.15.10`" in ui_doc
    assert "P1 rendered-flow QA v1.10.9" in ui_doc
    assert "P1 rendered-flow QA v1.10.9" in master
