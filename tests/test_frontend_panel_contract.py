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

def test_home_dashboard_trend_charts_use_dense_vertical_plot_area_without_extra_top_bottom_gap():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    env_chart = panel.split("  _renderTrendChart()", 1)[1].split("  _patchChart()", 1)[0]
    irrig_chart = panel.split("  _renderIrrigChart()", 1)[1].split("  _patchIrrigChart()", 1)[0]

    for chart in (env_chart, irrig_chart):
        assert "CHART_VIEW_H = 280" in chart
        assert "PAD_TOP = 4" in chart
        assert "PAD_BOTTOM = 18" in chart
        assert "chartH = CHART_VIEW_H - PAD_TOP - PAD_BOTTOM" in chart
        assert "viewBox=\"0 0 ${W} ${CHART_VIEW_H}\"" in chart
        assert "style=\"height:280px;\"" in chart
        assert "viewBox=\"0 0 ${W} 220\"" not in chart

def test_environment_page_is_control_strategy_with_interlock_ai_safety_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    sidebar = panel.split("  _renderSidebar()", 1)[1].split("  _alertPillHtml", 1)[0]
    env_page = panel.split("  _renderEnvSettingsPage()", 1)[1].split("  _renderIrrigSettingsPage()", 1)[0]

    assert "환경 제어" in sidebar
    assert "환경 제어 전략" not in sidebar
    assert "AI가 꺼져도 기본 인터록 제어로 온실을 안전하게 유지" in env_page
    for section in ["제어 모드", "온도 제어", "습도 / VPD 제어", "CO₂ 제어", "AI 전략 / 최종 적용값", "안전 한계", "작동 로그"]:
        assert section in panel
    for removed_tab in ["기본 인터록", "권한"]:
        assert removed_tab not in panel.split("  _envStrategyTabs()", 1)[1].split("  _renderEnvStrategyTabBar", 1)[0]
    for state_key in ["baseInterlockSettings", "aiStrategySettings", "lowLightStrategySettings", "safetyLimits", "finalAppliedTargets", "controlMode", "systemStatus", "controlLogs"]:
        assert state_key in panel
    assert "AI는 제어의 기본값이 아니다" not in env_page
    assert "우선순위: 1. 비상 정지" not in env_page


def test_environment_control_strategy_distinguishes_base_ai_final_and_permissions():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    env_page = panel.split("  _renderEnvSettingsPage()", 1)[1].split("  _renderIrrigSettingsPage()", 1)[0]
    content = panel.split("  _renderEnvStrategyTabContent", 1)[1].split("  _renderEnvSettingsPage", 1)[0]
    doc = (ROOT / "docs" / "decisions" / "environment-control-permissions.md").read_text(encoding="utf-8")

    for marker in ["data-ai-strategy", "data-final-target", "data-safety-limit", "data-control-log"]:
        assert marker in panel
    assert "data-base-interlock" not in env_page
    assert "기본 인터록값" not in env_page
    assert "AI 보정값" in content
    assert "최종 적용값" in content
    assert "저광기 전략" in content
    assert "lowLightStrategySettings" in panel
    for role in ["Admin", "Farm Owner", "Farm Worker"]:
        assert role not in env_page
        assert role in doc
    temperature_block = content.split('if (tab === "temperature")', 1)[1].split('if (tab === "humidity")', 1)[0]
    for field in ["주간 목표온도", "야간 목표온도", "기본 ADT", "기본 DIF", "난방 시작 온도", "난방 정지 온도", "환기 시작 온도", "환기 최대 온도", "고온 경보 온도", "저온 경보 온도"]:
        assert field in temperature_block
    humidity_block = content.split('if (tab === "humidity")', 1)[1].split('if (tab === "co2")', 1)[0]
    assert "목표 습도" in humidity_block
    assert "목표 VPD" in humidity_block
    co2_block = content.split('if (tab === "co2")', 1)[1].split('if (tab === "ai")', 1)[0]
    assert "목표 CO₂" in co2_block
    assert "_calculateFinalAppliedTargets" in panel
    assert "_bindControlStrategyInputs" in panel
    assert "_saveControlStrategy" in panel


