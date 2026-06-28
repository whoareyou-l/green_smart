from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "custom_components" / "green_smart" / "db.py"
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
INIT = ROOT / "custom_components" / "green_smart" / "__init__.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"


def test_v1959_plan_exists_before_prediction_validation_work_contract():
    plan = PLAN.read_text(encoding="utf-8")
    for marker in (
        "# Crop Model Slice Execution Plan",
        "Slice 1 — v1.9.59 Prediction Validation Loop",
        "Prediction → actual validation loop",
        "Create RED contract test: tests/test_crop_prediction_validation_contract.py",
        "Do not proceed to Slice 2 until Slice 1",
    ):
        assert marker in plan


def test_v1959_db_prediction_validation_contract():
    db = DB.read_text(encoding="utf-8")
    for marker in (
        "actual_validation_json JSON NULL",
        "actual_survey_id INT NULL",
        "validation_status VARCHAR(32) NOT NULL DEFAULT 'pending'",
        "idx_crop_model_training_validation_due",
        "predicted_for_date",
        "feature_snapshot_id BIGINT NULL",
    ):
        assert marker in db


def test_v1959_backend_prediction_validation_helpers_and_api_contract():
    crop = CROP.read_text(encoding="utf-8")
    init = INIT.read_text(encoding="utf-8")
    for marker in (
        "CROP_PREDICTION_VALIDATION_VERSION = \"crop_prediction_validation_v1\"",
        "_pending_crop_prediction_snapshots(",
        "_actual_stage_label_from_growth_survey(",
        "_prediction_stage_match(",
        "_validate_pending_crop_training_snapshots(",
        "actualValidation",
        "stageMatched",
        "transitionTimingErrorDays",
        "validation_needs_review",
        "CropModelPredictionValidationView",
        "/api/green_smart/crop/seasons/{season_id}/prediction-validations",
        "/api/green_smart/crop/seasons/{season_id}/prediction-validations/run",
    ):
        assert marker in crop
    assert "CropModelPredictionValidationView" in init
    assert "hass.http.register_view(CropModelPredictionValidationView())" in init


def test_v1959_panel_prediction_validation_card_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-prediction-validation-card",
        "data-crop-prediction-validation-status",
        "data-crop-prediction-validation-run",
        "예측 검증 상태",
        "최근 실제 조사",
        "validationStatus",
        "predictionValidation",
    ):
        assert marker in panel


def test_v1959_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.11.7"' in manifest
    assert 'const VERSION = "1.11.7"' in panel
    assert "v1.11.7" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
