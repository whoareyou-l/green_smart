from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MODEL_TESTS = ROOT / "tests" / "test_model_contract.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
UI_DOC = ROOT / "docs" / "design" / "current-ui-design-and-navigation.md"
MASTER_PLAN = ROOT / "docs" / "PROJECT_MASTER_PLAN.md"
SLICE_PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN_DECISIONS = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def _load_crop_views_for_helper_tests():
    spec = importlib.util.spec_from_file_location("test_model_contract", MODEL_TESTS)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module._load_crop_views_for_helper_tests()


def _sample_model_snapshot():
    crop_views = _load_crop_views_for_helper_tests()
    season = {"id": 12, "cropType": "lettuce", "plantDate": "2026-06-01", "plantDensity": 16, "zoneId": 1}
    growth_rows = [
        {
            "id": 102,
            "date": "2026-06-27",
            "cropType": "lettuce",
            "height": 18,
            "leafCount": 16,
            "stemDia": 12,
            "truss": 130,
            "node": 20,
            "metricsJson": '[{"key":"leafLength","value":18},{"key":"leafWidth","value":12},{"key":"leafCount","value":16},{"key":"freshWeight","value":130},{"key":"plantHeight","value":20}]',
        },
        {
            "id": 101,
            "date": "2026-06-20",
            "cropType": "lettuce",
            "height": 16,
            "leafCount": 12,
            "stemDia": 10,
            "truss": 100,
            "node": 18,
            "metricsJson": '[{"key":"leafLength","value":16},{"key":"leafWidth","value":10},{"key":"leafCount","value":12},{"key":"freshWeight","value":100},{"key":"plantHeight","value":18}]',
        },
    ]
    return crop_views._crop_model_snapshot_from_report_parts(None, 12, season, growth_rows, [], [])


def test_crop_stage_model_pipeline_steps_are_ordered_one_to_five_in_snapshot():
    crop_model = _sample_model_snapshot()
    steps = crop_model["trainableBaseline"]["pipelineSteps"]

    assert [step["step"] for step in steps] == [1, 2, 3, 4, 5]
    assert [step["key"] for step in steps] == [
        "stage_prediction_model",
        "crop_specific_stage_rules",
        "feature_snapshot",
        "prediction_row_persistence",
        "exact_7_day_validation_loop",
    ]
    assert all(step["status"] in {"ready", "review"} for step in steps)


def test_crop_stage_model_step_1_prediction_output_is_real_model_payload():
    stage_prediction = _sample_model_snapshot()["trainableBaseline"]["stagePrediction7d"]

    assert stage_prediction["modelTarget"] == "growth_stage_prediction_7d"
    assert stage_prediction["modelFamily"] == "hybrid_rule_score_v1"
    assert set(stage_prediction).issuperset({"currentStage", "predictedStage7d", "transitionWindow", "score", "stageEvidence"})
    assert "scoreComponents" in stage_prediction["score"]
    assert isinstance(stage_prediction["score"]["confidenceScore"], float)


def test_crop_stage_model_step_2_uses_crop_specific_stage_rules_and_index_type():
    crop_model = _sample_model_snapshot()
    diagnosis = crop_model["stageDiagnosis"]
    growth_index = crop_model["growthIndex"]

    assert diagnosis["stageId"].startswith("lettuce_")
    assert diagnosis["stageLabel"]
    assert growth_index["indexType"] == "L-Index"
    assert "stageConfidence" in diagnosis


def test_crop_stage_model_step_3_feature_snapshot_is_input_to_stage_prediction():
    baseline = _sample_model_snapshot()["trainableBaseline"]
    feature_snapshot = baseline["featureSnapshot"]
    stage_prediction = baseline["stagePrediction7d"]

    assert feature_snapshot["growthSurvey"]["qualityDisorderSummary"]["source"] == "growth_surveys.metrics_json"
    assert stage_prediction["stageEvidence"]["kmaWeatherStress"] == feature_snapshot["kmaWeatherStress7d"]
    assert "growthSurvey" in feature_snapshot
    assert "cropSafety" in feature_snapshot
    assert "cropInterlock" in feature_snapshot


def test_crop_stage_model_step_4_persistence_payload_is_declared_before_validation_loop():
    baseline = _sample_model_snapshot()["trainableBaseline"]
    steps = baseline["pipelineSteps"]
    persistence = steps[3]
    validation = steps[4]

    assert persistence["key"] == "prediction_row_persistence"
    assert persistence["status"] == "ready"
    assert persistence["outputTable"] == "crop_model_training_snapshots"
    assert persistence["requiredFields"] == [
        "feature_snapshot_json",
        "prediction_json",
        "readiness_json",
        "predicted_for_date",
        "validation_status",
    ]
    assert validation["dependsOnStep"] == 4


def test_crop_stage_model_step_5_exact_7_day_validation_policy_is_declared():
    validation = _sample_model_snapshot()["trainableBaseline"]["pipelineSteps"][4]

    assert validation["key"] == "exact_7_day_validation_loop"
    assert validation["status"] == "ready"
    assert validation["cadence"] == "weekly_exact_7_day_survey"
    assert validation["missingExactSurveyStatus"] == "validation_needs_review"
    assert validation["reviewReason"] == "exact_7_day_survey_missing"
    assert validation["nearestSurveyFallback"] is False


def test_v1_10_14_documents_ordered_one_to_five_release_scope():
    docs = "\n".join(path.read_text(encoding="utf-8") for path in (UI_DOC, MASTER_PLAN, SLICE_PLAN, DESIGN_DECISIONS))

    assert "v1.10.14 Ordered Crop Stage Model steps" in docs
    assert "1단계 생육단계 예측 모델" in docs
    assert "2단계 작물별 stage rule" in docs
    assert "3단계 feature snapshot" in docs
    assert "4단계 prediction row 저장" in docs
    assert "5단계 정확히 7일 차 validation loop" in docs
    assert "nearest survey fallback 금지" in docs


def test_v1_10_14_version_surfaces_are_current():
    panel = PANEL.read_text(encoding="utf-8")
    manifest = MANIFEST.read_text(encoding="utf-8")
    ui_doc = UI_DOC.read_text(encoding="utf-8")

    assert "v1.14.22" in panel[:200]
    assert 'const VERSION = "1.14.22"' in panel
    assert '"version": "1.14.22"' in manifest
    assert "기준 버전: `v1.14.22`" in ui_doc
