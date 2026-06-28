from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
GROWTH_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-growth-modal.js"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb004b_version_surfaces_are_v11113():
    assert '"version": "1.12.33"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.33"' in _read(PANEL)
    assert "v1.12.33" in _read(FRONTEND_PLAN)


def test_rb004b_growth_modal_module_exists_and_exports_pure_render_helpers():
    assert GROWTH_MODAL.exists()
    module = _read(GROWTH_MODAL)
    for marker in (
        "export function growthModalContext",
        "export function renderGrowthMetricFields",
        "export function renderGrowthQualityDisorderFields",
        "export function renderGrowthSurveyModal",
        "data-growth-field",
        "data-growth-quality-disorder-section",
        "data-growth-quality-disorder-field",
        "id=\"g-date\"",
        "id=\"g-note\"",
        "id=\"g-save\"",
        "생육조사 수정",
        "품질/생리장해 입력",
    ):
        assert marker in module
    for forbidden in (
        "hass.callApi",
        "this._hass.callApi",
        "_openCropPopup",
        "addEventListener",
        "querySelector",
        "green_smart/crop/growth",
        "green_smart/crop/seasons/${",
        "_fetchGrowthReport",
        "_refreshCropContent",
    ):
        assert forbidden not in module


def test_rb004b_panel_imports_growth_modal_helpers_and_keeps_save_api_binding_in_shell():
    panel = _read(PANEL)
    assert 'from "./domains/crop/crop-growth-modal.js"' in panel
    for imported in (
        "growthModalContext",
        "renderGrowthSurveyModal",
    ):
        assert imported in panel
    popup = panel.split("_openGrowthAddPopup(editIndex = null)", 1)[1].split("_openGrowthEditPopup", 1)[0]
    for marker in (
        "const context = growthModalContext(this, editIndex);",
        "const { isEdit, editRecord, activeSeason, config, qualityDisorderFields } = context;",
        "renderGrowthSurveyModal(this, context)",
        "this._openCropPopup(",
        "inner.querySelector(\"#g-save\")?.addEventListener",
        '"PUT", `green_smart/crop/growth/${id}`, body',
        '"POST", `green_smart/crop/seasons/${this._activeSeasonId}/growth`, body',
        "await this._fetchGrowthReport();",
    ):
        assert marker in popup
    assert "<div class=\"popup-card\">" not in popup
    assert "data-growth-field" not in popup
    assert "data-growth-quality-disorder-section" not in popup


def test_rb004b_preserves_other_crop_modals_and_api_boundaries():
    panel = _read(PANEL)
    for marker in (
        "_openCropBasicAddPopup",
        "_openCropBasicEditPopup",
        "_openPestAddPopup",
        "_openControlAddPopup",
        "_bindSeasonButtons(root)",
        'callApi("DELETE", `green_smart/crop/seasons/${sid}`',
        '"PATCH", `green_smart/crop/seasons/${sid}/demolish`',
    ):
        assert marker in panel


def test_rb004b_docs_record_growth_modal_extraction_boundaries():
    plan = _read(FRONTEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    shared_markers = (
        "RB-004B Growth survey modal render extraction",
        "v1.12.33",
        "domains/crop/crop-growth-modal.js",
        "생육조사 modal render helpers only",
        "save/API bindings remain in panel shell",
        "API/DB 변경 없음",
        "route path 변경 없음",
        "response shape 변경 없음",
    )
    for marker in shared_markers:
        assert marker in plan
        assert marker in master
    assert "병해충/방제 modal 변경 없음" in plan
    assert "custom_components/green_smart/panel/domains/crop/crop-growth-modal.js" in project
