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


def test_crop_season_selector_displays_korean_crop_labels_instead_of_raw_keys():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    selector = panel.split("  _renderSeasonSelector()", 1)[1].split("  _renderCropTabContent()", 1)[0]

    for marker in (
        "CROP_LABELS",
        'tomato:"토마토"',
        'lettuce:"상추"',
        'paprika:"파프리카"',
        'cucumber:"오이"',
        "cropLabel",
    ):
        assert marker in selector
    assert "s.variety || s.cropType" not in selector


def test_crop_pest_and_control_popups_use_season_location_scope_and_pest_autocomplete():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    pest_popup = panel.split("  _openPestAddPopup()", 1)[1].split("  _formatPesticideMoa", 1)[0]
    control_popup = panel.split("  _openControlAddPopup()", 1)[1].split("  _refreshCropContent", 1)[0]

    for marker in (
        "data-pest-type-entry",
        "data-pest-type-suggestions",
        "green_smart/central/pesticide/search",
        "MAX_PEST_TYPES",
        "#p-add-type",
        "p-location-scope",
        "p-location-detail",
        "전체",
        "부분",
        "_activeSeasonLabel()",
        "selectedTypes.join",
    ):
        assert marker in pest_popup
    assert "id=\"p-type\"" not in pest_popup
    assert "id=\"p-loc\"" not in pest_popup

    for marker in (
        "c-location-scope",
        "c-location-detail",
        "_activeSeasonLabel()",
        "전체",
        "부분",
        "currentSeasonLabel",
        "처리 위치",
    ):
        assert marker in control_popup
    assert "id=\"c-zone\"" not in control_popup


def test_product_phase6_growth_report_panel_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    growth_tab = panel.split("  _renderCropGrowthTab()", 1)[1].split("  _renderCropPestTab()", 1)[0]

    for marker in (
        "this._growthReportData",
        "async _fetchGrowthReport()",
        "_renderGrowthReportCard()",
        "data-growth-report-card",
        "data-growth-report-refresh",
        "green_smart/crop/seasons/${this._activeSeasonId}/growth-report",
        "growthTrend",
        "gIndexTrend",
        "yieldPrediction",
        "pestRisk",
        "weeklyReport",
        "생육 리포트",
        "G-Index 추이",
        "수확량 예측",
        "병해 위험도",
        "주간 리포트",
    ):
        assert marker in panel
    assert "_renderGrowthReportCard()" in growth_tab
    assert "this._fetchGrowthReport()" in panel


def test_product_phase6_yield_model_panel_surfaces_model_details_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    report_card = panel.split("  _renderGrowthReportCard()", 1)[1].split("  _renderCropGrowthTab()", 1)[0]

    for marker in (
        "estimatedKgPerPlant",
        "estimatedKgPerArea",
        "modelVersion",
        "cropModelLabel",
        "yieldDrivers",
        "confidenceReasons",
        "작물별 수확 모델",
        "주당 예측",
        "면적당 예측",
        "예측 근거",
    ):
        assert marker in report_card


def test_product_phase6_pest_risk_panel_surfaces_environment_weather_control_details_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    report_card = panel.split("  _renderGrowthReportCard()", 1)[1].split("  _renderCropGrowthTab()", 1)[0]

    for marker in (
        "environmentDrivers",
        "weatherDrivers",
        "controlHistoryDrivers",
        "riskFactors",
        "recommendedActions",
        "modelVersion",
        "병해 위험 모델",
        "환경 위험",
        "날씨 위험",
        "방제 이력",
        "권장 조치",
    ):
        assert marker in report_card


def test_product_phase6_weekly_report_export_notification_panel_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    report_card = panel.split("  _renderGrowthReportCard()", 1)[1].split("  _renderCropGrowthTab()", 1)[0]
    bind_section = panel.split("  _bindCropContent(root)", 1)[1].split("  _openSeasonBasicPopup", 1)[0]

    for marker in (
        "data-weekly-report-export",
        "data-weekly-report-notify",
        "_exportWeeklyGrowthReport()",
        "_notifyWeeklyGrowthReport()",
        "exportCsv",
        "exportFilename",
        "notificationDraft",
        "green_smart/crop/seasons/${this._activeSeasonId}/growth-report/notify",
        "주간 리포트 내보내기",
        "알림 보내기",
    ):
        assert marker in panel
    assert "data-weekly-report-export" in report_card
    assert "data-weekly-report-notify" in report_card
    assert "_exportWeeklyGrowthReport" in bind_section
    assert "_notifyWeeklyGrowthReport" in bind_section


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
    assert "data-irrigation-control-tab" in panel
    assert "data-irrigation-control-content" in irrig_page
    assert "_irrigationControlTabs()" in panel
    assert "_renderIrrigationControlTabBar" in panel
    assert "_renderIrrigationControlTabContent" in panel
    assert "  _bindIrrigationControlInputs(root) {" in panel
    assert "data-irrigation-control-tab data-irrigation-control-content" not in irrig_page
    for tab in ["제어 모드", "기본 관수 설정", "포수 전략", "일사 비례 관수", "드라이백 전략", "배액 피드백", "양액 전략", "AI 관수 보정", "안전 한계", "양액기 설정", "관수 로그"]:
        assert tab in panel
    for state_key in ["irrigationControlMode", "baseIrrigationSettings", "saturationStrategy", "solarIrrigationStrategy", "drybackStrategy", "drainFeedback", "nutrientStrategy", "aiIrrigationCorrection", "irrigationSafetyLimits", "fertigationDeviceSettings", "finalIrrigationTargets", "irrigationLogs"]:
        assert state_key in panel
    assert "AI는 기본 관수 인터록 위에 적용되는 보정 레이어" in panel
    assert "_calculateFinalIrrigationTargets" in panel


