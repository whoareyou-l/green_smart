from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1965_stage_score_weather_stress_documented_contract():
    plan = PLAN.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")
    for marker in (
        "Slice 6 — v1.9.65 Transparent Stage Prediction Score + KMA Weather Stress Inputs",
        "kmaWeatherStress7d",
        "kmaWeatherStressScore",
        "confidenceScore",
        "highTemperatureDays",
        "rapidTemperatureChangeDays",
        "GET /api/green_smart/weather/weekly",
    ):
        assert marker in plan
    for marker in (
        "Confirmed decision 14 — numeric confidence and KMA 7-day weather-stress inputs",
        "confidenceScore",
        "confidencePercent",
        "kmaWeatherStress7d",
        "weather_api.py / weather_views.py",
    ):
        assert marker in design


def test_v1965_backend_kma_weather_stress_feature_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_STAGE_PREDICTION_SCORE_VERSION = "crop_stage_prediction_score_v1"',
        'CROP_KMA_WEATHER_STRESS_FEATURES_VERSION = "crop_kma_weather_stress_features_v1"',
        "from .weather_api import WeatherStore, fetch_weekly_forecast",
        "_kma_weather_stress_features_from_weekly(",
        "_kma_weather_stress_feature_summary(",
        "highTemperatureDays",
        "lowTemperatureDays",
        "highHumidityDays",
        "lowHumidityDays",
        "rapidTemperatureChangeDays",
        "maxDailyTemperatureSwing",
        "avgDailyTemperatureSwing",
        "kmaForecastCoverageRatio",
        "weatherStressReasons",
        "sourceStatus",
        "ready",
        "partial",
        "missing",
        "stale",
    ):
        assert marker in crop


def test_v1965_transparent_stage_prediction_score_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        "_crop_stage_prediction_score_components(",
        "growthIndexBandScore",
        "weeklyDeltaScore",
        "environmentStressScore",
        "kmaWeatherStressScore",
        "irrigationNutrientStressScore",
        "pestControlRiskPenalty",
        "inputCompletenessPenalty",
        "stageCalibrationScore",
        '"confidenceScore"',
        '"confidencePercent"',
        '"scoreComponents"',
        '"rawScore"',
        '"explanation"',
    ):
        assert marker in crop
    stage_body = crop[crop.index("def _crop_stage_prediction_7d"):crop.index("def _crop_ml_upgrade_readiness")]
    assert '"confidence": "low|medium|high"' not in stage_body
    assert '"confidence": "medium"' not in stage_body
    assert '"confidence": "low"' not in stage_body


def test_v1965_kma_weather_stress_exposed_to_snapshots_and_report_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        '"kmaWeatherStress7d": kma_weather_stress',
        '"kmaWeatherStress7d": featureSources.get("kmaWeatherStress7d") or {}',
        '"kmaWeatherStress": kmaWeatherStress',
        '"stagePredictionScore": stagePrediction7d.get("score")',
        'json.dumps(featureSources.get("kmaWeatherStress7d") or {}',
    ):
        assert marker in crop


def test_v1965_panel_stage_score_weather_stress_read_only_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-stage-prediction-score-card",
        "data-crop-kma-weather-stress-card",
        "투명 생육단계 예측 점수",
        "KMA 7일 weather-stress",
        "kmaWeatherStress7d",
        "confidenceScore",
        "confidencePercent",
        "kmaWeatherStressScore",
        "highTemperatureDays",
        "rapidTemperatureChangeDays",
    ):
        assert marker in panel
    for forbidden in (
        "data-crop-kma-weather-stress-execute",
        "kmaWeatherStressAllowExecution",
        "executeWeatherControlFromCropModel",
    ):
        assert forbidden not in panel


def test_v1965_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.14.55"' in manifest
    assert 'const VERSION = "1.14.55"' in panel
    assert "v1.14.55" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
