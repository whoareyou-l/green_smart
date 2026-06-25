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


async def _run_validation(monkeypatch, *, growth_rows):
    crop_views = _load_crop_views_for_helper_tests()
    executed = []

    async def fake_fetchone(hass, query, params=()):
        return {"id": 12, "cropType": "lettuce", "plantDate": "2026-06-01", "zoneId": 1}

    async def fake_fetchall(hass, query, params=()):
        if "FROM growth_surveys" in query:
            return growth_rows
        raise AssertionError(f"unexpected fetchall query: {query}")

    async def fake_control_rows(hass, season_id, limit=10):
        return []

    async def fake_pending(hass, *, season_id, limit=50):
        return [{
            "id": 550,
            "sourceSurveyId": 401,
            "predictedForDate": "2026-07-04",
            "predictionJson": '{"predictedStage7d":{"stageId":"lettuce_leaf_expansion_main","stageLabel":"본격 엽생장기"}}',
            "validationStatus": "pending",
        }]

    async def fake_execute(hass, query, params=()):
        executed.append((query, params))
        return 1

    def fake_actual_stage(season, growth_row, growth_rows=None, control_rows=None):
        return {"stageId": "lettuce_leaf_expansion_main", "stageLabel": "본격 엽생장기", "actualSurveyId": growth_row["id"]}

    monkeypatch.setattr(crop_views, "fetchone", fake_fetchone)
    monkeypatch.setattr(crop_views, "fetchall", fake_fetchall)
    monkeypatch.setattr(crop_views, "_crop_control_rows_with_pesticides", fake_control_rows)
    monkeypatch.setattr(crop_views, "_pending_crop_prediction_snapshots", fake_pending)
    monkeypatch.setattr(crop_views, "execute", fake_execute)
    monkeypatch.setattr(crop_views, "_actual_stage_label_from_growth_survey", fake_actual_stage)

    result = await crop_views._validate_pending_crop_training_snapshots(object(), season_id=12)
    actual_validation = json.loads(executed[0][1][0])
    return result, actual_validation, executed


def test_step5_design_document_exists_before_implementation():
    text = STEP_PLAN.read_text(encoding="utf-8")

    assert "# Step 5 — 정확히 7일 차 validation loop" in text
    assert "Status: implemented and verified" in text
    assert "No nearest-survey fallback" in text
    assert "validationPolicy" in text


@pytest.mark.asyncio
async def test_step5_exact_date_success_row_carries_validation_policy(monkeypatch):
    result, actual_validation, executed = await _run_validation(monkeypatch, growth_rows=[
        {"id": 503, "date": "2026-07-05", "cropType": "lettuce", "metricsJson": "[]"},
        {"id": 502, "date": "2026-07-04", "cropType": "lettuce", "metricsJson": "[]"},
        {"id": 501, "date": "2026-07-03", "cropType": "lettuce", "metricsJson": "[]"},
    ])

    assert result["validatedCount"] == 1
    assert actual_validation["validationStage"] == "step_5_exact_7_day_validation_loop"
    assert actual_validation["actualSurveyId"] == 502
    assert actual_validation["validationPolicy"]["cadence"] == "weekly_exact_7_day_survey"
    assert actual_validation["validationPolicy"]["nearestSurveyFallback"] is False
    assert actual_validation["validationPolicy"]["missingExactSurveyStatus"] == "validation_needs_review"
    assert actual_validation["validationPolicy"]["reviewReason"] == "exact_7_day_survey_missing"
    assert actual_validation["validationStatus"] == "validated"
    assert executed[0][1][1] == 502


@pytest.mark.asyncio
async def test_step5_missing_exact_date_review_row_carries_validation_policy(monkeypatch):
    result, actual_validation, executed = await _run_validation(monkeypatch, growth_rows=[
        {"id": 503, "date": "2026-07-05", "cropType": "lettuce", "metricsJson": "[]"},
        {"id": 501, "date": "2026-07-03", "cropType": "lettuce", "metricsJson": "[]"},
    ])

    assert result["needsReviewCount"] == 1
    assert actual_validation["validationStage"] == "step_5_exact_7_day_validation_loop"
    assert actual_validation["actualSurveyId"] is None
    assert actual_validation["validationStatus"] == "validation_needs_review"
    assert actual_validation["reviewReason"] == "exact_7_day_survey_missing"
    assert actual_validation["validationPolicy"]["nearestSurveyFallback"] is False
    assert executed[0][1][1] is None
