from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
RESEARCH_DOC = ROOT / "docs" / "rebuild" / "rs-002-home-dashboard-research.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs004_zone_modal_opens_centered_not_top_left():
    source = _read(REBUILD_PANEL)
    for marker in (
        "data-zone-detail-modal",
        "align-items:center",
        "justify-content:center",
        "modal.style.display = \"flex\"",
        "modal.style.display = \"none\"",
        "modal.hidden = false",
        "modal.hidden = true",
        "document.body.classList.add(\"gs-modal-open\")",
        "document.body.classList.remove(\"gs-modal-open\")",
    ):
        assert marker in source

    # Hidden alone makes a fixed modal fall back to block layout when opened.
    assert "modal.hidden = false;\n    document.body.classList.add" not in source


def test_rs004_crop_os_stage_cards_are_single_column_not_crowded_grid():
    source = _read(REBUILD_PANEL)
    for marker in (
        "data-crop-os-flow-stages",
        "grid-template-columns:1fr",
        "gap:18px",
        "data-cba-layout=\"single-column-stage-flow\"",
        "data-stage-card-shell",
    ):
        assert marker in source

    for forbidden in (
        "repeat(auto-fit,minmax(280px,1fr))",
        "repeat(auto-fit,minmax(260px,1fr))",
        "grid-template-columns:repeat(auto-fit",
    ):
        assert forbidden not in source


def test_rs004_docs_record_modal_center_and_single_column_decision():
    doc = _read(RESEARCH_DOC)
    for marker in (
        "RS-004 visual layout correction",
        "Modal opens centered with explicit display:flex",
        "Stage cards are one per row",
        "avoid crowded multi-card grid",
    ):
        assert marker in doc
