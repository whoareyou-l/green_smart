from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CONTROL_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-control-modal.js"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb004d_version_surfaces_are_v11115():
    assert '"version": "1.15.53"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.53"' in _read(PANEL)
    assert "v1.15.53" in _read(FRONTEND_PLAN)


def test_rb004d_control_modal_module_exists_and_exports_pure_render_helpers():
    assert CONTROL_MODAL.exists()
    module = _read(CONTROL_MODAL)
    for marker in (
        "export function controlModalContext",
        "export function renderControlTreatmentModal",
        "export function renderControlPesticideEntry",
        "data-control-compact-modal",
        "data-control-date-field",
        "data-control-scope-row",
        "data-control-active-season-pill",
        "data-control-location-scope-select",
        "data-control-pesticide-list",
        "data-control-pesticide-add-row",
        "data-control-note-compact",
        "data-control-pesticide-entry",
        "data-control-pesticide-name-field",
        "data-pesticide-suggestions",
        "data-mix-warning",
        "data-pls-warning",
        "data-control-dose-grid",
        "data-control-usage-row",
        "data-chemical-amount-input",
        "data-water-amount-input",
        "data-treatment-area-input",
        "data-pyeong-amount-output",
        "cropModelNutritionHint",
        "PLS ✓",
        "PLS ✗",
        "방제 기록 수정",
        "방제 기록 추가",
    ):
        assert marker in module
    for forbidden in (
        "hass.callApi",
        "this._hass.callApi",
        "_openCropPopup",
        "addEventListener",
        "querySelector",
        "setTimeout",
        "document.createElement",
        "green_smart/central/pesticide/search",
        "green_smart/pesticide/mix-check",
        "green_smart/crop/seasons/${",
        "_fetchGrowthReport",
        "_refreshCropContent",
    ):
        assert forbidden not in module


def test_rb004d_panel_imports_control_modal_helpers_and_keeps_api_binding_in_shell():
    panel = _read(PANEL)
    assert 'from "./domains/crop/crop-control-modal.js"' in panel
    for imported in ("controlModalContext", "renderControlTreatmentModal", "renderControlPesticideEntry"):
        assert imported in panel
    popup = panel.split("_openControlAddPopup()", 1)[1].split("_openControlEditPopup", 1)[0]
    for marker in (
        "const context = controlModalContext(this, arguments[0] ?? null);",
        "const { editIndex, isEdit, editRecord, today, MAX_PESTS, currentSeasonLabel, entries, getHistory, getPlsFromHistory } = context;",
        "renderControlTreatmentModal(this, context)",
        "renderControlPesticideEntry(this, entries[i], i)",
        "inner.querySelector(\"#c-save\")?.addEventListener",
        "green_smart/central/pesticide/search",
        "green_smart/pesticide/mix-check",
        "_findPlsConflict(entry.name, entry.moa)",
        "cropModelNutritionHint",
        '"POST", `green_smart/crop/seasons/${this._activeSeasonId}/control`, controlBody',
        "await this._fetchGrowthReport();",
    ):
        assert marker in popup
    assert "<div class=\"popup-card\" data-control-compact-modal" not in popup
    assert "data-control-dose-grid" not in popup


def test_rb004d_preserves_other_record_modals_and_boundaries():
    panel = _read(PANEL)
    for marker in (
        "_openGrowthAddPopup",
        "_openPestAddPopup",
        "_openControlEditPopup",
        "_bindSeasonButtons(root)",
        "green_smart/central/pesticide/search",
        "green_smart/pesticide/mix-check",
    ):
        assert marker in panel


def test_rb004d_docs_record_control_modal_extraction_boundaries():
    plan = _read(FRONTEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    for marker in (
        "RB-004D Control/treatment modal render extraction",
        "v1.15.53",
        "domains/crop/crop-control-modal.js",
        "방제 기록 modal render helpers only",
        "PLS/혼용 warning render markers preserved",
        "pesticide/API/save bindings remain in panel shell",
        "API/DB 변경 없음",
        "route path 변경 없음",
        "response shape 변경 없음",
    ):
        assert marker in plan
        assert marker in master
    assert "custom_components/green_smart/panel/domains/crop/crop-control-modal.js" in project
