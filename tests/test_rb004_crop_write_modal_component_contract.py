from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
CROP_WRITE_MODAL = ROOT / "custom_components" / "green_smart" / "panel" / "domains" / "crop" / "crop-write-modal.js"
FRONTEND_PLAN = ROOT / "docs" / "rebuild" / "frontend-decomposition-plan.md"
MASTER_PLAN = ROOT / "docs" / "plans" / "2026-06-28-green-smart-product-first-rebuild-plan.md"
PROJECT_MASTER = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rb004_version_surfaces_are_v11112():
    assert '"version": "1.12.25"' in _read(MANIFEST)
    assert 'const VERSION = "1.12.25"' in _read(PANEL)
    assert "v1.12.25" in _read(FRONTEND_PLAN)


def test_rb004_crop_write_modal_module_exists_and_exports_pure_render_helpers():
    assert CROP_WRITE_MODAL.exists()
    module = _read(CROP_WRITE_MODAL)
    for marker in (
        "export function cropBasicAddZones",
        "export function renderCropBasicAddModal",
        "export function cropBasicEditValues",
        "export function renderCropBasicEditModal",
        "data-basic-crop-type",
        "data-basic-variety",
        "data-basic-method",
        "data-basic-zone-toggle",
        "data-basic-zone-body",
        "selectedZones.map",
        "zoneId: zone.id",
        "정식 등록",
        "작기 수정",
        "선택 구역 정식 등록",
        "수정 저장",
    ):
        assert marker in module
    for forbidden in (
        "hass.callApi",
        "this._hass.callApi",
        "_openCropPopup",
        "addEventListener",
        "querySelector",
        "green_smart/crop/seasons",
        "data-season-delete",
        "data-season-demolish",
    ):
        assert forbidden not in module


def test_rb004_panel_imports_write_modal_helpers_and_wrappers_delegate_html_only():
    panel = _read(PANEL)
    assert 'from "./domains/crop/crop-write-modal.js"' in panel
    for imported in (
        "cropBasicAddZones",
        "renderCropBasicAddModal",
        "cropBasicEditValues",
        "renderCropBasicEditModal",
    ):
        assert imported in panel
    add_section = panel.split("_openCropBasicAddPopup()", 1)[1].split("_openCropBasicEditPopup", 1)[0]
    edit_section = panel.split("_openCropBasicEditPopup(index)", 1)[1].split("// ── CSV 내보내기", 1)[0]
    for marker in (
        "const zones = cropBasicAddZones(this);",
        "renderCropBasicAddModal(this, zones)",
        "this._openCropPopup(",
        "this._bindBasicZoneModal(inner, zones, open)",
        'this._hass.callApi("POST", "green_smart/crop/seasons", body)',
        "selectedZones.map",
    ):
        assert marker in add_section
    for marker in (
        "const values = cropBasicEditValues(this, season);",
        "renderCropBasicEditModal(this, season, zone, values)",
        "this._openCropPopup(",
        'this._hass.callApi("PATCH", `green_smart/crop/seasons/${season.id}`',
    ):
        assert marker in edit_section
    for section in (add_section, edit_section):
        assert "<div class=\"popup-card\"" not in section
        assert "<div class=\"pop-header\"" not in section


def test_rb004_preserves_delete_demolish_and_record_write_bindings_in_panel_shell():
    panel = _read(PANEL)
    for marker in (
        "_bindSeasonButtons(root)",
        'callApi("DELETE", `green_smart/crop/seasons/${sid}`',
        '"PATCH", `green_smart/crop/seasons/${sid}/demolish`',
        "data-season-edit",
        "data-season-delete",
        "data-season-demolish",
        "_openGrowthAddPopup",
        "_openPestAddPopup",
        "_openControlAddPopup",
    ):
        assert marker in panel


def test_rb004_docs_record_write_modal_extraction_boundaries():
    plan = _read(FRONTEND_PLAN)
    master = _read(MASTER_PLAN)
    project = _read(PROJECT_MASTER)
    for marker in (
        "RB-004 Crop write modal extraction",
        "v1.12.25",
        "domains/crop/crop-write-modal.js",
        "작기 write modal render helpers only",
        "save/delete bindings remain in panel shell",
        "API/DB 변경 없음",
        "route path 변경 없음",
        "response shape 변경 없음",
    ):
        assert marker in plan
        assert marker in master
    assert "custom_components/green_smart/panel/domains/crop/crop-write-modal.js" in project
