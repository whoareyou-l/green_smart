from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REBUILD_PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "rebuild" / "green-smart-rebuild-panel.js"
RESEARCH_DOC = ROOT / "docs" / "rebuild" / "rs-002-home-dashboard-research.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_rs003_zone_detail_uses_tabs_not_horizontal_card_scroll_as_primary_ui():
    source = _read(REBUILD_PANEL)
    for marker in (
        "PAGE-CropCenteredHome",
        "MOD-CropStageZoneDetail",
        "COM-ZoneTabs",
        "COM-ZonePanel",
        "COM-ZoneDetailModal",
        "_selectedZoneId",
        "_bindZoneTabs",
        "_setSelectedZone",
        "renderZoneTabs",
        "renderZonePanel",
        "data-zone-tablist",
        "role=\"tablist\"",
        "role=\"tab\"",
        "aria-selected=",
        "data-zone-panel",
        "role=\"tabpanel\"",
        "data-active-zone-id",
    ):
        assert marker in source

    # If zone tabs exist, do not render every zone as a persistent horizontal card rail.
    # R7-040 legitimately uses horizontal overflow for the domain subtab top navbar;
    # keep this RS003 guard scoped to the old zone-detail card-rail markers.
    for forbidden in (
        "data-zone-detail-tabs",
        "data-zone-context-card",
        "flex:0 0 210px",
    ):
        assert forbidden not in source


def test_rs003_each_crop_os_stage_uses_the_same_zone_tab_component():
    source = _read(REBUILD_PANEL)
    for marker in (
        "renderZoneDrilldown(stageKey)",
        "renderZoneTabs(stageKey)",
        "renderZonePanel(stageKey)",
        'data-zone-detail-stage="${stageKey}"',
    ):
        assert marker in source
    for stage_key in (
        "crop-status",
        "growth-goal",
        "environment-impact",
        "recommend-act",
    ):
        assert f'data-r7-stage-card="{stage_key}"' in source


def test_rs003_zone_tab_clicks_update_visible_panel_without_rendering_all_zone_content():
    source = _read(REBUILD_PANEL)
    for marker in (
        "data-zone-tab-stage",
        "data-zone-tab-id",
        "data-zone-panel-stage",
        "data-zone-panel-id",
        "hidden",
        "button.setAttribute(\"aria-selected\"",
        "panel.hidden =",
        "this._selectedZoneId[stageKey] = zoneId",
        "data-cba-component=\"COM-ZoneTabs\"",
        "data-cba-component=\"COM-ZonePanel\"",
    ):
        assert marker in source


def test_rs003_zone_detail_modal_is_real_interaction_not_static_button_only():
    source = _read(REBUILD_PANEL)
    for marker in (
        "_openZoneDetailModal",
        "_closeZoneDetailModal",
        "data-zone-detail-modal",
        "role=\"dialog\"",
        "aria-modal=\"true\"",
        "data-zone-detail-modal-title",
        "data-zone-detail-modal-body",
        "data-zone-detail-modal-close",
        "data-cba-component=\"COM-ZoneDetailModal\"",
        "document.body.classList.add(\"gs-modal-open\")",
        "document.body.classList.remove(\"gs-modal-open\")",
        "Escape",
    ):
        assert marker in source


def test_rs003_docs_record_tab_first_zone_detail_decision():
    doc = _read(RESEARCH_DOC)
    for marker in (
        "RS-003 zone tab interaction decision",
        "구역 탭이 있으면 모든 구역 내용을 펼쳐 스크롤바를 만들지 않는다",
        "selected zone panel only",
        "modal is optional detail, not primary navigation",
        "horizontal scroll is not the primary zone navigation",
        "CBA: COM-ZoneTabs → COM-ZonePanel → COM-ZoneDetailModal → MOD-CropStageZoneDetail → PAGE-CropCenteredHome",
    ):
        assert marker in doc