def test_irrigation_control_tabs_use_tab_specific_summaries_not_identical_status_values():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    summary = panel.split("  _irrigSummary(state)", 1)[1].split("  _irrigTriad", 1)[0]

    assert "const tab = this._irrigationTab" in summary
    for key in ["baseIrrigationSettings", "saturationStrategy", "solarIrrigationStrategy", "drybackStrategy", "drainFeedback", "nutrientStrategy", "aiIrrigationCorrection", "irrigationSafetyLimits", "fertigationDeviceSettings"]:
        assert key in summary
    assert summary.count("return `<div class=\"strategy-status-row\"") >= 8


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


def test_device_control_replaces_ventilation_and_screen_sidebar_routes():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    sidebar = panel.split("  _renderSidebar()", 1)[1].split("  _alertPillHtml", 1)[0]
    dashboard = panel.split("    const sim = this._simData;", 1)[1].split("  // ── No-flicker partial data refresh", 1)[0]
    device_page = panel.split("  _renderDeviceControlPage()", 1)[1].split("  _renderVentSettingsPage()", 1)[0]

    assert 'navBtn("device",      "mdi:cog-box",            "장치제어"' in sidebar
    assert "환기 설정" not in sidebar
    assert "스크린 설정" not in sidebar
    assert 'this._page === "device"' in dashboard
    assert 'this._page === "ventilation"' not in dashboard
    assert 'this._page === "screen"' not in dashboard
    assert "data-device-control-tab" in panel
    assert "_deviceControlTabs()" in panel
    assert "_renderDeviceControlTabBar" in panel
    assert "_renderDeviceControlTabContent" in panel
    assert "  _bindDeviceControlInputs(root) {" in panel
    for tab in ["장치 현황", "수동 제어", "자동 제어 상태", "환기 장치 설정", "스크린 장치 설정", "장치 그룹 관리", "인터록 설정", "Fail Safe 설정", "알람 및 장애", "제어 이력"]:
        assert tab in panel
    for state_key in ["devices", "deviceGroups", "deviceStatus", "deviceControlLogs", "deviceInterlocks", "deviceFailsafeRules", "deviceAlarms", "ventilationDeviceSettings", "screenDeviceSettings"]:
        assert state_key in panel


def test_device_control_docs_cover_api_db_vue_and_flow_contracts():
    doc = (ROOT / "docs" / "design" / "device-control-page.md").read_text(encoding="utf-8")
    for heading in ["메뉴별 화면 구성", "API 설계", "DB 설계", "Vue 컴포넌트 구조", "AI Agent → DB → Home Assistant → 장치 제어 흐름", "RBAC 및 실행 확인 팝업"]:
        assert heading in doc
    for table in ["devices", "device_groups", "device_group_items", "device_status", "device_control_logs", "device_interlocks", "device_failsafe_rules", "device_alarms", "ventilation_device_settings", "screen_device_settings"]:
        assert table in doc
    for api in ["GET /api/devices", "POST /api/devices/manual-control", "GET /api/devices/status", "GET /api/devices/interlocks", "POST /api/devices/failsafe-rules", "GET /api/devices/control-logs"]:
        assert api in doc
    for comp in ["DeviceControlPage.vue", "DeviceStatusTab.vue", "ManualControlTab.vue", "VentilationDeviceSettingsTab.vue", "ScreenDeviceSettingsTab.vue", "InterlockRulesTab.vue", "FailSafeRulesTab.vue"]:
        assert comp in doc


