from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MODEL_TESTS = ROOT / "tests" / "test_model_contract.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-25-integrated-crop-diagnosis-v1-10-18.md"
ARCH = ROOT / "docs" / "plans" / "2026-06-25-crop-model-responsibility-architecture.md"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"

VALID_SIGNAL_CODES = {0, 1, 2, 3, 9}
FORBIDDEN_KEYS = {
    "setpoint",
    "targetAdt",
    "targetVpd",
    "targetEc",
    "targetPh",
    "pesticideInstruction",
    "pestControlWorkOrder",
    "workOrder",
    "execute",
    "deviceCommand",
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


def _assert_score(value):
    assert isinstance(value, (int, float))
    assert -1.0 <= value <= 1.0


def test_v11018_design_docs_pin_integrated_diagnosis_boundary():
    plan = PLAN.read_text(encoding="utf-8")
    arch = ARCH.read_text(encoding="utf-8")
    for text in (plan, arch):
        assert "Integrated Crop Diagnosis Model" in text
        assert "fruit load" in text or "fruitLoad" in text
        assert "source-sink" in text or "sourceSink" in text
        assert "environment" in text
        assert "irrigation" in text
    assert "No final ADT" in plan
    assert "No pesticide/control instruction" in plan


def test_integrated_crop_diagnosis_exists_and_consumes_prior_predictions():
    model = _sample_model()
    diagnosis = model["integratedCropDiagnosis"]
    assert diagnosis["versionCode"] == 1
    assert diagnosis["modelFamilyCode"] == 4101
    assert diagnosis["modelTargetCode"] == 4201
    assert diagnosis["inputRefs"] == {
        "stagePrediction7d": True,
        "growthStatePrediction": True,
        "riskFactorPrediction": True,
    }


def test_load_and_source_sink_diagnosis_are_numeric():
    diagnosis = _sample_model()["integratedCropDiagnosis"]
    load = diagnosis["loadBalanceDiagnosis"]
    source_sink = diagnosis["sourceSinkDiagnosis"]
    for key in ("fruitLoadScore", "leafLoadScore", "loadGapScore", "confidenceScore"):
        _assert_score(load[key])
    assert load["loadGapDirectionCode"] in {-1, 0, 1, 9}
    for key in ("sourceCapacityScore", "sinkDemandScore", "sourceSinkGapScore", "confidenceScore"):
        _assert_score(source_sink[key])
    assert source_sink["gapSeverityCode"] in {0, 1, 2, 3, 4, 5, 9}


def test_transition_diagnosis_can_route_environment_and_irrigation_nutrient_reviews():
    diagnosis = _sample_model()["integratedCropDiagnosis"]
    transition = diagnosis["transitionDiagnosis"]
    _assert_score(transition["vegetativeGenerativeBalanceScore"])
    assert transition["transitionNeedCode"] in VALID_SIGNAL_CODES
    assert transition["environmentModelReviewCode"] in VALID_SIGNAL_CODES
    assert transition["irrigationNutrientModelReviewCode"] in VALID_SIGNAL_CODES
    assert "environmentModelRequest" not in transition
    assert "irrigationNutrientModelRequest" not in transition


def test_review_signals_are_codes_only_and_include_expected_channels():
    signals = _sample_model()["integratedCropDiagnosis"]["reviewSignals"]
    expected = {
        "lowerLeafRemovalReviewCode",
        "fruitLoadAdjustmentReviewCode",
        "environmentModelReviewCode",
        "irrigationNutrientModelReviewCode",
        "pestScoutingOrControlReviewCode",
        "cropWorkReviewCode",
    }
    assert expected.issubset(signals)
    for key in expected:
        assert signals[key] in VALID_SIGNAL_CODES


def test_integrated_diagnosis_is_readonly_and_not_action_or_setpoint():
    diagnosis = _sample_model()["integratedCropDiagnosis"]
    assert diagnosis["readOnly"] is True
    assert diagnosis["executionAuthorityCode"] == 0
    assert diagnosis["trainingAuthorityCode"] == 0
    assert diagnosis["deploymentAuthorityCode"] == 0
    payload = str(diagnosis)
    for forbidden in FORBIDDEN_KEYS:
        assert forbidden not in diagnosis
        assert forbidden not in payload


def test_trainable_baseline_also_exposes_integrated_crop_diagnosis():
    model = _sample_model()
    assert model["trainableBaseline"]["integratedCropDiagnosis"] == model["integratedCropDiagnosis"]


def test_panel_exposes_integrated_diagnosis_as_readonly_evidence():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-integrated-diagnosis-card",
        "data-crop-integrated-diagnosis-evidence",
        "data-crop-diagnosis-source-sink-gap",
        "data-crop-diagnosis-transition-need-code",
        "data-crop-diagnosis-review-signal",
        "integratedCropDiagnosis",
        "sourceSinkGapScore",
        "environmentModelReviewCode",
        "irrigationNutrientModelReviewCode",
    ):
        assert marker in panel
    assert "data-crop-diagnosis-execute" not in panel
    assert "integratedDiagnosisAllowExecution" not in panel
