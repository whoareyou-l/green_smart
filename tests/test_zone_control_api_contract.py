from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"
VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


def test_db_bootstrap_creates_zone_control_backend_tables():
    source = DB.read_text(encoding="utf-8")
    for table in (
        "zone_control_settings",
        "zone_final_control_targets",
        "zone_control_logs",
        "zone_control_copy_jobs",
        "ai_zone_control_outputs",
    ):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in source
    for key in (
        "uniq_zone_control_settings",
        "farm_id INT NOT NULL DEFAULT 1",
        "crop_season_id INT NOT NULL",
        "zone_id INT NOT NULL",
        "domain VARCHAR(32) NOT NULL",
        "settings_json JSON NOT NULL",
        "targets_json JSON NOT NULL",
        "source_ai_output_id BIGINT NULL",
    ):
        assert key in source


def test_zone_control_views_define_common_api_routes_and_register_in_init():
    assert VIEWS.exists()
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    for cls in (
        "ZoneControlSettingsView",
        "ZoneControlCopySettingsView",
        "ZoneControlFinalTargetsView",
        "ZoneControlLogsView",
        "EnvironmentControlSettingsView",
        "IrrigationControlSettingsView",
        "DeviceControlSettingsView",
    ):
        assert cls in source
        assert cls in init_source
    for route in (
        'url = "/api/green_smart/zones/control-settings"',
        'url = "/api/green_smart/zones/copy-control-settings"',
        'url = "/api/green_smart/zones/final-targets"',
        'url = "/api/green_smart/zones/control-logs"',
        'url = "/api/green_smart/environment/control-settings"',
        'url = "/api/green_smart/irrigation/control-settings"',
        'url = "/api/green_smart/devices/control-settings"',
    ):
        assert route in source
    for behavior in (
        "_validate_domain",
        "_settings_response",
        "json.dumps(settings, ensure_ascii=False)",
        "INSERT INTO zone_control_settings",
        "ON DUPLICATE KEY UPDATE",
        "INSERT INTO zone_control_logs",
        "INSERT INTO zone_control_copy_jobs",
        "zone_final_control_targets",
    ):
        assert behavior in source
    assert "hass.http.register_view(ZoneControlSettingsView())" in init_source
    assert "await ensure_schema(hass)" in init_source


def test_panel_has_zone_control_api_helpers_with_localstorage_fallback():
    source = PANEL.read_text(encoding="utf-8")
    for required in (
        "async _fetchScopedControlStateFromApi(domain)",
        "async _saveScopedControlStateToApi(domain, state)",
        "async _copyScopedControlSettingsViaApi(domain, fromZoneId, toZoneIds)",
        "_zoneControlApiPath(domain)",
        "green_smart/zones/control-settings",
        "green_smart/zones/copy-control-settings",
        "API 저장 실패 시 localStorage fallback",
        "this._apiScopedControlCache",
    ):
        assert required in source


def test_zone_control_views_persist_ai_outputs_and_final_targets_phase7():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")

    for cls in (
        "ZoneAiControlOutputsView",
        "ZoneAiControlOutputApplyView",
        "EnvironmentAiControlOutputsView",
        "IrrigationAiControlOutputsView",
        "DeviceAiControlOutputsView",
    ):
        assert cls in source
        assert cls in init_source

    for route in (
        'url = "/api/green_smart/zones/ai-control-outputs"',
        'url = "/api/green_smart/zones/ai-control-outputs/{output_id}/apply"',
        'url = "/api/green_smart/environment/ai-control-outputs"',
        'url = "/api/green_smart/irrigation/ai-control-outputs"',
        'url = "/api/green_smart/devices/ai-control-outputs"',
    ):
        assert route in source

    for behavior in (
        "INSERT INTO ai_zone_control_outputs",
        "strategy_json",
        "safety_status",
        "applied TINYINT",
        "INSERT INTO zone_final_control_targets",
        "source_ai_output_id",
        "source_settings_id",
        "ai_output_saved",
        "ai_output_applied_to_final_targets",
        "UPDATE ai_zone_control_outputs SET applied = 1",
    ):
        assert behavior in source

    assert "hass.http.register_view(ZoneAiControlOutputsView())" in init_source
    assert "hass.http.register_view(ZoneAiControlOutputApplyView())" in init_source


def test_panel_shows_ai_outputs_and_final_targets_with_apply_action_phase8():
    source = PANEL.read_text(encoding="utf-8")

    for required in (
        "this._zoneAiOutputCache",
        "this._zoneFinalTargetCache",
        "async _fetchZoneAiOutputs(domain)",
        "async _fetchZoneFinalTargets(domain)",
        "async _applyZoneAiOutput(domain, outputId)",
        "_renderZoneAiFinalTargetCard(domain)",
        "_bindZoneAiFinalTargetInputs(root)",
        "green_smart/zones/ai-control-outputs",
        "green_smart/zones/final-targets",
        "data-zone-ai-final-card",
        "data-zone-ai-refresh",
        "data-zone-ai-apply",
        "AI 전략 출력",
        "최종 적용값",
        "AI 전략 적용",
        "적용 완료",
        "AI output 조회 실패 시 fallback",
    ):
        assert required in source

    for domain_call in (
        '_renderZoneAiFinalTargetCard("environment")',
        '_renderZoneAiFinalTargetCard("irrigation")',
        '_renderZoneAiFinalTargetCard("device")',
        "this._bindZoneAiFinalTargetInputs(root)",
    ):
        assert domain_call in source


