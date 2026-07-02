from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PLAN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1958_db_has_crop_model_feature_source_snapshot_table_contract():
    db = DB.read_text(encoding="utf-8")
    for marker in (
        "CREATE TABLE IF NOT EXISTS crop_model_feature_snapshots",
        "feature_version VARCHAR(64) NOT NULL DEFAULT 'crop_model_feature_sources_v1'",
        "environment_summary_json JSON NOT NULL",
        "irrigation_nutrient_summary_json JSON NOT NULL",
        "pest_control_summary_json JSON NOT NULL",
        "operation_history_summary_json JSON NOT NULL",
        "safety_interlock_summary_json JSON NOT NULL",
        "input_completeness_json JSON NOT NULL",
        "idx_crop_model_feature_snapshots_lookup",
        "feature_snapshot_id BIGINT NULL",
    ):
        assert marker in db


def test_v1958_crop_model_feature_sources_api_and_helpers_contract():
    crop = CROP.read_text(encoding="utf-8")
    init = INIT.read_text(encoding="utf-8")
    for marker in (
        "CROP_MODEL_FEATURE_SOURCES_VERSION = \"crop_model_feature_sources_v1\"",
        "_environment_feature_summary(",
        "_irrigation_nutrient_feature_summary(",
        "_pest_control_feature_summary(",
        "_operation_history_feature_summary(",
        "_safety_interlock_feature_summary(",
        "_crop_model_input_completeness(",
        "_crop_model_feature_sources_snapshot(",
        "_persist_crop_model_feature_snapshot(",
        "CropModelFeatureSourcesView",
        "sensor_readings",
        "irrigation_drain_feedback",
        "irrigation_control_logs",
        "pest_surveys",
        "control_records",
        "control_pesticides",
        "crop_interlock_approvals",
        "audit_logs",
    ):
        assert marker in crop
    assert "CropModelFeatureSourcesView" in init
    assert "hass.http.register_view(CropModelFeatureSourcesView())" in init


def test_v1958_trainable_baseline_uses_real_feature_sources_not_placeholders_contract():
    crop = CROP.read_text(encoding="utf-8")
    helper = crop.split("def _crop_trainable_feature_snapshot", 1)[1].split("def _crop_stage_prediction_7d", 1)[0]
    report = crop.split("async def _growth_report_response", 1)[1].split("class CropGrowthReportView", 1)[0]

    for marker in (
        "featureSources",
        "environmentSummary7d",
        "irrigationNutrientSummary7d",
        "pestControlSummary7d",
        "operationHistorySummary7d",
        "safetyInterlockSummary",
        "inputCompleteness",
        "sourceStatus",
    ):
        assert marker in helper
        assert marker in report

    assert "placeholder" not in helper.lower()
    assert "_crop_model_feature_sources_snapshot(hass" in report
    assert "featureSnapshotId" in crop


def test_v1958_panel_and_docs_surface_model_feature_sources_contract():
    panel = PANEL.read_text(encoding="utf-8")
    plan = PLAN.read_text(encoding="utf-8")
    manifest = MANIFEST.read_text(encoding="utf-8")

    for marker in (
        "data-crop-model-feature-sources-card",
        "모델 입력 소스",
        "환경 7일",
        "관수 제어 7일",
        "병해/방제",
        "입력 완성도",
        "inputCompleteness",
        "sourceStatus",
    ):
        assert marker in panel

    for marker in (
        "Confirmed decision 9 — crop model feature sources must be first-class inputs",
        "crop_model_feature_snapshots",
        "environment_summary_json",
        "irrigation_nutrient_summary_json",
        "pest_control_summary_json",
        "input_completeness_json",
    ):
        assert marker in plan

    assert '"version": "1.14.24"' in manifest
    assert 'const VERSION = "1.14.24"' in panel
