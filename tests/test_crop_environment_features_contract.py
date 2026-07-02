from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROP = ROOT / "custom_components" / "green_smart" / "crop_views.py"
PANEL = ROOT / "custom_components" / "green_smart" / "panel" / "green-smart-panel.js"
MANIFEST = ROOT / "custom_components" / "green_smart" / "manifest.json"
CENTRAL = ROOT / "custom_components" / "green_smart" / "central_views.py"
PLAN = ROOT / "docs" / "plans" / "2026-06-24-crop-model-slice-execution-plan.md"
DESIGN = ROOT / "docs" / "plans" / "2026-06-23-crop-model-design-decisions.md"


def test_v1962_environment_vertical_slice_documented_contract():
    plan = PLAN.read_text(encoding="utf-8")
    design = DESIGN.read_text(encoding="utf-8")
    for marker in (
        "Slice 3 — v1.9.62 Rich Environment Feature Engineering",
        "Vertical-slice scope",
        "crop_environment_features_v1",
        "data-crop-environment-features-card",
        "sampleCoverageRatio",
        "staleReasons",
    ):
        assert marker in plan
    for marker in (
        "Confirmed decision 11 — rich environment model features",
        "VPD avg/min/max",
        "ADT derived from average temperature",
        "DIF derived from day/night temperature split",
        "do not add active environment control",
    ):
        assert marker in design


def test_v1962_backend_environment_feature_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        'CROP_ENVIRONMENT_FEATURES_VERSION = "crop_environment_features_v1"',
        "_crop_environment_stats_by_type(",
        "_crop_environment_vpd_from_temp_humidity(",
        "_crop_environment_derived_features(",
        "_environment_feature_summary(",
        "sampleCoverageRatio",
        "staleReasons",
        "lastCapturedAt",
        "sourceStatus",
        "ready",
        "partial",
        "missing",
        "stale",
    ):
        assert marker in crop
    for feature in ("temperature", "humidity", "co2", "radiation", "vpd", "adt", "dif"):
        assert feature in crop


def test_v1962_environment_sql_reads_sensor_readings_without_schema_change_contract():
    crop = CROP.read_text(encoding="utf-8")
    assert "FROM sensor_readings" in crop
    assert "reading_type AS `readingType`" in crop
    assert "AVG(value)" in crop
    assert "MIN(value)" in crop
    assert "MAX(value)" in crop
    assert "SUM(value)" in crop
    assert "HOUR(captured_at)" in crop
    assert "CREATE TABLE" not in crop[crop.index("async def _environment_feature_summary"):crop.index("async def _irrigation_nutrient_feature_summary")]


def test_v1962_environment_summary_exposed_to_feature_snapshot_and_growth_report_contract():
    crop = CROP.read_text(encoding="utf-8")
    for marker in (
        '"environmentSummary7d": environment',
        '"environmentSummary7d": featureSources.get("environmentSummary7d") or {}',
        'json.dumps(featureSources.get("environmentSummary7d") or {}',
        '"derivedFeatures"',
        '"features"',
    ):
        assert marker in crop


def test_v1962_panel_environment_feature_evidence_is_read_only_contract():
    panel = PANEL.read_text(encoding="utf-8")
    for marker in (
        "data-crop-environment-features-card",
        "환경 feature",
        "environmentSummary7d",
        "sampleCoverageRatio",
        "staleReasons",
        "VPD",
        "ADT",
        "DIF",
    ):
        assert marker in panel
    forbidden = (
        "data-crop-environment-features-execute",
        "environmentFeatureAllowExecution",
        "executeEnvironmentFromCropModel",
    )
    for marker in forbidden:
        assert marker not in panel


def test_v1962_version_markers_contract():
    manifest = MANIFEST.read_text(encoding="utf-8")
    panel = PANEL.read_text(encoding="utf-8")
    central = CENTRAL.read_text(encoding="utf-8")
    assert '"version": "1.14.48"' in manifest
    assert 'const VERSION = "1.14.48"' in panel
    assert "v1.14.48" in panel[:200]
    assert 'EDGE_VERSION = "1.9.96"' in central
