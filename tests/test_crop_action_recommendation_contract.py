from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MODEL_TESTS = ROOT / "tests" / "test_model_contract.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-25-crop-action-recommendation-v1-10-19.md"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
VALID_PRIORITY = {0, 1, 2, 3, 9}
FORBIDDEN = {
    "setpoint", "targetAdt", "targetVpd", "targetEc", "targetPh",
    "pesticideInstruction", "workOrder", "deviceCommand", "execute", "autoExecute",
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
        {"id": 501, "date": "2026-06-29", "cropType": "tomato", "height": 92, "leafCount": 22, "stemDiameter": 9.8, "truss": 4, "node": 14, "metricsJson": '[{"key":"plantHeight","value":92},{"key":"leafCount","value":22},{"key":"stemDiameter","value":9.8},{"key":"trussCount","value":4},{"key":"fruitCount","value":18}]'},
        {"id": 500, "date": "2026-06-22", "cropType": "tomato", "height": 82, "leafCount": 19, "stemDiameter": 9.2, "truss": 3, "node": 12, "metricsJson": '[{"key":"plantHeight","value":82},{"key":"leafCount","value":19},{"key":"stemDiameter","value":9.2},{"key":"trussCount","value":3},{"key":"fruitCount","value":10}]'},
    ]
    return crop_views._crop_model_snapshot_from_report_parts(None, 12, season, growth_rows, [], [])


def _assert_request(req: dict, code: int):
    assert req["requestCode"] == code
    assert req["priorityCode"] in VALID_PRIORITY
    assert isinstance(req["confidenceScore"], (int, float))
    assert 0.0 <= req["confidenceScore"] <= 1.0


def test_v11019_plan_pins_recommendation_boundary():
    plan = PLAN.read_text(encoding="utf-8")
    assert "Crop Action Recommendation Model" in plan
    assert "workReviewRequests" in plan
    assert "modelReviewRequests" in plan
    assert "No final ADT" in plan
    assert "No pesticide/control instruction" in plan
    assert "No automatic work order" in plan


def test_crop_action_recommendation_exists_and_refs_integrated_diagnosis():
    model = _sample_model()
    rec = model["cropActionRecommendation"]
    assert rec["versionCode"] == 1
    assert rec["modelFamilyCode"] == 5101
    assert rec["modelTargetCode"] == 5201
    assert rec["inputRefs"] == {"integratedCropDiagnosis": True}


def test_work_review_requests_are_code_only():
    rec = _sample_model()["cropActionRecommendation"]
    work = rec["workReviewRequests"]
    expected = {
        "lowerLeafRemoval": 101,
        "fruitLoadAdjustment": 102,
        "pestScoutingOrControlReview": 103,
        "cropWorkReview": 104,
    }
    assert set(expected).issubset(work)
    for name, code in expected.items():
        _assert_request(work[name], code)


def test_model_review_requests_have_no_target_candidate_authority():
    rec = _sample_model()["cropActionRecommendation"]
    model_requests = rec["modelReviewRequests"]
    expected = {"environmentModelReview": 201, "irrigationNutrientModelReview": 301}
    for name, code in expected.items():
        req = model_requests[name]
        _assert_request(req, code)
        assert req["targetCandidateAuthorityCode"] == 0


def test_operator_review_queue_is_numeric_and_request_based():
    queue = _sample_model()["cropActionRecommendation"]["operatorReviewQueue"]
    assert isinstance(queue, list)
    for item in queue:
        assert isinstance(item["requestCode"], int)
        assert item["priorityCode"] in VALID_PRIORITY
        assert isinstance(item["sourceSignalCode"], int)


def test_action_recommendation_is_readonly_and_not_execution():
    rec = _sample_model()["cropActionRecommendation"]
    assert rec["readOnly"] is True
    assert rec["executionAuthorityCode"] == 0
    assert rec["trainingAuthorityCode"] == 0
    assert rec["deploymentAuthorityCode"] == 0
    payload = str(rec)
    for forbidden in FORBIDDEN:
        assert forbidden not in rec
        assert forbidden not in payload


def test_trainable_baseline_also_exposes_crop_action_recommendation():
    model = _sample_model()
    assert model["trainableBaseline"]["cropActionRecommendation"] == model["cropActionRecommendation"]


def test_panel_exposes_action_recommendation_as_readonly_requests():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-action-recommendation-card",
        "data-crop-action-recommendation-evidence",
        "data-crop-action-work-request",
        "data-crop-action-model-request",
        "data-crop-action-priority-code",
        "cropActionRecommendation",
        "workReviewRequests",
        "modelReviewRequests",
        "targetCandidateAuthorityCode",
    ):
        assert marker in panel
    assert "data-crop-action-execute" not in panel
    assert "cropActionAllowExecution" not in panel