def test_zone_control_device_entity_mappings_phase9():
    db_source = DB.read_text(encoding="utf-8")
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for db_marker in (
        "CREATE TABLE IF NOT EXISTS zone_device_entity_mappings",
        "uniq_zone_device_entity_mappings",
        "device_type VARCHAR(64) NOT NULL",
        "entity_id VARCHAR(255) NOT NULL",
        "control_role VARCHAR(64) NOT NULL",
        "safe_state VARCHAR(64) NULL",
        "enabled TINYINT(1) NOT NULL DEFAULT 1",
    ):
        assert db_marker in db_source

    for cls in (
        "ZoneDeviceEntityMappingsView",
        "EnvironmentDeviceEntityMappingsView",
        "IrrigationDeviceEntityMappingsView",
        "DeviceEntityMappingsView",
    ):
        assert cls in source
        assert cls in init_source

    for route in (
        'url = "/api/green_smart/zones/device-entity-mappings"',
        'url = "/api/green_smart/environment/device-entity-mappings"',
        'url = "/api/green_smart/irrigation/device-entity-mappings"',
        'url = "/api/green_smart/devices/device-entity-mappings"',
    ):
        assert route in source

    for behavior in (
        "INSERT INTO zone_device_entity_mappings",
        "ON DUPLICATE KEY UPDATE",
        "device_entity_mapping_saved",
        "device_entity_mapping_deleted",
        "control_role",
        "safe_state",
        "enabled",
    ):
        assert behavior in source

    for panel_marker in (
        "this._zoneEntityMappingCache",
        "async _fetchZoneEntityMappings(domain)",
        "async _saveZoneEntityMapping(domain, mapping)",
        "async _deleteZoneEntityMapping(domain, mappingId)",
        "_renderZoneEntityMappingCard(domain)",
        "_bindZoneEntityMappingInputs(root)",
        "green_smart/zones/device-entity-mappings",
        "data-zone-entity-mapping-card",
        "data-zone-entity-refresh",
        "data-zone-entity-add",
        "data-zone-entity-delete",
        "장치/센서 Entity 매핑",
        "entity_id",
        "control_role",
        "safe_state",
        "Entity 매핑 조회 실패 시 fallback",
    ):
        assert panel_marker in panel_source

    for domain_call in (
        '_renderZoneEntityMappingCard("environment")',
        '_renderZoneEntityMappingCard("irrigation")',
        '_renderZoneEntityMappingCard("device")',
        "this._bindZoneEntityMappingInputs(root)",
    ):
        assert domain_call in panel_source


def test_zone_control_executes_final_targets_via_ha_services_phase10():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for cls in (
        "ZoneFinalTargetExecutionView",
        "EnvironmentFinalTargetExecutionView",
        "IrrigationFinalTargetExecutionView",
        "DeviceFinalTargetExecutionView",
    ):
        assert cls in source
        assert cls in init_source

    for route in (
        'url = "/api/green_smart/zones/execute-final-targets"',
        'url = "/api/green_smart/environment/execute-final-targets"',
        'url = "/api/green_smart/irrigation/execute-final-targets"',
        'url = "/api/green_smart/devices/execute-final-targets"',
    ):
        assert route in source

    for behavior in (
        "_latest_final_target_response",
        "_enabled_entity_mappings",
        "_target_value_for_mapping",
        "_service_call_for_mapping",
        "hass.services.async_call",
        "dry_run",
        "final_targets_executed",
        "final_target_execution_failed",
        "zone_device_entity_mappings",
        "zone_final_control_targets",
    ):
        assert behavior in source

    for panel_marker in (
        "async _executeZoneFinalTargets(domain)",
        "data-zone-final-execute",
        "최종값 실행",
        "실행 완료",
        "green_smart/zones/execute-final-targets",
        "final targets 실행 실패 시 fallback",
    ):
        assert panel_marker in panel_source


def test_zone_control_execution_captures_pre_post_entity_state_phase11():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for helper in (
        "_entity_state_snapshot",
        "_states_match_expected_target",
        "_execution_state_report",
        "preState",
        "postState",
        "stateMatched",
        "stateVerification",
        "post_state_delay",
        "async_update_entity",
    ):
        assert helper in source

    for behavior in (
        "state_verification_passed",
        "state_verification_failed",
        "before_json",
        "after_json",
        "expectedTarget",
        "actualState",
        "response.get(\"stateMatched\")",
    ):
        assert behavior in source

    for panel_marker in (
        "executedCount",
        "stateMatched",
        "stateVerification",
        "상태 확인",
        "실행 후 상태",
    ):
        assert panel_marker in panel_source


def test_zone_control_execution_blocks_with_interlock_and_failsafe_phase12():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for helper in (
        "_interlock_failsafe_decision",
        "_safe_state_service_call_for_mapping",
        "blockedByInterlock",
        "failSafeApplied",
        "interlockReasons",
        "safetyStatus",
        "emergency_stop",
        "safe_state",
    ):
        assert helper in source

    for audit_action in (
        "interlock_blocked",
        "failsafe_applied",
        "execution_safety_blocked",
        "fail_safe_service_call_failed",
    ):
        assert audit_action in source

    for behavior in (
        "block_on_unavailable",
        "apply_safe_state_on_block",
        "safeStateCall",
        "safeStateResult",
        "blockedCalls",
        "safeStateCalls",
        "before_json",
        "after_json",
    ):
        assert behavior in source

    for panel_marker in (
        "blockedByInterlock",
        "failSafeApplied",
        "safetyStatus",
        "안전 차단",
        "Fail Safe",
    ):
        assert panel_marker in panel_source


def test_zone_control_execution_log_card_surfaces_safety_details_phase13():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "_summarize_control_log_row",
        "executionSummary",
        "blockedCallCount",
        "safeStateCallCount",
        "stateReportCount",
        "latestActualState",
        "latestExpectedTarget",
        "control-logs",
    ):
        assert api_marker in source

    for panel_marker in (
        "_zoneExecutionLogCache",
        "_fetchZoneExecutionLogs(domain)",
        "_renderZoneExecutionLogCard(domain)",
        "data-zone-execution-log-card",
        "실행/안전 로그",
        "차단 사유",
        "Fail Safe 적용",
        "실행 전 상태",
        "실행 후 상태",
        "green_smart/zones/control-logs",
        "실행 로그 조회 실패 시 fallback",
    ):
        assert panel_marker in panel_source

    for page_marker in (
        '_renderZoneExecutionLogCard("environment")',
        '_renderZoneExecutionLogCard("irrigation")',
        '_renderZoneExecutionLogCard("device")',
    ):
        assert page_marker in panel_source


def test_phase1_interlock_settings_api_and_panel_contract():
    db_source = DB.read_text(encoding="utf-8")
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for db_marker in (
        "CREATE TABLE IF NOT EXISTS zone_interlock_settings",
        "uniq_zone_interlock_settings",
        "settings_json JSON NOT NULL",
        "enabled TINYINT(1) NOT NULL DEFAULT 1",
    ):
        assert db_marker in db_source

    for api_marker in (
        "ZoneInterlockSettingsView",
        'url = "/api/green_smart/zones/interlock-settings"',
        "_interlock_settings_response",
        "_upsert_interlock_settings",
        "interlock_settings_saved",
        "settings_json AS settingsJson",
    ):
        assert api_marker in source
        if api_marker == "ZoneInterlockSettingsView":
            assert api_marker in init_source

    assert "hass.http.register_view(ZoneInterlockSettingsView())" in init_source

    for panel_marker in (
        "this._zoneInterlockSettingsCache",
        "async _fetchZoneInterlockSettings(domain)",
        "async _saveZoneInterlockSettings(domain)",
        "_renderZoneInterlockSettingsCard(domain)",
        "_bindZoneInterlockSettingsInputs(root)",
        "green_smart/zones/interlock-settings",
        "data-zone-interlock-settings-card",
        "data-zone-interlock-refresh",
        "data-zone-interlock-save",
        "인터록 설정",
        "안전 기준",
        "인터록 저장",
        "저장 완료",
        "인터록 설정 조회 실패 시 fallback",
    ):
        assert panel_marker in panel_source

    for page_marker in (
        '_renderZoneInterlockSettingsCard("environment")',
        '_renderZoneInterlockSettingsCard("irrigation")',
        '_renderZoneInterlockSettingsCard("device")',
    ):
        assert page_marker in panel_source


