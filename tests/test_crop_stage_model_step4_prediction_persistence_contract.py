from pathlib import Path
import importlib.util
import json

import pytest

ROOT = Path(__file__).resolve().parents[1]
MODEL_TESTS = ROOT / "tests" / "test_model_contract.py"
STEP_PLAN = ROOT / "docs" / "plans" / "2026-06-25-crop-stage-model-sequential-implementation.md"


def _load_crop_views_for_helper_tests():
    spec = importlib.util.spec_from_file_location("test_model_contract", MODEL_TESTS)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module._load_crop_views_for_helper_tests()


def _sample_crop_model(source_id: int | None = 401):
    crop_views = _load_crop_views_for_helper_tests()
    season = {"id": 12, "cropType": "lettuce", "plantDate": "2026-06-01", "plantDensity": 16, "zoneId": 3}
    growth_rows = [
        {
            "id": source_id,
            "date": "2026-06-27",
            "cropType": "lettuce",
            "height": 18,
            "leafCount": 16,
            "metricsJson": '[{"key":"leafLength","value":18},{"key":"leafWidth","value":12},{"key":"leafCount","value":16},{"key":"freshWeight","value":130},{"key":"plantHeight","value":20}]',
        }
    ]
    model = crop_views._crop_model_snapshot_from_report_parts(None, 12, season, growth_rows, [], [])
    if source_id is None:
        model["latestMetrics"].pop("id", None)
    return season, model


def test_step4_design_document_exists_before_implementation():
    text = STEP_PLAN.read_text(encoding="utf-8")

    assert "# Step 4 — prediction row 저장" in text
    assert "Status: implemented and verified" in text
    assert "sourceSurveyId" in text
    assert "predicted_for_date = prediction_date + 7 days" in text
    assert "refuse orphan rows" in text


def test_step4_trainable_baseline_exposes_prediction_persistence_metadata():
    _, model = _sample_crop_model()
    persistence = model["trainableBaseline"]["predictionPersistence"]

    assert persistence["step"] == 4
    assert persistence["status"] == "ready"
    assert persistence["outputTable"] == "crop_model_training_snapshots"
    assert persistence["sourceSurveyId"] == 401
    assert persistence["predictionDate"] == "2026-06-27"
    assert persistence["predictedForDate"] == "2026-07-04"
    assert persistence["initialValidationStatus"] == "pending"
    assert persistence["executionAuthority"] == "none"


@pytest.mark.asyncio
async def test_step4_persist_crop_model_training_snapshot_writes_traceable_row(monkeypatch):
    crop_views = _load_crop_views_for_helper_tests()
    season, model = _sample_crop_model()
    captured = []

    async def fake_execute(hass, query, params=()):
        captured.append((query, params))
        return 777

    monkeypatch.setattr(crop_views, "execute", fake_execute)

    row_id = await crop_views._persist_crop_model_training_snapshot(
        object(),
        season_id=12,
        season=season,
        cropModel=model,
        featureSnapshotId=88,
    )

    assert row_id == 777
    assert len(captured) == 1
    query, params = captured[0]
    assert "INSERT INTO crop_model_training_snapshots" in query
    assert params[1] == 12
    assert params[2] == 88
    assert params[3] == 3
    assert params[4] == "lettuce"
    assert params[5] == "hybrid_rule_score_v1"
    assert params[6] == 7
    assert params[7] == 401
    assert params[8] == "2026-06-27"
    assert params[9] == "2026-07-04"
    assert json.loads(params[10])["featureSnapshotStage"] == "step_3_feature_snapshot"
    assert json.loads(params[11])["modelStage"] == "step_1_stage_prediction_model"
    assert params[12] is None
    assert json.loads(params[13])["candidateModelFamilies"] == ["lstm", "gru", "temporal_transformer"]
    assert params[14] is None
    assert params[15] == "pending"


@pytest.mark.asyncio
async def test_step4_persist_refuses_orphan_prediction_without_source_survey(monkeypatch):
    crop_views = _load_crop_views_for_helper_tests()
    season, model = _sample_crop_model(source_id=None)
    called = []

    async def fake_execute(hass, query, params=()):
        called.append((query, params))
        return 777

    monkeypatch.setattr(crop_views, "execute", fake_execute)

    row_id = await crop_views._persist_crop_model_training_snapshot(
        object(),
        season_id=12,
        season=season,
        cropModel=model,
        featureSnapshotId=88,
    )

    assert row_id is None
    assert called == []
