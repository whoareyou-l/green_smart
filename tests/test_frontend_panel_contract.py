from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND_PANEL = ROOT / "custom_components" / "green_smart" / "frontend_panel.py"


def _source() -> str:
    return FRONTEND_PANEL.read_text(encoding="utf-8")


def test_panel_manifest_version_read_runs_in_executor_not_event_loop():
    source = _source()
    setup_section = source.split("async def async_setup_panel", 1)[1].split("async def _register_static_path", 1)[0]

    assert "async_add_executor_job(_get_panel_js_url)" in setup_section
    assert "panel_js_url = _get_panel_js_url()" not in setup_section
    assert "read_text" in source  # sync file read is allowed only inside executor target


def test_crop_basic_tab_uses_zone_id_name_not_legacy_zone_placeholder():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    seasons_list = panel.split("_renderCropSeasonsList()", 1)[1].split("_renderCropGrowthTab()", 1)[0]

    assert "_seasonZoneLabel(s)" in seasons_list
    assert 'Zone ${s.zone || "?"}' not in seasons_list
    assert "s.zoneName" in panel
    assert "s.zoneId" in panel


def test_crop_basic_add_popup_renders_configured_zone_groups_with_collapse_and_multi_save():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    popup = panel.split("_openCropBasicAddPopup()", 1)[1].split("// ── CSV 내보내기", 1)[0]

    assert "const cfg = this._normalizedForm()" in popup
    assert "cfg.greenhouse_zones" in popup
    assert "data-basic-zone-toggle" in popup
    assert "data-basic-zone-body" in popup
    assert "_basicZoneCollapsed" in panel
    assert "Promise.all" in popup
    assert "selectedZones.map" in popup
    assert "zoneId: zone.id" in popup


def test_crop_basic_add_popup_has_per_zone_crop_fields_and_same_as_previous_checkbox():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    popup = panel.split("_openCropBasicAddPopup()", 1)[1].split("// ── CSV 내보내기", 1)[0]

    assert "data-basic-crop-type" in popup
    assert "data-basic-variety" in popup
    assert "data-basic-method" in popup
    assert "data-basic-same-as-prev" in popup
    assert "_syncBasicZoneCommonFields" in panel
    assert "cropType: zoneValues.cropType" in popup
    assert "variety: zoneValues.variety" in popup
    assert "method: zoneValues.method" in popup


def test_crop_basic_list_has_edit_delete_buttons_confirm_and_edit_popup():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    seasons_list = panel.split("_renderCropSeasonsList()", 1)[1].split("_renderCropGrowthTab()", 1)[0]
    bind_section = panel.split("_bindSeasonButtons(root)", 1)[1].split("_renderEnvSettingsPage()", 1)[0]

    assert "data-season-edit" in seasons_list
    assert "data-season-delete" in seasons_list
    assert "mdi:pencil" in seasons_list
    assert "mdi:trash-can-outline" in seasons_list
    assert "_openCropBasicEditPopup" in panel
    assert "정말 삭제" in bind_section
    assert 'callApi("DELETE", `green_smart/crop/seasons/${sid}`' in bind_section


def test_crop_tabs_paginate_records_five_per_page():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")

    assert "const CROP_PAGE_SIZE = 5" in panel
    assert "_cropPage" in panel
    assert "_paginatedCropRows(" in panel
    assert "_renderCropPager(" in panel
    for key in ("basic", "growth", "pest", "control"):
        assert f'_renderCropPager("{key}"' in panel
        assert f'this._paginatedCropRows("{key}"' in panel
    assert "data-crop-page" in panel


def test_crop_basic_demolished_seasons_still_show_delete_button_without_edit_or_demolish():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    seasons_list = panel.split("_renderCropSeasonsList()", 1)[1].split("_renderCropGrowthTab()", 1)[0]

    assert "const seasonActions" in seasons_list
    assert "data-season-delete" in seasons_list
    assert "const activeActions" in seasons_list
    assert "const deleteAction" in seasons_list
    assert "demolished ? deleteAction : activeActions" in seasons_list


def test_growth_add_popup_uses_selected_season_crop_type_for_dynamic_fields():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    popup = panel.split("_openGrowthAddPopup()", 1)[1].split("_openPestAddPopup()", 1)[0]

    assert "_activeSeason()" in panel
    assert "_growthFieldConfigForCrop" in panel
    assert "activeSeason.cropType" in popup or "activeSeason?.cropType" in popup
    assert "data-growth-field" in popup
    for crop in ("tomato", "paprika", "strawberry", "lettuce", "cucumber", "herb"):
        assert crop in panel
    for field in ("height", "leafCount", "stemDia", "truss", "node"):
        assert f"body.{field}" in popup


def test_growth_survey_payload_list_and_export_use_dynamic_crop_metrics():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    popup = panel.split("_openGrowthAddPopup()", 1)[1].split("_openPestAddPopup()", 1)[0]
    growth_list = panel.split("  _renderCropGrowthTab()", 1)[1].split("  _renderCropPestTab()", 1)[0]
    export_section = panel.split('} else if (type === "growth") {', 1)[1].split('} else if (type === "pest") {', 1)[0]

    assert "metrics: config.fields.map" in popup
    assert "cropType: activeSeason?.cropType" in popup
    assert "metricsJson" in growth_list
    assert "this._renderGrowthMetricChips" in growth_list
    assert "_growthMetricRowsForExport" in panel
    assert "metricsJson" in export_section


def test_home_dashboard_does_not_render_or_fetch_pesticide_card():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    home = panel.split("  _renderHomePage(sim)", 1)[1].split("  _renderKPIStrip", 1)[0]
    weather_fetch = panel.split("  async _fetchWeather()", 1)[1].split("  _generateSimData", 1)[0]

    assert "_renderPesticideCard()" not in home
    assert "data-pesticide-card" not in home
    assert "central/pesticide/search" not in weather_fetch
    assert "data-pesticide-card" not in weather_fetch


def test_green_smart_sidebar_offsets_from_ha_sidebar_not_viewport_left():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    styles = panel.split("/* ── Sidebar / TopBar ─── */", 1)[1].split("/* Animations */", 1)[0]

    assert "--gs-ha-sidebar-left" in panel
    assert "_syncHaSidebarOffset" in panel
    assert "getBoundingClientRect().left" in panel
    assert "left:var(--gs-ha-sidebar-left,0px)" in styles
    assert "position:fixed;top:0;left:0;width:70px" not in styles