def test_phase1_entity_state_summary_api_and_panel_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "ZoneEntityStateSummaryView",
        'url = "/api/green_smart/zones/entity-state-summary"',
        "_entity_state_summary_response",
        "_entity_state_summary_item",
        "availableCount",
        "unavailableCount",
        "unknownCount",
        "staleCount",
        "hasBlockingState",
        "zone_device_entity_mappings",
        "hass.states.get",
    ):
        assert api_marker in source
        if api_marker == "ZoneEntityStateSummaryView":
            assert api_marker in init_source

    assert "hass.http.register_view(ZoneEntityStateSummaryView())" in init_source

    for panel_marker in (
        "this._zoneEntityStateSummaryCache",
        "async _fetchZoneEntityStateSummary(domain)",
        "_renderZoneEntityStateSummaryCard(domain)",
        "_bindZoneEntityStateSummaryInputs(root)",
        "green_smart/zones/entity-state-summary",
        "data-zone-entity-state-summary-card",
        "data-zone-entity-state-refresh",
        "Entity 상태 요약",
        "현재 상태",
        "사용 가능",
        "unavailable",
        "unknown",
        "상태 새로고침",
        "Entity 상태 요약 조회 실패 시 fallback",
    ):
        assert panel_marker in panel_source

    for page_marker in (
        '_renderZoneEntityStateSummaryCard("environment")',
        '_renderZoneEntityStateSummaryCard("irrigation")',
        '_renderZoneEntityStateSummaryCard("device")',
    ):
        assert page_marker in panel_source


def test_phase1_panel_uses_five_second_element_refresh_without_full_rerender_contract():
    panel_source = PANEL.read_text(encoding="utf-8")

    for marker in (
        "const PANEL_ELEMENT_REFRESH_MS = 5000",
        "this._zoneElementRefreshInterval",
        "_startZoneElementRefresh()",
        "_stopZoneElementRefresh()",
        "_refreshZoneControlElements({ patchOnly: true })",
        "_isZoneControlPage()",
        "_hasDirtyZoneControlEditor()",
        "_patchZoneControlElementCards(domain)",
        "_replaceZoneControlCard(",
        "전체 화면 재렌더 금지",
        "요소별 갱신",
        "dirty state 보존",
    ):
        assert marker in panel_source

    assert "setInterval(() => this._refreshZoneControlElements({ patchOnly: true }), PANEL_ELEMENT_REFRESH_MS)" in panel_source
    assert "clearInterval(this._zoneElementRefreshInterval)" in panel_source

    refresh_section = panel_source.split("async _refreshZoneControlElements", 1)[1].split("_patchZoneControlElementCards", 1)[0]
    assert "this._update()" not in refresh_section
    assert "this._fetchZoneEntityStateSummary(domain, { patchOnly })" in refresh_section
    assert "this._fetchZoneExecutionLogs(domain, { patchOnly })" in refresh_section
    assert "this._fetchZoneInterlockSettings(domain, { patchOnly })" in refresh_section

def test_phase1_manual_auto_override_mode_contract():
    db_source = DB.read_text(encoding="utf-8")
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for db_marker in (
        "CREATE TABLE IF NOT EXISTS zone_control_modes",
        "uniq_zone_control_modes",
        "mode VARCHAR(32) NOT NULL DEFAULT 'manual'",
        "override_reason TEXT NULL",
        "override_expires_at DATETIME NULL",
        "allow_auto_execution TINYINT(1) NOT NULL DEFAULT 0",
    ):
        assert db_marker in db_source

    for api_marker in (
        "VALID_CONTROL_MODES",
        "ZoneControlModeView",
        'url = "/api/green_smart/zones/control-mode"',
        "_control_mode_response",
        "_upsert_control_mode",
        "_control_mode_decision",
        "control_mode_saved",
        "zone_control_modes",
        "allowAutoExecution",
        "overrideExpiresAt",
    ):
        assert api_marker in source
        if api_marker == "ZoneControlModeView":
            assert api_marker in init_source

    assert "hass.http.register_view(ZoneControlModeView())" in init_source

    for execution_marker in (
        "modeDecision = await _control_mode_decision",
        "blocked_by_control_mode",
        "modeDecision.get(\"allowExecution\")",
        "manual override required before execution",
    ):
        assert execution_marker in source

    for panel_marker in (
        "this._zoneControlModeCache",
        "async _fetchZoneControlMode(domain)",
        "async _saveZoneControlMode(domain)",
        "_renderZoneControlModeCard(domain)",
        "_bindZoneControlModeInputs(root)",
        "green_smart/zones/control-mode",
        "data-zone-control-mode-card",
        "data-zone-control-mode-refresh",
        "data-zone-control-mode-save",
        "제어 모드",
        "수동",
        "자동",
        "반자동",
        "비활성",
        "Override 사유",
        "Override 만료",
        "제어 모드 조회 실패 시 fallback",
    ):
        assert panel_marker in panel_source

    refresh_section = panel_source.split("async _refreshZoneControlElements", 1)[1].split("_patchZoneControlElementCards", 1)[0]
    assert "this._fetchZoneControlMode(domain, { patchOnly })" in refresh_section

