import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"


def _module() -> ast.Module:
    return ast.parse(DB.read_text(encoding="utf-8"), filename=str(DB))


def test_db_cfg_reads_only_expected_environment_variables_with_safe_defaults():
    source = DB.read_text(encoding="utf-8")

    assert 'os.environ.get("DB_HOST", "127.0.0.1")' in source
    assert 'os.environ.get("DB_PORT", "3306")' in source
    assert 'os.environ.get("DB_USER", "gs_user")' in source
    assert 'os.environ.get("DB_PASSWORD", "")' in source
    assert 'os.environ.get("DB_NAME", "green_smart")' in source


def test_db_pool_uses_utf8mb4_autocommit_and_bounded_pool_size():
    source = DB.read_text(encoding="utf-8")

    assert 'charset="utf8mb4"' in source
    assert "autocommit=True" in source
    assert "minsize=2" in source
    assert "maxsize=10" in source


def test_db_query_helpers_convert_isoformat_values_and_return_single_row_or_none():
    source = DB.read_text(encoding="utf-8")

    assert "v.isoformat() if hasattr(v, \"isoformat\") else v" in source
    assert "return rows[0] if rows else None" in source


def test_db_close_pool_resets_singleton_after_wait_closed():
    module = _module()
    close_pool = next(node for node in module.body if isinstance(node, ast.AsyncFunctionDef) and node.name == "close_pool")
    source = ast.unparse(close_pool)

    assert "_pool.close()" in source
    assert "await _pool.wait_closed()" in source
    assert "_pool = None" in source


def test_db_bootstrap_creates_crop_management_tables_and_default_zone():
    source = DB.read_text(encoding="utf-8")

    assert "async def ensure_schema" in source
    for table in (
        "zones",
        "crop_seasons",
        "growth_surveys",
        "pest_surveys",
        "control_records",
        "control_pesticides",
    ):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in source
    assert "INSERT IGNORE INTO zones" in source
    assert "crop_type VARCHAR(50)" in source
    assert "metrics_json" in source
    assert "_ensure_column" in source


def test_db_bootstrap_creates_doc_planned_device_irrigation_and_admin_system_tables():
    source = DB.read_text(encoding="utf-8")
    for table in (
        "devices",
        "device_groups",
        "device_group_items",
        "device_status",
        "device_control_logs",
        "device_interlocks",
        "device_failsafe_rules",
        "device_alarms",
        "ventilation_device_settings",
        "screen_device_settings",
        "irrigation_settings",
        "sensor_readings",
        "irrigation_drain_feedback",
        "ai_irrigation_outputs",
        "final_irrigation_targets",
        "irrigation_control_logs",
        "audit_logs",
        "green_smart_admin_role_mappings",
        "green_smart_admin_system_config",
        "green_smart_admin_diagnostics",
        "green_smart_admin_backups",
    ):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in source
    for index_or_key in (
        "idx_devices_farm_type",
        "idx_sensor_readings_lookup",
        "idx_irrigation_control_logs_lookup",
        "idx_audit_logs_lookup",
        "uniq_admin_role_mappings",
        "uniq_admin_system_config",
    ):
        assert index_or_key in source
    for admin_column in (
        "ha_user_id VARCHAR(128) NOT NULL",
        "role VARCHAR(64) NOT NULL",
        "config_key VARCHAR(128) NOT NULL",
        "config_json JSON NOT NULL",
        "diagnostic_json JSON NOT NULL",
        "backup_json JSON NOT NULL",
    ):
        assert admin_column in source


def test_growth_survey_backend_persists_dynamic_crop_metrics_json():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")
    growth_section = source.split("class CropGrowthListView", 1)[1].split("class CropGrowthDeleteView", 1)[0]

    assert "import json" in source
    assert "metrics_json AS metricsJson" in growth_section
    assert "crop_type AS cropType" in growth_section
    assert "json.dumps(body.get(\"metrics\")" in growth_section
    assert "body.get(\"cropType\")" in growth_section
    assert "metricsJson" in growth_section


def test_product_phase6_growth_report_api_contract():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")
    init_source = (ROOT / "custom_components" / "green_smart" / "__init__.py").read_text(encoding="utf-8")

    for marker in (
        "class CropGrowthReportView(HomeAssistantView)",
        'url  = "/api/green_smart/crop/seasons/{season_id}/growth-report"',
        "_growth_report_response",
        "growthTrend",
        "gIndexTrend",
        "yieldPrediction",
        "pestRisk",
        "weeklyReport",
        "latestMetrics",
        "growth_surveys",
        "pest_surveys",
        "control_records",
        "plant_density AS plantDensity",
        "metrics_json AS metricsJson",
    ):
        assert marker in source
    assert "CropGrowthReportView" in init_source
    assert "hass.http.register_view(CropGrowthReportView())" in init_source


def test_product_phase6_crop_specific_yield_model_contract():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")
    report_section = source.split("async def _growth_report_response", 1)[1].split("class CropGrowthReportView", 1)[0]

    for marker in (
        "YIELD_MODEL_BY_CROP",
        '"tomato"',
        '"lettuce"',
        "_growth_yield_prediction(",
        "cropType",
        "estimatedKgPerPlant",
        "estimatedKgPerArea",
        "modelVersion",
        "cropModelLabel",
        "yieldDrivers",
        "growthVelocityCmPerWeek",
        "gIndexFactor",
        "densityFactor",
        "confidenceReasons",
        "tomato_growth_model_v1",
        "lettuce_growth_model_v1",
    ):
        assert marker in source
    assert "_growth_yield_prediction(season, latest, oldest, growth_rows, latest_g, weekly_growth)" in source
    assert '"yieldPrediction": cropModel["yieldPrediction"]' in report_section
    assert "cropModel = _crop_model_snapshot_from_report_parts" in report_section


