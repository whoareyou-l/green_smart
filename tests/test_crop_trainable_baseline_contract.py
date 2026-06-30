from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
PLAN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1957_db_has_trainable_crop_model_snapshot_table_contract():
    db = DB.read_text(encoding="utf-8")

    for marker in (
        "CREATE TABLE IF NOT EXISTS crop_model_training_snapshots",
        "feature_snapshot_json JSON NOT NULL",
        "prediction_json JSON NOT NULL",
        "actual_validation_json JSON NULL",
        "readiness_json JSON NOT NULL",
        "model_family VARCHAR(64) NOT NULL DEFAULT 'hybrid_rule_score_v1'",
        "target_horizon_days INT NOT NULL DEFAULT 7",
        "predicted_for_date DATE NOT NULL",
        "actual_survey_id INT NULL",
        "validation_status VARCHAR(32) NOT NULL DEFAULT 'pending'",
        "idx_crop_model_training_lookup",
    ):
        assert marker in db


def test_v1957_crop_view_generates_trainable_baseline_snapshot_contract():
    crop = CROP.read_text(encoding="utf-8")
    init = INIT.read_text(encoding="utf-8")

    for marker in (
        "CROP_TRAINABLE_BASELINE_VERSION = \"crop_trainable_baseline_v1\"",
        "CROP_STAGE_PREDICTION_MODEL_FAMILY = \"hybrid_rule_score_v1\"",
        "_crop_trainable_feature_snapshot(",
        "_crop_stage_prediction_7d(",
        "_crop_ml_upgrade_readiness(",
        "_persist_crop_model_training_snapshot(",
        "_validate_pending_crop_training_snapshots(",
        "CropModelTrainingSnapshotView",
        "CropModelTrainingReadinessView",
        "modelTarget",
        "growth_stage_prediction_7d",
        "predictedStage7d",
        "transitionWindow",
        "mlUpgradeReadiness",
        "candidateModelFamilies",
        "lstm",
        "gru",
        "temporal_transformer",
    ):
        assert marker in crop

    assert "CropModelTrainingSnapshotView" in init
    assert "CropModelTrainingReadinessView" in init
    assert "hass.http.register_view(CropModelTrainingSnapshotView())" in init
    assert "hass.http.register_view(CropModelTrainingReadinessView())" in init


def test_v1957_growth_report_exposes_trainable_baseline_and_panel_readiness_contract():
    crop = CROP.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    plan = PLAN.read_text(encoding="utf-8")

    report_section = crop.split("async def _growth_report_response", 1)[1].split("class CropGrowthReportView", 1)[0]
    report_card = panel.split("  _renderGrowthReportCard()", 1)[1].split("  _renderCropGrowthTab()", 1)[0]

    for marker in (
        '"trainableBaseline"',
        '"featureSnapshot"',
        '"stagePrediction7d"',
        '"mlUpgradeReadiness"',
    ):
        assert marker in report_section

    for marker in (
        "data-crop-trainable-baseline-card",
        "data-crop-ml-readiness",
        "학습 데이터 베이스라인",
        "7일 생육단계 예측",
        "시계열 모델 확장",
        "hybrid_rule_score_v1",
        "predictedStage7d",
        "transitionWindow",
        "mlUpgradeReadiness",
        "시계열 모델 확장 가능",
    ):
        assert marker in report_card

    for marker in (
        "Confirmed decision 8 — true crop baseline is a trainable data baseline",
        "trainable dataset pipeline + transparent initial predictor + weekly validation loop",
        "Feature snapshot",
        "Actual validation label",
    ):
        assert marker in plan


def test_v1957_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")

    assert '"version": "1.14.3"' in manifest
    assert 'const VERSION = "1.14.3"' in panel
    assert "v1.14.3" in panel[:200]