def test_control_pages_render_crop_season_zone_scope_bar_for_phase1():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    env_page = panel.split("  _renderEnvSettingsPage()", 1)[1].split("  _cloneIrrigationDefaults", 1)[0]
    irrigation_page = panel.split("  _renderIrrigSettingsPage()", 1)[1].split("  _cloneDeviceDefaults", 1)[0]
    device_page = panel.split("  _renderDeviceControlPage()", 1)[1].split("  _renderVentSettingsPage()", 1)[0]

    assert "this._controlScope" in panel
    assert "  _currentControlSeasonId() {" in panel
    assert "  _controlZoneOptions(domain) {" in panel
    assert "  _renderControlScopeBar(domain) {" in panel
    assert "  _bindControlScopeInputs(root) {" in panel
    assert "this._bindControlScopeInputs(root);" in panel
    for page, domain in [(env_page, "environment"), (irrigation_page, "irrigation"), (device_page, "device")]:
        assert f'this._renderControlScopeBar("{domain}")' in page
    for marker in ["data-control-scope-bar", "data-control-scope-season", "data-control-scope-zone", "data-control-scope-domain"]:
        assert marker in panel
    for label in ["현재 작기", "현재 구역", "적용 범위", "현재 구역만", "전체 구역에 복사"]:
        assert label in panel


def test_control_pages_use_crop_season_zone_scoped_storage_for_phase2():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    env_page = panel.split("  _renderEnvSettingsPage()", 1)[1].split("  _cloneIrrigationDefaults", 1)[0]
    irrigation_page = panel.split("  _renderIrrigSettingsPage()", 1)[1].split("  _cloneDeviceDefaults", 1)[0]
    device_page = panel.split("  _renderDeviceControlPage()", 1)[1].split("  _renderVentSettingsPage()", 1)[0]

    for required in [
        "green_smart_zone_control_settings",
        "green_smart_zone_control_migrated_v1",
        "  _cloneControlState(domain, state) {",
        "  _defaultControlStateForDomain(domain) {",
        "  _loadZoneControlSettings() {",
        "  _saveZoneControlSettings() {",
        "  _ensureScopedControlState(domain) {",
        "  _getScopedControlState(domain) {",
        "  _setScopedControlState(domain, state) {",
        "  _migrateLegacyControlStateToScoped() {",
    ]:
        assert required in panel

    for legacy_key in ["green_smart_control_strategy", "green_smart_irrigation_control", "green_smart_device_control"]:
        assert legacy_key in panel
    for domain in ["environment", "irrigation", "device"]:
        assert domain in panel
    assert "this._zoneControlSettings = this._loadZoneControlSettings();" in panel
    assert "this._migrateLegacyControlStateToScoped();" in panel
    assert 'this._getScopedControlState("environment")' in env_page
    assert 'this._getScopedControlState("irrigation")' in irrigation_page
    assert 'this._getScopedControlState("device")' in device_page
    assert 'this._setScopedControlState("environment", this._controlStrategy)' in panel
    assert 'this._setScopedControlState("irrigation", this._irrigationControl)' in panel
    assert 'this._setScopedControlState("device", this._deviceControl)' in panel


def test_control_scope_save_ux_shows_current_crop_zone_and_domain_for_phase3():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    scope_bar = panel.split("  _renderControlScopeBar(domain) {", 1)[1].split("  _cloneControlState", 1)[0]

    for required in [
        "  _controlDomainLabel(domain) {",
        "  _currentControlScopeLabel(domain) {",
        "  _setControlSaveNotice(domain) {",
        "this._controlSaveNotice",
        "data-control-scope-summary",
        "data-control-scope-storage-key",
        "data-control-save-notice",
        "저장 대상",
        "작기 + 구역 + 제어영역",
        "green_smart_zone_control_settings",
        "마지막 저장",
    ]:
        assert required in panel
    for domain_label in ["환경 제어", "관수 제어", "장치제어"]:
        assert domain_label in panel
    assert "this._setControlSaveNotice(\"environment\");" in panel
    assert "this._setControlSaveNotice(\"irrigation\");" in panel
    assert "this._setControlSaveNotice(\"device\");" in panel
    assert "this._currentControlScopeLabel(domain)" in scope_bar
    assert "this._controlDomainLabel(domain)" in scope_bar


def test_control_scope_can_copy_current_zone_settings_for_phase4():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    scope_bar = panel.split("  _renderControlScopeBar(domain) {", 1)[1].split("  _cloneControlState", 1)[0]
    binder = panel.split("  _bindControlScopeInputs(root) {", 1)[1].split("  // ── Dashboard event binding", 1)[0]

    for required in [
        "  _copyScopedControlSettings(domain, fromZoneId, toZoneId) {",
        "  _copyScopedControlSettingsToAllZones(domain, fromZoneId) {",
        "data-control-copy-target-zone",
        "data-control-copy-zone",
        "data-control-copy-all-zones",
        "복사 대상 구역",
        "현재 설정 복사",
        "전체 구역에 적용",
        "복사 완료",
    ]:
        assert required in panel
    assert "data-control-copy-target-zone" in scope_bar
    assert "data-control-copy-zone" in scope_bar
    assert "data-control-copy-all-zones" in scope_bar
    assert "this._copyScopedControlSettings(domain" in binder
    assert "this._copyScopedControlSettingsToAllZones(domain" in binder
    assert "confirm(" in binder
    assert "this._setControlSaveNotice(domain)" in panel


