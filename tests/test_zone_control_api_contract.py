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