def test_phase1_interlock_rule_builder_ui_contract():
    panel_source = PANEL.read_text(encoding="utf-8")

    for marker in (
        "_defaultZoneInterlockSettings()",
        "_normalizeZoneInterlockSettings(settings)",
        "_readZoneInterlockSettingsFromCard(domain)",
        "_addZoneInterlockRule(domain)",
        "_deleteZoneInterlockRule(domain, index)",
        "_renderZoneInterlockRuleBuilder(domain, settings)",
        "data-zone-interlock-rule-builder",
        "data-zone-interlock-rule-row",
        "data-zone-interlock-rule-role",
        "data-zone-interlock-rule-condition",
        "data-zone-interlock-rule-threshold",
        "data-zone-interlock-rule-action",
        "data-zone-interlock-rule-message",
        "data-zone-interlock-rule-add",
        "data-zone-interlock-rule-delete",
        "세부 인터록 규칙",
        "규칙 추가",
        "규칙 삭제",
        "제어 역할",
        "조건",
        "임계값",
        "차단 동작",
        "운영자 메시지",
        "structured rule UI",
    ):
        assert marker in panel_source

    save_section = panel_source.split("async _saveZoneInterlockSettings(domain)", 1)[1].split("async _fetchZoneControlMode", 1)[0]
    assert "_readZoneInterlockSettingsFromCard(domain)" in save_section
    assert "JSON.parse(text || \"{}\")" not in save_section

    bind_section = panel_source.split("_bindZoneInterlockSettingsInputs(root)", 1)[1].split("_bindZoneControlModeInputs(root)", 1)[0]
    assert "data-zone-interlock-rule-add" in bind_section
    assert "data-zone-interlock-rule-delete" in bind_section

def test_phase2a_safety_guard_decision_layer_contract():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for helper in (
        "_safety_guard_policy(final_target, interlock_settings)",
        "_safety_guard_rule_matches(rule, mapping, pre_state, call)",
        "_safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state)",
        "_safety_guard_result_schema(",
        "safetyGuard",
        "ruleResults",
        "failSafeRequired",
        "zone_interlock_settings",
        "settings_json AS settingsJson",
        "safety_guard_blocked",
    ):
        assert helper in source

    execution_section = source.split("class ZoneFinalTargetExecutionView", 1)[1].split("class ZoneAiControlOutputsView", 1)[0]
    assert "interlock_settings = await _interlock_settings_response" in execution_section
    assert "_safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state)" in execution_section
    assert "safety_decision[\"safetyGuard\"]" in execution_section
    assert "response = {" in execution_section and "safetyGuard" in execution_section

    for legacy_marker in (
        "blockedByInterlock",
        "failSafeApplied",
        "interlockReasons",
        "safeStateCall",
        "safeStateResult",
    ):
        assert legacy_marker in source

    for panel_marker in (
        "safetyGuard",
        "ruleResults",
        "SafetyGuard",
        "안전 판단",
    ):
        assert panel_marker in panel_source

def test_phase2b_safety_guard_semantic_rule_presets_contract():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for marker in (
        "SAFETY_GUARD_RULE_PRESETS",
        "_safety_guard_numeric_value(pre_state, rule)",
        "_safety_guard_reason_code(rule, default_code)",
        "wind_speed_above",
        "temperature_below",
        "temperature_above",
        "vwc_below",
        "vwc_above",
        "ec_below",
        "ec_above",
        "sensor_integrity",
        "weather.wind_speed",
        "sensor.temperature",
        "sensor.vwc",
        "sensor.ec",
        "safety_guard_rule_matched",
        "reasonCode",
        "actualValue",
        "threshold",
    ):
        assert marker in source

    matcher_section = source.split("def _safety_guard_rule_matches", 1)[1].split("def _safety_guard_result_schema", 1)[0]
    for behavior in (
        "condition in {\"above\", \"wind_speed_above\", \"temperature_above\", \"vwc_above\", \"ec_above\"}",
        "condition in {\"below\", \"temperature_below\", \"vwc_below\", \"ec_below\"}",
        "condition == \"sensor_integrity\"",
        "actual_value = _safety_guard_numeric_value(pre_state, rule)",
        "reasonCode",
        "actualValue",
    ):
        assert behavior in matcher_section

    for panel_marker in (
        "강풍 초과",
        "저온 미만",
        "고온 초과",
        "VWC 미만",
        "VWC 초과",
        "EC 미만",
        "EC 초과",
        "센서 무결성",
        "wind_speed_above",
        "temperature_below",
        "temperature_above",
        "vwc_below",
        "vwc_above",
        "ec_below",
        "ec_above",
        "sensor_integrity",
        "reasonCode",
    ):
        assert panel_marker in panel_source

def test_phase2c_safety_guard_watchdog_and_notification_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS = 60",
        "_safety_guard_watchdog_response",
        "_safety_guard_watchdog_item",
        "_notify_safety_guard_critical",
        "persistent_notification.create",
        "safety_guard_watchdog_checked",
        "safety_guard_critical_event",
        "ZoneSafetyGuardWatchdogView",
        'url = "/api/green_smart/zones/safety-guard-watchdog"',
        "criticalEvents",
        "watchdogStatus",
        "checkedAt",
        "lastCheckedAt",
        "staleThresholdSeconds",
    ):
        assert api_marker in source
        if api_marker == "ZoneSafetyGuardWatchdogView":
            assert api_marker in init_source

    assert "hass.http.register_view(ZoneSafetyGuardWatchdogView())" in init_source

    watchdog_section = source.split("async def _safety_guard_watchdog_response", 1)[1].split("class ZoneSafetyGuardWatchdogView", 1)[0]
    for behavior in (
        "_enabled_entity_mappings",
        "_interlock_settings_response",
        "_entity_state_snapshot",
        "_safety_guard_decision(final_target, interlock_settings, mapping, call, pre_state)",
        "dryRun",
        "watchdog",
        "criticalEvents",
        "_notify_safety_guard_critical",
    ):
        assert behavior in watchdog_section

    for panel_marker in (
        "this._zoneSafetyGuardWatchdogCache",
        "async _fetchZoneSafetyGuardWatchdog(domain",
        "_renderZoneSafetyGuardWatchdogCard(domain)",
        "_bindZoneSafetyGuardWatchdogInputs(root)",
        "green_smart/zones/safety-guard-watchdog",
        "data-zone-safety-watchdog-card",
        "data-zone-safety-watchdog-refresh",
        "SafetyGuard Watchdog",
        "1분 fallback 검사",
        "criticalEvents",
        "critical safety event",
        "SafetyGuard Watchdog 조회 실패 시 fallback",
    ):
        assert panel_marker in panel_source

    refresh_section = panel_source.split("async _refreshZoneControlElements", 1)[1].split("_patchZoneControlElementCards", 1)[0]
    assert "this._fetchZoneSafetyGuardWatchdog(domain, { patchOnly })" in refresh_section