def test_product_phase6_environment_weather_control_pest_risk_contract():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")
    report_section = source.split("async def _growth_report_response", 1)[1].split("class CropGrowthReportView", 1)[0]

    for marker in (
        "_growth_pest_risk(",
        "_weather_risk_snapshot(",
        "environmentDrivers",
        "weatherDrivers",
        "controlHistoryDrivers",
        "riskFactors",
        "recommendedActions",
        "lastControlDate",
        "daysSinceLastControl",
        "humidityRisk",
        "rainRisk",
        "temperatureRisk",
        "pest_history_score",
        "weather_environment_control_model_v1",
    ):
        assert marker in source
    assert "pestRisk = _growth_pest_risk(hass, pest_rows, control_rows)" in source
    assert '"pestRisk": cropModel["pestRisk"]' in report_section
    assert "cropModel = _crop_model_snapshot_from_report_parts" in report_section


def test_product_phase6_weekly_report_export_notification_contract():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")
    init_source = (ROOT / "custom_components" / "green_smart" / "__init__.py").read_text(encoding="utf-8")
    report_section = source.split("async def _growth_report_response", 1)[1].split("class CropGrowthReportView", 1)[0]

    for marker in (
        "_growth_weekly_report(",
        "_weekly_report_export_csv(",
        "exportText",
        "exportCsv",
        "exportFilename",
        "notificationDraft",
        "class CropGrowthReportNotifyView(HomeAssistantView)",
        'url  = "/api/green_smart/crop/seasons/{season_id}/growth-report/notify"',
        "persistent_notification",
        "green_smart_weekly_report",
        "주간 생육 리포트",
        "WEEKLY_REPORT_INTERVAL_DAYS = 7",
        "_growth_report_health_signature",
        "_growth_report_worsened",
        "_maybe_send_growth_report_auto_notification",
        "_run_growth_report_notification_tick",
        "_setup_growth_report_notification_scheduler",
        "growth_report_notification_checked",
        "weekly_report_auto_sent",
        "growth_report_worsened_sent",
    ):
        assert marker in source + init_source
    assert "weeklyReport = _growth_weekly_report(season_id, growth_rows, control_rows, weekly_growth, pestRisk, yieldPrediction)" in report_section
    assert "CropGrowthReportNotifyView" in init_source
    assert "hass.http.register_view(CropGrowthReportNotifyView())" in init_source
    assert "await _setup_growth_report_notification_scheduler(hass)" in init_source


def test_integration_setup_runs_db_schema_bootstrap_before_crop_views():
    init_source = (ROOT / "custom_components" / "green_smart" / "__init__.py").read_text(encoding="utf-8")

    assert "from .db import ensure_schema" in init_source
    assert "await ensure_schema(hass)" in init_source
    assert init_source.index("await ensure_schema(hass)") < init_source.index("hass.http.register_view(CropSeasonsView())")


def test_control_record_save_requires_active_season_before_posting():
    panel = (ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js").read_text(encoding="utf-8")
    save_section = panel.split('inner.querySelector("#c-save")?.addEventListener("click"', 1)[1].split("const controlBody", 1)[0]

    assert "!this._activeSeasonId" in save_section
    assert "작기를 먼저 등록" in save_section
    assert "green_smart/crop/seasons/${this._activeSeasonId}/control" in panel


def test_crop_season_post_ensures_zone_and_get_keeps_zone_id_name():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")

    assert "async def _ensure_zone" in source
    assert "INSERT IGNORE INTO zones" in source
    assert "await _ensure_zone(hass, zone_id_int)" in source
    assert "LEFT JOIN zones" in source
    assert "s.zone_id AS zoneId" in source
    assert "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName" in source


def test_crop_season_patch_updates_editable_fields_and_returns_zone_label():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")

    assert "async def patch(self, request: web.Request, season_id: str)" in source
    assert "UPDATE crop_seasons" in source
    assert "crop_type = %s" in source
    assert "zone_id = %s" in source
    assert "plant_density = %s" in source
    assert "COALESCE(z.name, CONCAT(s.zone_id, '구역')) AS zoneName" in source


def test_crop_season_delete_hard_deletes_child_tables_before_season():
    source = (ROOT / "custom_components" / "green_smart" / "crop_views.py").read_text(encoding="utf-8")
    delete_section = source.split("class CropSeasonDeleteView", 1)[1].split("# ── 생육조사", 1)[0]

    assert "DELETE cp FROM control_pesticides cp" in delete_section
    assert "DELETE FROM control_records WHERE season_id = %s" in delete_section
    assert "DELETE FROM pest_surveys WHERE season_id = %s" in delete_section
    assert "DELETE FROM growth_surveys WHERE season_id = %s" in delete_section
    assert "DELETE FROM crop_seasons WHERE id = %s" in delete_section
    assert "UPDATE crop_seasons SET deleted_at" not in delete_section
