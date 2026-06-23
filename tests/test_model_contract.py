from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
ZONE_VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
BACKEND_DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"
PLAN = ROOT / "docs" / "plans" / "2026-06-23-integrated-crop-environment-irrigation-device-models.md"


def test_model_phase_m1_crop_model_snapshot_helper_contract():
    source = CROP_VIEWS.read_text(encoding="utf-8")
    report_section = source.split("async def _growth_report_response", 1)[1].split("class CropGrowthReportView", 1)[0]

    for marker in (
        "CROP_MODEL_VERSION",
        "_crop_growth_stage(",
        "_crop_profile_for_season(",
        "_crop_model_snapshot_from_report_parts(",
        "async def _crop_model_snapshot(hass, season_id: int) -> dict:",
        "cropModelVersion",
        "cropProfile",
        "growthStage",
        "gIndex",
        "yieldPrediction",
        "pestRisk",
        "confidenceReasons",
        "sourceTables",
    ):
        assert marker in source

    assert "cropModel = _crop_model_snapshot_from_report_parts" in report_section
    assert '"cropModel": cropModel' in report_section
    assert '"yieldPrediction": cropModel["yieldPrediction"]' in report_section
    assert '"pestRisk": cropModel["pestRisk"]' in report_section


def test_model_phase_m1_zone_control_can_reuse_crop_model_snapshot_without_new_tables():
    zone_source = ZONE_VIEWS.read_text(encoding="utf-8")
    crop_source = CROP_VIEWS.read_text(encoding="utf-8")
    backend_doc = BACKEND_DOC.read_text(encoding="utf-8")
    plan = PLAN.read_text(encoding="utf-8")

    assert "from .crop_views import _crop_model_snapshot" in zone_source
    assert "crop_seasons" in crop_source
    assert "growth_surveys" in crop_source
    assert "pest_surveys" in crop_source
    assert "control_records" in crop_source
    assert "CREATE TABLE IF NOT EXISTS crop_model" not in crop_source
    assert "CREATE TABLE IF NOT EXISTS crop_model" not in zone_source

    for marker in (
        "작기 모델은 `crop_season_id + zone_id`를 기준으로 한다.",
        "cropModelVersion",
        "cropProfile",
        "growthStage",
        "G-Index",
        "confidenceReasons",
        "No new DB table is required for M1",
    ):
        assert marker in backend_doc + "\n" + plan
