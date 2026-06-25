from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MODEL_TESTS = ROOT / "tests" / "test_model_contract.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-25-risk-factor-prediction-v1-10-17.md"
ARCH = ROOT / "docs" / "plans" / "2026-06-25-crop-model-responsibility-architecture.md"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"

FORBIDDEN_CORE_KEYS = {"level", "label", "severity", "riskLevel", "band", "trend", "action", "recommendation"}
VALID_BANDS = {1, 2, 3, 4, 5, 9}
VALID_TRENDS = {-1, 0, 1, 2, 9}
REQUIRED_GROUPS = {
    "environmentStress": [
        "highTemperatureStress",
        "lowTemperatureStress",
        "temperatureSwingStress",
        "vpdStress",
        "humidityStress",
        "co2Stress",
        "lightDliStress",
    ],
    "irrigationNutrientStress": [
        "ecStress",
        "phStress",
        "dryBackStress",
        "drainImbalanceRisk",
    ],
    "pestDiseaseRisk": [
        "pestPressure",
        "diseasePressure",
        "controlFreshnessRisk",
    ],
    "operationDataQualityRisk": [
        "operationFreshnessRisk",
        "sensorInterlockDataQualityRisk",
    ],
}


def _load_crop_views_for_helper_tests():
    spec = importlib.util.spec_from_file_location("test_model_contract", MODEL_TESTS)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module._load_crop_views_for_helper_tests()


def _sample_model():
    crop_views = _load_crop_views_for_helper_tests()
    season = {"id": 12, "cropType": "tomato", "plantDate": "2026-06-01", "plantDensity": 2.5, "zoneId": 3}
    growth_rows = [
        {
            "id": 501,
            "date": "2026-06-29",
            "cropType": "tomato",
            "height": 92,
            "leafCount": 22,
            "stemDiameter": 9.8,
            "truss": 4,
            "node": 14,
            "metricsJson": '[{"key":"plantHeight","value":92},{"key":"leafCount","value":22},{"key":"stemDiameter","value":9.8},{"key":"trussCount","value":4},{"key":"fruitCount","value":18}]',
        },
        {
            "id": 500,
            "date": "2026-06-22",
            "cropType": "tomato",
            "height": 82,
            "leafCount": 19,
            "stemDiameter": 9.2,
            "truss": 3,
            "node": 12,
            "metricsJson": '[{"key":"plantHeight","value":82},{"key":"leafCount","value":19},{"key":"stemDiameter","value":9.2},{"key":"trussCount","value":3},{"key":"fruitCount","value":10}]',
        },
    ]
    return crop_views._crop_model_snapshot_from_report_parts(None, 12, season, growth_rows, [], [])


def _assert_numeric_risk_item(item: dict):
    assert set(item).isdisjoint(FORBIDDEN_CORE_KEYS), item
    assert isinstance(item["riskCode"], int)
    assert isinstance(item["score"], (int, float))
    assert 0.0 <= item["score"] <= 1.0
    assert item["bandCode"] in VALID_BANDS
    assert item["trendCode"] in VALID_TRENDS
    assert isinstance(item["confidenceScore"], (int, float))
    assert 0.0 <= item["confidenceScore"] <= 1.0
    assert isinstance(item["evidenceScore"], (int, float))
    assert 0.0 <= item["evidenceScore"] <= 1.0


def test_v11017_design_docs_pin_factorized_numeric_risk_contract():
    plan = PLAN.read_text(encoding="utf-8")
    arch = ARCH.read_text(encoding="utf-8")
    for text in (plan, arch):
        assert "Risk Factor Prediction Model" in text
        assert "highTemperatureStress" in text
        assert "temperatureSwingStress" in text
        assert "vpdStress" in text
        assert "ecStress" in text
        assert "controlFreshnessRisk" in text
        assert "score" in text
        assert "bandCode" in text
        assert "trendCode" in text
    assert "No diagnosis" in plan
    assert "No pesticide instruction" in plan


def test_risk_factor_prediction_exists_with_required_numeric_groups():
    prediction = _sample_model()["riskFactorPrediction"]
    assert prediction["versionCode"] == 1
    assert prediction["modelFamilyCode"] == 3101
    assert prediction["modelTargetCode"] == 3201
    assert prediction["windowDays"] == 7
    for group_name, item_names in REQUIRED_GROUPS.items():
        group = prediction[group_name]
        for item_name in item_names:
            assert item_name in group
            _assert_numeric_risk_item(group[item_name])


def _flatten_values(value):
    if isinstance(value, dict):
        for inner in value.values():
            yield from _flatten_values(inner)
    elif isinstance(value, list):
        for inner in value:
            yield from _flatten_values(inner)
    else:
        yield value


def test_risk_factor_prediction_forbids_vague_string_core_values():
    prediction = _sample_model()["riskFactorPrediction"]
    forbidden_strings = (
        "environmentRisk",
        "riskLevel",
        "medium",
        "high",
        "low",
        "severe",
        "immediate_action",
        "바로 대처",
        "심각",
        "중간",
        "약함",
        "매우 약함",
        "pesticide_control_work_review",
    )
    string_values = [value for value in _flatten_values(prediction) if isinstance(value, str)]
    for forbidden in forbidden_strings:
        assert forbidden not in string_values


def test_risk_factor_prediction_aggregate_and_worst_item_are_numeric_only():
    prediction = _sample_model()["riskFactorPrediction"]
    aggregate = prediction["aggregateRisk"]
    worst = prediction["highestRiskItem"]
    for payload in (aggregate, worst):
        assert set(payload).isdisjoint(FORBIDDEN_CORE_KEYS)
        assert isinstance(payload["score"], (int, float))
        assert 0.0 <= payload["score"] <= 1.0
        assert payload["bandCode"] in VALID_BANDS
        assert payload["trendCode"] in VALID_TRENDS
    assert isinstance(worst["riskCode"], int)
    assert isinstance(worst["groupCode"], int)


def test_risk_factor_prediction_is_readonly_and_not_diagnosis_or_action():
    prediction = _sample_model()["riskFactorPrediction"]
    assert prediction["readOnly"] is True
    assert prediction["executionAuthorityCode"] == 0
    assert prediction["trainingAuthorityCode"] == 0
    assert prediction["deploymentAuthorityCode"] == 0
    forbidden = {
        "diagnosis",
        "actionSignals",
        "environmentModelRequest",
        "irrigationNutrientModelRequest",
        "pestControlWorkOrder",
        "pesticideInstruction",
        "setpoint",
    }
    assert forbidden.isdisjoint(prediction.keys())
    assert forbidden.isdisjoint(set(str(prediction).split()))


def test_trainable_baseline_also_exposes_risk_factor_prediction():
    model = _sample_model()
    assert model["trainableBaseline"]["riskFactorPrediction"] == model["riskFactorPrediction"]


def test_panel_exposes_risk_factor_prediction_as_readonly_numeric_card():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-risk-factor-numeric-card",
        "data-crop-risk-factor-numeric-evidence",
        "data-crop-risk-factor-score",
        "data-crop-risk-factor-band-code",
        "data-crop-risk-factor-trend-code",
        "data-crop-risk-factor-item",
        "riskFactorPrediction",
        "highTemperatureStress",
        "temperatureSwingStress",
        "vpdStress",
        "ecStress",
        "controlFreshnessRisk",
        "bandCode",
        "trendCode",
    ):
        assert marker in panel
    assert "data-crop-risk-factor-execute" not in panel
    assert "riskFactorAllowExecution" not in panel
