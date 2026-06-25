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


def _diagnosis_for(crop_type, row, *, plant_date="2026-06-01"):
    crop_views = _load_crop_views_for_helper_tests()
    season = {"id": 12, "cropType": crop_type, "method": "hydro", "plantDate": plant_date, "zoneId": 1}
    return crop_views._crop_stage_diagnosis_from_parts(12, season, [row], [])


def test_step2_design_document_exists_before_implementation():
    text = STEP_PLAN.read_text(encoding="utf-8")

    assert "# Step 2 — 작물별 stage rule" in text
    assert "Status: implemented and verified" in text
    assert "tomato → G-Index" in text
    assert "lettuce → L-Index" in text
    assert "stageSequence" in text


def test_step2_tomato_stage_rule_uses_g_index_and_sequence_metadata():
    tomato_row = {
        "id": 201,
        "date": "2026-06-27",
        "cropType": "tomato",
        "height": 150,
        "leafCount": 28,
        "stemDia": 12,
        "truss": 5,
        "node": 8,
        "metricsJson": '[{"key":"plantHeight","value":150},{"key":"leafCount","value":28},{"key":"stemDiameter","value":12},{"key":"flowerClusterNo","value":5},{"key":"fruitSetNode","value":8}]',
    }
    diagnosis = _diagnosis_for("tomato", tomato_row)

    assert diagnosis["stageId"].startswith("tomato_")
    assert diagnosis["indexType"] == "G-Index"
    assert diagnosis["stageRule"]["cropType"] == "tomato"
    assert diagnosis["stageRule"]["indexType"] == "G-Index"
    assert diagnosis["stageRuleSource"] == "default_or_db_calibration"
    assert diagnosis["stageOrder"] >= 0
    assert diagnosis["stageSequence"][diagnosis["stageOrder"]] == diagnosis["stageId"]
    assert diagnosis["nextStageId"] is None or diagnosis["nextStageId"].startswith("tomato_")


def test_step2_lettuce_stage_rule_uses_l_index_not_generic_g_index():
    lettuce_row = {
        "id": 202,
        "date": "2026-06-27",
        "cropType": "lettuce",
        "height": 18,
        "leafCount": 16,
        "stemDia": 12,
        "truss": 130,
        "node": 20,
        "metricsJson": '[{"key":"leafLength","value":18},{"key":"leafWidth","value":12},{"key":"leafCount","value":16},{"key":"freshWeight","value":130},{"key":"plantHeight","value":20}]',
    }
    diagnosis = _diagnosis_for("lettuce", lettuce_row)

    assert diagnosis["stageId"].startswith("lettuce_")
    assert diagnosis["indexType"] == "L-Index"
    assert diagnosis["indexValue"] == 27.3
    assert diagnosis["stageRule"]["cropType"] == "lettuce"
    assert diagnosis["stageRule"]["indexType"] == "L-Index"
    assert diagnosis["stageSequence"][diagnosis["stageOrder"]] == diagnosis["stageId"]
    assert diagnosis["nextStageId"] is None or diagnosis["nextStageId"].startswith("lettuce_")
    assert diagnosis["previousStageId"] is None or diagnosis["previousStageId"].startswith("lettuce_")


def test_step2_unknown_crop_does_not_pretend_crop_specific_rule_exists():
    row = {"id": 203, "date": "2026-06-27", "cropType": "basil", "height": 10, "metricsJson": "[]"}
    diagnosis = _diagnosis_for("basil", row)

    assert diagnosis["stageId"] == "unknown"
    assert diagnosis["stageRule"] == {}
    assert diagnosis["stageSequence"] == []
    assert diagnosis["stageOrder"] is None
    assert diagnosis["nextStageId"] is None
    assert diagnosis["previousStageId"] is None