def test_phase2d_safety_guard_scheduler_and_stale_policy_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")

    for marker in (
        "async_track_time_interval",
        "_setup_safety_guard_watchdog_scheduler",
        "_teardown_safety_guard_watchdog_scheduler",
        "_run_safety_guard_watchdog_tick",
        "_safety_guard_state_age_seconds",
        "_safety_guard_is_stale(pre_state, stale_threshold_seconds)",
        "SAFETY_GUARD_LAST_NOTIFIED_KEY",
        "safety_guard_watchdog_scheduler_started",
        "safety_guard_watchdog_scheduler_stopped",
        "safety_guard_notification_deduped",
        "unsub_safety_guard_watchdog",
        "timedelta(seconds=SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS)",
    ):
        assert marker in init_source or marker in source

    assert "await _setup_safety_guard_watchdog_scheduler(hass)" in init_source
    assert "_teardown_safety_guard_watchdog_scheduler(hass)" in init_source
    assert "async_track_time_interval(hass, _tick, timedelta(seconds=SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS))" in init_source

    scheduler_section = init_source.split("async def _setup_safety_guard_watchdog_scheduler", 1)[1].split("async def async_setup", 1)[0]
    for behavior in (
        "domain_data.get(\"unsub_safety_guard_watchdog\")",
        "hass.loop.call_soon_threadsafe(hass.async_create_task, _run_safety_guard_watchdog_tick(hass, now))",
        "SAFETY_GUARD_WATCHDOG_INTERVAL_SECONDS",
        "safety_guard_watchdog_scheduler_started",
    ):
        assert behavior in scheduler_section

    stale_section = source.split("def _safety_guard_is_stale", 1)[1].split("def _safety_guard_watchdog_item", 1)[0]
    for behavior in (
        "_safety_guard_state_age_seconds(pre_state)",
        "age_seconds is not None",
        "age_seconds > stale_threshold_seconds",
    ):
        assert behavior in stale_section

    notify_section = source.split("def _notify_safety_guard_critical", 1)[1].split("def _safety_guard_watchdog_item", 1)[0]
    for behavior in (
        "SAFETY_GUARD_LAST_NOTIFIED_KEY",
        "safety_guard_notification_deduped",
        "last_notified",
        "notification_key",
    ):
        assert behavior in notify_section

def test_phase2e_safety_guard_event_history_ack_clear_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "SAFETY_GUARD_EVENT_ACTIONS",
        "_safety_guard_event_history_response",
        "_safety_guard_event_lifecycle_post",
        "ZoneSafetyGuardEventsView",
        "ZoneSafetyGuardEventAckView",
        "ZoneSafetyGuardEventClearView",
        'url = "/api/green_smart/zones/safety-guard-events"',
        'url = "/api/green_smart/zones/safety-guard-events/ack"',
        'url = "/api/green_smart/zones/safety-guard-events/clear"',
        "safety_guard_event_acknowledged",
        "safety_guard_event_cleared",
        "acknowledged",
        "cleared",
        "eventLifecycle",
        "activeEvents",
    ):
        assert api_marker in source
        if api_marker.startswith("ZoneSafetyGuard"):
            assert api_marker in init_source

    for register_marker in (
        "hass.http.register_view(ZoneSafetyGuardEventsView())",
        "hass.http.register_view(ZoneSafetyGuardEventAckView())",
        "hass.http.register_view(ZoneSafetyGuardEventClearView())",
    ):
        assert register_marker in init_source

    history_section = source.split("async def _safety_guard_event_history_response", 1)[1].split("class ZoneSafetyGuardEventsView", 1)[0]
    for behavior in (
        "zone_control_logs",
        "SAFETY_GUARD_EVENT_ACTIONS",
        "eventLifecycle",
        "activeEvents",
        "acknowledgedEventIds",
        "clearedEventIds",
        "safety_guard_critical_event",
    ):
        assert behavior in history_section

    for panel_marker in (
        "this._zoneSafetyGuardEventCache",
        "async _fetchZoneSafetyGuardEvents(domain",
        "async _ackZoneSafetyGuardEvent(domain, eventId, note)",
        "async _clearZoneSafetyGuardEvent(domain, eventId, note)",
        "_renderZoneSafetyGuardEventHistoryCard(domain)",
        "_bindZoneSafetyGuardEventInputs(root)",
        "green_smart/zones/safety-guard-events",
        "data-zone-safety-event-card",
        "data-zone-safety-event-ack",
        "data-zone-safety-event-clear",
        "SafetyGuard 이벤트 이력",
        "운영자 확인",
        "조치 완료",
        "acknowledged",
        "cleared",
        "SafetyGuard event 조회 실패 시 fallback",
    ):
        assert panel_marker in panel_source

    refresh_section = panel_source.split("async _refreshZoneControlElements", 1)[1].split("_patchZoneControlElementCards", 1)[0]
    assert "this._fetchZoneSafetyGuardEvents(domain, { patchOnly })" in refresh_section


def test_phase2f_safety_guard_notification_clear_and_operator_note_contract():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "_safety_guard_notification_id",
        "_clear_safety_guard_notification",
        "persistent_notification.dismiss",
        "green_smart_safety_guard_{crop_season_id}_{zone_id}_{domain}",
        "SAFETY_GUARD_LAST_NOTIFIED_KEY",
        "pop(notification_key, None)",
        "notificationCleared",
        "safety_guard_notification_cleared",
        "operatorNote",
    ):
        assert api_marker in source

    lifecycle_section = source.split("async def _safety_guard_event_lifecycle_post", 1)[1].split("class ZoneSafetyGuardEventsView", 1)[0]
    for behavior in (
        "note = str(body.get(\"note\") or body.get(\"message\") or body.get(\"operatorNote\") or \"\").strip()",
        "if lifecycle_action == \"clear\":",
        "await _clear_safety_guard_notification",
        "notificationCleared",
        "operatorNote",
    ):
        assert behavior in lifecycle_section

    for panel_marker in (
        "data-zone-safety-event-note",
        "data-zone-safety-event-note-for",
        "조치 메모",
        "상태: active",
        "상태: acknowledged",
        "상태: cleared",
        "const note = this._zoneSafetyGuardEventNote(domain, eventId);",
        "async _ackZoneSafetyGuardEvent(domain, eventId, note)",
        "async _clearZoneSafetyGuardEvent(domain, eventId, note)",
        "operatorNote: note",
        "state === \"active\"",
        "state === \"acknowledged\"",
    ):
        assert panel_marker in panel_source


