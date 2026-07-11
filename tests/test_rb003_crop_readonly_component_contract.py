from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CROP_READONLY = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-readonly.js"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb003_version_surfaces_are_v1117():
    assert '"version": "1.15.34"' in _read(MANIFEST)
    assert 'const VERSION = "1.15.34"' in _read(PANEL)
    assert "v1.15.34" in _read(FRONTEND_PLAN)


def test_rb003_crop_readonly_module_exists_and_exports_pure_render_helpers():
    assert CROP_READONLY.exists()
    module = _read(CROP_READONLY)
    for marker in (
        "export function renderCropBasicOverviewCard",
        "export function renderCropBasicTab",
        "export function renderCropSeasonsList",
        "data-crop-basic-summary-card",
        "data-crop-basic-list-header",
        "data-crop-basic-season-list",
        "data-crop-basic-record-row",
        "data-crop-basic-record-actions",
        "data-crop-basic-empty-state",
    ):
        assert marker in module
    for forbidden in (
        "hass.callApi",
        "this._hass.callApi",
        "openCropBasicAddPopup",
        "green_smart/crop/seasons/${sid}`",
        "data-crop-ui-execute-device",
    ):
        assert forbidden not in module


def test_rb003_panel_imports_crop_readonly_and_delegates_wrappers():
    panel = _read(PANEL)
    assert 'from "./domains/crop/crop-readonly.js"' in panel
    for imported in (
        "renderCropBasicOverviewCard",
        "renderCropBasicTab",
        "renderCropSeasonsList",
    ):
        assert imported in panel
    assert "_renderCropBasicOverviewCard()" in panel and "return renderCropBasicOverviewCard(this);" in panel
    assert "_renderCropBasicTab()" in panel and "return renderCropBasicTab(this);" in panel
    assert "_renderCropSeasonsList()" in panel and "return renderCropSeasonsList(this);" in panel


def test_rb003_preserves_existing_basic_write_bindings_in_panel_shell():
    panel = _read(PANEL)
    for marker in (
        "_openCropBasicAddPopup()",
        "_openCropBasicEditPopup",
        "_bindSeasonButtons(root)",
        'callApi("DELETE", `green_smart/crop/seasons/${sid}`',
        "data-season-edit",
        "data-season-delete",
        "data-season-demolish",
    ):
        assert marker in panel


def test_rb003_frontend_plan_records_readonly_extraction_boundaries():
    plan = _read(FRONTEND_PLAN)
    master = _read(MASTER_PLAN)
    for marker in (
        "RB-003 Crop read-only component extraction",
        "v1.15.34",
        "domains/crop/crop-readonly.js",
        "read-only render helpers only",
        "crop write modal/save/delete 변경 없음",
        "DB/API 변경 없음",
    ):
        assert marker in plan
        assert marker in master
