from pathlib import Path
import importlib.util
import sys
import types

ROOT = Path(__file__).resolve().parents[1]
CROP_VIEWS = ROOT / "custom_components" / "green_smart" / "crop_views.py"
ZONE_VIEWS = ROOT / "custom_components" / "green_smart" / "zone_control_views.py"
BACKEND_DOC = ROOT / "docs" / "design" / "current-backend-api-db-ha-contract.md"
PLAN = ROOT / "docs" / "plans" / "2026-06-23-integrated-crop-environment-irrigation-device-models.md"
SAFETY_PLAN = ROOT / "docs" / "plans" / "2026-06-23-safety-interlock-model-order.md"


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


def _load_crop_views_for_helper_tests():
    aiohttp_mod = types.ModuleType("aiohttp")
    web_mod = types.ModuleType("aiohttp.web")

    class Response:
        def __init__(self, text="", content_type=None, status=200):
            self.text = text
            self.content_type = content_type
            self.status = status

    setattr(web_mod, "Response", Response)
    setattr(web_mod, "Request", object)
    setattr(aiohttp_mod, "web", web_mod)

    ha_mod = types.ModuleType("homeassistant")
    components_mod = types.ModuleType("homeassistant.components")
    http_mod = types.ModuleType("homeassistant.components.http")

    class HomeAssistantView:
        pass

    setattr(http_mod, "HomeAssistantView", HomeAssistantView)
    setattr(components_mod, "http", http_mod)
    setattr(ha_mod, "components", components_mod)

    package_mod = types.ModuleType("green_smart_testpkg")
    package_mod.__path__ = [str(CROP_VIEWS.parent)]
    db_mod = types.ModuleType("green_smart_testpkg.db")
    async def fetchall(*args, **kwargs):
        return []
    async def fetchone(*args, **kwargs):
        return None
    async def execute(*args, **kwargs):
        return 0
    setattr(db_mod, "fetchall", fetchall)
    setattr(db_mod, "fetchone", fetchone)
    setattr(db_mod, "execute", execute)

    previous = {name: sys.modules.get(name) for name in (
        "aiohttp", "aiohttp.web", "homeassistant", "homeassistant.components", "homeassistant.components.http", "green_smart_testpkg", "green_smart_testpkg.db"
    )}
    sys.modules.update({
        "aiohttp": aiohttp_mod,
        "aiohttp.web": web_mod,
        "homeassistant": ha_mod,
        "homeassistant.components": components_mod,
        "homeassistant.components.http": http_mod,
        "green_smart_testpkg": package_mod,
        "green_smart_testpkg.db": db_mod,
    })
    try:
        spec = importlib.util.spec_from_file_location("green_smart_testpkg.crop_views", CROP_VIEWS)
        assert spec is not None and spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        sys.modules["green_smart_testpkg.crop_views"] = module
        spec.loader.exec_module(module)
        return module
    finally:
        for name, old in previous.items():
            if old is None:
                sys.modules.pop(name, None)
            else:
                sys.modules[name] = old


def test_crop_safety_rules_contract_markers_are_defined_before_more_model_work():
    source = CROP_VIEWS.read_text(encoding="utf-8")
    backend_doc = BACKEND_DOC.read_text(encoding="utf-8")
    safety_plan = SAFETY_PLAN.read_text(encoding="utf-8")
    combined_docs = backend_doc + "\n" + safety_plan

    for marker in (
        "CROP_SAFETY_RULE_VERSION",
        "CROP_SAFETY_RULE_DEFAULTS",
        "_crop_safety_rule_snapshot(",
        "cropSafetyStatus",
        "cropSafetyBlocked",
        "cropSafetyReasons",
        "cropSafetyRules",
        "cropSafetyRuleResults",
        "crop_season_missing",
        "crop_type_unknown",
        "growth_survey_stale",
        "crop_pest_risk_high",
        "crop_growth_anomaly",
        "crop_control_record_stale",
        "crop_confidence_low",
    ):
        assert marker in source
        assert marker in combined_docs


def test_crop_safety_rule_snapshot_blocks_missing_unknown_stale_high_risk_low_confidence():
    crop_views = _load_crop_views_for_helper_tests()

    result = crop_views._crop_safety_rule_snapshot(
        season={"id": 7, "cropType": "unknown", "plantDate": "2026-01-01"},
        growth_rows=[{"date": "2000-01-01", "height": 25, "cropType": "unknown"}],
        pestRisk={"level": "high", "score": 20},
        yieldPrediction={"confidence": "low"},
        latest_g=999,
        weekly_growth=999,
        control_rows=[],
    )

    assert result["cropSafetyStatus"] == "blocked"
    assert result["cropSafetyBlocked"] is True
    assert result["cropSafetyRuleVersion"] == crop_views.CROP_SAFETY_RULE_VERSION
    assert result["automationAllowed"] is False
    assert result["targetPromotionAllowed"] is False
    for reason in (
        "crop_type_unknown",
        "growth_survey_stale",
        "crop_pest_risk_high",
        "crop_growth_anomaly",
        "crop_control_record_stale",
        "crop_confidence_low",
    ):
        assert reason in result["cropSafetyReasons"]
    assert all("reasonCode" in item and "matched" in item for item in result["cropSafetyRuleResults"])


def test_crop_safety_rule_snapshot_marks_missing_crop_season_as_blocked():
    crop_views = _load_crop_views_for_helper_tests()

    result = crop_views._crop_safety_rule_snapshot(
        season={"id": 99},
        growth_rows=[],
        pestRisk={"level": "low", "score": 0},
        yieldPrediction={"confidence": "low"},
        latest_g=0,
        weekly_growth=0,
        control_rows=[],
    )

    assert result["cropSafetyBlocked"] is True
    assert "crop_season_missing" in result["cropSafetyReasons"]
    assert "crop_confidence_low" in result["cropSafetyReasons"]