def test_phase3a_environment_strategy_mvp_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "ENVIRONMENT_STRATEGY_COMPONENTS",
        "_environment_strategy_g_index",
        "_environment_strategy_adt_dif_vpd",
        "_environment_strategy_final_targets",
        "_environment_strategy_preview_response",
        "ZoneEnvironmentStrategyPreviewView",
        'url = "/api/green_smart/environment/strategy-preview"',
        "environment_strategy_previewed",
        "environment_strategy_final_targets_saved",
        "calculated_by=\"environment_strategy_mvp\"",
        "corpGIndex",
        "adt",
        "dif",
        "vpd",
        "ventTarget",
        "screenTarget",
        "SafetyGuard 우선",
    ):
        assert api_marker in source

    assert "hass.http.register_view(ZoneEnvironmentStrategyPreviewView())" in init_source

    strategy_section = source.split("def _environment_strategy_g_index", 1)[1].split("class ZoneEnvironmentStrategyPreviewView", 1)[0]
    for behavior in (
        "CORP",
        "TEMHUM",
        "VENT",
        "SCRN",
        "radiation",
        "temperature",
        "humidity",
        "ventTarget",
        "screenTarget",
        "targets",
    ):
        assert behavior in strategy_section

    for panel_marker in (
        "this._zoneEnvironmentStrategyPreviewCache",
        "async _fetchEnvironmentStrategyPreview(domain",
        "async _saveEnvironmentStrategyFinalTargets(domain)",
        "_renderEnvironmentStrategyPreviewCard(domain)",
        "_bindEnvironmentStrategyPreviewInputs(root)",
        "green_smart/environment/strategy-preview",
        "data-env-strategy-preview-card",
        "data-env-strategy-preview-refresh",
        "data-env-strategy-save-final",
        "환경 전략 MVP",
        "CORP G-Index",
        "TEMHUM ADT/DIF/VPD",
        "VENT/SCRN 최종 목표",
        "SafetyGuard 우선 적용",
        "전략 최종값 저장",
        "environment_strategy_mvp",
    ):
        assert panel_marker in panel_source

    env_page = panel_source.split("  _renderEnvSettingsPage() {", 1)[1].split("  _cloneIrrigationDefaults()", 1)[0]
    assert '_renderEnvironmentStrategyPreviewCard("environment")' in env_page


def test_phase3b_environment_strategy_input_source_and_diff_contract():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "_environment_strategy_inputs_from_sources",
        "_environment_strategy_diff_against_latest_target",
        "sourceMode",
        "sourceSummary",
        "manualOverrides",
        "latestFinalTarget",
        "targetDiff",
        "diffCount",
        "entityStateSummary",
        "weatherSource",
        "operatorOverride",
        "environment_strategy_input_source_resolved",
    ):
        assert api_marker in source

    preview_section = source.split("async def _environment_strategy_preview_response", 1)[1].split("class ZoneEnvironmentStrategyPreviewView", 1)[0]
    for behavior in (
        "_entity_state_summary_response",
        "_latest_final_target_response",
        "_environment_strategy_inputs_from_sources",
        "_environment_strategy_diff_against_latest_target",
        "manualOverrides",
        "targetDiff",
        "sourceSummary",
    ):
        assert behavior in preview_section

    post_section = source.split("async def post(self, request: web.Request) -> web.Response:", 1)[1].split("return _json(response)", 1)[0]
    for behavior in (
        "source_mode",
        "sourceMode",
        "manual_overrides",
        "manualOverrides",
        "weather_source",
        "weatherSource",
    ):
        assert behavior in post_section

    for panel_marker in (
        "data-env-strategy-source-mode",
        "data-env-strategy-manual-radiation",
        "data-env-strategy-manual-temperature",
        "data-env-strategy-manual-humidity",
        "data-env-strategy-manual-co2",
        "data-env-strategy-manual-override",
        "입력 소스",
        "HA 상태 요약",
        "날씨/센서 자동",
        "운영자 수동 보정",
        "Preview Diff",
        "targetDiff",
        "diffCount",
        "_environmentStrategyPreviewPayload(domain)",
        "_readEnvironmentStrategyInputs(root, domain)",
        "manualOverrides",
        "sourceMode",
    ):
        assert panel_marker in panel_source



def test_phase4_irrigation_strategy_mvp_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "IRRIGATION_STRATEGY_COMPONENTS",
        "_irrigation_strategy_inputs_from_sources",
        "_irrigation_strategy_ec_ph_vwc_dryback",
        "_irrigation_strategy_final_targets",
        "_irrigation_strategy_preview_response",
        "ZoneIrrigationStrategyPreviewView",
        'url = "/api/green_smart/irrigation/strategy-preview"',
        "irrigation_strategy_previewed",
        "irrigation_strategy_final_targets_saved",
        "calculated_by=\"irrigation_strategy_mvp\"",
        "IRR",
        "accumulatedRadiation",
        "currentVwc",
        "currentEc",
        "currentPh",
        "dryback",
        "shotAmountL",
        "minIntervalMin",
        "targetEc",
        "targetPh",
        "targetDryback",
        "targetDrainRate",
        "emergencyIrrigation",
        "SafetyGuard 우선",
    ):
        assert api_marker in source

    assert "hass.http.register_view(ZoneIrrigationStrategyPreviewView())" in init_source

    strategy_section = source.split("def _irrigation_strategy_inputs_from_sources", 1)[1].split("class ZoneIrrigationStrategyPreviewView", 1)[0]
    for behavior in (
        "_entity_state_summary_response",
        "_latest_final_target_response",
        "zone_control_settings",
        "solarIrrigationStrategy",
        "drybackStrategy",
        "drainFeedback",
        "nutrientStrategy",
        "irrigationSafetyLimits",
        "VWC 하한 긴급 관수",
        "IRR 기본 EC/pH/VWC/드라이백/일사 누적 관수",
        "targetDiff",
        "diffCount",
    ):
        assert behavior in strategy_section

    for panel_marker in (
        "this._zoneIrrigationStrategyPreviewCache",
        "async _fetchIrrigationStrategyPreview(domain",
        "async _saveIrrigationStrategyFinalTargets(domain)",
        "_renderIrrigationStrategyPreviewCard(domain)",
        "_bindIrrigationStrategyPreviewInputs(root)",
        "green_smart/irrigation/strategy-preview",
        "data-irrigation-strategy-preview-card",
        "data-irrigation-strategy-preview-refresh",
        "data-irrigation-strategy-save-final",
        "data-irrigation-strategy-source-mode",
        "data-irrigation-strategy-manual-radiation",
        "data-irrigation-strategy-manual-vwc",
        "data-irrigation-strategy-manual-ec",
        "data-irrigation-strategy-manual-ph",
        "data-irrigation-strategy-manual-override",
        "관수 전략 MVP",
        "IRR EC/pH/VWC/드라이백",
        "일사 누적 관수",
        "VWC 하한 긴급 관수",
        "관수 최종 목표",
        "SafetyGuard 우선 적용",
        "관수 전략 최종값 저장",
        "irrigation_strategy_mvp",
        "targetDiff",
        "diffCount",
        "_irrigationStrategyPreviewPayload(domain)",
        "_readIrrigationStrategyInputs(root, domain)",
        "manualOverrides",
        "sourceMode",
    ):
        assert panel_marker in panel_source

    irrigation_page = panel_source.split("  _renderIrrigSettingsPage() {", 1)[1].split("  _cloneDeviceDefaults()", 1)[0]
    assert '_renderIrrigationStrategyPreviewCard("irrigation")' in irrigation_page



