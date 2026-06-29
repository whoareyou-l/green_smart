from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1963_irrigation_vertical_slice_documented_contract():
    plan = PLAN.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")
    for marker in (
        "Slice 4 — v1.9.63 Rich Irrigation/Nutrient Feature Engineering",
        "Vertical-slice scope",
        "crop_irrigation_nutrient_features_v1",
        "data-crop-irrigation-nutrient-features-card",
        "ecDeltaFeedDrain",
        "drybackProxy",
        "staleDrainFeedback",
    ):
        assert marker in plan
    for marker in (
        "Confirmed decision 12 — rich irrigation/nutrient model features",
        "feedEcAvg",
        "drainEcAvg",
        "do not add active irrigation control",
        "read-only model evidence",
    ):
        assert marker in design


def test_v1963_backend_irrigation_nutrient_feature_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_IRRIGATION_NUTRIENT_FEATURES_VERSION = "crop_irrigation_nutrient_features_v1"',
        "_crop_irrigation_number(",
        "_crop_irrigation_nutrient_derived_features(",
        "_irrigation_nutrient_feature_summary(",
        "feedEcAvg",
        "feedPhAvg",
        "drainEcAvg",
        "drainPhAvg",
        "ecDeltaFeedDrain",
        "phDeltaFeedDrain",
        "irrigationAmountTotal",
        "irrigationEventCount",
        "drainRateAvg",
        "drybackProxy",
        "errorCount",
        "staleDrainFeedback",
        "staleReasons",
        "sourceStatus",
        "ready",
        "partial",
        "missing",
        "stale",
    ):
        assert marker in crop


def test_v1963_irrigation_sql_reads_existing_tables_without_schema_change_contract():
    crop = CROP.read_text(encoding="utf-8")
    body = crop[crop.index("async def _irrigation_nutrient_feature_summary"):crop.index("async def _pest_control_feature_summary")]
    for marker in (
        "FROM irrigation_drain_feedback",
        "FROM irrigation_control_logs",
        "irrigation_settings",
        "AVG(feed_amount_l)",
        "AVG(drain_amount_l)",
        "AVG(drain_rate)",
        "AVG(drain_ec)",
        "AVG(drain_ph)",
        "SUM(amount_l)",
        "AVG(feed_ec)",
        "AVG(feed_ph)",
        "SUM(has_error)",
        "MAX(measured_at)",
        "MAX(executed_at)",
    ):
        assert marker in body
    assert "CREATE TABLE" not in body
    for forbidden in ("pid", "pump_execute", "fertigation_execute", "service.call"):
        assert forbidden not in body.lower()


def test_v1963_irrigation_summary_exposed_to_feature_snapshot_and_growth_report_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        '"irrigationNutrientSummary7d": irrigation',
        '"irrigationNutrientSummary7d": featureSources.get("irrigationNutrientSummary7d") or {}',
        'json.dumps(featureSources.get("irrigationNutrientSummary7d") or {}',
        '"derivedFeatures"',
        '"features"',
    ):
        assert marker in crop


def test_v1963_panel_irrigation_feature_evidence_is_read_only_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-irrigation-nutrient-features-card",
        "관수/양액 feature",
        "irrigationNutrientSummary7d",
        "feedEcAvg",
        "drainEcAvg",
        "ecDeltaFeedDrain",
        "phDeltaFeedDrain",
        "drybackProxy",
        "staleDrainFeedback",
    ):
        assert marker in panel
    for forbidden in (
        "data-crop-irrigation-nutrient-features-execute",
        "irrigationFeatureAllowExecution",
        "executeIrrigationFromCropModel",
    ):
        assert forbidden not in panel


def test_v1963_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.12.54"' in manifest
    assert 'const VERSION = "1.12.54"' in panel
    assert "v1.12.54" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
