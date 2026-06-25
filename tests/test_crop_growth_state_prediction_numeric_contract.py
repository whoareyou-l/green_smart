from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MODEL_TESTS = ROOT / "tests" / "test_model_contract.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-25-growth-state-prediction-v1-10-16.md"
ARCH = ROOT / "docs" / "plans" / "2026-06-25-crop-model-responsibility-architecture.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"


FORBIDDEN_CORE_KEYS = {"state", "strength", "direction", "label", "stateLabel", "directionLabel"}


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


def _assert_numeric_balance_payload(balance: dict):
    assert set(balance).isdisjoint(FORBIDDEN_CORE_KEYS)
    assert isinstance(balance["balanceScore"], (int, float))
    assert -1.0 <= balance["balanceScore"] <= 1.0
    assert isinstance(balance["balancePercent"], int)
    assert -100 <= balance["balancePercent"] <= 100
    assert balance["directionCode"] in {-1, 0, 1, 9}
    assert isinstance(balance["magnitudeScore"], (int, float))
    assert 0.0 <= balance["magnitudeScore"] <= 1.0
    assert balance["magnitudeBandCode"] in {0, 1, 2, 3, 4, 5, 9}
    assert isinstance(balance["confidenceScore"], (int, float))
    assert 0.0 <= balance["confidenceScore"] <= 1.0
    assert balance["confidenceBandCode"] in {1, 2, 3, 4, 5, 9}


def test_v11016_design_docs_pin_numeric_current_plus_7d_contract():
    plan = PLAN.read_text(encoding="utf-8")
    arch = ARCH.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")

    for text in (plan, arch, design):
        assert "numeric-first" in text
        assert "balanceScore" in text
        assert "directionCode" in text
        assert "magnitudeBandCode" in text
        assert "driverContributions" in text

    assert "current + 7일만" in plan
    assert "It excludes:" in plan
    assert "string states such as `vegetative`, `generative`, `medium`, or `high` must not be used as core state values" in design


def test_growth_state_prediction_exists_as_numeric_current_and_7d_payload():
    model = _sample_model()
    prediction = model["growthStatePrediction"]

    assert prediction["versionCode"] == 1
    assert prediction["modelFamilyCode"] == 2101
    assert prediction["modelTargetCode"] == 2201
    assert prediction["axis"] == {
        "axisCode": 1,
        "negativePoleCode": -1,
        "neutralCode": 0,
        "positivePoleCode": 1,
        "minScore": -1.0,
        "maxScore": 1.0,
    }
    assert "predictedBalance3d" not in prediction
    assert "predictedBalance1d" not in prediction

    _assert_numeric_balance_payload(prediction["currentBalance"])
    _assert_numeric_balance_payload(prediction["predictedBalance7d"])


def test_growth_state_prediction_forbids_string_state_strength_direction_in_core_payload():
    model = _sample_model()
    prediction = model["growthStatePrediction"]

    for section_name in ("currentBalance", "predictedBalance7d"):
        section = prediction[section_name]
        assert set(section).isdisjoint(FORBIDDEN_CORE_KEYS), section

    movement = prediction["balanceMovement"]
    assert set(movement).isdisjoint(FORBIDDEN_CORE_KEYS)
    for forbidden in ("toward_generative", "toward_vegetative", "generative", "vegetative", "medium", "high"):
        assert forbidden not in str(prediction)


def test_growth_state_prediction_movement_is_current_to_7d_numeric_only():
    model = _sample_model()
    movement = model["growthStatePrediction"]["balanceMovement"]

    assert "movementScore3d" not in movement
    assert "movementDirectionCode3d" not in movement
    assert "movementMagnitudeBandCode3d" not in movement
    assert isinstance(movement["movementScore7d"], (int, float))
    assert -1.0 <= movement["movementScore7d"] <= 1.0
    assert movement["movementDirectionCode7d"] in {-1, 0, 1, 9}
    assert movement["movementMagnitudeBandCode7d"] in {0, 1, 2, 3, 4, 5, 9}
    assert 0.0 <= movement["velocityScore"] <= 1.0
    assert -1.0 <= movement["accelerationScore"] <= 1.0
    assert 0.0 <= movement["stabilityScore"] <= 1.0
    assert 0.0 <= movement["volatilityScore"] <= 1.0


def test_growth_state_prediction_driver_contributions_are_numeric():
    model = _sample_model()
    drivers = model["growthStatePrediction"]["driverContributions"]

    expected = {
        "growthSurveySignal": 101,
        "environmentSteering": 201,
        "irrigationNutrientSteering": 301,
        "operationSignal": 401,
        "riskSignal": 501,
        "stageContextSignal": 601,
    }
    assert set(expected).issubset(drivers)
    total_weight = 0.0
    for name, driver_code in expected.items():
        driver = drivers[name]
        assert set(driver).isdisjoint(FORBIDDEN_CORE_KEYS)
        assert driver["driverCode"] == driver_code
        assert driver["directionCode"] in {-1, 0, 1, 9}
        assert -1.0 <= driver["rawScore"] <= 1.0
        assert 0.0 <= driver["weight"] <= 1.0
        assert -1.0 <= driver["contributionScore"] <= 1.0
        assert 0.0 <= driver["confidenceScore"] <= 1.0
        total_weight += driver["weight"]
    assert round(total_weight, 5) == 1.0


def test_growth_state_prediction_is_readonly_and_not_diagnosis_or_action():
    model = _sample_model()
    prediction = model["growthStatePrediction"]

    assert prediction["readOnly"] is True
    assert prediction["executionAuthorityCode"] == 0
    assert prediction["trainingAuthorityCode"] == 0
    assert prediction["deploymentAuthorityCode"] == 0

    forbidden_diagnosis_or_action = {
        "fruitLoad",
        "leafLoad",
        "assimilateBalance",
        "transitionLogic",
        "actionSignals",
        "environmentModelRequest",
        "irrigationNutrientModelRequest",
        "lower_leaf_removal_review",
    }
    assert forbidden_diagnosis_or_action.isdisjoint(prediction.keys())
    assert forbidden_diagnosis_or_action.isdisjoint(set(str(prediction).split()))


def test_trainable_baseline_also_exposes_growth_state_prediction():
    model = _sample_model()
    prediction = model["growthStatePrediction"]
    baseline_prediction = model["trainableBaseline"]["growthStatePrediction"]

    assert baseline_prediction == prediction
    assert baseline_prediction["modelTargetCode"] == 2201
    assert "predictedBalance7d" in baseline_prediction


def test_panel_exposes_growth_state_prediction_as_readonly_numeric_card():
    panel = PANEL.read_text(encoding="utf-8")

    for marker in (
        "data-crop-growth-state-numeric-card",
        "data-crop-growth-state-balance-score",
        "data-crop-growth-state-numeric-evidence",
        "data-crop-growth-state-current-score",
        "data-crop-growth-state-predicted7d-score",
        "data-crop-growth-state-movement-score",
        "data-crop-growth-state-driver-contributions",
        "data-crop-growth-state-driver",
        "growthStatePrediction",
        "predictedBalance7d",
        "directionCode",
        "magnitudeBandCode",
        "driverContributions",
    ):
        assert marker in panel

    assert "data-crop-growth-state-execute" not in panel
    assert "growthStateAllowExecution" not in panel