def test_phase5_limited_auto_control_and_alert_resume_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "LIMITED_AUTO_DEVICE_GROUPS",
        "LIMITED_AUTO_POLICY_DEFAULTS",
        "_limited_auto_policy_response",
        "_limited_auto_policy_post",
        "_device_group_auto_allowance",
        "_limited_auto_execution_policy",
        "_alert_resume_lifecycle_response",
        "ZoneLimitedAutoPolicyView",
        "ZoneAlertResumeView",
        'url = "/api/green_smart/zones/limited-auto-policy"',
        'url = "/api/green_smart/zones/alert-resume"',
        "limited_auto_policy_saved",
        "limited_auto_execution_allowed",
        "limited_auto_execution_blocked",
        "alert_resume_requested",
        "alert_resume_approved",
        "alert_resume_rejected",
        "deviceGroupAutoAllow",
        "semiAutoRequiresAck",
        "maxAutoDurationMinutes",
        "resumeState",
        "resumeAllowed",
        "operatorConfirmationRequired",
        "SafetyGuard 우선",
    ):
        assert api_marker in source

    for registration in (
        "hass.http.register_view(ZoneLimitedAutoPolicyView())",
        "hass.http.register_view(ZoneAlertResumeView())",
    ):
        assert registration in init_source

    execution_section = source.split("async def _execute_latest_final_targets", 1)[1].split("class ZoneAiControlOutputsView", 1)[0]
    for behavior in (
        "_limited_auto_execution_policy",
        "limited_auto_execution_allowed",
        "limited_auto_execution_blocked",
        "deviceGroupAutoAllow",
        "semiAutoRequiresAck",
        "operatorConfirmationRequired",
    ):
        assert behavior in execution_section

    for panel_marker in (
        "this._zoneLimitedAutoPolicyCache",
        "this._zoneAlertResumeCache",
        "async _fetchZoneLimitedAutoPolicy(domain",
        "async _saveZoneLimitedAutoPolicy(domain)",
        "async _requestZoneAlertResume(domain)",
        "_readZoneLimitedAutoPolicy(root, domain)",
        "_renderZoneLimitedAutoPolicyCard(domain)",
        "_bindZoneLimitedAutoPolicyInputs(root)",
        "green_smart/zones/limited-auto-policy",
        "green_smart/zones/alert-resume",
        "data-zone-limited-auto-card",
        "data-zone-limited-auto-refresh",
        "data-zone-limited-auto-save",
        "data-zone-limited-auto-group",
        "data-zone-limited-auto-enabled",
        "data-zone-limited-auto-semi-ack",
        "data-zone-limited-auto-duration",
        "data-zone-alert-resume-request",
        "제한적 자동제어",
        "장비군별 자동 허용",
        "반자동 승인 필요",
        "자동 최대 지속 시간",
        "알림 확인/조치/재개",
        "재개 요청",
        "SafetyGuard 우선 적용",
    ):
        assert panel_marker in panel_source

    for domain in ("environment", "irrigation", "device"):
        page = panel_source
        assert f'_renderZoneLimitedAutoPolicyCard("{domain}")' in page



def test_control_phase_c14_dry_run_ui_contract():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    execution_section = source.split("class ZoneFinalTargetExecutionView", 1)[1].split("class ZoneAiControlOutputsView", 1)[0]
    for api_marker in (
        "dry_run",
        "dryRun",
        '"executedCount": 0 if dry_run',
        "plannedCount",
        "calls",
        "blockedCalls",
        "safeStateCalls",
        "preState",
        'stateVerification"] = "dry_run"',
        "if dry_run:",
        "continue",
    ):
        assert api_marker in execution_section

    assert "if not dry_run:" in execution_section.split("await hass.services.async_call", 1)[0]

    for panel_marker in (
        "this._zoneDryRunPreviewCache",
        "async _previewZoneFinalTargetsDryRun(domain)",
        "_renderZoneDryRunPreviewCard(domain)",
        "_bindZoneDryRunPreviewInputs(root)",
        "green_smart/zones/execute-final-targets",
        "dry_run: true",
        "data-zone-dry-run-card",
        "data-zone-dry-run-preview",
        "data-zone-dry-run-domain",
        "data-zone-dry-run-call-row",
        "data-zone-dry-run-blocked-row",
        "data-zone-dry-run-failsafe-row",
        "Dry Run UI",
        "실행 전 확인",
        "예정 service call",
        "현재 상태",
        "안전 차단",
        "Fail Safe",
        "SafetyGuard 판단",
        "제한적 자동제어 gate",
        "실제 장비는 움직이지 않습니다",
    ):
        assert panel_marker in panel_source

    for domain in ("environment", "irrigation", "device"):
        assert f'_renderZoneDryRunPreviewCard("{domain}")' in panel_source



def test_control_phase_c15_entity_mapping_validation_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "ENTITY_MAPPING_VALIDATION_SERVICE_DOMAINS",
        "_entity_mapping_expected_service_domain",
        "_validate_entity_mapping_item",
        "_validate_entity_mapping_response",
        "ZoneEntityMappingValidationView",
        'url = "/api/green_smart/zones/entity-mapping-validation"',
        "entity_mapping_validation_checked",
        "entityExists",
        "serviceCompatible",
        "safeStateValid",
        "missingSafeState",
        "mappingValidationStatus",
        "validationIssues",
        "entity_id 존재",
        "domain/service 호환성",
        "safe_state 유효성",
    ):
        assert api_marker in source

    assert "hass.http.register_view(ZoneEntityMappingValidationView())" in init_source

    mapping_post_section = source.split("class ZoneDeviceEntityMappingsView", 1)[1].split("def _summarize_control_log_row", 1)[0]
    for save_marker in (
        "_validate_entity_mapping_item",
        "mappingValidation",
        "mappingValidationStatus",
        "validationIssues",
    ):
        assert save_marker in mapping_post_section

    for panel_marker in (
        "this._zoneEntityMappingValidationCache",
        "async _fetchZoneEntityMappingValidation(domain)",
        "_renderZoneEntityMappingValidationCard(domain)",
        "_bindZoneEntityMappingValidationInputs(root)",
        "green_smart/zones/entity-mapping-validation",
        "data-zone-entity-validation-card",
        "data-zone-entity-validation-refresh",
        "data-zone-entity-validation-row",
        "data-zone-entity-validation-status",
        "data-zone-entity-validation-issue",
        "Entity Mapping 검증",
        "Setup Assistant",
        "entity_id 존재",
        "domain/service 호환성",
        "safe_state 유효성",
        "위험 장비 mapping 누락",
        "검증 실행",
    ):
        assert panel_marker in panel_source

    for domain in ("environment", "irrigation", "device"):
        assert f'_renderZoneEntityMappingValidationCard("{domain}")' in panel_source