def test_zone_scoped_control_settings_docs_cover_db_api_ai_phase5():
    doc_path = ROOT / "docs" / "design" / "zone-scoped-control-settings.md"
    assert doc_path.exists()
    doc = doc_path.read_text(encoding="utf-8")
    for heading in [
        "목표",
        "현재 UI 저장 구조",
        "DB 설계",
        "API 설계",
        "환경 제어 API wrapper",
        "관수 제어 API wrapper",
        "장치제어 API wrapper",
        "마이그레이션 정책",
        "구역 복사 정책",
        "AI Agent output 연동",
        "Home Assistant 제어 흐름",
        "권한 및 감사 로그",
        "단계별 backend 적용 순서",
    ]:
        assert heading in doc
    for table in ["zone_control_settings", "zone_final_control_targets", "zone_control_logs", "zone_control_copy_jobs", "ai_zone_control_outputs"]:
        assert table in doc
    for column in ["farm_id", "crop_season_id", "zone_id", "domain", "settings_json", "targets_json", "source_ai_output_id"]:
        assert column in doc
    for api in [
        "GET /api/zones/control-settings",
        "POST /api/zones/control-settings",
        "POST /api/zones/copy-control-settings",
        "GET /api/zones/final-targets",
        "GET /api/zones/control-logs",
        "GET /api/environment/control-settings",
        "GET /api/irrigation/control-settings",
        "GET /api/devices/control-settings",
    ]:
        assert api in doc
    for flow in [
        "AI Agent → 전략 생성 → DB 저장 → Home Assistant → 장치 제어 → 장치 상태 수집 → DB 저장",
        "green_smart_zone_control_settings",
        "environment",
        "irrigation",
        "device",
    ]:
        assert flow in doc

def test_home_operator_first_card_numeric_status_popup_and_role_actions_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    home = panel.split("  _renderHomePage(sim)", 1)[1].split("  _renderKPIStrip", 1)[0]
    binder = panel.split("  _bindDashboard(root)", 1)[1].split("  _onSave", 1)[0]

    assert "_renderHomeActionSummaryCard" in home
    assert home.index("_renderHomeActionSummaryCard") < home.index("_renderKPIStrip")
    for marker in (
        "data-home-action-summary",
        "data-home-risk-alerts",
        "data-home-today-tasks",
        "data-home-required-actions",
        "data-home-greenhouse-summary",
    ):
        assert marker in panel
    for order_text in ("위험 알림", "오늘 할 일", "조치 필요", "현재 온실 상태"):
        assert order_text in panel
    for marker in (
        "_homeStatusItems(kpi)",
        "data-home-status-card",
        "data-status-level",
        "data-status-key",
        "_openHomeStatusPopup",
        "_renderHomeStatusPopup",
        "data-home-status-popup",
        "data-role-action",
        "farm_staff",
        "farm_owner",
        "장치 정지",
        "제한 실행",
    ):
        assert marker in panel
    assert "[data-home-status-card]" in binder


def test_home_action_buttons_call_event_lifecycle_and_dry_run_contract():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    popup = panel.split("  _openHomeStatusPopup(key)", 1)[1].split("  _renderAdminSystemPage", 1)[0]

    for marker in (
        "async _homeAcknowledgeStatusAction(item)",
        "async _homeCompleteStatusAction(item)",
        "async _homePreviewStopDeviceDryRun(item)",
        "async _homePreviewLimitedExecutionDryRun(item)",
        "_homeActionDomainForStatus(item)",
        "_homeActionPayloadForStatus(item)",
        "green_smart/zones/safety-guard-events/ack",
        "green_smart/zones/safety-guard-events/clear",
        "green_smart/zones/execute-final-targets",
        "dry_run: true",
        "operatorNote",
        "home_status_acknowledge",
        "home_status_complete",
        "home_stop_device_dry_run",
        "home_limited_execute_dry_run",
        "data-home-action-result",
    ):
        assert marker in panel

    for button_contract in (
        "_homeAcknowledgeStatusAction(item)",
        "_homeCompleteStatusAction(item)",
        "_homePreviewStopDeviceDryRun(item)",
        "_homePreviewLimitedExecutionDryRun(item)",
    ):
        assert button_contract in popup

    assert "장치 정지 Dry Run" in panel
    assert "제한 실행 Dry Run" in panel
    assert "실제 장비 실행 안 함" in panel