def test_environment_strategy_uses_thermometer_icon_and_subtabs_single_active_card():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    sidebar = panel.split("  _renderSidebar()", 1)[1].split("  _alertPillHtml", 1)[0]
    env_page = panel.split("  _renderEnvSettingsPage()", 1)[1].split("  _renderIrrigSettingsPage()", 1)[0]
    binder = panel.split("  _bindControlStrategyInputs(root)", 1)[1].split("  // ── Dashboard event binding", 1)[0]
    tabs = panel.split("  _envStrategyTabs()", 1)[1].split("  _renderEnvStrategyTabBar", 1)[0]

    assert 'navBtn("environment", "mdi:thermometer-lines",  "환경 제어"' in sidebar
    assert 'this._envStrategyTab = "mode"' in panel
    assert "data-env-strategy-tab" in env_page
    assert "data-env-strategy-content" in env_page
    assert "_renderEnvStrategyTabBar" in panel
    assert "_renderEnvStrategyTabContent" in panel
    assert "_envStrategyTabs()" in panel
    assert "data-env-strategy-tab" in binder
    assert "this._envStrategyTab = btn.dataset.envStrategyTab" in binder
    assert "strategy-grid" not in env_page
    assert "_strategySection(" not in env_page
    assert 'key: "interlock"' not in tabs
    assert 'key: "final"' not in tabs
    assert 'key: "permissions"' not in tabs


def test_irrigation_control_page_tabs_state_and_ai_interlock_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    sidebar = panel.split("  _renderSidebar()", 1)[1].split("  _alertPillHtml", 1)[0]
    irrig_page = panel.split("  _renderIrrigSettingsPage()", 1)[1].split("  _renderVentSettingsPage()", 1)[0]

    assert 'navBtn("irrigation",  "mdi:water",              "관수 제어"' in sidebar
    assert "기본 관수 인터록으로 안전하게 작동하고" in irrig_page
    assert "data-irrigation-control-tab" in irrig_page
    assert "data-irrigation-control-content" in irrig_page
    assert "_irrigationControlTabs()" in panel
    assert "_renderIrrigationControlTabBar" in panel
    assert "_renderIrrigationControlTabContent" in panel
    assert "_bindIrrigationControlInputs" in panel
    for tab in ["제어 모드", "기본 관수 설정", "포수 전략", "일사 비례 관수", "드라이백 전략", "배액 피드백", "양액 전략", "AI 관수 보정", "안전 한계", "양액기 설정", "관수 로그"]:
        assert tab in panel
    for state_key in ["irrigationControlMode", "baseIrrigationSettings", "saturationStrategy", "solarIrrigationStrategy", "drybackStrategy", "drainFeedback", "nutrientStrategy", "aiIrrigationCorrection", "irrigationSafetyLimits", "fertigationDeviceSettings", "finalIrrigationTargets", "irrigationLogs"]:
        assert state_key in panel
    assert "AI는 기본 관수 인터록 위에 적용되는 보정 레이어" in panel
    assert "_calculateFinalIrrigationTargets" in panel


def test_irrigation_control_docs_cover_requested_development_deliverables():
    doc_path = ROOT / "docs" / "design" / "irrigation-control-page.md"
    doc = doc_path.read_text(encoding="utf-8")
    for heading in ["전체 페이지 구조", "하위 탭 구조", "React 컴포넌트 구조", "TypeScript Interface", "Mock Data", "API 명세", "DB 테이블 초안", "RBAC 권한 처리 방식", "실제 UI 코드", "Home Assistant 엔티티 연동 구조", "AI Agent 출력값을 DB에 저장하고 UI에 반영하는 구조"]:
        assert heading in doc
    for api in ["GET /api/irrigation/status", "GET /api/irrigation/settings", "POST /api/irrigation/settings", "GET /api/irrigation/final-targets", "GET /api/irrigation/ai-correction", "POST /api/irrigation/manual-run", "POST /api/irrigation/emergency-stop", "GET /api/irrigation/logs", "POST /api/irrigation/drain-feedback"]:
        assert api in doc
    for table in ["irrigation_settings", "sensor_readings", "irrigation_drain_feedback", "ai_irrigation_outputs", "final_irrigation_targets", "irrigation_control_logs", "audit_logs"]:
        assert table in doc
    for role in ["Admin", "Farm Owner", "Farm Worker"]:
        assert role in doc