def test_control_phase_c16_sensor_safety_rule_contract():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "SENSOR_SAFETY_RULE_OPERATORS",
        "_sensor_safety_rule_snapshot",
        "_sensor_safety_rule_value",
        "_sensor_safety_rule_matches",
        "_sensor_safety_rule_results",
        "sensor_entity_id",
        "sensorEntityId",
        "sensorAttribute",
        "sensorOperator",
        "sensorActualValue",
        "sensorThreshold",
        "sensorRuleMatched",
        "sensorSafetyStatus",
        "sensorSafetyResults",
        "sensor_safety_rule_blocked",
        "풍속/강우/저온/탱크수위/펌프 fault",
    ):
        assert api_marker in source

    decision_section = source.split("def _safety_guard_decision", 1)[1].split("def _interlock_failsafe_decision", 1)[0]
    for decision_marker in (
        "_sensor_safety_rule_results",
        "sensor_results",
        "sensorSafetyResults",
        "sensorSafetyStatus",
        "sensor_safety_rule_blocked",
        "reasons.append",
    ):
        assert decision_marker in decision_section

    execution_section = source.split("class ZoneFinalTargetExecutionView", 1)[1].split("class ZoneAiControlOutputsView", 1)[0]
    for execution_marker in (
        "sensorSafetyResults",
        "sensorSafetyStatus",
        "sensor_safety_rule_blocked",
    ):
        assert execution_marker in execution_section

    for panel_marker in (
        "data-zone-interlock-rule-sensor-entity",
        "data-zone-interlock-rule-sensor-attribute",
        "data-zone-interlock-rule-sensor-operator",
        "sensor_entity_id",
        "sensor_attribute",
        "sensor_operator",
        "실시간 Sensor 기반 Safety Rule",
        "센서 entity",
        "센서 속성",
        "센서 연산자",
        "풍속",
        "강우",
        "저온",
        "탱크수위",
        "펌프 fault",
    ):
        assert panel_marker in panel_source



def test_control_phase_c17_operator_confirmation_contract():
    source = VIEWS.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "OPERATOR_CONFIRMATION_PHRASE",
        "OPERATOR_EXECUTION_ROLES",
        "_operator_execution_confirmation",
        "operatorConfirmationRequired",
        "operatorConfirmed",
        "operatorConfirmationPhrase",
        "operatorConfirmationText",
        "operatorRole",
        "operatorOverrideReason",
        "operator_confirmation_required",
        "operator_execution_confirmed",
        "manual/assist/auto 실행 권한",
        "운영자 확인",
        "재개/override UX",
    ):
        assert api_marker in source

    execution_section = source.split("class ZoneFinalTargetExecutionView", 1)[1].split("class ZoneAiControlOutputsView", 1)[0]
    for execution_marker in (
        "_operator_execution_confirmation",
        "operatorConfirmationRequired",
        "operatorConfirmed",
        "operator_confirmation_required",
        "operator_execution_confirmed",
        "operatorOverrideReason",
    ):
        assert execution_marker in execution_section

    for panel_marker in (
        "_operatorConfirmationPhrase(domain)",
        "_operatorExecutionConfirmationPayload(domain)",
        "data-zone-operator-confirm-card",
        "data-zone-operator-confirm-enabled",
        "data-zone-operator-confirm-text",
        "data-zone-operator-confirm-role",
        "data-zone-operator-confirm-reason",
        "data-zone-final-execute-confirmed",
        "운영자 실행 확인",
        "실제 장비 실행 확인",
        "확인 문구",
        "실행 권한",
        "override 사유",
        "manual/assist/auto",
    ):
        assert panel_marker in panel_source

    for domain in ("environment", "irrigation", "device"):
        assert f'_renderZoneOperatorConfirmCard("{domain}")' in panel_source



def test_control_phase_c18_rehearsal_readiness_contract():
    source = VIEWS.read_text(encoding="utf-8")
    init_source = INIT.read_text(encoding="utf-8")
    panel_source = PANEL.read_text(encoding="utf-8")

    for api_marker in (
        "REHEARSAL_SCENARIO_IDS",
        "_rehearsal_scenario_templates",
        "_rehearsal_readiness_response",
        "ZoneRehearsalReadinessView",
        'url = "/api/green_smart/zones/rehearsal-readiness"',
        "rehearsal_readiness_checked",
        "scenarioReadinessStatus",
        "scenarioChecklist",
        "normal_operation",
        "strong_wind_block",
        "rain_block",
        "low_temperature_block",
        "sensor_fault_block",
        "failsafe_recovery",
        "operator_recovery",
        "정상",
        "강풍",
        "강우",
        "저온",
        "센서 고장",
        "차단",
        "Fail Safe",
        "복구",
    ):
        assert api_marker in source

    assert "hass.http.register_view(ZoneRehearsalReadinessView())" in init_source

    for panel_marker in (
        "this._zoneRehearsalReadinessCache",
        "async _fetchZoneRehearsalReadiness(domain)",
        "_renderZoneRehearsalReadinessCard(domain)",
        "_bindZoneRehearsalReadinessInputs(root)",
        "green_smart/zones/rehearsal-readiness",
        "data-zone-rehearsal-card",
        "data-zone-rehearsal-refresh",
        "data-zone-rehearsal-scenario-row",
        "data-zone-rehearsal-check-row",
        "현장 리허설",
        "시나리오 테스트",
        "정상",
        "강풍",
        "강우",
        "저온",
        "센서 고장",
        "차단",
        "Fail Safe",
        "복구",
        "리허설 준비도",
    ):
        assert panel_marker in panel_source

    for domain in ("environment", "irrigation", "device"):
        assert f'_renderZoneRehearsalReadinessCard("{domain}")' in panel_source
