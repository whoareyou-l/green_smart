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


def _feature_snapshot(growth_rows=None, feature_sources=None):
    crop_views = _load_crop_views_for_helper_tests()
    growth_rows = growth_rows if growth_rows is not None else [
        {
            "id": 301,
            "date": "2026-06-27",
            "cropType": "lettuce",
            "height": 18,
            "leafCount": 16,
            "metricsJson": '[{"key":"leafLength","value":18},{"key":"leafWidth","value":12},{"key":"leafCount","value":16},{"key":"freshWeight","value":130},{"key":"plantHeight","value":20}]',
        }
    ]
    latest = growth_rows[0] if growth_rows else {"cropType": "lettuce"}
    growth_index = crop_views._crop_growth_index(latest)
    return crop_views._crop_trainable_feature_snapshot(
        season={"id": 12, "cropType": "lettuce", "zoneId": 1},
        growth_rows=growth_rows,
        pestRisk={"level": "low", "score": 0},
        cropSafety={"cropSafetyStatus": "clear", "cropSafetyBlocked": False},
        cropInterlock={"cropInterlockStatus": "clear", "cropInterlockBlocked": False},
        growthIndex=growth_index,
        weekly_growth=2.0,
        control_rows=[],
        featureSources=feature_sources,
    )


def test_step3_design_document_exists_before_implementation():
    text = STEP_PLAN.read_text(encoding="utf-8")

    assert "# Step 3 — feature snapshot" in text
    assert "Status: implemented and verified" in text
    assert "requiredSourceGroups" in text
    assert "sourceCoverage" in text
    assert "featureSnapshotLimitations" in text


def test_step3_feature_snapshot_has_explicit_stage_and_boundary():
    snapshot = _feature_snapshot()

    assert snapshot["featureSnapshotStage"] == "step_3_feature_snapshot"
    assert snapshot["readOnly"] is True
    assert snapshot["executionAuthority"] == "none"
    assert snapshot["trainingAuthority"] == "none"
    assert snapshot["deploymentAuthority"] == "none"


def test_step3_feature_snapshot_declares_required_sources_and_coverage():
    snapshot = _feature_snapshot(feature_sources={
        "environmentSummary7d": {"sourceStatus": "ready"},
        "kmaWeatherStress7d": {"sourceStatus": "stale"},
        "irrigationNutrientSummary7d": {},
        "pestControlSummary7d": {"sourceStatus": "missing"},
        "operationHistorySummary7d": {},
        "inputCompleteness": {"score": 0.4},
        "sourceStatus": {"environmentSummary7d": "ready", "kmaWeatherStress7d": "stale"},
    })

    assert snapshot["requiredSourceGroups"] == [
        "growthSurvey",
        "environmentSummary7d",
        "kmaWeatherStress7d",
        "irrigationNutrientSummary7d",
        "pestControlSummary7d",
        "operationHistorySummary7d",
        "safetyInterlockSummary",
    ]
    coverage = snapshot["sourceCoverage"]
    assert coverage["growthSurvey"] == "ready"
    assert coverage["environmentSummary7d"] == "ready"
    assert coverage["kmaWeatherStress7d"] == "stale"
    assert coverage["pestControlSummary7d"] == "missing"
    assert snapshot["inputCompleteness"]["score"] == 0.4


def test_step3_feature_snapshot_limitations_surface_missing_or_stale_sources():
    snapshot = _feature_snapshot(feature_sources={
        "environmentSummary7d": {},
        "kmaWeatherStress7d": {"sourceStatus": "stale"},
        "inputCompleteness": {"score": 0.2},
    })

    limitations = snapshot["featureSnapshotLimitations"]
    assert "environmentSummary7d:missing" in limitations
    assert "kmaWeatherStress7d:stale" in limitations
    assert "input_completeness_low" in limitations


def test_step3_feature_snapshot_keeps_safety_interlock_as_first_class_inputs():
    snapshot = _feature_snapshot()

    assert snapshot["safetyInterlockSummary"]["cropSafety"] == snapshot["cropSafety"]
    assert snapshot["safetyInterlockSummary"]["cropInterlock"] == snapshot["cropInterlock"]
    assert "growthSurvey" in snapshot
    assert snapshot["growthSurvey"]["count"] == 1
