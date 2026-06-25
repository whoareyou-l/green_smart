from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MODEL_TESTS = ROOT / "tests" / "test_model_contract.py"
STEP_PLAN = ROOT / "docs" / "plans" / "2026-06-25-crop-stage-model-sequential-implementation.md"


def _load_crop_views_for_helper_tests():
    spec = importlib.util.spec_from_file_location("test_model_contract", MODEL_TESTS)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module._load_crop_views_for_helper_tests()


def _stage_prediction_payload():
    crop_views = _load_crop_views_for_helper_tests()
    stage_diagnosis = {
        "stageId": "lettuce_leaf_expansion_main",
        "stageLabel": "본격 엽생장기",
        "stageConfidence": "medium",
        "indexBand": "caution",
        "missingEvidence": ["leafGrowthTrend"],
        "nextRequiredSurvey": "record leaf size trend and quality risk",
    }
    growth_index = {
        "indexType": "L-Index",
        "value": 27.3,
        "missingInputs": [],
    }
    growth_rows = [
        {"id": 102, "date": "2026-06-27", "cropType": "lettuce"},
        {"id": 101, "date": "2026-06-20", "cropType": "lettuce"},
    ]
    feature_sources = {
        "inputCompleteness": {"score": 0.72, "sourceStatus": {"growthSurvey": "ready", "environmentSummary7d": "missing"}},
        "kmaWeatherStress7d": {"sourceStatus": "stale", "weatherStressReasons": ["forecast_stale"]},
    }
    return crop_views._crop_stage_prediction_7d(
        stageDiagnosis=stage_diagnosis,
        growthIndex=growth_index,
        growth_rows=growth_rows,
        featureSources=feature_sources,
    )


def test_step1_design_document_exists_before_implementation():
    text = STEP_PLAN.read_text(encoding="utf-8")

    assert "# Step 1 — 생육단계 예측 모델" in text
    assert "Status: implemented and verified" in text
    assert "Step 1 does **not** decide new crop-specific stage sequences by itself" in text
    assert "predictionInputs" in text
    assert "modelDecision" in text
    assert "modelLimitations" in text


def test_step1_prediction_payload_has_explicit_model_metadata_and_boundary():
    prediction = _stage_prediction_payload()

    assert prediction["modelStage"] == "step_1_stage_prediction_model"
    assert prediction["predictionHorizonDays"] == 7
    assert prediction["readOnly"] is True
    assert prediction["executionAuthority"] == "none"
    assert prediction["trainingAuthority"] == "none"
    assert prediction["deploymentAuthority"] == "none"


def test_step1_prediction_payload_separates_probability_confidence_and_inputs():
    prediction = _stage_prediction_payload()

    assert 0.0 <= prediction["score"]["probability"] <= 1.0
    assert 0.0 <= prediction["score"]["confidenceScore"] <= 1.0
    assert prediction["score"]["probability"] == prediction["predictedStage7d"]["probability"]
    assert prediction["score"]["confidenceScore"] == prediction["predictedStage7d"]["confidenceScore"]
    assert prediction["predictionInputs"]["surveyCount"] == 2
    assert prediction["predictionInputs"]["inputCompleteness"]["score"] == 0.72
    assert prediction["predictionInputs"]["kmaWeatherStress7d"]["sourceStatus"] == "stale"


def test_step1_prediction_payload_explains_decision_and_limitations():
    prediction = _stage_prediction_payload()
    decision = prediction["modelDecision"]
    limitations = prediction["modelLimitations"]

    assert decision["basis"] == "hybrid_rule_score_v1"
    assert decision["currentStageId"] == "lettuce_leaf_expansion_main"
    assert decision["thresholds"]["transitionCandidateProbability"] == 0.65
    assert decision["selectedAction"] in {"keep_current_stage", "mark_next_stage_candidate"}
    assert "leafGrowthTrend" in prediction["missingInputs"]
    assert "kmaWeatherStress7d" in prediction["missingInputs"]
    assert any("missing" in item or "stale" in item for item in limitations)


def test_step1_prediction_payload_does_not_fake_crop_specific_next_stage_sequence():
    prediction = _stage_prediction_payload()

    assert prediction["predictedStage7d"]["stageId"] in {
        "lettuce_leaf_expansion_main",
        "lettuce_leaf_expansion_main_next_candidate",
    }
    assert prediction["modelDecision"]["nextStageSequenceSource"] == "step_2_crop_specific_stage_rules_not_applied_here"
