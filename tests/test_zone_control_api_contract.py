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
