from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
PEST_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-pest-modal.js"
MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _pest_popup(panel: str) -> str:
    return panel.split("  _openPestAddPopup()", 1)[1].split("  _formatPesticideMoa", 1)[0]


def _pest_frontend(panel: str) -> str:
    return _pest_popup(panel) + "\n" + _read(PEST_MODAL)


def test_v1980_pest_popup_compact_scope_row_and_no_free_location_detail():
    panel = _read(PANEL)
    popup = _pest_frontend(panel)

    for marker in (
        "data-pest-compact-modal",
        "data-pest-scope-row",
        "data-pest-active-season-pill",
        "data-pest-location-scope-select",
        "data-pest-type-severity-list",
        "data-pest-type-severity-row",
        "data-pest-type-add-row",
        "data-pest-note-compact",
    ):
        assert marker in popup

    assert popup.index("data-pest-active-season-pill") < popup.index("data-pest-location-scope-select")
    assert "p-location-detail" not in popup
    assert "상세 위치" not in popup
    assert "발생 위치 상세" not in popup


def test_v1980_pest_popup_type_and_severity_are_one_row_units():
    panel = _read(PANEL)
    popup = _pest_frontend(panel)

    row_start = popup.index("data-pest-type-severity-row")
    row = popup[row_start: popup.index("</div>`).join", row_start)]
    assert "data-pest-type-input" in row
    assert "data-pest-severity-select" in row
    assert "data-pest-type-del" in popup
    assert "MAX_PEST_TYPES" in popup
    assert "selectedTypes.join" in popup
    assert "Math.max(max, Number(p.severity || 1))" in popup


def test_v1980_pest_popup_docs_and_version_contract():
    panel = _read(PANEL)
    master = _read(MASTER)
    ui_doc = _read(UI_DOC)

    assert '"version": "1.15.23"' in _read(ROOT / "custom_components" / "green_smart" / "manifest.json")
    assert 'const VERSION = "1.15.23"' in panel
    assert "병해충 예찰 모달 compact layout" in master
    for marker in (
        "data-pest-compact-modal",
        "data-pest-scope-row",
        "data-pest-type-severity-row",
    ):
        assert marker in ui_doc

    assert "p-location-detail" not in ui_doc
    assert "발생 위치 상세" not in ui_doc
