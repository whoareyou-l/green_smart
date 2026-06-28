from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
PEST_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-pest-modal.js"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb004c_version_surfaces_are_v11114():
    assert '"version": "1.12.30"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.30"' in _read(PANEL)
    assert "v1.12.30" in _read(FRONTEND_PLAN)


def test_rb004c_pest_modal_module_exists_and_exports_pure_render_helpers():
    assert PEST_MODAL.exists()
    module = _read(PEST_MODAL)
    for marker in (
        "export function pestModalContext",
        "export function renderPestScoutingModal",
        "export function renderPestTypeRows",
        "data-pest-compact-modal",
        "data-pest-scope-row",
        "data-pest-active-season-pill",
        "data-pest-location-scope-select",
        "data-pest-type-severity-list",
        "data-pest-type-add-row",
        "data-pest-type-entry",
        "data-pest-type-severity-row",
        "data-pest-type-input",
        "data-pest-type-suggestions",
        "data-pest-severity-select",
        "data-pest-type-del",
        "id=\"p-date\"",
        "id=\"p-type-list\"",
        "id=\"p-add-type\"",
        "id=\"p-note\"",
        "id=\"p-save\"",
        "병해충 예찰 수정",
        "병해충 예찰 추가",
        "농약 API 자동완성",
    ):
        assert marker in module
    for forbidden in (
        "hass.callApi",
        "this._hass.callApi",
        "_openCropPopup",
        "addEventListener",
        "querySelector",
        "setTimeout",
        "green_smart/central/pesticide/search",
        "green_smart/crop/pest",
        "green_smart/crop/seasons/${",
        "_fetchGrowthReport",
        "_refreshCropContent",
    ):
        assert forbidden not in module


def test_rb004c_panel_imports_pest_modal_helpers_and_keeps_autocomplete_and_save_in_shell():
    panel = _read(PANEL)
    assert 'from "./domains/crop/crop-pest-modal.js"' in panel
    for imported in ("pestModalContext", "renderPestScoutingModal", "renderPestTypeRows"):
        assert imported in panel
    popup = panel.split("_openPestAddPopup()", 1)[1].split("_openPestEditPopup", 1)[0]
    for marker in (
        "const context = pestModalContext(this, arguments[0] ?? null);",
        "const { editIndex, isEdit, editRecord, today, currentSeasonLabel, pestTypes, MAX_PEST_TYPES } = context;",
        "renderPestScoutingModal(this, context)",
        "renderPestTypeRows(this, pestTypes)",
        "inner.querySelector(\"#p-save\")?.addEventListener",
        "green_smart/central/pesticide/search",
        'isEdit ? "PATCH" : "POST"',
        "green_smart/crop/pest/${editRecord.id}",
        "green_smart/crop/seasons/${this._activeSeasonId}/pest",
        "await this._fetchGrowthReport();",
    ):
        assert marker in popup
    assert "<div class=\"popup-card\" data-pest-compact-modal>" not in popup
    assert "data-pest-scope-row" not in popup
    assert "data-pest-type-severity-list" not in popup


def test_rb004c_preserves_growth_control_modals_and_api_boundaries():
    panel = _read(PANEL)
    control_module = (ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-control-modal.js").read_text(encoding="utf-8")
    frontend = panel + "\n" + control_module
    for marker in (
        "_openGrowthAddPopup",
        "_openControlAddPopup",
        "_openPestEditPopup",
        "_bindSeasonButtons(root)",
        "data-control-compact-modal",
        '"POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth`',
    ):
        assert marker in frontend


def test_rb004c_docs_record_pest_modal_extraction_boundaries():
    plan = _read(FRONTEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    shared_markers = (
        "RB-004C Pest scouting modal render extraction",
        "v1.12.30",
        "domains/crop/crop-pest-modal.js",
        "병해충 예찰 modal render helpers only",
        "autocomplete/API/save bindings remain in panel shell",
        "API/DB 변경 없음",
        "route path 변경 없음",
        "response shape 변경 없음",
    )
    for marker in shared_markers:
        assert marker in plan
        assert marker in master
    assert "방제 modal 변경 없음" in plan
    assert "custom_components/green_smart/panel/domains/crop/crop-pest-modal.js" in project
